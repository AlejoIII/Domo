import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Building2, User, Palette, FileText, Bell, Shield, KeyRound, LogOut, Moon, Sun, Check, ScrollText,
  LayoutGrid, CreditCard, Plug, PanelLeft, FileLock2,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { RolesSettingsSection } from '@/features/settings/RolesSettingsSection';
import { AuditSettingsSection } from '@/features/settings/AuditSettingsSection';
import { FormLayoutsSettingsSection } from '@/features/settings/FormLayoutsSettingsSection';
import { NotificationsSettingsSection } from '@/features/settings/NotificationsSettingsSection';
import { BillingSettingsSection } from '@/features/settings/BillingSettingsSection';
import { IntegrationsSettingsSection } from '@/features/settings/IntegrationsSettingsSection';
import { NavigationSettingsSection } from '@/features/settings/NavigationSettingsSection';
import { PrivacySettingsSection } from '@/features/settings/PrivacySettingsSection';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/auth.store';
import { useThemeStore } from '@/store/theme.store';
import { useSidebarStore } from '@/store/sidebar.store';
import { usePreferencesStore, type PageSize, type Density, type DateFormat } from '@/store/preferences.store';
import { useCompanyStore } from '@/store/company.store';
import { logoutApi, fetchTwoFactorStatus, setupTwoFactor, enableTwoFactor, disableTwoFactor } from '@/services/auth.service';
import {
  changePassword,
  fetchCompanySettings,
  updateCompanySettings,
  updateProfile,
} from '@/services/settings.service';
import { syncBillingSubscription } from '@/services/billing.service';
import { useAuthReady } from '@/hooks/useAuthReady';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { useDraftDirty } from '@/hooks/useDraftDirty';
import { FormRequiredLegend } from '@/components/forms/FormLabel';
import { canCustomizeAppearance } from '@/lib/appearance-access';
import {
  ACCENT_PALETTES,
  FONT_SCALES,
  UI_RADIUS,
  type FontScale,
  type UiRadius,
} from '@/lib/theme-palettes';

const tabs = [
  { id: 'profile', label: 'Perfil', icon: User },
  { id: 'company', label: 'Empresa', icon: Building2 },
  { id: 'documents', label: 'Documentos', icon: FileText },
  { id: 'forms', label: 'Fichas', icon: LayoutGrid },
  { id: 'roles', label: 'Roles', icon: KeyRound },
  { id: 'audit', label: 'Auditoría', icon: ScrollText },
  { id: 'appearance', label: 'Apariencia', icon: Palette },
  { id: 'navigation', label: 'Navegación', icon: PanelLeft },
  { id: 'notifications', label: 'Avisos', icon: Bell },
  { id: 'billing', label: 'Plan y facturación', icon: CreditCard },
  { id: 'integrations', label: 'Integraciones', icon: Plug },
  { id: 'privacy', label: 'Privacidad y datos', icon: FileLock2 },
  { id: 'security', label: 'Seguridad', icon: Shield },
] as const;

type TabId = (typeof tabs)[number]['id'];

/** Configuración de empresa: solo rol admin (creador de la cuenta). */
const ADMIN_ONLY_TABS = new Set<TabId>([
  'company',
  'documents',
  'forms',
  'roles',
  'audit',
  'navigation',
  'billing',
  'integrations',
  'privacy',
]);

export function SettingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab') as TabId | null;
  const [tab, setTab] = useState<TabId>(() =>
    tabParam && tabs.some((t) => t.id === tabParam) ? tabParam : 'profile',
  );
  const [billingNotice, setBillingNotice] = useState<'success' | 'cancel' | null>(null);
  const [sectionDirty, setSectionDirty] = useState(false);
  const { requestLeave, dialog } = useUnsavedChangesGuard(sectionDirty);
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const user = useAuthStore((s) => s.user);
  const { hasPermission, isAdmin } = usePermissions();
  const canWriteSettings = isAdmin && hasPermission('settings.write');
  const queryClient = useQueryClient();
  const billingResult = searchParams.get('billing');

  useEffect(() => {
    if (billingResult === 'success') {
      setBillingNotice('success');
      void (async () => {
        try {
          await syncBillingSubscription();
        } catch {
          // Webhook/sync optional in dev; user can retry refresh
        }
        await queryClient.invalidateQueries({ queryKey: ['billing'] });
        await queryClient.invalidateQueries({ queryKey: ['settings', 'company'] });
      })();
    } else if (billingResult === 'cancel') {
      setBillingNotice('cancel');
    }
    if (billingResult && tabParam === 'billing') {
      const next = new URLSearchParams(searchParams);
      next.delete('billing');
      setSearchParams(next, { replace: true });
    }
  }, [billingResult, tabParam, queryClient, searchParams, setSearchParams]);

  const visibleTabs = tabs.filter((t) => {
    if (ADMIN_ONLY_TABS.has(t.id)) return isAdmin;
    return true;
  });

  useEffect(() => {
    if (!visibleTabs.some((t) => t.id === tab)) {
      setTab(visibleTabs[0]?.id ?? 'profile');
    }
  }, [visibleTabs, tab]);

  useEffect(() => {
    if (tabParam && visibleTabs.some((t) => t.id === tabParam) && tabParam !== tab) {
      setTab(tabParam);
    }
  }, [tabParam, visibleTabs, tab]);

  const selectTab = (next: TabId) => {
    if (next === tab) return;
    requestLeave(() => {
      setTab(next);
      setSearchParams({ tab: next }, { replace: true });
      setSectionDirty(false);
    });
  };

  const renderTabContent = () => {
    switch (tab) {
      case 'profile':
        return <ProfileSection onDirtyChange={setSectionDirty} />;
      case 'company':
        return <CompanySection canWrite={canWriteSettings} onDirtyChange={setSectionDirty} />;
      case 'documents':
        return <DocumentsSection canWrite={canWriteSettings} onDirtyChange={setSectionDirty} />;
      case 'forms':
        return <FormLayoutsSettingsSection />;
      case 'roles':
        return (
          <RolesSettingsSection
            canWrite={canWriteSettings}
            onDirtyChange={setSectionDirty}
            requestLeave={requestLeave}
          />
        );
      case 'audit':
        return <AuditSettingsSection />;
      case 'appearance':
        return <AppearanceSection />;
      case 'navigation':
        return (
          <NavigationSettingsSection
            canWrite={canWriteSettings}
            onDirtyChange={setSectionDirty}
          />
        );
      case 'notifications':
        return <NotificationsSettingsSection />;
      case 'billing':
        return <BillingSettingsSection />;
      case 'integrations':
        return <IntegrationsSettingsSection onDirtyChange={setSectionDirty} />;
      case 'privacy':
        return <PrivacySettingsSection />;
      case 'security':
        return <SecuritySection onLogout={handleLogout} onDirtyChange={setSectionDirty} />;
      default:
        return null;
    }
  };

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // ignore
    }
    logout();
    navigate('/login', { replace: true });
  };

  const displayName =
    user?.firstName && user?.lastName
      ? `${user.firstName} ${user.lastName}`
      : user?.email ?? 'Usuario';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {dialog}
      <div>
        <h1 className="text-2xl font-bold">Configuración</h1>
        <p className="text-sm text-muted-foreground">
          {displayName}
          {user?.companyName ? ` · ${user.companyName}` : ''}
        </p>
      </div>

      {billingNotice && (
        <div
          className={cn(
            'rounded-lg px-4 py-3 text-sm',
            billingNotice === 'success'
              ? 'bg-green-500/10 text-green-700 dark:text-green-400'
              : 'bg-muted text-muted-foreground',
          )}
        >
          {billingNotice === 'success'
            ? 'Pago completado. Tu plan se ha actualizado.'
            : 'Pago cancelado. No se ha realizado ningún cargo.'}
          <button
            type="button"
            className="ml-3 underline"
            onClick={() => setBillingNotice(null)}
          >
            Cerrar
          </button>
        </div>
      )}

      <div className="flex flex-col gap-6 lg:flex-row">
        <Card className="h-fit shrink-0 p-2 lg:w-56">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col">
            {visibleTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => selectTab(t.id)}
                className={cn(
                  'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors duration-200',
                  tab === t.id
                    ? 'bg-primary/10 text-primary shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </nav>
        </Card>

        <div className="relative min-w-0 flex-1">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={tab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="space-y-4"
            >
              {renderTabContent()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void }) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saved, setSaved] = useState(false);
  const { isDirty, markClean, resetBaseline } = useDraftDirty(
    { firstName, lastName, email },
    user?.id ?? 'profile',
  );

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!user) return;
    const next = {
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email ?? '',
    };
    setFirstName(next.firstName);
    setLastName(next.lastName);
    setEmail(next.email);
    resetBaseline(next, user.id);
  }, [user, resetBaseline]);

  const mutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      setUser(data);
      markClean();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  return (
    <Card className="space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold">Perfil</h2>
        <p className="text-sm text-muted-foreground">Datos de tu cuenta de usuario</p>
      </div>
      <FormRequiredLegend />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Nombre" optionalHint placeholder="Ana" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
        <Input label="Apellidos" optionalHint placeholder="García López" value={lastName} onChange={(e) => setLastName(e.target.value)} />
      </div>
      <Input label="Email" type="email" required placeholder="usuario@empresa.com" value={email} onChange={(e) => setEmail(e.target.value)} />
      {mutation.isError && (
        <p className="text-sm text-red-600">No se pudo guardar el perfil. Revisa el email.</p>
      )}
      <div className="flex justify-end gap-2">
        {saved && (
          <span className="flex items-center gap-1 text-sm text-success">
            <Check className="h-4 w-4" /> Guardado
          </span>
        )}
        <Button
          loading={mutation.isPending}
          onClick={() => mutation.mutate({ firstName, lastName, email })}
        >
          Guardar perfil
        </Button>
      </div>
    </Card>
  );
}

function ReadOnlyBanner() {
  return (
    <p className="rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
      Solo lectura: no tienes permiso para modificar la configuración de la empresa.
    </p>
  );
}

function CompanySection({
  canWrite,
  onDirtyChange,
}: {
  canWrite: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const authReady = useAuthReady();
  const setUser = useAuthStore((s) => s.setUser);
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['settings', 'company'],
    queryFn: fetchCompanySettings,
    enabled: authReady,
  });

  const [form, setForm] = useState({
    name: '',
    taxId: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'ES',
  });
  const [saved, setSaved] = useState(false);
  const { isDirty, markClean, resetBaseline } = useDraftDirty(form, data?.id ?? 'company');

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!data) return;
    const nextForm = {
      name: data.name ?? '',
      taxId: data.taxId ?? '',
      email: data.email ?? '',
      phone: data.phone ?? '',
      address: data.address ?? '',
      city: data.city ?? '',
      postalCode: data.postalCode ?? '',
      country: data.country ?? 'ES',
    };
    setForm(nextForm);
    resetBaseline(nextForm, data.id);
  }, [data, resetBaseline]);

  const mutation = useMutation({
    mutationFn: updateCompanySettings,
    onSuccess: (company) => {
      queryClient.setQueryData(['settings', 'company'], company);
      useCompanyStore.getState().applySettings(company);
      if (user) setUser({ ...user, companyName: company.name });
      markClean();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  const disabled = !canWrite;

  if (isLoading) return <div className="flex justify-center py-12"><Loader /></div>;
  if (isError) {
    return (
      <Card className="space-y-3 p-6">
        <p className="text-sm text-red-600">No se pudo cargar la empresa.</p>
        <p className="text-xs text-muted-foreground">
          Prueba: cierra sesión y vuelve a entrar. Si sigue fallando, en el backend ejecuta
          {' '}<code className="rounded bg-muted px-1">npx prisma migrate deploy</code>
          {' '}y{' '}<code className="rounded bg-muted px-1">npm run db:seed</code>.
        </p>
      </Card>
    );
  }

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  return (
    <Card className="space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold">Empresa</h2>
        <p className="text-sm text-muted-foreground">Datos fiscales y de contacto</p>
      </div>
      {!canWrite && <ReadOnlyBanner />}
      <FormRequiredLegend />
      <Input label="Nombre comercial" required placeholder="Muebles Aranda S.L." value={form.name} onChange={set('name')} disabled={disabled} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="NIF / CIF" optionalHint placeholder="B12345678" value={form.taxId} onChange={set('taxId')} disabled={disabled} />
        <Input label="País" optionalHint placeholder="ES" value={form.country} onChange={set('country')} maxLength={2} disabled={disabled} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Email" type="email" optionalHint placeholder="contacto@empresa.com" value={form.email} onChange={set('email')} disabled={disabled} />
        <Input label="Teléfono" optionalHint placeholder="600 123 456" value={form.phone} onChange={set('phone')} disabled={disabled} />
      </div>
      <Input label="Dirección" optionalHint placeholder="Calle Mayor 12, 2º B" value={form.address} onChange={set('address')} disabled={disabled} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Ciudad" placeholder="Madrid" value={form.city} onChange={set('city')} disabled={disabled} />
        <Input label="Código postal" placeholder="28001" value={form.postalCode} onChange={set('postalCode')} disabled={disabled} />
      </div>
      {mutation.isError && (
        <p className="text-sm text-red-600">No se pudo guardar. Comprueba tus permisos.</p>
      )}
      <div className="flex justify-end gap-2">
        {saved && (
          <span className="flex items-center gap-1 text-sm text-success">
            <Check className="h-4 w-4" /> Guardado
          </span>
        )}
        {canWrite && (
          <Button
            loading={mutation.isPending}
            onClick={() =>
              mutation.mutate({
                ...form,
                taxId: form.taxId || undefined,
                email: form.email || undefined,
              })
            }
          >
            Guardar empresa
          </Button>
        )}
      </div>
    </Card>
  );
}

function DocumentsSection({
  canWrite,
  onDirtyChange,
}: {
  canWrite: boolean;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const authReady = useAuthReady();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['settings', 'company'],
    queryFn: fetchCompanySettings,
    enabled: authReady,
  });

  const [form, setForm] = useState({
    defaultTaxRate: '21',
    currency: 'EUR',
    orderPrefix: 'PED',
    invoicePrefix: 'FAC',
    creditNotePrefix: 'REC',
    quotePrefix: 'PRE',
    poPrefix: 'OC',
    monthlySalesTarget: '',
  });
  const [saved, setSaved] = useState(false);
  const { isDirty, markClean, resetBaseline } = useDraftDirty(form, data?.id ?? 'documents');

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  useEffect(() => {
    if (!data) return;
    const nextForm = {
      defaultTaxRate: String(data.defaultTaxRate ?? 21),
      currency: data.currency ?? 'EUR',
      orderPrefix: data.orderPrefix ?? 'PED',
      invoicePrefix: data.invoicePrefix ?? 'FAC',
      creditNotePrefix: data.creditNotePrefix ?? 'REC',
      quotePrefix: data.quotePrefix ?? 'PRE',
      poPrefix: data.poPrefix ?? 'OC',
      monthlySalesTarget: data.monthlySalesTarget != null ? String(data.monthlySalesTarget) : '',
    };
    setForm(nextForm);
    resetBaseline(nextForm, data.id);
  }, [data, resetBaseline]);

  const mutation = useMutation({
    mutationFn: updateCompanySettings,
    onSuccess: (company) => {
      queryClient.setQueryData(['settings', 'company'], company);
      useCompanyStore.getState().applySettings(company);
      markClean();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    },
  });

  if (isLoading) return <div className="flex justify-center py-12"><Loader /></div>;
  if (isError) {
    return <Card className="p-6"><p className="text-sm text-red-600">Error al cargar.</p></Card>;
  }

  const disabled = !canWrite;

  return (
    <Card className="space-y-4 p-6">
      <div>
        <h2 className="text-lg font-semibold">Documentos</h2>
        <p className="text-sm text-muted-foreground">
          IVA por defecto en documentos nuevos, moneda en importes, prefijos de numeración y objetivo
          de ventas mensual
        </p>
      </div>
      {!canWrite && <ReadOnlyBanner />}
      <FormRequiredLegend />
      <p className="rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        El IVA y la moneda se aplican al crear pedidos, facturas y presupuestos. Los prefijos solo
        afectan a documentos nuevos (no renumeran los existentes).
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="IVA por defecto (%)"
          type="number"
          step="0.01"
          placeholder="21"
          value={form.defaultTaxRate}
          onChange={(e) => setForm((f) => ({ ...f, defaultTaxRate: e.target.value }))}
          disabled={disabled}
        />
        <div>
          <label className="text-sm font-medium">Moneda</label>
          <select
            className="mt-1 w-full rounded-lg border border-border/70 bg-card px-3 py-2 text-sm disabled:opacity-60"
            value={form.currency}
            onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
            disabled={disabled}
          >
            <option value="EUR">EUR — Euro</option>
            <option value="USD">USD — Dólar</option>
            <option value="GBP">GBP — Libra</option>
          </select>
        </div>
        <Input
          label="Objetivo ventas mensual (EUR)"
          type="number"
          min={0}
          step="0.01"
          placeholder="Ej. 10000"
          value={form.monthlySalesTarget}
          onChange={(e) => setForm((f) => ({ ...f, monthlySalesTarget: e.target.value }))}
          disabled={disabled}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Prefijo pedidos"
          placeholder="PED"
          value={form.orderPrefix}
          onChange={(e) => setForm((f) => ({ ...f, orderPrefix: e.target.value.toUpperCase() }))}
          disabled={disabled}
        />
        <Input
          label="Prefijo facturas"
          placeholder="FAC"
          value={form.invoicePrefix}
          onChange={(e) => setForm((f) => ({ ...f, invoicePrefix: e.target.value.toUpperCase() }))}
          disabled={disabled}
        />
        <Input
          label="Prefijo rectificativas"
          placeholder="REC"
          value={form.creditNotePrefix}
          onChange={(e) => setForm((f) => ({ ...f, creditNotePrefix: e.target.value.toUpperCase() }))}
          disabled={disabled}
        />
        <Input
          label="Prefijo presupuestos"
          placeholder="PRE"
          value={form.quotePrefix}
          onChange={(e) => setForm((f) => ({ ...f, quotePrefix: e.target.value.toUpperCase() }))}
          disabled={disabled}
        />
        <Input
          label="Prefijo órdenes compra"
          placeholder="OC"
          value={form.poPrefix}
          onChange={(e) => setForm((f) => ({ ...f, poPrefix: e.target.value.toUpperCase() }))}
          disabled={disabled}
        />
      </div>
      {mutation.isError && (
        <p className="text-sm text-red-600">No se pudo guardar. Comprueba tus permisos.</p>
      )}
      <div className="flex justify-end gap-2">
        {saved && (
          <span className="flex items-center gap-1 text-sm text-success">
            <Check className="h-4 w-4" /> Guardado
          </span>
        )}
        {canWrite && (
          <Button
            loading={mutation.isPending}
            onClick={() =>
              mutation.mutate({
                defaultTaxRate: Number(form.defaultTaxRate),
                currency: form.currency,
                orderPrefix: form.orderPrefix,
                invoicePrefix: form.invoicePrefix,
                creditNotePrefix: form.creditNotePrefix,
                quotePrefix: form.quotePrefix,
                poPrefix: form.poPrefix,
                monthlySalesTarget: form.monthlySalesTarget.trim()
                  ? Number(form.monthlySalesTarget)
                  : null,
              })
            }
          >
            Guardar documentos
          </Button>
        )}
      </div>
    </Card>
  );
}

function AppearanceSection() {
  const user = useAuthStore((s) => s.user);
  const {
    theme, setTheme, accent, setAccent, radius, setRadius,
    fontScale, setFontScale, reducedMotion, setReducedMotion,
  } = useThemeStore();
  const collapsed = useSidebarStore((s) => s.collapsed);
  const setCollapsed = useSidebarStore((s) => s.setCollapsed);
  const density = usePreferencesStore((s) => s.density);
  const setDensity = usePreferencesStore((s) => s.setDensity);
  const pageSize = usePreferencesStore((s) => s.pageSize);
  const setPageSize = usePreferencesStore((s) => s.setPageSize);
  const dateFormat = usePreferencesStore((s) => s.dateFormat);
  const setDateFormat = usePreferencesStore((s) => s.setDateFormat);
  const premium = canCustomizeAppearance(user);

  return (
    <Card className="divide-y divide-border/60">
      <div className="p-6">
        <h2 className="text-lg font-semibold">Apariencia</h2>
        <p className="text-sm text-muted-foreground">
          Tema y preferencias de interfaz. La paleta y tipografía avanzadas son Premium.
        </p>
      </div>

      <Row title="Tema" description="Claro, oscuro o según el sistema">
        <div className="flex flex-wrap gap-2">
          <Button
            variant={theme === 'light' ? 'primary' : 'secondary'}
            onClick={() => setTheme('light')}
          >
            <Sun className="h-4 w-4" /> Claro
          </Button>
          <Button
            variant={theme === 'dark' ? 'primary' : 'secondary'}
            onClick={() => setTheme('dark')}
          >
            <Moon className="h-4 w-4" /> Oscuro
          </Button>
          <Button
            variant={theme === 'system' ? 'primary' : 'secondary'}
            onClick={() => setTheme('system')}
          >
            Sistema
          </Button>
        </div>
      </Row>

      <Row title="Barra lateral" description={collapsed ? 'Contraída' : 'Expandida'}>
        <Button variant="secondary" onClick={() => setCollapsed(!collapsed)}>
          {collapsed ? 'Expandir' : 'Contraer'}
        </Button>
      </Row>

      <Row title="Densidad" description="Espaciado de tablas y listados">
        <select
          className="rounded-lg border border-border/70 bg-card px-3 py-2 text-sm"
          value={density}
          onChange={(e) => setDensity(e.target.value as Density)}
        >
          <option value="comfortable">Cómoda</option>
          <option value="compact">Compacta</option>
        </select>
      </Row>

      <Row title="Filas por página" description="Paginación por defecto en rejillas">
        <select
          className="rounded-lg border border-border/70 bg-card px-3 py-2 text-sm"
          value={pageSize}
          onChange={(e) => setPageSize(Number(e.target.value) as PageSize)}
        >
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
        </select>
      </Row>

      <Row title="Formato de fecha" description="Cómo se muestran las fechas en listados y fichas">
        <select
          className="rounded-lg border border-border/70 bg-card px-3 py-2 text-sm"
          value={dateFormat}
          onChange={(e) => setDateFormat(e.target.value as DateFormat)}
        >
          <option value="dd/MM/yyyy">DD/MM/AAAA</option>
          <option value="yyyy-MM-dd">AAAA-MM-DD</option>
          <option value="MM/dd/yyyy">MM/DD/AAAA</option>
        </select>
      </Row>

      <Row title="Reducir movimiento" description="Minimiza animaciones de la interfaz">
        <button
          type="button"
          role="switch"
          aria-checked={reducedMotion}
          onClick={() => setReducedMotion(!reducedMotion)}
          className={cn(
            'relative h-6 w-11 shrink-0 rounded-full transition',
            reducedMotion ? 'bg-primary' : 'bg-muted',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition',
              reducedMotion && 'translate-x-5',
            )}
          />
        </button>
      </Row>

      <div className="space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="font-medium">Personalización Premium</p>
            <p className="text-sm text-muted-foreground">
              Paleta de color, radio de bordes y tamaño de texto
            </p>
          </div>
          {!premium && (
            <Link
              to="/settings?tab=billing"
              className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/15"
            >
              Mejorar a Premium
            </Link>
          )}
        </div>

        <fieldset disabled={!premium} className={cn('space-y-4', !premium && 'opacity-60')}>
          <div>
            <p className="mb-2 text-sm font-medium">Paleta de acento</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ACCENT_PALETTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setAccent(p.id)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition',
                    accent === p.id
                      ? 'border-primary bg-primary/10 ring-1 ring-primary/40'
                      : 'border-border/70 hover:bg-muted/50',
                  )}
                >
                  <span
                    className="h-5 w-5 shrink-0 rounded-full border border-black/10"
                    style={{ background: p.swatch }}
                  />
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Bordes</span>
              <select
                className="w-full rounded-lg border border-border/70 bg-card px-3 py-2"
                value={radius}
                onChange={(e) => setRadius(e.target.value as UiRadius)}
              >
                {(Object.keys(UI_RADIUS) as UiRadius[]).map((key) => (
                  <option key={key} value={key}>{UI_RADIUS[key].label}</option>
                ))}
              </select>
            </label>
            <label className="block space-y-1 text-sm">
              <span className="font-medium">Tamaño de texto</span>
              <select
                className="w-full rounded-lg border border-border/70 bg-card px-3 py-2"
                value={fontScale}
                onChange={(e) => setFontScale(e.target.value as FontScale)}
              >
                {(Object.keys(FONT_SCALES) as FontScale[]).map((key) => (
                  <option key={key} value={key}>{FONT_SCALES[key].label}</option>
                ))}
              </select>
            </label>
          </div>
        </fieldset>
      </div>

      <Row title="Idioma" description="Traducción completa de la interfaz — disponible próximamente">
        <select
          className="cursor-not-allowed rounded-lg border border-border/70 bg-muted/50 px-3 py-2 text-sm opacity-60"
          value="es"
          disabled
        >
          <option value="es">Español</option>
        </select>
      </Row>
    </Card>
  );
}

function SecuritySection({
  onLogout,
  onDirtyChange,
}: {
  onLogout: () => void;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [totpSetup, setTotpSetup] = useState<{ secret: string; otpauthUrl: string } | null>(null);
  const [totpCode, setTotpCode] = useState('');
  const [totpMessage, setTotpMessage] = useState<string | null>(null);
  const [totpError, setTotpError] = useState<string | null>(null);
  const { isDirty, markClean } = useDraftDirty(
    { currentPassword, newPassword, confirm },
    'security',
  );

  const twoFactorQuery = useQuery({
    queryKey: ['two-factor-status'],
    queryFn: fetchTwoFactorStatus,
    enabled: !!user,
  });

  const setupMutation = useMutation({
    mutationFn: setupTwoFactor,
    onSuccess: (data) => {
      setTotpSetup(data);
      setTotpError(null);
      setTotpMessage('Escanea el código o introduce la clave manualmente en tu app de autenticación.');
    },
    onError: () => setTotpError('No se pudo iniciar la configuración de 2FA'),
  });

  const enableMutation = useMutation({
    mutationFn: (code: string) => enableTwoFactor(code),
    onSuccess: (data) => {
      setTotpMessage(data.message);
      setTotpError(null);
      setTotpSetup(null);
      setTotpCode('');
      if (user) setUser({ ...user, totpEnabled: true });
      twoFactorQuery.refetch();
    },
    onError: () => setTotpError('Código inválido. Comprueba la hora de tu dispositivo.'),
  });

  const disableMutation = useMutation({
    mutationFn: (code: string) => disableTwoFactor(code),
    onSuccess: (data) => {
      setTotpMessage(data.message);
      setTotpError(null);
      setTotpCode('');
      if (user) setUser({ ...user, totpEnabled: false });
      twoFactorQuery.refetch();
    },
    onError: () => setTotpError('No se pudo desactivar 2FA. Código inválido.'),
  });

  useEffect(() => {
    onDirtyChange?.(isDirty);
    return () => onDirtyChange?.(false);
  }, [isDirty, onDirtyChange]);

  const mutation = useMutation({
    mutationFn: changePassword,
    onSuccess: () => {
      setMessage('Contraseña actualizada correctamente');
      setError(null);
      setCurrentPassword('');
      setNewPassword('');
      setConfirm('');
      markClean();
    },
    onError: () => {
      setError('No se pudo cambiar. Revisa la contraseña actual.');
      setMessage(null);
    },
  });

  const submit = () => {
    setError(null);
    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (newPassword !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    mutation.mutate({ currentPassword, newPassword });
  };

  return (
    <div className="space-y-4">
      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-lg font-semibold">Cambiar contraseña</h2>
          <p className="text-sm text-muted-foreground">Actualiza tu acceso a Domo</p>
        </div>
        <FormRequiredLegend />
        <Input
          label="Contraseña actual"
          type="password"
          required
          placeholder="La que usas ahora para entrar"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <Input
          label="Nueva contraseña"
          type="password"
          required
          placeholder="Mínimo 6 caracteres"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <Input
          label="Confirmar nueva"
          type="password"
          required
          placeholder="Repite la nueva contraseña"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        {message && <p className="text-sm text-success">{message}</p>}
        <div className="flex justify-end">
          <Button loading={mutation.isPending} onClick={submit}>
            Actualizar contraseña
          </Button>
        </div>
      </Card>

      {twoFactorQuery.data?.canSetup && (
        <Card className="space-y-4 p-6">
          <div>
            <h2 className="text-lg font-semibold">Autenticación en dos pasos (2FA)</h2>
            <p className="text-sm text-muted-foreground">
              Protege tu cuenta de administrador con Google Authenticator u otra app TOTP.
            </p>
          </div>

          {twoFactorQuery.data.enabled ? (
            <div className="space-y-3">
              <p className="text-sm text-success">2FA activado en esta cuenta.</p>
              <Input
                label="Código 2FA para desactivar"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <div className="flex justify-end">
                <Button
                  variant="danger"
                  loading={disableMutation.isPending}
                  onClick={() => disableMutation.mutate(totpCode)}
                >
                  Desactivar 2FA
                </Button>
              </div>
            </div>
          ) : totpSetup ? (
            <div className="space-y-3">
              <p className="break-all rounded-lg bg-muted px-3 py-2 font-mono text-xs">
                {totpSetup.secret}
              </p>
              <a
                href={totpSetup.otpauthUrl}
                className="text-sm text-primary hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                Abrir enlace otpauth (app de autenticación)
              </a>
              <Input
                label="Código de verificación"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setTotpSetup(null)}>
                  Cancelar
                </Button>
                <Button
                  loading={enableMutation.isPending}
                  onClick={() => enableMutation.mutate(totpCode)}
                >
                  Confirmar activación
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button loading={setupMutation.isPending} onClick={() => setupMutation.mutate()}>
                Configurar 2FA
              </Button>
            </div>
          )}

          {totpError && <p className="text-sm text-red-600">{totpError}</p>}
          {totpMessage && <p className="text-sm text-success">{totpMessage}</p>}
        </Card>
      )}

      <Card className="flex items-center justify-between p-6">
        <div>
          <p className="font-medium">Cerrar sesión</p>
          <p className="text-sm text-muted-foreground">Salir de tu cuenta en este dispositivo</p>
        </div>
        <Button variant="danger" onClick={onLogout}>
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </Card>
    </div>
  );
}

function Row({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}
