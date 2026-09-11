import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BetaService } from './beta.service';
import { PrismaService } from '../../common/database/prisma.service';

describe('BetaService', () => {
  let service: BetaService;
  const prisma = {
    platformSettings: {
      upsert: jest.fn(),
    },
    company: {
      count: jest.fn(),
    },
    betaInvite: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    prisma.platformSettings.upsert.mockResolvedValue({
      id: 'global',
      registrationMode: 'invite_only',
      betaSignupCap: 10,
    });
    prisma.company.count.mockResolvedValue(3);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BetaService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string, fallback?: string) => {
              if (key === 'REGISTRATION_MODE') return 'open';
              if (key === 'FRONTEND_URL') return 'http://localhost:5173';
              return fallback;
            },
          },
        },
      ],
    }).compile();

    service = module.get(BetaService);
  });

  it('returns invite-only registration config', async () => {
    const config = await service.getRegistrationConfig();
    expect(config.mode).toBe('invite_only');
    expect(config.requiresInvite).toBe(true);
    expect(config.betaSignupCount).toBe(3);
    expect(config.signupCapReached).toBe(false);
  });

  it('rejects expired invite token', async () => {
    prisma.betaInvite.findUnique.mockResolvedValue({
      id: '1',
      token: 'abc',
      label: 'beta-2026',
      email: null,
      maxUses: 1,
      usedCount: 0,
      revokedAt: null,
      expiresAt: new Date('2020-01-01'),
    });

    await expect(service.validateInviteToken('abc')).rejects.toThrow('expirado');
  });

  it('builds register url with invite token', () => {
    expect(service.buildRegisterUrl('token123')).toBe(
      'http://localhost:5173/register?invite=token123',
    );
  });
});
