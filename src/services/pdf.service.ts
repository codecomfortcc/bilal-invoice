import { jsPDF } from "jspdf";
import * as htmlToImage from "html-to-image";
import { InvoiceData } from "@/types";
import { invoke } from "@tauri-apps/api/core";

export interface PdfResult {
  success: boolean;
  filename?: string;
  folder?: string;
  date?: string;
  error?: string;
}

export async function generatePdf(invoiceData: InvoiceData): Promise<PdfResult> {
  const container = document.getElementById("pdf-preview-container");
  if (!container) {
    return { success: false, error: "Could not find the invoice preview container." };
  }

  try {
    // Find all page elements inside the container
    const pages = container.querySelectorAll<HTMLElement>("[data-invoice-page]");
    const elements = pages.length > 0 ? Array.from(pages) : [container];

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < elements.length; i++) {
      const element = elements[i];

      // Temporarily remove scale transform for accurate capture
      const parent = element.closest("[data-preview-scale]") as HTMLElement | null;
      const originalTransform = parent?.style.transform;
      if (parent) parent.style.transform = "none";

      const imgData = await htmlToImage.toJpeg(element, {
        quality: 0.95,
        backgroundColor: "#ffffff",
        pixelRatio: 2,
      });

      // Restore transform
      if (parent && originalTransform !== undefined) {
        parent.style.transform = originalTransform;
      }

      const imgWidth = element.offsetWidth;
      const imgHeight = element.offsetHeight;
      const renderWidth = pdfWidth;
      const renderHeight = (imgHeight * pdfWidth) / imgWidth;

      if (i > 0) pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, 0, renderWidth, Math.min(renderHeight, pdfHeight));
    }

    const defaultFilename = `Invoice-${invoiceData.invoiceNumber || "Draft"}.pdf`;
    const folderHint = (invoiceData.exportFolder && invoiceData.exportFileName) ? invoiceData.exportFolder : null;
    const fileHint = (invoiceData.exportFolder && invoiceData.exportFileName) ? invoiceData.exportFileName : null;

    const pdfBuffer = pdf.output("arraybuffer");
    const pdfBytes = Array.from(new Uint8Array(pdfBuffer));

    // Call rust backend to handle the file dialog and writing
    const result = await invoke<PdfResult>("save_pdf_export", {
      pdfBytes,
      defaultFilename,
      folderHint,
      fileHint
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("PDF generation failed:", error);
    return { success: false, error: message };
  }
}
