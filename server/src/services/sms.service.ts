import { env } from '../config/env.js';

export class SmsService {
  public static isConfigured(): boolean {
    return Boolean(env.AFRO_MESSAGE_API_KEY && env.AFRO_MESSAGE_API_KEY.trim().length > 0);
  }

  /**
   * Normalizes Ethiopian and international phone numbers into E.164 format (+251...)
   */
  public static normalizePhoneNumber(rawPhone: string): string {
    const cleaned = rawPhone.replace(/[\s\-\(\)]/g, '').trim();

    // Ethiopian domestic format: 09xxxxxxxx or 07xxxxxxxx
    if (/^0[79]\d{8}$/.test(cleaned)) {
      return `+251${cleaned.slice(1)}`;
    }
    // Without leading zero: 9xxxxxxxx or 7xxxxxxxx
    if (/^[79]\d{8}$/.test(cleaned)) {
      return `+251${cleaned}`;
    }
    // 2519xxxxxxxx or 2517xxxxxxxx
    if (/^251[79]\d{8}$/.test(cleaned)) {
      return `+${cleaned}`;
    }
    // Already in +251... format
    if (/^\+251[79]\d{8}$/.test(cleaned)) {
      return cleaned;
    }
    // Other international phone numbers
    if (cleaned.startsWith('+')) {
      return cleaned;
    }

    return `+${cleaned}`;
  }

  /**
   * Sends an SMS message using AfroMessage API
   */
  public static async sendSms(to: string, message: string): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!this.isConfigured()) {
      console.warn(`[SMS] AfroMessage not configured. Simulating SMS to ${to}: "${message}"`);
      return { success: true, data: { simulated: true } };
    }

    const normalizedTo = this.normalizePhoneNumber(to);

    try {
      const payload: Record<string, any> = {
        to: normalizedTo,
        message,
      };

      if (env.AFRO_MESSAGE_SENDER) {
        payload.sender = env.AFRO_MESSAGE_SENDER;
      }

      const response = await fetch(env.AFRO_MESSAGE_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${env.AFRO_MESSAGE_API_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      const data: any = await response.json().catch(() => ({}));
      const ok = response.ok && data?.acknowledge !== 'error';

      if (!ok) {
        const errorMsg = data?.response?.errors?.[0] || data?.message || response.statusText;
        console.warn(`[SMS -> ${normalizedTo}] AfroMessage notice:`, errorMsg);
        return { success: false, error: errorMsg };
      }

      console.log(`[SMS sent -> ${normalizedTo}] Message successfully delivered.`);
      return { success: true, data };
    } catch (err: any) {
      console.error(`[SMS failed -> ${normalizedTo}]:`, err.message);
      return { success: false, error: err.message };
    }
  }

  /**
   * Helper to send a 6-digit phone verification code
   */
  public static async sendVerificationOtp(phone: string, code: string): Promise<{ success: boolean; error?: string }> {
    const text = `[Dagna / ዳኛ] Your phone verification code is: ${code}. Valid for 10 minutes.`;
    return this.sendSms(phone, text);
  }
}
