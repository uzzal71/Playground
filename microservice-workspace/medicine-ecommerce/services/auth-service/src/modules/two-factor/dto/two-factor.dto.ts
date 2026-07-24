import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class Enable2FAResponseDto {
  @ApiProperty({ description: 'Base32 secret to manually enter' })
  secret: string;

  @ApiProperty({ description: 'otpauth:// URI for QR code generation' })
  otpauthUrl: string;

  @ApiProperty({ description: 'Data URL of the QR code image' })
  qrCodeDataUrl: string;
}

export class Verify2FADto {
  @ApiProperty({ example: '123456', description: '6-digit code from authenticator app' })
  @IsString()
  @Length(6, 6, { message: '2FA code must be exactly 6 digits' })
  code: string;
}

export class Confirm2FAResponseDto {
  @ApiProperty({ description: 'List of one-time backup codes — store securely' })
  backupCodes: string[];

  @ApiProperty()
  message: string;
}

export class Disable2FADto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({ description: 'Current 6-digit 2FA code' })
  @IsString()
  @Length(6, 6)
  code: string;
}
