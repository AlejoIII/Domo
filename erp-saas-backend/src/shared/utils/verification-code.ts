import { randomInt } from 'crypto';

export function generateVerificationCode(): string {
  return String(randomInt(100000, 1000000));
}
