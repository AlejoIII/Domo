import { AuditRetentionService } from './audit-retention.service';

describe('AuditRetentionService helpers', () => {
  const service = Object.create(AuditRetentionService.prototype) as AuditRetentionService;

  it('parses monthly partition names', () => {
    const parse = (service as unknown as {
      parsePartitionMonth: (name: string) => Date | null;
    }).parsePartitionMonth.bind(service);

    expect(parse('audit_logs_2024_06')?.toISOString()).toBe('2024-06-01T00:00:00.000Z');
    expect(parse('webhook_deliveries_2025_01')?.toISOString()).toBe('2025-01-01T00:00:00.000Z');
    expect(parse('audit_logs_default')).toBeNull();
    expect(parse('audit_logs')).toBeNull();
    expect(parse('users_2024_06')).toBeNull();
  });

  it('computes cutoff as first day of month minus retention', () => {
    const cutoff = (service as unknown as {
      cutoffMonthStart: (months: number) => Date;
    }).cutoffMonthStart.bind(service);

    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-26T12:00:00.000Z'));

    expect(cutoff(12).toISOString()).toBe('2025-07-01T00:00:00.000Z');
    expect(cutoff(1).toISOString()).toBe('2026-06-01T00:00:00.000Z');

    jest.useRealTimers();
  });
});
