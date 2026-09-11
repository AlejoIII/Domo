import { useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Mail, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { VerificationCodeInput } from '@/components/ui/VerificationCodeInput';
import { useAuthStore } from '@/store/auth.store';
import { resendVerification, verifyEmail } from '@/services/auth.service';
import { getPostAuthPath } from '@/lib/auth-routes';

export function VerifyEmailPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const setSession = useAuthStore((s) => s.setSession);
  const logout = useAuthStore((s) => s.logout);

  const state = location.state as {
    devCode?: string;
    email?: string;
    emailSent?: boolean;
    emailError?: string;
  } | null;
  const [email, setEmail] = useState(user?.email || state?.email || searchParams.get('email') || '');
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(state?.devCode ?? null);
  const [emailError, setEmailError] = useState<string | null>(state?.emailError ?? null);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const applyDevCode = (newCode?: string) => {
    if (newCode) {
      setDevCode(newCode);
      setCode(newCode);
    }
  };

  const handleVerify = async () => {
    if (!email || code.length !== 6) {
      setMessage('Introduce tu email y el código de 6 dígitos');
      setStatus('error');
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      const result = await verifyEmail(email, code);
      if (result.user) {
        setSession(result.user);
      } else if (user) {
        setUser({ ...user, emailVerified: true });
      }
      setStatus('success');
      const redirectTo = result.user
        ? getPostAuthPath(result.user)
        : '/login';
      setTimeout(() => navigate(redirectTo, { replace: true }), 1500);
    } catch {
      setStatus('error');
      setMessage('Código inválido o expirado. Solicita uno nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    setMessage(null);
    try {
      const result = await resendVerification(email);
      applyDevCode(result.devCode);
      setEmailError(result.emailError ?? null);
      setStatus('idle');
      setMessage(
        result.emailSent
          ? 'Código enviado. Revisa tu bandeja (y spam).'
          : result.emailError ?? 'No se pudo enviar el email.',
      );
    } catch {
      setStatus('error');
      setMessage('No se pudo reenviar el código. Inténtalo más tarde.');
    } finally {
      setResending(false);
    }
  };

  if (status === 'success') {
    return (
      <Card className="border-border/60 p-8 text-center shadow-card">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success" />
        <h1 className="text-xl font-bold">¡Email verificado!</h1>
        <p className="mt-2 text-sm text-muted-foreground">Redirigiendo…</p>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 p-8 shadow-card">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Mail className="h-6 w-6" />
      </div>
      <h1 className="mb-2 text-2xl font-bold">Verifica tu email</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Introduce el código de 6 dígitos enviado a tu correo (Gmail, temporal, etc.).
      </p>

      {!user && (
        <div className="mb-4">
          <Input
            label="Email"
            type="email"
            placeholder="usuario@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      )}

      {user && (
        <p className="mb-4 text-center text-sm">
          Cuenta: <strong>{email}</strong>
        </p>
      )}

      {emailError && (
        <p className="mb-4 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {emailError}
        </p>
      )}

      {state?.emailSent && !emailError && (
        <p className="mb-4 rounded-lg bg-success/10 px-3 py-2 text-sm text-success">
          Email enviado correctamente. Revisa tu bandeja temporal.
        </p>
      )}

      {devCode && (
        <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 p-4 text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Respaldo — código de verificación
          </p>
          <p className="mt-1 text-3xl font-bold tracking-[0.3em] text-primary">{devCode}</p>
          <p className="mt-2 text-xs text-muted-foreground">
            Úsalo si el email no llega (común con Gmail → temporales)
          </p>
          <Button
            variant="ghost"
            className="mt-2 text-xs"
            onClick={() => setCode(devCode)}
          >
            Usar este código
          </Button>
        </div>
      )}

      <VerificationCodeInput value={code} onChange={setCode} disabled={submitting} />

      {message && (
        <p className={`mt-4 rounded-lg px-3 py-2 text-sm ${status === 'error' ? 'bg-red-500/10 text-red-600' : 'bg-muted text-foreground'}`}>
          {message}
        </p>
      )}

      <div className="mt-6 space-y-3">
        <Button className="w-full" loading={submitting} onClick={handleVerify}>
          Verificar
        </Button>
        <Button variant="secondary" className="w-full" loading={resending} onClick={handleResend} disabled={!email}>
          Reenviar código
        </Button>
        <Button variant="ghost" className="w-full" onClick={() => { logout(); navigate('/login'); }}>
          Volver al login
        </Button>
      </div>
    </Card>
  );
}
