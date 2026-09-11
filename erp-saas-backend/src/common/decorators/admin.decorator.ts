import { SetMetadata } from '@nestjs/common';

export const ADMIN_ONLY_KEY = 'adminOnly';

/** Solo el rol `admin` de la empresa (creador de la cuenta / administradores). */
export const RequireAdmin = () => SetMetadata(ADMIN_ONLY_KEY, true);
