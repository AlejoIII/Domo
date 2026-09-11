import { useEffect, useState } from 'react';

import { useAuthStore } from '@/store/auth.store';



/** True when persisted auth is loaded and a user session is present. */

export function useAuthReady() {

  const user = useAuthStore((s) => s.user);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());



  useEffect(() => {

    if (useAuthStore.persist.hasHydrated()) {

      setHydrated(true);

      return;

    }

    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));

  }, []);



  return hydrated && isAuthenticated && !!user;

}

