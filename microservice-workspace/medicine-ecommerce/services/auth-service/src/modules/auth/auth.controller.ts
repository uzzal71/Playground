import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { TwoFactorService } from '../two-factor/two-factor.service';
import { UsersService } from '../users/users.service';
import {
  AuthResponseDto,
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshTokenDto,
  RegisterDto,
  ResendVerificationDto,
  ResetPasswordDto,
  TwoFactorRequiredResponseDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import {
  Confirm2FAResponseDto,
  Disable2FADto,
  Enable2FAResponseDto,
  Verify2FADto,
} from '../two-factor/dto/two-factor.dto';
import {
  AuthenticatedUser,
  CurrentUser,
  IpAddress,
  Public,
  UserAgent,
} from '../../common/decorators/auth.decorators';

@ApiTags('Authentication')
@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly twoFactorService: TwoFactorService,
    private readonly usersService: UsersService,
  ) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  async register(
    @Body() dto: RegisterDto,
    @IpAddress() ip: string,
    @UserAgent() userAgent: string,
  ) {
    return this.authService.register(dto, { ip, userAgent });
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Log in with email and password' })
  @ApiResponse({ status: 200, type: AuthResponseDto })
  @ApiResponse({ status: 200, type: TwoFactorRequiredResponseDto })
  async login(
    @Body() dto: LoginDto,
    @IpAddress() ip: string,
    @UserAgent() userAgent: string,
  ) {
    const result = await this.authService.login(dto, { ip, userAgent });

    if ('twoFactorRequired' in result) {
      return {
        twoFactorRequired: true,
        userId: result.userId,
        message: 'Please provide your 2FA code to complete login',
      };
    }

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      tokenType: 'Bearer',
      user: {
        id: result.user.id,
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
        role: result.user.role,
        emailVerified: result.user.emailVerified,
        twoFactorEnabled: result.user.twoFactorEnabled,
      },
    };
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(
    @Body() dto: RefreshTokenDto,
    @IpAddress() ip: string,
    @UserAgent() userAgent: string,
  ) {
    const tokens = await this.authService.refreshTokens(dto.refreshToken, {
      ip,
      userAgent,
    });
    return { ...tokens, tokenType: 'Bearer' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Log out current session' })
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: RefreshTokenDto,
    @IpAddress() ip: string,
    @UserAgent() userAgent: string,
  ) {
    await this.authService.logout(user.sub, dto.refreshToken, user.sessionId, {
      ip,
      userAgent,
    });
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  async me(@CurrentUser() user: AuthenticatedUser) {
    const fullUser = await this.usersService.findByIdOrFail(user.sub);
    return {
      id: fullUser.id,
      email: fullUser.email,
      firstName: fullUser.firstName,
      lastName: fullUser.lastName,
      phone: fullUser.phone,
      role: fullUser.role,
      status: fullUser.status,
      emailVerified: fullUser.emailVerified,
      twoFactorEnabled: fullUser.twoFactorEnabled,
      lastLoginAt: fullUser.lastLoginAt,
      createdAt: fullUser.createdAt,
    };
  }

  
  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Verify email address with token from email' })
  async verifyEmail(
    @Body() dto: VerifyEmailDto,
    @IpAddress() ip: string,
    @UserAgent() userAgent: string,
  ) {
    await this.authService.verifyEmail(dto, { ip, userAgent });
    return { message: 'Email verified successfully' };
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 300000 } }) 
  @ApiOperation({ summary: 'Resend email verification link' })
  async resendVerification(
    @Body() dto: ResendVerificationDto,
    @IpAddress() ip: string,
    @UserAgent() userAgent: string,
  ) {
    await this.authService.resendVerification(dto.email, { ip, userAgent });
    return { message: 'If the email exists and is unverified, a new link has been sent' };
  }

  
  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 3, ttl: 300000 } })
  @ApiOperation({ summary: 'Request a password reset email' })
  async forgotPassword(
    @Body() dto: ForgotPasswordDto,
    @IpAddress() ip: string,
    @UserAgent() userAgent: string,
  ) {
    await this.authService.forgotPassword(dto, { ip, userAgent });
    return { message: 'If the email exists, a reset link has been sent' };
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Reset password using token from email' })
  async resetPassword(
    @Body() dto: ResetPasswordDto,
    @IpAddress() ip: string,
    @UserAgent() userAgent: string,
  ) {
    await this.authService.resetPassword(dto, { ip, userAgent });
    return { message: 'Password reset successful. All sessions have been revoked.' };
  }

  @Put('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password (authenticated)' })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ChangePasswordDto,
    @IpAddress() ip: string,
    @UserAgent() userAgent: string,
  ) {
    await this.authService.changePassword(user.sub, dto, { ip, userAgent });
    return { message: 'Password changed. Please log in again.' };
  }

  
  @Post('2fa/setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate 2FA secret and QR code' })
  @ApiResponse({ status: 201, type: Enable2FAResponseDto })
  async setup2FA(@CurrentUser() user: AuthenticatedUser) {
    return this.twoFactorService.generateSecret(user.sub);
  }

  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm 2FA setup with code' })
  @ApiResponse({ status: 200, type: Confirm2FAResponseDto })
  async enable2FA(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: Verify2FADto,
  ) {
    const result = await this.twoFactorService.confirmAndEnable(
      user.sub,
      dto.code,
    );
    return {
      backupCodes: result.backupCodes,
      message: 'Two-factor authentication enabled. Store these backup codes in a safe place — they will not be shown again.',
    };
  }

  @Delete('2fa')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable 2FA' })
  async disable2FA(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: Disable2FADto,
  ) {
    await this.twoFactorService.disable(user.sub, dto.code, dto.password);
    return { message: 'Two-factor authentication disabled' };
  }
}
