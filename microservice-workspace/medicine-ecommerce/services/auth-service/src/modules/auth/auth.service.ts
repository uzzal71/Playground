import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { TokensService, TokenPair } from '../tokens/tokens.service';
import { SessionsService } from '../sessions/sessions.service';
import { TwoFactorService } from '../two-factor/two-factor.service';
import { EmailService } from '../email/email.service';
import { EventsPublisherService } from '../events/events-publisher.service';
import { AuditService } from '../audit/audit.service';
import { VerificationTokenType } from '../tokens/entities/verification-token.entity';
import { AuditEventType } from '../audit/entities/audit-log.entity';
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import { addMinutes } from '../../common/utils/crypto.util';

interface RequestContext {
  ip?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly tokensService: TokensService,
    private readonly sessionsService: SessionsService,
    private readonly twoFactorService: TwoFactorService,
    private readonly emailService: EmailService,
    private readonly eventsService: EventsPublisherService,
    private readonly auditService: AuditService,
  ) {}

  async register(dto: RegisterDto, ctx: RequestContext): Promise<{ message: string; userId: string }> {
    if (await this.usersService.existsByEmail(dto.email)) {
      throw new ConflictException('Email is already registered');
    }

    const bcryptRounds = this.configService.get<number>('app.bcryptRounds', 12);
    const passwordHash = await bcrypt.hash(dto.password, bcryptRounds);

    const user = await this.usersService.create({
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone || null,
      role: dto.role || UserRole.CUSTOMER,
      status: UserStatus.PENDING,
    });

    
    const expiresHours = this.configService.get<number>(
      'app.tokens.emailVerificationExpiresHours',
      24,
    );
    const verificationToken = await this.tokensService.createVerificationToken(
      user.id,
      VerificationTokenType.EMAIL_VERIFICATION,
      expiresHours,
      ctx.ip,
    );

    
    this.emailService
      .sendVerificationEmail(user.email, user.firstName, verificationToken)
      .catch((err) =>
        this.logger.error('Failed to send verification email', err),
      );

    
    await this.auditService.log({
      userId: user.id,
      eventType: AuditEventType.USER_REGISTERED,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    
    await this.eventsService.publish('user.registered', {
      userId: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });

    return {
      message: 'Registration successful. Please check your email to verify your account.',
      userId: user.id,
    };
  }

  async login(
    dto: LoginDto,
    ctx: RequestContext,
  ): Promise<TokenPair & { user: User } | { twoFactorRequired: true; userId: string }> {
    const user = await this.usersService.findByEmailWithSecrets(dto.email);

    if (!user) {
      
      await bcrypt.compare(dto.password, '$2b$12$invalidhashinvalidhashinvalidhash');
      await this.auditService.log({
        eventType: AuditEventType.USER_LOGIN_FAILED,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { email: dto.email },
        success: false,
        failureReason: 'user_not_found',
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    
    if (user.isLocked()) {
      await this.auditService.log({
        userId: user.id,
        eventType: AuditEventType.USER_LOGIN_FAILED,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        success: false,
        failureReason: 'account_locked',
      });
      throw new UnauthorizedException(
        'Account is locked due to too many failed login attempts. Try again later.',
      );
    }

    
    if (user.status === UserStatus.SUSPENDED || user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('Account is not active');
    }

    
    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) {
      await this.handleFailedLogin(user, ctx);
      throw new UnauthorizedException('Invalid email or password');
    }

    
    if (user.twoFactorEnabled) {
      if (!dto.twoFactorCode) {
        return { twoFactorRequired: true, userId: user.id };
      }
      const valid = await this.twoFactorService.verify(user.id, dto.twoFactorCode);
      if (!valid) {
        await this.handleFailedLogin(user, ctx);
        await this.auditService.log({
          userId: user.id,
          eventType: AuditEventType.USER_2FA_FAILED,
          ipAddress: ctx.ip,
          userAgent: ctx.userAgent,
          success: false,
        });
        throw new UnauthorizedException('Invalid 2FA code');
      }
      await this.auditService.log({
        userId: user.id,
        eventType: AuditEventType.USER_2FA_VERIFIED,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
      });
    }

    
    if (!user.emailVerified) {
      throw new UnauthorizedException(
        'Please verify your email before logging in',
      );
    }

    
    await this.usersService.resetFailedAttempts(user.id);
    await this.usersService.updateLastLogin(user.id, ctx.ip || 'unknown');

    
    const session = await this.sessionsService.create({
      userId: user.id,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    
    const tokenPair = await this.tokensService.issueTokenPair(user, session.id, {
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    
    await this.auditService.log({
      userId: user.id,
      eventType: AuditEventType.USER_LOGIN_SUCCESS,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { sessionId: session.id },
    });

    
    await this.eventsService.publish('user.login', {
      userId: user.id,
      email: user.email,
      sessionId: session.id,
      ip: ctx.ip,
    });

    return { ...tokenPair, user };
  }

  private async handleFailedLogin(user: User, ctx: RequestContext): Promise<void> {
    await this.usersService.incrementFailedAttempts(user.id);

    const maxAttempts = this.configService.get<number>(
      'app.accountLockout.maxAttempts',
      5,
    );
    const newAttempts = user.failedLoginAttempts + 1;

    if (newAttempts >= maxAttempts) {
      const lockMinutes = this.configService.get<number>(
        'app.accountLockout.durationMinutes',
        30,
      );
      const lockedUntil = addMinutes(new Date(), lockMinutes);
      await this.usersService.lockAccount(user.id, lockedUntil);

      await this.auditService.log({
        userId: user.id,
        eventType: AuditEventType.USER_ACCOUNT_LOCKED,
        ipAddress: ctx.ip,
        userAgent: ctx.userAgent,
        metadata: { lockedUntil: lockedUntil.toISOString() },
      });

      this.emailService
        .sendAccountLockedEmail(user.email, user.firstName)
        .catch((err) => this.logger.error('Failed to send lock email', err));

      await this.eventsService.publish('user.account.locked', {
        userId: user.id,
        email: user.email,
        lockedUntil: lockedUntil.toISOString(),
      });
    }

    await this.auditService.log({
      userId: user.id,
      eventType: AuditEventType.USER_LOGIN_FAILED,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
      metadata: { attemptCount: newAttempts },
      success: false,
      failureReason: 'invalid_password',
    });
  }

  async refreshTokens(
    refreshToken: string,
    ctx: RequestContext,
  ): Promise<TokenPair> {
    const result = await this.tokensService.rotateRefreshToken(refreshToken, {
      ip: ctx.ip,
      userAgent: ctx.userAgent,
    });

    await this.auditService.log({
      userId: result.user.id,
      eventType: AuditEventType.TOKEN_REFRESHED,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    return result.tokenPair;
  }

  async logout(
    userId: string,
    refreshToken: string | undefined,
    sessionId: string | undefined,
    ctx: RequestContext,
  ): Promise<void> {
    if (refreshToken) {
      await this.tokensService.revokeRefreshToken(refreshToken, 'logout');
    }
    if (sessionId) {
      await this.sessionsService.revoke(sessionId);
    }

    await this.auditService.log({
      userId,
      eventType: AuditEventType.USER_LOGOUT,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    await this.eventsService.publish('user.logout', { userId, sessionId });
  }

  async verifyEmail(dto: VerifyEmailDto, ctx: RequestContext): Promise<void> {
    const verificationToken = await this.tokensService.consumeVerificationToken(
      dto.token,
      VerificationTokenType.EMAIL_VERIFICATION,
    );

    await this.usersService.markEmailVerified(verificationToken.userId);

    await this.auditService.log({
      userId: verificationToken.userId,
      eventType: AuditEventType.USER_EMAIL_VERIFIED,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    await this.eventsService.publish('user.email.verified', {
      userId: verificationToken.userId,
    });
  }

  async resendVerification(email: string, ctx: RequestContext): Promise<void> {
    const user = await this.usersService.findByEmail(email);
    
    if (!user || user.emailVerified) return;

    const expiresHours = this.configService.get<number>(
      'app.tokens.emailVerificationExpiresHours',
      24,
    );
    const token = await this.tokensService.createVerificationToken(
      user.id,
      VerificationTokenType.EMAIL_VERIFICATION,
      expiresHours,
      ctx.ip,
    );

    await this.emailService.sendVerificationEmail(
      user.email,
      user.firstName,
      token,
    );
  }

  async forgotPassword(
    dto: ForgotPasswordDto,
    ctx: RequestContext,
  ): Promise<void> {
    const user = await this.usersService.findByEmail(dto.email);
    
    if (!user) return;

    const expiresHours = this.configService.get<number>(
      'app.tokens.passwordResetExpiresHours',
      1,
    );
    const token = await this.tokensService.createVerificationToken(
      user.id,
      VerificationTokenType.PASSWORD_RESET,
      expiresHours,
      ctx.ip,
    );

    await this.emailService.sendPasswordResetEmail(
      user.email,
      user.firstName,
      token,
    );

    await this.auditService.log({
      userId: user.id,
      eventType: AuditEventType.USER_PASSWORD_RESET_REQUESTED,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });
  }

  async resetPassword(dto: ResetPasswordDto, ctx: RequestContext): Promise<void> {
    const verificationToken = await this.tokensService.consumeVerificationToken(
      dto.token,
      VerificationTokenType.PASSWORD_RESET,
    );

    const bcryptRounds = this.configService.get<number>('app.bcryptRounds', 12);
    const passwordHash = await bcrypt.hash(dto.newPassword, bcryptRounds);

    await this.usersService.updatePassword(verificationToken.userId, passwordHash);

    
    await this.tokensService.revokeAllUserTokens(
      verificationToken.userId,
      'password_reset',
    );
    await this.sessionsService.revokeAllForUser(verificationToken.userId);

    await this.auditService.log({
      userId: verificationToken.userId,
      eventType: AuditEventType.USER_PASSWORD_RESET_COMPLETED,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    await this.eventsService.publish('user.password.reset', {
      userId: verificationToken.userId,
    });
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
    ctx: RequestContext,
  ): Promise<void> {
    const user = await this.usersService.findByIdOrFail(userId);

    const currentValid = await bcrypt.compare(
      dto.currentPassword,
      user.passwordHash,
    );
    if (!currentValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    const bcryptRounds = this.configService.get<number>('app.bcryptRounds', 12);
    const passwordHash = await bcrypt.hash(dto.newPassword, bcryptRounds);

    await this.usersService.updatePassword(userId, passwordHash);

    
    await this.tokensService.revokeAllUserTokens(userId, 'password_changed');

    await this.auditService.log({
      userId,
      eventType: AuditEventType.USER_PASSWORD_CHANGED,
      ipAddress: ctx.ip,
      userAgent: ctx.userAgent,
    });

    await this.eventsService.publish('user.password.changed', { userId });
  }
}
