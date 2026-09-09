import { InvoiceData } from "@/types";
import { generatePdf, PdfResult } from "@/services/pdf.service";
import { saveInvoice } from "@/services/invoice.service";

/**
 * Orchestrates the business workflow for exporting an invoice to PDF.
 * This ensures the UI only calls this method, and the BLL coordinates the DAL and PDF services.
 */
export async function executeExportWorkflow(
  invoiceData: InvoiceData,
  onProgress?: (msg: string) => void
): Promise<PdfResult> {
  if (onProgress) onProgress("Generating PDF...");
  
  const result = await generatePdf(invoiceData);
  
  if (result.success) {
    if (onProgress) onProgress("Saving export metadata...");
    
    // Save metadata back to DB
    const updatedInvoice = {
      ...invoiceData,
      exportFileName: result.filename,
      exportFolder: result.folder,
      exportDate: result.date,
    };
    
    await saveInvoice(updatedInvoice);
  }
  
  return result;
}
