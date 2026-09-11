import { useState } from 'react';
import { Link } from 'react-router-dom';
import { isAxiosError } from 'axios';
import { Mail } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { forgotPassword } from '@/services/auth.service';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    setDevResetUrl(null);

    try {
      const result = await forgotPassword(email);
      setMessage(result.message);
      if (result.devResetUrl) setDevResetUrl(result.devResetUrl);
    } catch (err) {
      const msg = isAxiosError(err)
        ? (err.response?.data?.message ?? 'No se pudo procesar la solicitud')
        : 'Error de conexión con el servidor';
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-border/60 p-8 shadow-card">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Mail className="h-6 w-6" />
      </div>
      <h1 className="mb-2 text-2xl font-bold">Recuperar contraseña</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        Te enviaremos un enlace para restablecer tu contraseña si el email está registrado.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="usuario@empresa.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error && (
          <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        {message && (
          <p className="rounded-lg bg-muted px-3 py-2 text-sm text-foreground">
            {message}
          </p>
        )}

        {devResetUrl && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
            <p className="font-medium text-primary">Enlace de desarrollo</p>
            <a href={devResetUrl} className="mt-2 break-all text-primary hover:underline">
              {devResetUrl}
            </a>
          </div>
        )}

        <Button type="submit" className="w-full" loading={submitting}>
          Enviar enlace
        </Button>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        <Link to="/login" className="font-medium text-primary hover:underline">
          Volver al login
        </Link>
      </p>
    </Card>
  );
}
