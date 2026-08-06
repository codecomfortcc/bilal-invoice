import { InvoiceData } from "@/types";
import { getDb } from "@/database/db";

export async function saveInvoice(invoice: InvoiceData): Promise<void> {
  const db = await getDb();
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO invoices (
      id, invoiceNumber, date, customerId, items, remarks, total, amountInWords,
      consigneeName, consigneeGst, consigneeState,
      buyerName, buyerAddress, buyerGst, buyerState,
      deliveryNote, modeOfPayment, referenceNo, otherReferences,
      buyersOrderNo, buyersOrderDate, dispatchDocNo, deliveryNoteDate,
      dispatchedThrough, destination, termsOfDelivery,
      status, exportFileName, exportFolder, exportDate, created_at, updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8,
      $9, $10, $11,
      $12, $13, $14, $15,
      $16, $17, $18, $19,
      $20, $21, $22, $23,
      $24, $25, $26,
      $27, $28, $29, $30, $31, $32
    )
    ON CONFLICT(id) DO UPDATE SET
      invoiceNumber=excluded.invoiceNumber, date=excluded.date, customerId=excluded.customerId,
      items=excluded.items, remarks=excluded.remarks, total=excluded.total, amountInWords=excluded.amountInWords,
      consigneeName=excluded.consigneeName, consigneeGst=excluded.consigneeGst, consigneeState=excluded.consigneeState,
      buyerName=excluded.buyerName, buyerAddress=excluded.buyerAddress, buyerGst=excluded.buyerGst, buyerState=excluded.buyerState,
      deliveryNote=excluded.deliveryNote, modeOfPayment=excluded.modeOfPayment, referenceNo=excluded.referenceNo,
      otherReferences=excluded.otherReferences, buyersOrderNo=excluded.buyersOrderNo, buyersOrderDate=excluded.buyersOrderDate,
      dispatchDocNo=excluded.dispatchDocNo, deliveryNoteDate=excluded.deliveryNoteDate,
      dispatchedThrough=excluded.dispatchedThrough, destination=excluded.destination, termsOfDelivery=excluded.termsOfDelivery,
      status=excluded.status, exportFileName=excluded.exportFileName, exportFolder=excluded.exportFolder,
      exportDate=excluded.exportDate, updated_at=excluded.updated_at`,
    [
      invoice.id, invoice.invoiceNumber, invoice.date, invoice.customerId || "",
      JSON.stringify(invoice.items), invoice.remarks, invoice.total, invoice.amountInWords || "",
      invoice.consigneeName || "", invoice.consigneeGst || "", invoice.consigneeState || "",
      invoice.buyerName || "", invoice.buyerAddress || "", invoice.buyerGst || "", invoice.buyerState || "",
      invoice.deliveryNote || "", invoice.modeOfPayment || "", invoice.referenceNo || "",
      invoice.otherReferences || "", invoice.buyersOrderNo || "", invoice.buyersOrderDate || "",
      invoice.dispatchDocNo || "", invoice.deliveryNoteDate || "",
      invoice.dispatchedThrough || "", invoice.destination || "", invoice.termsOfDelivery || "",
      "draft", invoice.exportFileName || null, invoice.exportFolder || null, invoice.exportDate || null, now, now,
    ]
  );
}

export async function getInvoice(id: string): Promise<InvoiceData | null> {
  const db = await getDb();
  const result = await db.select<any[]>("SELECT * FROM invoices WHERE id = $1", [id]);
  if (result.length === 0) return null;
  return deserializeInvoice(result[0]);
}

export async function listInvoices(): Promise<InvoiceData[]> {
  const db = await getDb();
  const result = await db.select<any[]>("SELECT * FROM invoices ORDER BY updated_at DESC");
  return result.map(deserializeInvoice);
}

export async function deleteInvoice(id: string): Promise<void> {
  const db = await getDb();
  await db.execute("DELETE FROM invoices WHERE id = $1", [id]);
}

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

function deserializeInvoice(row: any): InvoiceData {
  return {
    id: row.id,
    invoiceNumber: row.invoiceNumber,
    date: row.date,
    customerId: row.customerId,
    items: typeof row.items === "string" ? JSON.parse(row.items) : row.items || [],
    remarks: row.remarks || "",
    total: row.total || 0,
    amountInWords: row.amountInWords || "",
    consigneeName: row.consigneeName || undefined,
    consigneeGst: row.consigneeGst || undefined,
    consigneeState: row.consigneeState || undefined,
    buyerName: row.buyerName || undefined,
    buyerAddress: row.buyerAddress || undefined,
    buyerGst: row.buyerGst || undefined,
    buyerState: row.buyerState || undefined,
    deliveryNote: row.deliveryNote || undefined,
    modeOfPayment: row.modeOfPayment || undefined,
    referenceNo: row.referenceNo || undefined,
    otherReferences: row.otherReferences || undefined,
    buyersOrderNo: row.buyersOrderNo || undefined,
    buyersOrderDate: row.buyersOrderDate || undefined,
    dispatchDocNo: row.dispatchDocNo || undefined,
    deliveryNoteDate: row.deliveryNoteDate || undefined,
    dispatchedThrough: row.dispatchedThrough || undefined,
    destination: row.destination || undefined,
    termsOfDelivery: row.termsOfDelivery || undefined,
    exportFileName: row.exportFileName || undefined,
    exportFolder: row.exportFolder || undefined,
    exportDate: row.exportDate || undefined,
  };
}
