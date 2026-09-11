import {
  CallHandler, ExecutionContext, Injectable, NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { AuditService } from './audit.service';
import { buildAuditAction, extractAuditEntity } from './audit-action.util';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly audit: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const method = req.method as string;

    if (!['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      return next.handle();
    }

    const path: string = req.route?.path ?? req.url ?? '';
    if (path.includes('/auth/') || path.includes('/health') || path.includes('/platform')) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(() => {
        const user = req.user as { id?: string; companyId?: string } | undefined;
        if (!user?.companyId) return;

        const entity = extractAuditEntity(path);
        this.audit.logAsync({
          action: buildAuditAction(method, path),
          companyId: user.companyId,
          userId: user.id,
          entity: entity ?? undefined,
          entityId: req.params?.id,
          // Solo IDs de ruta: evita inflar JSONB con query/params completos
          metadata: slimAuditMetadata(req.params as Record<string, unknown> | undefined),
        });
      }),
    );
  }
}

/** Conserva como máximo unos pocos identificadores de ruta. */
function slimAuditMetadata(
  params?: Record<string, unknown>,
): Record<string, string> | undefined {
  if (!params) return undefined;

  const allowed = ['id', 'paymentId', 'entryId', 'noteId', 'userId', 'entityId', 'deliveryId'];
  const slim: Record<string, string> = {};
  for (const key of allowed) {
    const value = params[key];
    if (typeof value === 'string' && value.length > 0 && value.length <= 80) {
      slim[key] = value;
    }
  }
  return Object.keys(slim).length > 0 ? slim : undefined;
}
