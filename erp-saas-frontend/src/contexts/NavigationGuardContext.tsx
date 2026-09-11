import {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  IDLE_BLOCKER,
  UNSAFE_DataRouterContext,
  UNSAFE_DataRouterStateContext,
  type BlockerFunction,
} from 'react-router-dom';
import { NavigationGuardContext, type NavigationGuardContextValue } from '@/contexts/navigation-guard-context';

/** Clave fija: evita el aviso de React Router al remount (Strict Mode / Fast Refresh). */
const BLOCKER_KEY = 'domo-navigation-guard';

/** Dueño actual del blocker (módulo). Evita que un cleanup viejo borre el registro nuevo. */
let blockerOwner: symbol | null = null;

/**
 * React Router admite un único bloqueador por router, pero varios formularios
 * pueden estar sucios a la vez (por ejemplo la ficha y el editor de layout).
 * Este proveedor concentra ese bloqueador y decide cuál de ellos avisa.
 */
export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const dirtyRef = useRef(new Map<string, boolean>());
  const allowRef = useRef(false);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const dataRouter = useContext(UNSAFE_DataRouterContext);
  const routerState = useContext(UNSAFE_DataRouterStateContext);
  const router = dataRouter?.router;

  const firstDirtyId = useCallback(() => {
    for (const [id, dirty] of dirtyRef.current) {
      if (dirty) return id;
    }
    return null;
  }, []);

  const shouldBlock = useCallback<BlockerFunction>(
    () => !allowRef.current && firstDirtyId() !== null,
    [firstDirtyId],
  );
  const shouldBlockRef = useRef(shouldBlock);
  shouldBlockRef.current = shouldBlock;

  useEffect(() => {
    if (!router) return;

    const owner = Symbol(BLOCKER_KEY);
    blockerOwner = owner;

    const fn: BlockerFunction = (args) => shouldBlockRef.current(args);
    router.getBlocker(BLOCKER_KEY, fn);

    return () => {
      if (blockerOwner !== owner) return;
      router.deleteBlocker(BLOCKER_KEY);
      blockerOwner = null;
    };
  }, [router]);

  const blocker = routerState?.blockers.get(BLOCKER_KEY) ?? IDLE_BLOCKER;

  useEffect(() => {
    if (blocker.state !== 'blocked') return;
    const id = firstDirtyId();
    if (id) {
      setActiveId(id);
    } else {
      blocker.proceed?.();
    }
  }, [blocker, firstDirtyId]);

  const setDirty = useCallback((id: string, dirty: boolean) => {
    dirtyRef.current.set(id, dirty);
  }, []);

  const unregister = useCallback((id: string) => {
    dirtyRef.current.delete(id);
  }, []);

  const allowNextNavigation = useCallback(() => {
    allowRef.current = true;
    queueMicrotask(() => {
      allowRef.current = false;
    });
  }, []);

  const requestLeave = useCallback(
    (id: string, action: () => void) => {
      if (allowRef.current || firstDirtyId() === null) {
        action();
        return;
      }
      pendingActionRef.current = action;
      setActiveId(id);
    },
    [firstDirtyId],
  );

  const confirmLeave = useCallback(() => {
    setActiveId(null);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (blocker.state === 'blocked') blocker.proceed?.();
    action?.();
  }, [blocker]);

  const cancelLeave = useCallback(() => {
    setActiveId(null);
    pendingActionRef.current = null;
    if (blocker.state === 'blocked') blocker.reset?.();
  }, [blocker]);

  const value = useMemo<NavigationGuardContextValue>(
    () => ({
      setDirty,
      unregister,
      requestLeave,
      allowNextNavigation,
      confirmLeave,
      cancelLeave,
      activeId,
    }),
    [
      setDirty,
      unregister,
      requestLeave,
      allowNextNavigation,
      confirmLeave,
      cancelLeave,
      activeId,
    ],
  );

  return (
    <NavigationGuardContext.Provider value={value}>
      {children}
    </NavigationGuardContext.Provider>
  );
}
