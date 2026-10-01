import { useEffect, useState } from 'react';

/** Chromium `beforeinstallprompt` (no tipado aún en lib.dom estándar). */
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS Safari
    ('standalone' in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function usePwaInstall() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(isStandalone);
  const [promptReady, setPromptReady] = useState(false);

  useEffect(() => {
    if (isStandalone()) {
      setInstalled(true);
      setPromptReady(true);
      return;
    }

    const onBip = (event: Event) => {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setPromptReady(true);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
      setPromptReady(true);
    };

    window.addEventListener('beforeinstallprompt', onBip);
    window.addEventListener('appinstalled', onInstalled);

    // Si el navegador no dispara el evento (Arc, Firefox, Safari…), marcar listo para mostrar ayuda.
    const timer = window.setTimeout(() => setPromptReady(true), 2500);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBip);
      window.removeEventListener('appinstalled', onInstalled);
      window.clearTimeout(timer);
    };
  }, []);

  const canInstall = Boolean(deferred) && !installed;

  const install = async () => {
    if (!deferred) return false;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    setDeferred(null);
    if (choice.outcome === 'accepted') setInstalled(true);
    return choice.outcome === 'accepted';
  };

  return { canInstall, installed, promptReady, install };
}
