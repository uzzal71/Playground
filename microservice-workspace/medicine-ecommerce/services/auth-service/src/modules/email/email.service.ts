import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

export interface EmailContent {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter;
  private fromAddress: string;
  private appUrl: string;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const smtpConfig = this.configService.get('email.smtp');
    const fromConfig = this.configService.get('email.from');
    this.appUrl = this.configService.get<string>('app.appUrl', 'http://localhost:3000');
    this.fromAddress = `"${fromConfig.name}" <${fromConfig.email}>`;

    this.transporter = nodemailer.createTransport(smtpConfig);

    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified');
    } catch (err) {
      this.logger.warn(
        'SMTP verification failed - emails may not send',
        err instanceof Error ? err.message : err,
      );
    }
  }

  async send(content: EmailContent): Promise<void> {
    try {
      const info = await this.transporter.sendMail({
        from: this.fromAddress,
        to: content.to,
        subject: content.subject,
        html: content.html,
        text: content.text || this.stripHtml(content.html),
      });
      this.logger.log(`Email sent to ${content.to} - messageId: ${info.messageId}`);
    } catch (err) {
      this.logger.error(`Failed to send email to ${content.to}`, err);
      throw err;
    }
  }

  async sendVerificationEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const verifyUrl = `${this.appUrl}/verify-email?token=${token}`;
    await this.send({
      to,
      subject: 'Verify your email address',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#2c5282;">Welcome, ${name}!</h2>
          <p>Thanks for signing up. Please verify your email address by clicking the button below.</p>
          <div style="margin:30px 0;">
            <a href="${verifyUrl}"
               style="background:#3182ce;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">
              Verify Email
            </a>
          </div>
          <p style="color:#666;font-size:14px;">Or copy this link: <br><code>${verifyUrl}</code></p>
          <p style="color:#666;font-size:14px;">This link will expire in 24 hours.</p>
          <p style="color:#999;font-size:12px;margin-top:40px;">
            If you didn't create an account, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  }

  async sendPasswordResetEmail(
    to: string,
    name: string,
    token: string,
  ): Promise<void> {
    const resetUrl = `${this.appUrl}/reset-password?token=${token}`;
    await this.send({
      to,
      subject: 'Reset your password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#2c5282;">Password Reset Request</h2>
          <p>Hi ${name},</p>
          <p>We received a request to reset your password. Click the button below to set a new password.</p>
          <div style="margin:30px 0;">
            <a href="${resetUrl}"
               style="background:#e53e3e;color:white;padding:12px 24px;text-decoration:none;border-radius:6px;display:inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color:#666;font-size:14px;">Or copy this link: <br><code>${resetUrl}</code></p>
          <p style="color:#666;font-size:14px;">This link will expire in 1 hour.</p>
          <p style="color:#999;font-size:12px;margin-top:40px;">
            If you didn't request a password reset, please ignore this email or contact support if you have concerns.
          </p>
        </div>
      `,
    });
  }

  async sendAccountLockedEmail(to: string, name: string): Promise<void> {
    await this.send({
      to,
      subject: 'Your account has been temporarily locked',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
          <h2 style="color:#c53030;">Account Locked</h2>
          <p>Hi ${name},</p>
          <p>Your account has been temporarily locked due to multiple failed login attempts.</p>
          <p>You can try again in 30 minutes, or reset your password if you believe this was unauthorized.</p>
          <p style="color:#999;font-size:12px;margin-top:40px;">
            If this wasn't you, please change your password immediately.
          </p>
        </div>
      `,
    });
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }
}
