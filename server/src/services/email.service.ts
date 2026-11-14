import nodemailer, { Transporter } from 'nodemailer';
import { env } from '../config/env.js';

export class EmailService {
  private static transporter: Transporter | null = null;

  public static isConfigured(): boolean {
    return Boolean(env.SMTP_USER && env.SMTP_PASS);
  }

  private static getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_SECURE, // true for port 465, false for other ports
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }
    return this.transporter;
  }

  /**
   * Sends an email verification 6-digit OTP code
   */
  public static async sendVerificationCode(to: string, code: string, handle: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn(`[EMAIL] SMTP not configured. Simulating verification email to ${to}: code=${code}`);
      return true;
    }

    try {
      const transporter = this.getTransporter();
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject: `Dagna (ዳኛ) - Verify Your Email Address [${code}]`,
        text: `Hello ${handle},\n\nYour Dagna verification code is: ${code}\n\nThis code will expire in 10 minutes.\nIf you did not request this code, please ignore this email.\n\nBest regards,\nThe Dagna Team`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background-color: #0f172a; border: 1px solid #1e293b; border-radius: 12px; color: #f8fafc;">
            <div style="text-align: center; margin-bottom: 24px;">
              <h1 style="color: #38bdf8; font-size: 28px; margin: 0; letter-spacing: 1px;">DAGNA <span style="color: #94a3b8; font-size: 20px;">(ዳኛ)</span></h1>
              <p style="color: #64748b; font-size: 13px; margin-top: 4px;">Competitive Programming & Online Judge</p>
            </div>
            
            <div style="background-color: #1e293b; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
              <p style="color: #cbd5e1; font-size: 15px; margin-top: 0;">Hello <strong style="color: #ffffff;">${handle}</strong>,</p>
              <p style="color: #94a3b8; font-size: 14px;">Use the verification code below to confirm your email address on Dagna:</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #38bdf8; padding: 12px 24px; background-color: #0f172a; border-radius: 6px; display: inline-block; margin: 16px 0; font-family: monospace;">
                ${code}
              </div>
              <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">This code is valid for <strong>10 minutes</strong>. Never share this code with anyone.</p>
            </div>

            <p style="color: #475569; font-size: 12px; text-align: center; margin: 0;">
              If you didn't create an account or request this verification, you can safely ignore this email.
            </p>
          </div>
        `,
      });
      console.log(`[EMAIL sent -> ${to}] Verification code delivered.`);
      return true;
    } catch (err: any) {
      console.error(`[EMAIL failed -> ${to}]:`, err.message);
      return false;
    }
  }

  /**
   * Sends a password reset link/token
   */
  public static async sendPasswordReset(to: string, resetUrl: string, handle: string): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn(`[EMAIL] SMTP not configured. Simulating reset email to ${to}: ${resetUrl}`);
      return true;
    }

    try {
      const transporter = this.getTransporter();
      await transporter.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject: `Dagna (ዳኛ) - Password Reset Request`,
        text: `Hello ${handle},\n\nYou requested a password reset. Click the link below to set a new password:\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nBest regards,\nThe Dagna Team`,
        html: `
          <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background-color: #0f172a; border-radius: 12px; color: #f8fafc;">
            <h2 style="color: #38bdf8;">Password Reset</h2>
            <p>Hello <strong>${handle}</strong>,</p>
            <p>Click the button below to reset your password. This link is valid for 1 hour.</p>
            <div style="text-align: center; margin: 24px 0;">
              <a href="${resetUrl}" style="background-color: #0284c7; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
            </div>
            <p style="color: #64748b; font-size: 12px;">If you did not request a password reset, no action is needed.</p>
          </div>
        `,
      });
      return true;
    } catch (err: any) {
      console.error(`[EMAIL reset failed -> ${to}]:`, err.message);
      return false;
    }
  }
}
