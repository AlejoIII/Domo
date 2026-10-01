import type { INestApplication } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';
import { getQueueToken } from '@nestjs/bullmq';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import type { Queue } from 'bullmq';
import {
  QUEUE_AUDIT,
  QUEUE_EMAIL,
  QUEUE_EXPORTS,
  QUEUE_VERIFACTU,
  QUEUE_WEBHOOKS,
} from './queue.constants';

export function setupBullBoard(app: INestApplication, config: ConfigService) {
  if (config.get('BULL_BOARD_ENABLED') !== 'true') return;

  const token = config.get<string>('BULL_BOARD_TOKEN');
  if (!token) {
    console.warn('BULL_BOARD_ENABLED but BULL_BOARD_TOKEN missing — Bull Board disabled');
    return;
  }

  const expressApp = app as NestExpressApplication;
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');

  const queues = [QUEUE_WEBHOOKS, QUEUE_AUDIT, QUEUE_EMAIL, QUEUE_EXPORTS, QUEUE_VERIFACTU]
    .map((name) => {
      try {
        return app.get<Queue>(getQueueToken(name));
      } catch {
        return null;
      }
    })
    .filter((q): q is Queue => q != null);

  if (!queues.length) return;

  createBullBoard({
    queues: queues.map((q) => new BullMQAdapter(q)),
    serverAdapter,
  });

  expressApp.use('/admin/queues', (req: Request, res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const queryToken = typeof req.query.token === 'string' ? req.query.token : undefined;
    const bearer = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (bearer === token || queryToken === token) {
      next();
      return;
    }
    res.status(401).json({ message: 'Unauthorized' });
  });

  expressApp.use('/admin/queues', serverAdapter.getRouter());
}
