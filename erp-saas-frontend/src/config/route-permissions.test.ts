import { describe, expect, it } from 'vitest';
import { getRoutePermission } from '@/config/route-permissions';

describe('getRoutePermission', () => {
  it('allows dashboard and settings without explicit permission', () => {
    expect(getRoutePermission('/dashboard')).toBeNull();
    expect(getRoutePermission('/settings')).toBeNull();
    expect(getRoutePermission('/onboarding')).toBeNull();
  });

  it('maps core sales and inventory routes', () => {
    expect(getRoutePermission('/clients')).toBe('clients.read');
    expect(getRoutePermission('/clients/new')).toBe('clients.read');
    expect(getRoutePermission('/orders/abc')).toBe('orders.read');
    expect(getRoutePermission('/inventory/movements')).toBe('products.read');
  });

  it('maps premium modules', () => {
    expect(getRoutePermission('/accounting')).toBe('accounting.read');
    expect(getRoutePermission('/treasury')).toBe('treasury.read');
    expect(getRoutePermission('/crm')).toBe('crm.read');
    expect(getRoutePermission('/crm/settings/stages')).toBe('crm.write');
    expect(getRoutePermission('/projects')).toBe('projects.read');
    expect(getRoutePermission('/manufacturing')).toBe('manufacturing.read');
    expect(getRoutePermission('/reports/stock-valuation')).toBe('reports.read');
    expect(getRoutePermission('/hr/employees')).toBe('employees.read');
  });

  it('maps print routes to parent document permission', () => {
    expect(getRoutePermission('/invoices/1/print')).toBe('invoices.read');
    expect(getRoutePermission('/orders/1/delivery-note/print')).toBe('orders.read');
  });
});
