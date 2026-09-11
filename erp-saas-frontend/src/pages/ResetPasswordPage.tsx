import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { resetPassword } from '@/services/auth.service';

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError('Enlace inválido. Solicita uno nuevo.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token, password);
      setSuccess(true);
      setTimeout(() => navigate('/login', { replace: true }), 2000);
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data?.message ?? 'No se pudo restablecer la contraseña')
        : 'Error de conexión con el servidor';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <Card className="border-border/60 p-8 text-center shadow-card">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-success" />
        <h1 className="text-xl font-bold">Contraseña actualizada</h1>
        <p className="mt-2 text-sm text-muted-foreground">Redirigiendo al login…</p>
      </Card>
    );
  }

  return (
    <Card className="border-border/60 p-8 shadow-card">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <KeyRound className="h-6 w-6" />
      </div>
      <h1 className="mb-2 text-2xl font-bold">Nueva contraseña</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Introduce tu nueva contraseña para completar el restablecimiento.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Nueva contraseña"
          type="password"
          placeholder="Mínimo 6 caracteres"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Input
          label="Confirmar contraseña"
          type="password"
          placeholder="Repite la contraseña"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" loading={submitting}>
          Guardar contraseña
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link to="/forgot-password" className="font-medium text-primary hover:underline">
          Solicitar nuevo enlace
        </Link>
      </p>
    </Card>
  );
}
