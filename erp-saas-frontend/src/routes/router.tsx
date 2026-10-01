import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { MarketingLayout } from '@/layouts/MarketingLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { GuestRoute } from '@/routes/GuestRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { VerifyEmailPage } from '@/pages/VerifyEmailPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { AcceptInvitePage } from '@/pages/AcceptInvitePage';
import { LandingPage } from '@/pages/LandingPage';
import { FeaturesPage } from '@/pages/FeaturesPage';
import { PricingPage } from '@/pages/PricingPage';
import { AboutPage } from '@/pages/AboutPage';
import { ContactPage } from '@/pages/ContactPage';
import { TermsPage } from '@/pages/TermsPage';
import { PrivacyPage } from '@/pages/PrivacyPage';
import { CookiesPage } from '@/pages/CookiesPage';
import { StatusPage } from '@/pages/StatusPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ClientsPage } from '@/pages/ClientsPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { SuppliersPage } from '@/pages/SuppliersPage';
import { CategoriesPage } from '@/pages/CategoriesPage';
import { WarehousesPage } from '@/pages/WarehousesPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { InvoicesPage } from '@/pages/InvoicesPage';
import { QuotesPage } from '@/pages/QuotesPage';
import { PurchaseOrdersPage } from '@/pages/PurchaseOrdersPage';
import { SalesReportPage } from '@/pages/SalesReportPage';
import { FinanceReportPage } from '@/pages/FinanceReportPage';
import { AccountingPage } from '@/pages/AccountingPage';
import { TreasuryPage } from '@/pages/TreasuryPage';
import { DataImportPage } from '@/pages/DataImportPage';
import { CrmPage } from '@/pages/CrmPage';
import { CrmSettingsHubPage } from '@/pages/crm/CrmSettingsHubPage';
import { CrmStagesPage } from '@/pages/crm/CrmStagesPage';
import { CrmCatalogPage } from '@/pages/crm/CrmCatalogPage';
import { CrmTemplatesPage } from '@/pages/crm/CrmTemplatesPage';
import { CrmTemplatesRedirect } from '@/pages/crm/CrmTemplatesRedirect';
import { CrmEmailSettingsPage } from '@/pages/crm/CrmEmailSettingsPage';
import { CrmAcreliaPage } from '@/pages/crm/CrmAcreliaPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ManufacturingPage } from '@/pages/ManufacturingPage';
import { StockMovementsPage } from '@/pages/StockMovementsPage';
import { StockValuationReportPage } from '@/pages/StockValuationReportPage';
import { ClientFormPage } from '@/features/clients/ClientFormPage';
import { ProductFormPage } from '@/features/products/ProductFormPage';
import { SupplierFormPage } from '@/features/suppliers/SupplierFormPage';
import { CategoryFormPage } from '@/features/categories/CategoryFormPage';
import { WarehouseFormPage } from '@/features/warehouses/WarehouseFormPage';
import { OrderFormPage } from '@/features/orders/OrderFormPage';
import { DocumentPrintPage } from '@/pages/DocumentPrintPage';
import { InvoiceFormPage } from '@/features/invoices/InvoiceFormPage';
import { QuoteFormPage } from '@/features/quotes/QuoteFormPage';
import { PurchaseOrderFormPage } from '@/features/purchase-orders/PurchaseOrderFormPage';
import { EmployeesPage } from '@/pages/EmployeesPage';
import { EmployeeFormPage } from '@/features/employees/EmployeeFormPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { HelpManualsPage } from '@/pages/HelpManualsPage';
import { OnboardingGate } from '@/routes/OnboardingGate';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { PlanLimitPage } from '@/pages/PlanLimitPage';
import { PlatformAdminRoute } from '@/routes/PlatformAdminRoute';
import { PlatformLayout } from '@/layouts/PlatformLayout';
import { PlatformDashboardPage } from '@/pages/platform/PlatformDashboardPage';
import { PlatformCompaniesPage } from '@/pages/platform/PlatformCompaniesPage';
import { PlatformCompanyDetailPage } from '@/pages/platform/PlatformCompanyDetailPage';
import { PlatformUsersPage } from '@/pages/platform/PlatformUsersPage';
import { PlatformBillingPage } from '@/pages/platform/PlatformBillingPage';
import { PlatformSystemPage } from '@/pages/platform/PlatformSystemPage';
import { PlatformBetaPage } from '@/pages/platform/PlatformBetaPage';
import { getMenuRoutes } from '@/config/menu.config';

const implementedPaths = [
  '/dashboard',
  '/clients',
  '/products',
  '/hr/employees',
  '/suppliers',
  '/categories',
  '/warehouses',
  '/orders',
  '/invoices',
  '/quotes',
  '/purchase-orders',
  '/inventory/movements',
  '/reports/sales',
  '/reports/finance',
  '/reports/stock-valuation',
  '/accounting',
  '/treasury',
  '/crm',
  '/crm/settings',
  '/projects',
  '/manufacturing',
];

const menuRoutes = getMenuRoutes()
  .filter(({ path }) => !implementedPaths.includes(path))
  .map(({ path, title }) => ({
    path: path.replace(/^\//, ''),
    element: <PlaceholderPage title={title} />,
  }));

const appRoutes: RouteObject[] = [
  {
    element: <MarketingLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/funcionalidades', element: <FeaturesPage /> },
      { path: '/precios', element: <PricingPage /> },
      { path: '/sobre-nosotros', element: <AboutPage /> },
      { path: '/contact', element: <ContactPage /> },
      { path: '/terms', element: <TermsPage /> },
      { path: '/privacy', element: <PrivacyPage /> },
      { path: '/cookies', element: <CookiesPage /> },
      { path: '/status', element: <StatusPage /> },
    ],
  },
  {
    element: <GuestRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
          { path: '/verify-email', element: <VerifyEmailPage /> },
          { path: '/forgot-password', element: <ForgotPasswordPage /> },
          { path: '/reset-password', element: <ResetPasswordPage /> },
          { path: '/accept-invite', element: <AcceptInvitePage /> },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: 'onboarding', element: <OnboardingPage /> },
      { path: 'plan-limit', element: <PlanLimitPage /> },
      {
        element: <OnboardingGate />,
        children: [
          {
            element: <DashboardLayout />,
            children: [
              { path: 'dashboard', element: <DashboardPage /> },
          { path: 'clients', element: <ClientsPage /> },
          { path: 'clients/new', element: <ClientFormPage /> },
          { path: 'clients/:id', element: <ClientFormPage /> },
          { path: 'products', element: <ProductsPage /> },
          { path: 'products/new', element: <ProductFormPage /> },
          { path: 'products/:id', element: <ProductFormPage /> },
          { path: 'suppliers', element: <SuppliersPage /> },
          { path: 'suppliers/new', element: <SupplierFormPage /> },
          { path: 'suppliers/:id', element: <SupplierFormPage /> },
          { path: 'categories', element: <CategoriesPage /> },
          { path: 'categories/new', element: <CategoryFormPage /> },
          { path: 'categories/:id', element: <CategoryFormPage /> },
          { path: 'warehouses', element: <WarehousesPage /> },
          { path: 'warehouses/new', element: <WarehouseFormPage /> },
          { path: 'warehouses/:id', element: <WarehouseFormPage /> },
          { path: 'inventory/movements', element: <StockMovementsPage /> },
          { path: 'orders', element: <OrdersPage /> },
          { path: 'orders/new', element: <OrderFormPage /> },
          { path: 'orders/:id', element: <OrderFormPage /> },
          { path: 'orders/:id/print', element: <DocumentPrintPage kind="orders" /> },
          { path: 'orders/:id/delivery-note/print', element: <DocumentPrintPage kind="delivery-notes" /> },
          { path: 'invoices', element: <InvoicesPage /> },
          { path: 'invoices/new', element: <InvoiceFormPage /> },
          { path: 'invoices/:id', element: <InvoiceFormPage /> },
          { path: 'invoices/:id/print', element: <DocumentPrintPage kind="invoices" /> },
          { path: 'quotes', element: <QuotesPage /> },
          { path: 'quotes/new', element: <QuoteFormPage /> },
          { path: 'quotes/:id', element: <QuoteFormPage /> },
          { path: 'quotes/:id/print', element: <DocumentPrintPage kind="quotes" /> },
          { path: 'purchase-orders', element: <PurchaseOrdersPage /> },
          { path: 'purchase-orders/new', element: <PurchaseOrderFormPage /> },
          { path: 'purchase-orders/:id', element: <PurchaseOrderFormPage /> },
          { path: 'purchase-orders/:id/print', element: <DocumentPrintPage kind="purchase-orders" /> },
          { path: 'reports/sales', element: <SalesReportPage /> },
          { path: 'reports/finance', element: <FinanceReportPage /> },
          { path: 'reports/stock-valuation', element: <StockValuationReportPage /> },
          { path: 'accounting', element: <AccountingPage /> },
          { path: 'treasury', element: <TreasuryPage /> },
          { path: 'crm', element: <CrmPage /> },
          { path: 'crm/settings', element: <CrmSettingsHubPage /> },
          { path: 'crm/settings/stages', element: <CrmStagesPage /> },
          { path: 'crm/settings/catalog/:category', element: <CrmCatalogPage /> },
          { path: 'crm/settings/templates', element: <CrmTemplatesPage /> },
          { path: 'crm/settings/email-templates', element: <CrmTemplatesRedirect /> },
          { path: 'crm/settings/sms-templates', element: <CrmTemplatesRedirect /> },
          { path: 'crm/settings/email', element: <CrmEmailSettingsPage /> },
          { path: 'crm/settings/acrelia', element: <CrmAcreliaPage /> },
          { path: 'projects', element: <ProjectsPage /> },
          { path: 'manufacturing', element: <ManufacturingPage /> },
          { path: 'hr/employees', element: <EmployeesPage /> },
          { path: 'hr/employees/new', element: <EmployeeFormPage /> },
          { path: 'hr/employees/:id', element: <EmployeeFormPage /> },
          ...menuRoutes,
          { path: 'settings', element: <SettingsPage /> },
          { path: 'settings/import', element: <DataImportPage /> },
          { path: 'help/manuals', element: <HelpManualsPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    element: <PlatformAdminRoute />,
    children: [
      {
        element: <DashboardLayout />,
        children: [
          {
            element: <PlatformLayout />,
            children: [
              { path: 'platform', element: <PlatformDashboardPage /> },
              { path: 'platform/companies', element: <PlatformCompaniesPage /> },
              { path: 'platform/companies/:id', element: <PlatformCompanyDetailPage /> },
              { path: 'platform/users', element: <PlatformUsersPage /> },
              { path: 'platform/billing', element: <PlatformBillingPage /> },
              { path: 'platform/beta', element: <PlatformBetaPage /> },
              { path: 'platform/system', element: <PlatformSystemPage /> },
            ],
          },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
];

// El chrome global (banner de cookies) vive dentro del router para poder usar <Link>
export const router = createBrowserRouter([
  { element: <RootLayout />, children: appRoutes },
]);
