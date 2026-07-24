import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { SignJWT, importPKCS8 } from 'jose';
import { v4 as uuidv4 } from 'uuid';
import { RefreshToken } from './entities/refresh-token.entity';
import {
  VerificationToken,
  VerificationTokenType,
} from './entities/verification-token.entity';
import { User, UserRole } from '../users/entities/user.entity';
import {
  addHours,
  generateSecureToken,
  hashToken,
  parseDuration,
} from '../../common/utils/crypto.util';

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  sessionId?: string;
  iss: string;
  aud: string;
  iat: number;
  exp: number;
  jti: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

@Injectable()
export class TokensService {
  private readonly logger = new Logger(TokensService.name);
  private privateKeyPromise: Promise<any> | null = null;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepo: Repository<RefreshToken>,
    @InjectRepository(VerificationToken)
    private readonly verificationTokenRepo: Repository<VerificationToken>,
  ) {}

  private async getPrivateKey() {
    if (!this.privateKeyPromise) {
      const pem = this.configService.get<string>('jwt.privateKey')!;
      this.privateKeyPromise = importPKCS8(pem, 'RS256');
    }
    return this.privateKeyPromise;
  }

  async issueTokenPair(
    user: User,
    sessionId: string,
    metadata: { ip?: string; userAgent?: string } = {},
    familyId?: string,
  ): Promise<TokenPair> {
    const accessToken = await this.signAccessToken(user, sessionId);

    const refreshTokenRaw = generateSecureToken(48);
    const refreshTokenHash = hashToken(refreshTokenRaw);
    const refreshExpiresMs = parseDuration(
      this.configService.get<string>('jwt.refreshExpires', '7d'),
    );

    await this.refreshTokenRepo.save({
      userId: user.id,
      tokenHash: refreshTokenHash,
      familyId: familyId || uuidv4(),
      sessionId,
      expiresAt: new Date(Date.now() + refreshExpiresMs),
      createdIp: metadata.ip ?? null,
      userAgent: metadata.userAgent ?? null,
    });

    const accessExpiresMs = parseDuration(
      this.configService.get<string>('jwt.accessExpires', '15m'),
    );

    return {
      accessToken,
      refreshToken: refreshTokenRaw,
      expiresIn: Math.floor(accessExpiresMs / 1000),
    };
  }

  private async signAccessToken(user: User, sessionId: string): Promise<string> {
    const privateKey = await this.getPrivateKey();
    const issuer = this.configService.get<string>('jwt.issuer')!;
    const audience = this.configService.get<string>('jwt.audience')!;
    const keyId = this.configService.get<string>('jwt.keyId')!;
    const expiresIn = this.configService.get<string>('jwt.accessExpires', '15m');

    return new SignJWT({
      email: user.email,
      role: user.role,
      sessionId,
    })
      .setProtectedHeader({ alg: 'RS256', kid: keyId, typ: 'JWT' })
      .setSubject(user.id)
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .setJti(uuidv4())
      .sign(privateKey);
  }

  async rotateRefreshToken(
    rawRefreshToken: string,
    metadata: { ip?: string; userAgent?: string } = {},
  ): Promise<{ tokenPair: TokenPair; user: User; reuseDetected: boolean }> {
    const tokenHash = hashToken(rawRefreshToken);
    const stored = await this.refreshTokenRepo.findOne({
      where: { tokenHash },
      relations: ['user'],
    });

    if (!stored) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (stored.isRevoked()) {
      this.logger.warn(
        `Refresh token reuse detected for family ${stored.familyId} (user ${stored.userId})`,
      );
      await this.revokeFamily(stored.familyId, 'reuse_detected');
      throw new UnauthorizedException(
        'Refresh token reuse detected — all sessions revoked',
      );
    }

    if (stored.isExpired()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    const user = stored.user;
    if (!user || !user.isActive()) {
      throw new UnauthorizedException('User account is not active');
    }

    const tokenPair = await this.issueTokenPair(
      user,
      stored.sessionId || uuidv4(),
      metadata,
      stored.familyId,
    );

    const newTokenHash = hashToken(tokenPair.refreshToken);
    const newToken = await this.refreshTokenRepo.findOne({
      where: { tokenHash: newTokenHash },
    });

    await this.refreshTokenRepo.update(stored.id, {
      revokedAt: new Date(),
      revokedReason: 'rotated',
      replacedByTokenId: newToken?.id ?? null,
    });

    return { tokenPair, user, reuseDetected: false };
  }

  async revokeRefreshToken(rawToken: string, reason = 'logout'): Promise<void> {
    const tokenHash = hashToken(rawToken);
    await this.refreshTokenRepo.update(
      { tokenHash, revokedAt: undefined },
      { revokedAt: new Date(), revokedReason: reason },
    );
  }

  async revokeFamily(familyId: string, reason: string): Promise<void> {
    await this.refreshTokenRepo.update(
      { familyId, revokedAt: undefined },
      { revokedAt: new Date(), revokedReason: reason },
    );
  }

  async revokeAllUserTokens(userId: string, reason = 'manual'): Promise<void> {
    await this.refreshTokenRepo.update(
      { userId, revokedAt: undefined },
      { revokedAt: new Date(), revokedReason: reason },
    );
  }

  async createVerificationToken(
    userId: string,
    type: VerificationTokenType,
    expiresHours: number,
    ip?: string,
  ): Promise<string> {
    const rawToken = generateSecureToken(32);
    const tokenHash = hashToken(rawToken);

    await this.verificationTokenRepo.save({
      userId,
      tokenHash,
      type,
      expiresAt: addHours(new Date(), expiresHours),
      requestIp: ip ?? null,
    });

    return rawToken;
  }

  async consumeVerificationToken(
    rawToken: string,
    type: VerificationTokenType,
  ): Promise<VerificationToken> {
    const tokenHash = hashToken(rawToken);
    const token = await this.verificationTokenRepo.findOne({
      where: { tokenHash, type },
    });

    if (!token || !token.isValid()) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    await this.verificationTokenRepo.update(token.id, { usedAt: new Date() });
    return token;
  }

  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();
    await this.refreshTokenRepo.delete({ expiresAt: LessThan(now) });
    await this.verificationTokenRepo.delete({ expiresAt: LessThan(now) });
  }
}
