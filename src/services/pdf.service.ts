import { jsPDF } from "jspdf";
import * as htmlToImage from "html-to-image";
import { InvoiceData } from "@/types";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";

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

    let savePath = "";
    let folder = "";
    let fileName = "";

    if (invoiceData.exportFolder && invoiceData.exportFileName) {
      // Re-exporting an edited invoice: overwrite without asking
      folder = invoiceData.exportFolder;
      fileName = invoiceData.exportFileName;
      savePath = `${folder}\\${fileName}`;
    } else {
      // First time export
      const defaultFilename = `Invoice-${invoiceData.invoiceNumber || "Draft"}.pdf`;
      const selectedPath = await save({
        defaultPath: defaultFilename,
        filters: [{ name: "PDF Document", extensions: ["pdf"] }],
      });

      if (!selectedPath) {
        return { success: false, error: "Export cancelled" };
      }

      savePath = selectedPath;
      const lastSlash = Math.max(savePath.lastIndexOf('\\'), savePath.lastIndexOf('/'));
      folder = savePath.substring(0, lastSlash);
      fileName = savePath.substring(lastSlash + 1);
    }

    const pdfBuffer = pdf.output("arraybuffer");
    await writeFile(savePath, new Uint8Array(pdfBuffer));

    return { 
      success: true, 
      filename: fileName,
      folder: folder,
      date: new Date().toISOString()
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("PDF generation failed:", error);
    return { success: false, error: message };
  }
}
