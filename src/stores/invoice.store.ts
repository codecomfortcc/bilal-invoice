import { create } from "zustand";
import { InvoiceData, Company } from "@/types";
import { format } from "date-fns";
import { useCompanyStore } from "./company.store";

interface InvoiceState {
  invoiceData: InvoiceData;
  templateData: InvoiceData | null;
  setInvoiceData: (data: InvoiceData) => void;
  updateInvoiceData: (updates: Partial<InvoiceData>) => Promise<void>;
  createNewInvoice: () => Promise<void>;
  setTemplateData: (data: InvoiceData | null) => void;
  importState: (data: InvoiceData) => void;
  pdfQueue: { queueId: string, invoice: InvoiceData, company: Company | null }[];
  queueSnapshot: () => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (newQueue: { queueId: string, invoice: InvoiceData, company: Company | null }[]) => void;
  clearQueue: () => void;
  updateQueueItemInvoice: (queueId: string, updates: Partial<InvoiceData>) => void;
  updateQueueItemCompany: (queueId: string, updates: Partial<Company>) => void;
}

const defaultInvoice: InvoiceData = {
  id: `inv_${Date.now()}`,
  invoiceNumber: "",
  date: format(new Date(), "yyyy-MM-dd"),
  customerId: "",
  items: [],
  remarks: "",
  total: 0,
  amountInWords: "",
};

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoiceData: { ...defaultInvoice },
  templateData: null,
  pdfQueue: [],
  
  setInvoiceData: (data) => set({ 
    invoiceData: data, 
  }),
  
  updateInvoiceData: async (updates) => {
    const currentState = get().invoiceData;
    const optimisticData = { ...currentState, ...updates };
    
    // 1. Optimistic UI update
    set({ invoiceData: optimisticData });

    // 2. Commit to Backend as Source of Truth
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const savedInvoice = await invoke('save_invoice', { invoice: optimisticData });
      // 3. Update UI with Canonical Backend State (e.g. recalculated totals)
      set({ invoiceData: savedInvoice as InvoiceData });
    } catch (e) {
      console.error("Failed to save to backend:", e);
    }
  },
    
  setTemplateData: (data) => set({ templateData: data }),
  
  importState: (data) => set({ invoiceData: data, templateData: data }),
  
  queueSnapshot: () => {
    const { invoiceData } = get();
    const company = useCompanyStore.getState().company;
    set((state) => ({
      pdfQueue: [
        ...state.pdfQueue,
        {
          queueId: crypto.randomUUID ? crypto.randomUUID() : `q_${Date.now()}_${Math.random()}`,
          invoice: structuredClone(invoiceData),
          company: structuredClone(company)
        }
      ]
    }));
  },
  
  removeFromQueue: (index: number) => set((state) => ({
    pdfQueue: state.pdfQueue.filter((_, i) => i !== index)
  })),

  reorderQueue: (newQueue) => set({ pdfQueue: newQueue }),
  
  clearQueue: () => set({ pdfQueue: [] }),
  
  updateQueueItemInvoice: (queueId, updates) => set((state) => ({
    pdfQueue: state.pdfQueue.map(item => 
      item.queueId === queueId 
        ? { ...item, invoice: { ...item.invoice, ...updates } } 
        : item
    )
  })),

  updateQueueItemCompany: (queueId, updates) => set((state) => ({
    pdfQueue: state.pdfQueue.map(item => 
      item.queueId === queueId && item.company
        ? { ...item, company: { ...item.company, ...updates } } 
        : item
    )
  })),
  
  createNewInvoice: async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      const currentTemplate = get().templateData;
      // The Rust backend handles all initialization and lock persistence rules
      const newInvoice = await invoke('initialize_invoice', { template: currentTemplate });
      set({ 
        invoiceData: newInvoice as InvoiceData, 
        templateData: currentTemplate // keep the template in memory for future uses
      });
    } catch (e) {
      console.error("Failed to initialize new invoice:", e);
    }
  },
}));
