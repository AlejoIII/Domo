import { lazy } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { RootLayout } from '@/layouts/RootLayout';
import { AuthLayout } from '@/layouts/AuthLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { MarketingLayout } from '@/layouts/MarketingLayout';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { GuestRoute } from '@/routes/GuestRoute';
import { PlaceholderPage } from '@/pages/PlaceholderPage';
import { OnboardingGate } from '@/routes/OnboardingGate';
import { PlatformAdminRoute } from '@/routes/PlatformAdminRoute';
import { PlatformLayout } from '@/layouts/PlatformLayout';
import { getMenuRoutes } from '@/config/menu.config';

const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/pages/RegisterPage').then((m) => ({ default: m.RegisterPage })));
const VerifyEmailPage = lazy(() => import('@/pages/VerifyEmailPage').then((m) => ({ default: m.VerifyEmailPage })));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const AcceptInvitePage = lazy(() => import('@/pages/AcceptInvitePage').then((m) => ({ default: m.AcceptInvitePage })));
const LandingPage = lazy(() => import('@/pages/LandingPage').then((m) => ({ default: m.LandingPage })));
const ContactPage = lazy(() => import('@/pages/ContactPage').then((m) => ({ default: m.ContactPage })));
const TermsPage = lazy(() => import('@/pages/TermsPage').then((m) => ({ default: m.TermsPage })));
const PrivacyPage = lazy(() => import('@/pages/PrivacyPage').then((m) => ({ default: m.PrivacyPage })));
const CookiesPage = lazy(() => import('@/pages/CookiesPage').then((m) => ({ default: m.CookiesPage })));
const StatusPage = lazy(() => import('@/pages/StatusPage').then((m) => ({ default: m.StatusPage })));
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ClientsPage = lazy(() => import('@/pages/ClientsPage').then((m) => ({ default: m.ClientsPage })));
const ProductsPage = lazy(() => import('@/pages/ProductsPage').then((m) => ({ default: m.ProductsPage })));
const SuppliersPage = lazy(() => import('@/pages/SuppliersPage').then((m) => ({ default: m.SuppliersPage })));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage').then((m) => ({ default: m.CategoriesPage })));
const WarehousesPage = lazy(() => import('@/pages/WarehousesPage').then((m) => ({ default: m.WarehousesPage })));
const OrdersPage = lazy(() => import('@/pages/OrdersPage').then((m) => ({ default: m.OrdersPage })));
const InvoicesPage = lazy(() => import('@/pages/InvoicesPage').then((m) => ({ default: m.InvoicesPage })));
const QuotesPage = lazy(() => import('@/pages/QuotesPage').then((m) => ({ default: m.QuotesPage })));
const PurchaseOrdersPage = lazy(() => import('@/pages/PurchaseOrdersPage').then((m) => ({ default: m.PurchaseOrdersPage })));
const SalesReportPage = lazy(() => import('@/pages/SalesReportPage').then((m) => ({ default: m.SalesReportPage })));
const FinanceReportPage = lazy(() => import('@/pages/FinanceReportPage').then((m) => ({ default: m.FinanceReportPage })));
const AccountingPage = lazy(() => import('@/pages/AccountingPage').then((m) => ({ default: m.AccountingPage })));
const TreasuryPage = lazy(() => import('@/pages/TreasuryPage').then((m) => ({ default: m.TreasuryPage })));
const CrmPage = lazy(() => import('@/pages/CrmPage').then((m) => ({ default: m.CrmPage })));
const CrmSettingsHubPage = lazy(() => import('@/pages/crm/CrmSettingsHubPage').then((m) => ({ default: m.CrmSettingsHubPage })));
const CrmStagesPage = lazy(() => import('@/pages/crm/CrmStagesPage').then((m) => ({ default: m.CrmStagesPage })));
const CrmCatalogPage = lazy(() => import('@/pages/crm/CrmCatalogPage').then((m) => ({ default: m.CrmCatalogPage })));
const CrmTemplatesPage = lazy(() => import('@/pages/crm/CrmTemplatesPage').then((m) => ({ default: m.CrmTemplatesPage })));
const CrmTemplatesRedirect = lazy(() => import('@/pages/crm/CrmTemplatesRedirect').then((m) => ({ default: m.CrmTemplatesRedirect })));
const CrmEmailSettingsPage = lazy(() => import('@/pages/crm/CrmEmailSettingsPage').then((m) => ({ default: m.CrmEmailSettingsPage })));
const CrmAcreliaPage = lazy(() => import('@/pages/crm/CrmAcreliaPage').then((m) => ({ default: m.CrmAcreliaPage })));
const ProjectsPage = lazy(() => import('@/pages/ProjectsPage').then((m) => ({ default: m.ProjectsPage })));
const ManufacturingPage = lazy(() => import('@/pages/ManufacturingPage').then((m) => ({ default: m.ManufacturingPage })));
const StockMovementsPage = lazy(() => import('@/pages/StockMovementsPage').then((m) => ({ default: m.StockMovementsPage })));
const StockValuationReportPage = lazy(() => import('@/pages/StockValuationReportPage').then((m) => ({ default: m.StockValuationReportPage })));
const ClientFormPage = lazy(() => import('@/features/clients/ClientFormPage').then((m) => ({ default: m.ClientFormPage })));
const ProductFormPage = lazy(() => import('@/features/products/ProductFormPage').then((m) => ({ default: m.ProductFormPage })));
const SupplierFormPage = lazy(() => import('@/features/suppliers/SupplierFormPage').then((m) => ({ default: m.SupplierFormPage })));
const CategoryFormPage = lazy(() => import('@/features/categories/CategoryFormPage').then((m) => ({ default: m.CategoryFormPage })));
const WarehouseFormPage = lazy(() => import('@/features/warehouses/WarehouseFormPage').then((m) => ({ default: m.WarehouseFormPage })));
const OrderFormPage = lazy(() => import('@/features/orders/OrderFormPage').then((m) => ({ default: m.OrderFormPage })));
const DocumentPrintPage = lazy(() => import('@/pages/DocumentPrintPage').then((m) => ({ default: m.DocumentPrintPage })));
const InvoiceFormPage = lazy(() => import('@/features/invoices/InvoiceFormPage').then((m) => ({ default: m.InvoiceFormPage })));
const QuoteFormPage = lazy(() => import('@/features/quotes/QuoteFormPage').then((m) => ({ default: m.QuoteFormPage })));
const PurchaseOrderFormPage = lazy(() => import('@/features/purchase-orders/PurchaseOrderFormPage').then((m) => ({ default: m.PurchaseOrderFormPage })));
const EmployeesPage = lazy(() => import('@/pages/EmployeesPage').then((m) => ({ default: m.EmployeesPage })));
const EmployeeFormPage = lazy(() => import('@/features/employees/EmployeeFormPage').then((m) => ({ default: m.EmployeeFormPage })));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })));
const SettingsPage = lazy(() => import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })));
const OnboardingPage = lazy(() => import('@/pages/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));
const PlanLimitPage = lazy(() => import('@/pages/PlanLimitPage').then((m) => ({ default: m.PlanLimitPage })));
const PlatformDashboardPage = lazy(() => import('@/pages/platform/PlatformDashboardPage').then((m) => ({ default: m.PlatformDashboardPage })));
const PlatformCompaniesPage = lazy(() => import('@/pages/platform/PlatformCompaniesPage').then((m) => ({ default: m.PlatformCompaniesPage })));
const PlatformCompanyDetailPage = lazy(() => import('@/pages/platform/PlatformCompanyDetailPage').then((m) => ({ default: m.PlatformCompanyDetailPage })));
const PlatformUsersPage = lazy(() => import('@/pages/platform/PlatformUsersPage').then((m) => ({ default: m.PlatformUsersPage })));
const PlatformBillingPage = lazy(() => import('@/pages/platform/PlatformBillingPage').then((m) => ({ default: m.PlatformBillingPage })));
const PlatformSystemPage = lazy(() => import('@/pages/platform/PlatformSystemPage').then((m) => ({ default: m.PlatformSystemPage })));
const PlatformBetaPage = lazy(() => import('@/pages/platform/PlatformBetaPage').then((m) => ({ default: m.PlatformBetaPage })));

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
