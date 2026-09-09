import { InvoiceData } from "@/types";

export function generateInvoiceNumber(): string {
  return `INV-${Date.now().toString().slice(-6)}`;
}

export function createBlankInvoice(): InvoiceData {
  return {
    id: `inv_${Date.now()}`,
    invoiceNumber: "",
    date: new Date().toISOString().split("T")[0],
    customerId: "",
    items: [],
    remarks: "",
    total: 0,
    amountInWords: "",
  };
}

export function calculateItemAmount(quantity: number, rate: number): number {
  return quantity * rate;
}

export function calculateTotal(items: InvoiceData["items"]): number {
  return items.reduce((acc, item) => acc + item.amount, 0);
}
