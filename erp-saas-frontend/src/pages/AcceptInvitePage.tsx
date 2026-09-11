import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { acceptInvite } from '@/services/auth.service';
import { useAuthStore } from '@/store/auth.store';
import { getPostAuthPath } from '@/lib/auth-routes';

export function AcceptInvitePage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError('Enlace de invitación inválido');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await acceptInvite({ token, firstName, lastName, password });
      if (!res.user) {
        setError('Respuesta de activación incompleta');
        return;
      }
      setSession(res.user);
      navigate(getPostAuthPath(res.user), { replace: true });
    } catch {
      setError('No se pudo activar la cuenta. El enlace puede haber expirado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md space-y-4 p-6">
      <div>
        <h1 className="text-xl font-bold">Aceptar invitación</h1>
        <p className="text-sm text-muted-foreground">Crea tu contraseña para unirte al equipo</p>
      </div>
      <form onSubmit={submit} className="space-y-4">
        <Input label="Nombre" placeholder="María" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        <Input label="Apellidos" placeholder="García López" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        <Input
          label="Contraseña"
          type="password"
          placeholder="Mínimo 8 caracteres"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <Button type="submit" className="w-full" loading={loading}>
          Activar cuenta
        </Button>
      </form>
    </Card>
  );
}
