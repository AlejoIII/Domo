import { randomUUID } from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';

type RequestWithAuth = IncomingMessage & {
  user?: { companyId?: string; id?: string };
  apiKeyContext?: { companyId?: string };
};

export function buildPinoHttpOptions() {
  return {
    transport:
      process.env.NODE_ENV !== 'production'
        ? { target: 'pino-pretty', options: { singleLine: true } }
        : undefined,
    autoLogging: true,
    genReqId: (req: IncomingMessage, res: ServerResponse) => {
      const header = req.headers['x-request-id'];
      if (typeof header === 'string' && header.trim()) return header.trim();
      const id = randomUUID();
      res.setHeader('x-request-id', id);
      return id;
    },
    customProps: (req: IncomingMessage) => {
      const authReq = req as RequestWithAuth;
      return {
        companyId: authReq.user?.companyId ?? authReq.apiKeyContext?.companyId,
        userId: authReq.user?.id,
      };
    },
  };
}
