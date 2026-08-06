import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { InvoiceData } from '@/types';

export async function generatePdf(invoiceData: InvoiceData) {
  // Find the live preview container
  const element = document.getElementById('pdf-preview-container');
  if (!element) {
    alert("Could not find the invoice preview container to generate PDF.");
    return;
  }

  try {
    // We temporarily remove the scale transform to capture at full 800px native resolution
    const originalTransform = element.style.transform;
    element.style.transform = 'none';

    // Capture the DOM element as a canvas
    const imgData = await htmlToImage.toJpeg(element, {
      quality: 0.95,
      backgroundColor: '#ffffff',
      pixelRatio: 2 // Higher scale for better resolution in PDF
    });

    // Restore the scale transform
    element.style.transform = originalTransform;

    // Initialize jsPDF (A4 standard dimensions: 210 x 297 mm)
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Calculate image dimensions to fit the PDF
    const imgWidth = element.offsetWidth;
    const imgHeight = element.offsetHeight;
    const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
    
    // Actually, usually an invoice template is designed to fill the A4 page proportionally
    // We will stretch/scale it to fit the page width
    const renderWidth = pdfWidth;
    const renderHeight = (imgHeight * pdfWidth) / imgWidth;

    pdf.addImage(imgData, 'JPEG', 0, 0, renderWidth, renderHeight);
    
    pdf.save(`Invoice-${invoiceData.invoiceNumber || 'Draft'}.pdf`);
  } catch (error) {
    console.error("Error generating PDF: ", error);
    alert("Failed to generate PDF. Check console for details.");
  }
}
