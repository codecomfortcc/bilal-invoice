import { create } from "zustand";

export type LogLevel = "info" | "warn" | "error" | "success";

export interface DebugLogEntry {
  id: number;
  timestamp: Date;
  level: LogLevel;
  message: string;
  detail?: string;
}

interface DebugLogState {
  logs: DebugLogEntry[];
  nextId: number;
  addLog: (level: LogLevel, message: string, detail?: string) => void;
  clearLogs: () => void;
}

export const useDebugLogStore = create<DebugLogState>((set) => ({
  logs: [],
  nextId: 1,
  addLog: (level, message, detail) =>
    set((s) => ({
      logs: [
        {
          id: s.nextId,
          timestamp: new Date(),
          level,
          message,
          detail,
        },
        ...s.logs,
      ].slice(0, 200), // keep last 200 entries
      nextId: s.nextId + 1,
    })),
  clearLogs: () => set({ logs: [], nextId: 1 }),
}));
