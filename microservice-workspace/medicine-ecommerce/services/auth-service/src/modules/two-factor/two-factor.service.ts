import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { generateBackupCodes } from '../../common/utils/crypto.util';

@Injectable()
export class TwoFactorService {
  private readonly appName: string;
  private readonly window: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    this.appName = this.configService.get<string>(
      'twoFactor.appName',
      'MedicineEcommerce',
    );
    this.window = this.configService.get<number>('twoFactor.window', 1);
    authenticator.options = { window: this.window };
  }

  async generateSecret(userId: string): Promise<{
    secret: string;
    otpauthUrl: string;
    qrCodeDataUrl: string;
  }> {
    const user = await this.usersService.findByIdOrFail(userId);

    if (user.twoFactorEnabled) {
      throw new BadRequestException('2FA is already enabled');
    }

    const secret = authenticator.generateSecret();
    const otpauthUrl = authenticator.keyuri(user.email, this.appName, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    
    
    await this.usersService.update(userId, { twoFactorSecret: secret });

    return { secret, otpauthUrl, qrCodeDataUrl };
  }

  async confirmAndEnable(
    userId: string,
    code: string,
  ): Promise<{ backupCodes: string[] }> {
    const user = await this.usersService.findByIdWithSecrets(userId);
    if (!user) throw new UnauthorizedException('User not found');

    if (!user.twoFactorSecret) {
      throw new BadRequestException(
        '2FA setup not initiated. Call generate first.',
      );
    }

    if (!authenticator.check(code, user.twoFactorSecret)) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    
    const backupCodes = generateBackupCodes(10);
    const hashedCodes = await Promise.all(
      backupCodes.map((c) => bcrypt.hash(c, 10)),
    );

    await this.usersService.update(userId, {
      twoFactorEnabled: true,
      twoFactorBackupCodes: hashedCodes,
    });

    return { backupCodes };
  }

  async verify(userId: string, code: string): Promise<boolean> {
    const user = await this.usersService.findByIdWithSecrets(userId);
    if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
      return false;
    }

    
    if (authenticator.check(code, user.twoFactorSecret)) {
      return true;
    }

    
    if (user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
      for (let i = 0; i < user.twoFactorBackupCodes.length; i++) {
        const isMatch = await bcrypt.compare(code, user.twoFactorBackupCodes[i]);
        if (isMatch) {
          
          const remaining = [...user.twoFactorBackupCodes];
          remaining.splice(i, 1);
          await this.usersService.update(userId, {
            twoFactorBackupCodes: remaining,
          });
          return true;
        }
      }
    }

    return false;
  }

  async disable(userId: string, code: string, password: string): Promise<void> {
    const user = await this.usersService.findByIdWithSecrets(userId);
    if (!user) throw new UnauthorizedException('User not found');

    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('2FA is not enabled');
    }

    const codeValid = await this.verify(userId, code);
    if (!codeValid) {
      throw new UnauthorizedException('Invalid 2FA code');
    }

    await this.usersService.update(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null,
      twoFactorBackupCodes: null,
    });
  }
}
