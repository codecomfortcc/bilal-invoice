import { create } from 'zustand';

export type UpdaterStatus = 
  | 'idle' 
  | 'checking' 
  | 'available' 
  | 'downloading' 
  | 'downloaded' 
  | 'installing' 
  | 'error';

export interface UpdateInfo {
  version: string;
  body?: string;
}

interface UpdaterState {
  status: UpdaterStatus;
  updateInfo: UpdateInfo | null;
  progress: number; // 0 to 100
  downloadSpeed: string; // e.g. "2.5 MB/s"
  errorMessage: string | null;
  isWidgetDismissed: boolean;
  
  setStatus: (status: UpdaterStatus) => void;
  setUpdateInfo: (info: UpdateInfo | null) => void;
  setProgress: (progress: number) => void;
  setDownloadSpeed: (speed: string) => void;
  setErrorMessage: (msg: string | null) => void;
  dismissWidget: () => void;
  reset: () => void;
}

export const useUpdaterStore = create<UpdaterState>((set) => ({
  status: 'idle',
  updateInfo: null,
  progress: 0,
  downloadSpeed: '0 B/s',
  errorMessage: null,
  isWidgetDismissed: false,

  setStatus: (status) => set({ status, isWidgetDismissed: false }),
  setUpdateInfo: (updateInfo) => set({ updateInfo }),
  setProgress: (progress) => set({ progress }),
  setDownloadSpeed: (downloadSpeed) => set({ downloadSpeed }),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  dismissWidget: () => set({ isWidgetDismissed: true }),
  reset: () => set({ 
    status: 'idle', 
    updateInfo: null, 
    progress: 0, 
    downloadSpeed: '0 B/s', 
    errorMessage: null,
    isWidgetDismissed: false
  }),
}));
