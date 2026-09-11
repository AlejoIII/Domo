import { useNavigate } from 'react-router-dom';
import { useImpersonationStore } from '@/store/impersonation.store';
import { useAuthStore } from '@/store/auth.store';
import { refreshSessionWithToken } from '@/services/api';

export function ImpersonationBanner() {
  const backup = useImpersonationStore((s) => s.backup);
  const clearBackup = useImpersonationStore((s) => s.clearBackup);
  const setSession = useAuthStore((s) => s.setSession);
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();

  if (!backup) return null;

  const exit = async () => {
    const restored = await refreshSessionWithToken(backup.refreshToken);
    if (restored) {
      setSession(backup.user);
      clearBackup();
      navigate('/platform');
      return;
    }
    clearBackup();
    navigate('/login', { replace: true });
  };

  return (
    <div className="border-b border-amber-500/40 bg-amber-500/15 px-4 py-2 text-center text-sm text-amber-900 dark:text-amber-100">
      Estás viendo la cuenta de <strong>{user?.companyName ?? user?.email}</strong> como soporte.
      <button type="button" className="ml-3 font-medium underline" onClick={() => void exit()}>
        Salir de impersonation
      </button>
    </div>
  );
}
