import { SetMetadata } from '@nestjs/common';
import type { ApiScope } from './integrations.constants';

export const API_SCOPES_KEY = 'apiScopes';

export const RequireApiScope = (...scopes: ApiScope[]) =>
  SetMetadata(API_SCOPES_KEY, scopes);

export const API_KEY_AUTH_KEY = 'apiKeyAuth';

export interface ApiKeyAuthContext {
  id: string;
  companyId: string;
  scopes: string[];
}

export const API_KEY_CONTEXT_KEY = 'apiKeyContext';
