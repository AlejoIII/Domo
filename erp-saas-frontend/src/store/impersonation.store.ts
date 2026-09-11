import { create } from 'zustand';

interface ImpersonationBackup {
  accessToken: string;
  refreshToken: string;
  user: import('@/services/auth.service').AuthUser;
}

interface ImpersonationState {
  backup: ImpersonationBackup | null;
  setBackup: (backup: ImpersonationBackup) => void;
  clearBackup: () => void;
}

export const useImpersonationStore = create<ImpersonationState>((set) => ({
  backup: null,
  setBackup: (backup) => set({ backup }),
  clearBackup: () => set({ backup: null }),
}));
