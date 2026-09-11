import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, FileText, Warehouse, Package, Users, Check, ChevronRight, ChevronLeft } from 'lucide-react';
import { isAxiosError } from 'axios';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader } from '@/components/ui/Loader';
import { FormRequiredLegend } from '@/components/forms/FormLabel';
import { useAuthStore } from '@/store/auth.store';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { useDraftDirty } from '@/hooks/useDraftDirty';
import { useUnsavedChangesGuard } from '@/hooks/useUnsavedChangesGuard';
import { updateCompanySettings } from '@/services/settings.service';
import { createWarehouse } from '@/services/warehouses.service';
import { createProduct } from '@/services/products.service';
import { createInvitation } from '@/services/settings.service';
import { completeOnboarding } from '@/services/billing.service';

const STEPS = [
  { id: 1, title: 'Datos de empresa', icon: Building2 },
  { id: 2, title: 'IVA y prefijos', icon: FileText },
  { id: 3, title: 'Primer almacén', icon: Warehouse },
  { id: 4, title: 'Primer producto', icon: Package },
  { id: 5, title: 'Invitar equipo', icon: Users },
] as const;

export function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { data: company, isLoading } = useCompanySettings();

  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [companyForm, setCompanyForm] = useState({
    name: '',
    taxId: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'ES',
  });

  const [docForm, setDocForm] = useState({
    defaultTaxRate: '21',
    currency: 'EUR',
    orderPrefix: 'PED',
    invoicePrefix: 'FAC',
    creditNotePrefix: 'REC',
    quotePrefix: 'PRE',
    poPrefix: 'OC',
  });

  const [warehouseForm, setWarehouseForm] = useState({ code: 'ALM01', name: 'Almacén principal' });
  const [productForm, setProductForm] = useState({ code: 'PROD01', name: 'Producto demo', price: '0' });
  const [inviteEmail, setInviteEmail] = useState('');

  const stepValues =
    step === 1 ? companyForm
    : step === 2 ? docForm
    : step === 3 ? warehouseForm
    : step === 4 ? productForm
    : { inviteEmail };

  const { isDirty, markClean } = useDraftDirty(stepValues, String(step));
  const { requestLeave, dialog } = useUnsavedChangesGuard(isDirty);

  const finishMutation = useMutation({
    mutationFn: () => completeOnboarding(true),
    onSuccess: () => {
      if (user) {
        setUser({ ...user, onboardingCompleted: true });
      }
      queryClient.invalidateQueries({ queryKey: ['settings', 'company'] });
      navigate('/dashboard', { replace: true });
    },
  });

  if (user?.onboardingCompleted) {
    return <Navigate to="/dashboard" replace />;
  }

  if (isLoading && !company) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  const initCompanyForm = () => {
    if (!company || companyForm.name) return;
    setCompanyForm({
      name: company.name ?? '',
      taxId: company.taxId ?? '',
      email: company.email ?? '',
      phone: company.phone ?? '',
      address: company.address ?? '',
      city: company.city ?? '',
      postalCode: company.postalCode ?? '',
      country: company.country ?? 'ES',
    });
    setDocForm({
      defaultTaxRate: String(company.defaultTaxRate ?? 21),
      currency: company.currency ?? 'EUR',
      orderPrefix: company.orderPrefix ?? 'PED',
      invoicePrefix: company.invoicePrefix ?? 'FAC',
      creditNotePrefix: company.creditNotePrefix ?? 'REC',
      quotePrefix: company.quotePrefix ?? 'PRE',
      poPrefix: company.poPrefix ?? 'OC',
    });
  };

  if (company && !companyForm.name) initCompanyForm();

  const handleNext = async () => {
    setError(null);
    setSaving(true);
    try {
      if (step === 1) {
        await updateCompanySettings(companyForm);
      } else if (step === 2) {
        await updateCompanySettings({
          defaultTaxRate: Number(docForm.defaultTaxRate),
          currency: docForm.currency,
          orderPrefix: docForm.orderPrefix,
          invoicePrefix: docForm.invoicePrefix,
          creditNotePrefix: docForm.creditNotePrefix,
          quotePrefix: docForm.quotePrefix,
          poPrefix: docForm.poPrefix,
        });
      } else if (step === 3) {
        await createWarehouse(warehouseForm);
      } else if (step === 4) {
        await createProduct({
          code: productForm.code,
          name: productForm.name,
          price: Number(productForm.price) || 0,
          unit: 'ud',
          isActive: true,
        });
      } else if (step === 5 && inviteEmail.trim()) {
        await createInvitation({ email: inviteEmail.trim() });
      }

      if (step < 5) {
        markClean();
        setStep(step + 1);
      } else {
        await finishMutation.mutateAsync();
      }
    } catch (err) {
      const message = isAxiosError(err)
        ? (err.response?.data?.message ?? 'No se pudo guardar')
        : 'Error de conexión';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSkipInvite = async () => {
    setError(null);
    const finish = async () => {
      try {
        await finishMutation.mutateAsync();
      } catch (err) {
        const message = isAxiosError(err)
          ? (err.response?.data?.message ?? 'No se pudo completar')
          : 'Error de conexión';
        setError(message);
      }
    };
    if (isDirty) {
      requestLeave(finish);
      return;
    }
    await finish();
  };

  return (
    <div className="min-h-screen bg-muted/30 px-4 py-10">
      {dialog}
      <div className="mx-auto max-w-2xl">
        <div className="mb-8 text-center">
          <p className="text-sm font-medium text-primary">Domo</p>
          <h1 className="text-2xl font-bold tracking-tight">Configura tu empresa</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Paso {step} de {STEPS.length} — {STEPS[step - 1].title}
          </p>
        </div>

        <div className="mb-6 flex justify-center gap-2">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`h-2 w-10 rounded-full transition-colors ${
                s.id <= step ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>

        <Card className="border-border/60 p-6 shadow-card">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              <FormRequiredLegend />
              {step === 1 && (
                <>
                  <Input label="Nombre empresa" required placeholder="Comercial García S.L." value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} />
                  <Input label="CIF/NIF" optionalHint placeholder="B12345678" value={companyForm.taxId} onChange={(e) => setCompanyForm({ ...companyForm, taxId: e.target.value })} />
                  <Input label="Email" type="email" optionalHint placeholder="contacto@empresa.com" value={companyForm.email} onChange={(e) => setCompanyForm({ ...companyForm, email: e.target.value })} />
                  <Input label="Teléfono" optionalHint placeholder="600 123 456" value={companyForm.phone} onChange={(e) => setCompanyForm({ ...companyForm, phone: e.target.value })} />
                  <Input label="Dirección" optionalHint placeholder="Calle Mayor 12, 3º B" value={companyForm.address} onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Ciudad" optionalHint placeholder="Madrid" value={companyForm.city} onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })} />
                    <Input label="C.P." optionalHint placeholder="28001" value={companyForm.postalCode} onChange={(e) => setCompanyForm({ ...companyForm, postalCode: e.target.value })} />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="IVA por defecto (%)" type="number" placeholder="21" value={docForm.defaultTaxRate} onChange={(e) => setDocForm({ ...docForm, defaultTaxRate: e.target.value })} />
                    <Input label="Moneda" placeholder="EUR" value={docForm.currency} onChange={(e) => setDocForm({ ...docForm, currency: e.target.value })} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Prefijo pedidos" placeholder="PED" value={docForm.orderPrefix} onChange={(e) => setDocForm({ ...docForm, orderPrefix: e.target.value })} />
                    <Input label="Prefijo facturas" placeholder="FAC" value={docForm.invoicePrefix} onChange={(e) => setDocForm({ ...docForm, invoicePrefix: e.target.value })} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Prefijo rectificativas" placeholder="REC" value={docForm.creditNotePrefix} onChange={(e) => setDocForm({ ...docForm, creditNotePrefix: e.target.value })} />
                    <Input label="Prefijo presupuestos" placeholder="PRE" value={docForm.quotePrefix} onChange={(e) => setDocForm({ ...docForm, quotePrefix: e.target.value })} />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input label="Prefijo órdenes compra" placeholder="OC" value={docForm.poPrefix} onChange={(e) => setDocForm({ ...docForm, poPrefix: e.target.value })} />
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <Input label="Código almacén" required placeholder="ALM01" value={warehouseForm.code} onChange={(e) => setWarehouseForm({ ...warehouseForm, code: e.target.value })} />
                  <Input label="Nombre almacén" required placeholder="Almacén principal" value={warehouseForm.name} onChange={(e) => setWarehouseForm({ ...warehouseForm, name: e.target.value })} />
                </>
              )}

              {step === 4 && (
                <>
                  <Input label="Código producto" required placeholder="PROD01" value={productForm.code} onChange={(e) => setProductForm({ ...productForm, code: e.target.value })} />
                  <Input label="Nombre producto" required placeholder="Tornillo M6 inoxidable" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
                  <Input label="Precio" type="number" step="0.01" optionalHint placeholder="0.00" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
                </>
              )}

              {step === 5 && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Invita a un compañero por email (opcional). Puedes hacerlo más tarde desde Configuración.
                  </p>
                  <Input label="Email del compañero" type="email" optionalHint value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="compañero@empresa.com" />
                </>
              )}
            </motion.div>
          </AnimatePresence>

          {error && (
            <p className="mt-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={step === 1 || saving}
              onClick={() => requestLeave(() => { markClean(); setStep(step - 1); })}
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Anterior
            </Button>

            <div className="flex gap-2">
              {step === 5 && (
                <Button type="button" variant="ghost" disabled={finishMutation.isPending} onClick={handleSkipInvite}>
                  Omitir
                </Button>
              )}
              <Button type="button" disabled={saving || finishMutation.isPending} onClick={handleNext}>
                {step === 5 ? (
                  <>
                    <Check className="mr-1 h-4 w-4" />
                    Finalizar
                  </>
                ) : (
                  <>
                    Siguiente
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
