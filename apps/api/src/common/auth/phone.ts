import { createHmac } from 'node:crypto';

export const INDIAN_PHONE_PATTERN = /^\+91[6-9]\d{9}$/;

export function assertIndianPhone(phone: string): string {
  const normalized = phone.trim();
  if (!INDIAN_PHONE_PATTERN.test(normalized)) {
    throw new Error('Invalid phone');
  }
  return normalized;
}

export function maskPhone(phone: string): string {
  const normalized = phone.trim();
  if (normalized.length < 8) {
    return '****';
  }
  return `${normalized.slice(0, 3)}******${normalized.slice(-4)}`;
}

export function phoneFingerprint(phone: string, secret: string): string {
  return createHmac('sha256', secret).update(phone.trim()).digest('hex').slice(0, 24);
}
