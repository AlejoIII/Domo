import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { ApiKeyAuthContext } from './api-key.decorator';

export const CurrentApiKey = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ApiKeyAuthContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.apiKeyContext;
  },
);

export const CurrentApiCompany = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.apiKeyContext.companyId as string;
  },
);
