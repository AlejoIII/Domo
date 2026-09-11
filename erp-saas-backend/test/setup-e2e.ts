process.env.NODE_ENV = 'test';
process.env.EMAIL_VERIFICATION_ENABLED = 'false';
process.env.EMAIL_PROVIDER = 'console';
process.env.JWT_SECRET = process.env.JWT_SECRET ?? 'test-jwt-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-jwt-refresh-secret';
process.env.AUTH_EXPOSE_TOKENS_IN_BODY = 'true';

jest.mock('otplib', () => ({
  generateSecret: () => 'MOCKTOTPSECRET0001',
  generateURI: () => 'otpauth://totp/Domo:test?secret=MOCK',
  verifySync: () => true,
  generateSync: () => '123456',
}));
