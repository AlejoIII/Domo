import { describe, expect, it } from 'vitest';
import {
  formatPermissionGroup,
  formatPermissionLabel,
  isSensitivePermission,
} from './format-permissions';

describe('format-permissions', () => {
  it('translates known groups', () => {
    expect(formatPermissionGroup('clients')).toBe('Clientes');
    expect(formatPermissionGroup('settings')).toBe('Configuración');
  });

  it('translates known permissions', () => {
    expect(formatPermissionLabel('invoices.write')).toBe(
      'Crear y editar facturas, cobros y rectificativas',
    );
    expect(formatPermissionLabel('api.manage')).toBe(
      'Gestionar claves API y webhooks',
    );
  });

  it('falls back for unknown codes', () => {
    expect(formatPermissionLabel('widgets.read')).toMatch(/widgets/i);
    expect(formatPermissionLabel('widgets.read')).toMatch(/ver|consultar/i);
  });

  it('flags sensitive permissions', () => {
    expect(isSensitivePermission('settings.billing')).toBe(true);
    expect(isSensitivePermission('clients.read')).toBe(false);
  });
});
