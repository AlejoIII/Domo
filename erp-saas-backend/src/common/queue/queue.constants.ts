export const QUEUE_WEBHOOKS = 'webhooks';
export const QUEUE_AUDIT = 'audit';
export const QUEUE_EMAIL = 'email';
export const QUEUE_EXPORTS = 'exports';
export const QUEUE_VERIFACTU = 'verifactu';

export const QUEUE_PREFIX = 'domo:bull';

export const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: 'exponential' as const, delay: 2000 },
  removeOnComplete: 100,
  removeOnFail: 500,
};
