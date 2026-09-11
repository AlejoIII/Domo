import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth.store';
import { fetchRegistrationConfig, login, verifyTotpLogin } from '@/services/auth.service';
import { applyNotificationPrefs } from '@/lib/notification-prefs';
import { getPostAuthPath } from '@/lib/auth-routes';
import { consumeSessionExpired, SESSION_EXPIRED_MESSAGE } from '@/lib/session-expired';

const schema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

const totpSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Introduce un código de 6 dígitos'),
});

type FormData = z.infer<typeof schema>;
type TotpFormData = z.infer<typeof totpSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [totpStep, setTotpStep] = useState<{ tempToken: string } | null>(null);

  const registrationQuery = useQuery({
    queryKey: ['auth', 'registration-config'],
    queryFn: fetchRegistrationConfig,
  });

  useEffect(() => {
    if (consumeSessionExpired()) {
      setSessionExpired(true);
    }
  }, []);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: import.meta.env.DEV
      ? { email: 'admin@demo.com', password: 'admin123' }
      : { email: '', password: '' },
  });

  const {
    register: registerTotp,
    handleSubmit: handleTotpSubmit,
    formState: { errors: totpErrors, isSubmitting: totpSubmitting },
  } = useForm<TotpFormData>({
    resolver: zodResolver(totpSchema),
  });

  const completeSession = (session: {
    user?: Parameters<typeof setSession>[0];
  }) => {
    if (!session.user) {
      setError('Respuesta de login incompleta');
      return;
    }
    setSession(session.user);
    if (session.user.notificationPrefs) {
      applyNotificationPrefs(session.user.notificationPrefs);
    }
    navigate(getPostAuthPath(session.user));
  };

  const onSubmit = async (data: FormData) => {
    setError(null);
    setSessionExpired(false);
    try {
      const session = await login(data.email, data.password);
      if (session.requiresTotp && session.tempToken) {
        setTotpStep({ tempToken: session.tempToken });
        return;
      }
      completeSession(session);
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 403) {
        navigate('/verify-email', {
          replace: true,
          state: { email: data.email },
        });
        return;
      }
      const message = isAxiosError(err)
        ? (err.response?.data?.message ?? 'No se pudo iniciar sesión')
        : 'Error de conexión con el servidor';
      setError(message);
    }
  };

  const onTotpSubmit = async (data: TotpFormData) => {
    if (!totpStep) return;
    setError(null);
    try {
      const session = await verifyTotpLogin(totpStep.tempToken, data.code);
      completeSession(session);
    } catch (err) {
      const message = isAxiosError(err)
        ? (err.response?.data?.message ?? 'Código 2FA inválido')
        : 'Error de conexión con el servidor';
      setError(message);
    }
  };

  if (totpStep) {
    return (
      <Card className="border-border/60 p-8 shadow-card">
        <p className="mb-1 text-sm font-medium text-primary">Domo</p>
        <h1 className="mb-2 text-2xl font-bold tracking-tight">Verificación 2FA</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Introduce el código de 6 dígitos de tu app de autenticación.
        </p>
        <form onSubmit={handleTotpSubmit(onTotpSubmit)} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          <Input
            label="Código 2FA"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder="123456"
            error={totpErrors.code?.message}
            {...registerTotp('code')}
          />
          <Button type="submit" className="w-full" loading={totpSubmitting}>
            Verificar
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="w-full"
            onClick={() => {
              setTotpStep(null);
              setError(null);
            }}
          >
            Volver
          </Button>
        </form>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 p-8 shadow-card">
      <p className="mb-1 text-sm font-medium text-primary">Domo</p>
      <h1 className="mb-6 text-2xl font-bold tracking-tight">Iniciar sesión</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {sessionExpired && (
          <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
            {SESSION_EXPIRED_MESSAGE}
          </p>
        )}
        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <Input label="Email" type="email" placeholder="usuario@empresa.com" error={errors.email?.message} {...register('email')} />
        <Input label="Contraseña" type="password" placeholder="Mínimo 6 caracteres" error={errors.password?.message} {...register('password')} />
        <div className="flex justify-end">
          <Link to="/forgot-password" className="text-sm font-medium text-primary hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <Button type="submit" className="w-full" loading={isSubmitting}>Entrar</Button>
      </form>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        {registrationQuery.data?.requiresInvite ? (
          <>El registro está en beta cerrada. Usa el enlace de invitación que te enviamos.</>
        ) : (
          <>
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="font-medium text-primary hover:underline">
              Registrar empresa
            </Link>
          </>
        )}
      </p>
      {import.meta.env.DEV && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          Demo: admin@demo.com / admin123
        </p>
      )}
    </Card>
  );
}
