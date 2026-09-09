export interface Company {
  id: string;
  name: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  pincode?: string;
  address: string;
  gst: string;
  phone: string;
  email: string;
  bankDetails: string;
  logo: string;
  signature: string;
  digitalSignatureName?: string;
  consigneeName?: string;
  consigneeAddressLine1?: string;
  consigneeAddressLine2?: string;
  consigneeCity?: string;
  consigneePincode?: string;
  consigneeAddress?: string;
  consigneeGst?: string;
  consigneeState?: string;
  signatureOffsetX?: number;
  signatureOffsetY?: number;
  signatureScale?: number;
  modeOfPayment?: string;
  termsOfDelivery?: string;
  consigneeStateCode?: string;
  showBankDetails?: boolean;
  showDigitalSignature?: boolean;
  showSignatureImage?: boolean;
  autoSaveProducts?: boolean;
  billSize?: string;
  lockedFields?: string; // JSON string of Record<string, { id: string, isLocked: boolean, information: any, label: string }>
  columnWidths?: string; // JSON string of Record<string, number>
  customLabels?: string; // JSON string of Record<string, string>
  masterFont?: string;
  masterFontVariant?: string;
  masterColor?: string;
  // Persistent invoice defaults
  buyerName?: string;
  buyerAddressLine1?: string;
  buyerAddressLine2?: string;
  buyerCity?: string;
  buyerPincode?: string;
  buyerAddress?: string;
  buyerGst?: string;
  buyerState?: string;
  buyerStateCode?: string;
  deliveryNote?: string;
  referenceNo?: string;
  otherReferences?: string;
  buyersOrderNo?: string;
  dispatchDocNo?: string;
  dispatchedThrough?: string;
  destination?: string;
  invoiceNumber?: string;
  numberFormat?: string; // 'indian' | 'international'
  fieldStyles?: string; // JSON string of Record<string, { font?: string; bold?: boolean; italic?: boolean; underline?: boolean; color?: string; }>
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
  startDate?: string;
  endDate?: string;
  inventory_item_id?: string;
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
  consigneeAddressLine1?: string;
  consigneeAddressLine2?: string;
  consigneeCity?: string;
  consigneePincode?: string;
  consigneeAddress?: string;
  consigneeGst?: string;
  consigneeState?: string;
  consigneeStateCode?: string;
  
  // Buyer
  buyerName?: string;
  buyerAddressLine1?: string;
  buyerAddressLine2?: string;
  buyerCity?: string;
  buyerPincode?: string;
  buyerAddress?: string;
  buyerGst?: string;
  buyerState?: string;
  buyerStateCode?: string;
  
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
