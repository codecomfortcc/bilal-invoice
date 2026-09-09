import { InvoiceData } from "@/types";
import { invoke } from "@tauri-apps/api/core";

export async function saveInvoice(invoice: InvoiceData): Promise<InvoiceData> {
  return await invoke<InvoiceData>("save_invoice", { invoice });
}

export async function getInvoice(id: string): Promise<InvoiceData | null> {
  try {
    return await invoke<InvoiceData | null>("get_invoice", { id });
  } catch (error) {
    console.error("Failed to get invoice:", error);
    return null;
  }
}

export async function listInvoices(): Promise<InvoiceData[]> {
  try {
    return await invoke<InvoiceData[]>("list_invoices");
  } catch (error) {
    console.error("Failed to list invoices:", error);
    return [];
  }
}

export async function deleteInvoice(id: string): Promise<void> {
  await invoke("delete_invoice", { id });
}
