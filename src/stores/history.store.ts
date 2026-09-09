import { create } from "zustand";
import { InvoiceData, Company } from "@/types";
import { useInvoiceStore } from "./invoice.store";
import { useCompanyStore } from "./company.store";
import { saveCompanySettings } from "@/services/settings.service";

interface Snapshot {
  invoice: InvoiceData;
  company: Company | null;
}

interface HistoryState {
  past: Snapshot[];
  future: Snapshot[];
  commit: () => void;
  undo: () => void;
  redo: () => void;
  clear: () => void;
}

export const useHistoryStore = create<HistoryState>((set) => ({
  past: [],
  future: [],
  
  commit: () => {
    const invoice = useInvoiceStore.getState().invoiceData;
    const company = useCompanyStore.getState().company;
    
    // Check if the current state is different from the last snapshot
    set((state) => {
      const currentSnapshot = { invoice: structuredClone(invoice), company: structuredClone(company) };
      return {
        past: [...state.past, currentSnapshot].slice(-50), // keep last 50
        future: [],
      };
    });
  },
  
  undo: () => {
    set((state) => {
      if (state.past.length === 0) return state;
      
      const currentInvoice = useInvoiceStore.getState().invoiceData;
      const currentCompany = useCompanyStore.getState().company;
      const currentSnapshot = { invoice: structuredClone(currentInvoice), company: structuredClone(currentCompany) };
      
      const previous = state.past[state.past.length - 1];
      const newPast = state.past.slice(0, state.past.length - 1);
      
      // Restore states directly to the other stores
      useInvoiceStore.getState().setInvoiceData(previous.invoice);
      useCompanyStore.getState().setCompany(previous.company);
      
      // Persist restored company state to SQLite
      if (previous.company) {
        saveCompanySettings(previous.company);
      }
      
      return {
        past: newPast,
        future: [currentSnapshot, ...state.future].slice(0, 50),
      };
    });
  },
  
  redo: () => {
    set((state) => {
      if (state.future.length === 0) return state;
      
      const currentInvoice = useInvoiceStore.getState().invoiceData;
      const currentCompany = useCompanyStore.getState().company;
      const currentSnapshot = { invoice: structuredClone(currentInvoice), company: structuredClone(currentCompany) };
      
      const next = state.future[0];
      const newFuture = state.future.slice(1);
      
      // Restore states directly to the other stores
      useInvoiceStore.getState().setInvoiceData(next.invoice);
      useCompanyStore.getState().setCompany(next.company);
      
      // Persist restored company state to SQLite
      if (next.company) {
        saveCompanySettings(next.company);
      }
      
      return {
        past: [...state.past, currentSnapshot].slice(-50),
        future: newFuture,
      };
    });
  },
  
  clear: () => set({ past: [], future: [] }),
}));
