import { create } from "zustand";
import { InvoiceData, Company } from "@/types";
import { format } from "date-fns";
import { useCompanyStore } from "./company.store";

interface InvoiceState {
  invoiceData: InvoiceData;
  templateData: InvoiceData | null;
  setInvoiceData: (data: InvoiceData) => void;
  updateInvoiceData: (updates: Partial<InvoiceData>) => void;
  createNewInvoice: () => void;
  setTemplateData: (data: InvoiceData | null) => void;
  pdfQueue: { invoice: InvoiceData, company: Company | null }[];
  queueSnapshot: () => void;
  clearQueue: () => void;
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
  
  updateInvoiceData: (updates) =>
    set((state) => {
      const newInvoiceData = { ...state.invoiceData, ...updates };
      return {
        invoiceData: newInvoiceData,
      };
    }),
    
  setTemplateData: (data) => set({ templateData: data }),
  
  queueSnapshot: () => {
    const { invoiceData } = get();
    const company = useCompanyStore.getState().company;
    set((state) => ({
      pdfQueue: [
        ...state.pdfQueue,
        {
          invoice: structuredClone(invoiceData),
          company: structuredClone(company)
        }
      ]
    }));
  },
  
  clearQueue: () => set({ pdfQueue: [] }),
  
  createNewInvoice: () => {
    const { invoiceData, templateData } = get();
    const company = useCompanyStore.getState().company;
    let lockedFields: Record<string, any> = {};
    if (company?.lockedFields) {
      try {
        lockedFields = JSON.parse(company.lockedFields);
      } catch (e) {}
    }

    const base = templateData ? structuredClone(templateData) : structuredClone(defaultInvoice);
    
    // For every property in the current invoiceData, if it's locked, retain its value.
    // If not locked, we use the base/default value.
    const newInvoiceData: any = {
      ...base,
      id: `inv_${Date.now()}`,
      date: format(new Date(), "yyyy-MM-dd"),
    };

    for (const key of Object.keys(invoiceData)) {
      if (lockedFields[key] && (invoiceData as any)[key] !== undefined) {
        newInvoiceData[key] = (invoiceData as any)[key];
      }
    }

    set({ invoiceData: newInvoiceData });
  },
}));
