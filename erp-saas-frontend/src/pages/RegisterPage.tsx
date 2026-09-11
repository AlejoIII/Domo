import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { useAuthStore } from '@/store/auth.store';
import {
  fetchRegistrationConfig,
  register as registerApi,
  validateBetaInvite,
} from '@/services/auth.service';
import { getPostAuthPath } from '@/lib/auth-routes';

const schema = z
  .object({
    companyName: z.string().min(2, 'Mínimo 2 caracteres'),
    firstName: z.string().min(2, 'Mínimo 2 caracteres'),
    lastName: z.string().min(2, 'Mínimo 2 caracteres'),
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string(),
    acceptedTerms: z.literal(true, {
      errorMap: () => ({ message: 'Debes aceptar los términos y la política de privacidad' }),
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Las contraseñas no coinciden',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('invite') ?? '';
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);

  const configQuery = useQuery({
    queryKey: ['auth', 'registration-config'],
    queryFn: fetchRegistrationConfig,
  });

  const inviteQuery = useQuery({
    queryKey: ['auth', 'validate-invite', inviteToken],
    queryFn: () => validateBetaInvite(inviteToken),
    enabled: !!inviteToken,
    retry: false,
  });

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (inviteQuery.data?.email) {
      setValue('email', inviteQuery.data.email);
    }
  }, [inviteQuery.data?.email, setValue]);

  const config = configQuery.data;
  const blockedByInviteOnly = config?.requiresInvite && !inviteToken;
  const blockedByCap = config?.signupCapReached;
  const inviteInvalid = !!inviteToken && inviteQuery.isError;

  const onSubmit = async ({ confirmPassword: _, acceptedTerms, ...data }: FormData) => {
    setError(null);
    try {
      const result = await registerApi({
        ...data,
        acceptedTerms,
        inviteToken: inviteToken || undefined,
      });

      if (result.requiresVerification || !result.user) {
        navigate('/verify-email', {
          replace: true,
          state: {
            email: result.email ?? data.email,
            emailSent: result.emailSent,
            emailError: result.emailError,
            devCode: result.devCode,
          },
        });
        return;
      }

      if (!result.user) {
        setError('Respuesta de registro incompleta');
        return;
      }

      setSession(result.user);
      navigate(getPostAuthPath(result.user));
    } catch (err) {
      const message = isAxiosError(err)
        ? (err.response?.data?.message ?? 'No se pudo completar el registro')
        : 'Error de conexión con el servidor';
      setError(message);
    }
  };

  if (configQuery.isLoading) {
    return (
      <Card className="border-border/60 p-8 shadow-card">
        <div className="flex justify-center py-8"><Loader /></div>
      </Card>
    );
  }

  if (blockedByCap) {
    return (
      <Card className="border-border/60 p-8 shadow-card">
        <h1 className="mb-2 text-2xl font-bold">Beta cerrada</h1>
        <p className="text-sm text-muted-foreground">
          Hemos alcanzado el cupo de empresas para esta fase. Contacta con soporte si quieres participar.
        </p>
        <p className="mt-4 text-center text-sm">
          <Link to="/login" className="font-medium text-primary hover:underline">Iniciar sesión</Link>
        </p>
      </Card>
    );
  }

  if (blockedByInviteOnly) {
    return (
      <Card className="border-border/60 p-8 shadow-card">
        <h1 className="mb-2 text-2xl font-bold">Registro por invitación</h1>
        <p className="text-sm text-muted-foreground">
          Domo está en beta cerrada. Necesitas un enlace de invitación para crear tu empresa.
        </p>
        <p className="mt-4 text-center text-sm">
          <Link to="/login" className="font-medium text-primary hover:underline">Iniciar sesión</Link>
        </p>
      </Card>
    );
  }

  if (inviteInvalid) {
    return (
      <Card className="border-border/60 p-8 shadow-card">
        <h1 className="mb-2 text-2xl font-bold">Invitación no válida</h1>
        <p className="text-sm text-muted-foreground">
          El enlace de invitación ha expirado, ya fue usado o no es válido.
        </p>
        <p className="mt-4 text-center text-sm">
          <Link to="/login" className="font-medium text-primary hover:underline">Iniciar sesión</Link>
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 p-8 shadow-card">
      <p className="mb-1 text-sm font-medium text-primary">Domo</p>
      <h1 className="mb-2 text-2xl font-bold tracking-tight">Registrar empresa</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        {inviteQuery.data
          ? `Invitación beta · cohorte ${inviteQuery.data.label}`
          : 'Crea tu cuenta y empieza a usar Domo'}
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <Input label="Nombre de la empresa" placeholder="Comercial García S.L." error={errors.companyName?.message} {...register('companyName')} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Nombre" placeholder="María" error={errors.firstName?.message} {...register('firstName')} />
          <Input label="Apellidos" placeholder="García López" error={errors.lastName?.message} {...register('lastName')} />
        </div>
        <Input
          label="Email"
          type="email"
          placeholder="usuario@empresa.com"
          error={errors.email?.message}
          readOnly={!!inviteQuery.data?.emailLocked}
          {...register('email')}
        />
        <Input label="Contraseña" type="password" placeholder="Mínimo 6 caracteres" error={errors.password?.message} {...register('password')} />
        <Input label="Confirmar contraseña" type="password" placeholder="Repite la contraseña" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-0.5 rounded border-border"
            {...register('acceptedTerms')}
          />
          <span className="text-muted-foreground">
            Acepto los{' '}
            <Link to="/terms" target="_blank" className="text-primary hover:underline">términos de uso</Link>
            {' '}y la{' '}
            <Link to="/privacy" target="_blank" className="text-primary hover:underline">política de privacidad</Link>
          </span>
        </label>
        {errors.acceptedTerms && (
          <p className="text-sm text-red-600 dark:text-red-400">{errors.acceptedTerms.message}</p>
        )}
        <Button type="submit" className="w-full" loading={isSubmitting}>
          Crear cuenta
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{' '}
        <Link to="/login" className="font-medium text-primary hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </Card>
  );
}
