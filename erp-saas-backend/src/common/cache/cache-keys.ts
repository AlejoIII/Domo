/** Logical cache keys (without Redis prefix). */
export const CacheKeys = {
  dashboardStats: (companyId: string) => `dashboard:stats:${companyId}`,
  reportsSales: (companyId: string, from?: string, to?: string) =>
    `reports:sales:${companyId}:${from ?? ''}:${to ?? ''}`,
  reportsSalesPrefix: (companyId: string) => `reports:sales:${companyId}:`,
  companySettings: (companyId: string) => `settings:company:${companyId}`,
  navigationPrefs: (companyId: string) => `settings:navigation:${companyId}`,
  formLayout: (companyId: string, entityId: string) =>
    `settings:form-layout:${companyId}:${entityId}`,
  rolesList: (companyId: string) => `roles:list:${companyId}`,
  roleOne: (companyId: string, roleId: string) => `roles:one:${companyId}:${roleId}`,
  permissionsCatalog: () => 'permissions:catalog',
  userAuth: (userId: string) => `auth:context:${userId}`,
} as const;
