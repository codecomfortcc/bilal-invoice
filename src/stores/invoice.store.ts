import { create } from "zustand";
import { InvoiceData } from "@/types";

interface InvoiceState {
  invoiceData: InvoiceData;
  setInvoiceData: (data: InvoiceData) => void;
  updateInvoiceData: (updates: Partial<InvoiceData>) => void;
  resetInvoiceData: () => void;
}

const defaultInvoice: InvoiceData = {
  id: `inv_${Date.now()}`,
  invoiceNumber: "",
  date: new Date().toISOString().split("T")[0],
  customerId: "",
  items: [],
  remarks: "",
  total: 0,
  amountInWords: "",
};

export const useInvoiceStore = create<InvoiceState>((set) => ({
  invoiceData: { ...defaultInvoice },
  setInvoiceData: (data) => set({ invoiceData: data }),
  updateInvoiceData: (updates) =>
    set((state) => ({
      invoiceData: { ...state.invoiceData, ...updates },
    })),
  resetInvoiceData: () =>
    set({
      invoiceData: {
        ...defaultInvoice,
        id: `inv_${Date.now()}`,
        date: new Date().toISOString().split("T")[0],
      },
    }),
}));
