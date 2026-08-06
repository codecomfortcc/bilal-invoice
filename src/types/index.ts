export interface Company {
  id: string;
  name: string;
  address: string;
  gst: string;
  phone: string;
  email: string;
  bankDetails: string;
  logo: string;
  signature: string;
  digitalSignatureName?: string;
  consigneeName?: string;
  consigneeAddress?: string;
  consigneeGst?: string;
  consigneeState?: string;
  signatureOffsetX?: number;
  signatureOffsetY?: number;
}

export interface Customer {
  id: string;
  name: string;
  address: string;
  gst: string;
  phone: string;
  email: string;
  created_at?: string;
  updated_at?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  hsn: string;
  quantity: number;
  rate: number;
  unit: string;
  amount: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId: string;
  items: InvoiceItem[];
  remarks: string;
  total: number;
  amountInWords: string;
  customFields?: Record<string, string>;
  
  // Export tracking
  exportFileName?: string;
  exportFolder?: string;
  exportDate?: string;
  
  // Consignee
  consigneeName?: string;
  consigneeGst?: string;
  consigneeState?: string;
  
  // Buyer
  buyerName?: string;
  buyerAddress?: string;
  buyerGst?: string;
  buyerState?: string;
  
  // Right-side grid details
  deliveryNote?: string;
  modeOfPayment?: string;
  referenceNo?: string;
  otherReferences?: string;
  buyersOrderNo?: string;
  buyersOrderDate?: string;
  dispatchDocNo?: string;
  deliveryNoteDate?: string;
  dispatchedThrough?: string;
  destination?: string;
  termsOfDelivery?: string;
}
