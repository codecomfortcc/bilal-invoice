import React, { useEffect, useState } from "react";
import { Company, InvoiceData, InvoiceItem } from "@/types";
import { numberToWordsIndian } from "@/lib/numberToWords";
import { useCompanyStore, useInvoiceStore, useInventoryStore, useHistoryStore } from "@/stores";
import { Plus, Trash2 } from "lucide-react";
import { formatNumber } from "@/lib/formatters";
import { calculateTotal } from "@/lib/invoiceRules";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { saveCompanySettings } from "@/services/settings.service";
import { saveInventoryItem } from "@/services/inventory.service";

interface InvoicePreviewProps {
  data: InvoiceData;
  isEditing?: boolean;
  onUpdateInvoice?: (updates: Partial<InvoiceData>) => void;
  onUpdateCompany?: (updates: Partial<Company>) => void;
}

import { EditableText } from "./EditableText";
import { EditableDate } from "./EditableDate";
import { EditableImage } from "./EditableImage";
import { EditableServices } from "./EditableServices";
import { EditableQuantity } from "./EditableQuantity";
import { EditableCash } from "./EditableCash";
import { Rnd } from "react-rnd";

export const CompanyContext = React.createContext<Company | null>(null);

const ColumnResizer = ({ width, onResize, onResizeEnd, isLeftAligned = false }: { width: number, onResize: (w: number) => void, onResizeEnd: (w: number) => void, isLeftAligned?: boolean }) => {
  return (
    <div
      className={cn(
        "absolute top-0 w-1.5 h-full cursor-col-resize hover:bg-blue-500 z-50",
        isLeftAligned ? "left-0 -translate-x-1/2" : "right-0 translate-x-1/2"
      )}
      onMouseDown={(e) => {
        e.preventDefault();
        const startX = e.clientX;
        const startWidth = width;
        const onMouseMove = (moveEvent: MouseEvent) => {
          const delta = moveEvent.clientX - startX;
          const newWidth = Math.max(20, startWidth + (isLeftAligned ? -delta : delta));
          onResize(newWidth);
        };
        const onMouseUp = (upEvent: MouseEvent) => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
          const delta = upEvent.clientX - startX;
          const finalWidth = Math.max(20, startWidth + (isLeftAligned ? -delta : delta));
          onResizeEnd(finalWidth);
        };
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
      }}
    />
  );
};

export function InvoicePreview({ data, isEditing = false, overrideCompany, onUpdateInvoice, onUpdateCompany }: InvoicePreviewProps & { overrideCompany?: Company | null }) {
  const globalCompany = useCompanyStore((state) => state.company);
  const { setCompany } = useCompanyStore();
  const company = overrideCompany || globalCompany;
  
  const { updateInvoiceData } = useInvoiceStore();
  const { items: inventoryItems, fetchItems } = useInventoryStore();

  const showBankDetails = company?.showBankDetails ?? true;
  const showDigitalSignature = company?.showDigitalSignature ?? true;
  const showSignatureImage = company?.showSignatureImage ?? true;
  const autoSaveProducts = company?.autoSaveProducts ?? true;

  let labels: Record<string, string> = {};
  if (company?.customLabels) {
    try {
      labels = JSON.parse(company.customLabels);
    } catch (e) {}
  }

  const [widths, setWidths] = useState({
    sl: 32,
    hsn: 64,
    qty: 64,
    rate: 64,
    per: 48,
    amount: 96
  });

  useEffect(() => {
    if (company?.columnWidths) {
      try {
        const parsed = JSON.parse(company.columnWidths);
        if (parsed.sl) setWidths(parsed);
      } catch (e) {}
    }
  }, [company?.columnWidths]);

  const updateColumnWidth = (col: keyof typeof widths, newWidth: number) => {
    setWidths(prev => ({ ...prev, [col]: newWidth }));
  };

  const saveColumnWidths = (col: keyof typeof widths, newWidth: number) => {
    if (!company) return;
    useHistoryStore.getState().commit();
    const newWidths = { ...widths, [col]: newWidth };
    const updatedCompany = { ...company, columnWidths: JSON.stringify(newWidths) };
    if (onUpdateCompany) {
      onUpdateCompany({ columnWidths: JSON.stringify(newWidths) });
    } else {
      setCompany(updatedCompany);
      saveCompanySettings(updatedCompany);
    }
  };

  useEffect(() => {
    if (isEditing && inventoryItems.length === 0) {
      fetchItems();
    }
  }, [isEditing, fetchItems, inventoryItems.length]);

  const updateLabel = (key: string, value: string) => {
    if (company) {
      useHistoryStore.getState().commit();
      let labels: Record<string, string> = {};
      try {
        labels = JSON.parse(company.customLabels || "{}");
      } catch (e) {}
      labels[key] = value;
      const updated = { ...company, customLabels: JSON.stringify(labels) };
      if (onUpdateCompany) {
        onUpdateCompany({ customLabels: JSON.stringify(labels) });
      } else {
        setCompany(updated);
        saveCompanySettings(updated);
      }
    }
  };

  const updateCompanyField = (field: keyof Company, value: any) => {
    if (!company) return;
    const updated = { ...company, [field]: value };
    if (onUpdateCompany) {
      onUpdateCompany({ [field]: value });
    } else {
      setCompany(updated);
      saveCompanySettings(updated);
    }
  };

  const updateCompanyFields = (updates: Partial<Company>) => {
    if (!company) return;
    const updated = { ...company, ...updates };
    if (onUpdateCompany) {
      onUpdateCompany(updates);
    } else {
      setCompany(updated);
      saveCompanySettings(updated);
    }
  };

  const updateField = (field: keyof InvoiceData, value: any) => {
    useHistoryStore.getState().commit();
    if (onUpdateInvoice) {
      onUpdateInvoice({ [field]: value });
    } else {
      updateInvoiceData({ [field]: value });
    }
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    useHistoryStore.getState().commit();
    const newItems = [...data.items];
    
    // Parse numeric fields
    let parsedValue = value;
    if (field === "quantity" || field === "rate" || field === "amount") {
      parsedValue = Number(value) || 0;
    }
    
    const item = { ...newItems[index], [field]: parsedValue };

    // Auto calculate amount
    if (field === "quantity" || field === "rate") {
      item.amount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
    }

    // Auto-fill from inventory if description matches exactly
    if (field === "description") {
      const matchedProduct = inventoryItems.find((i) => i.title === value);
      if (matchedProduct) {
        if (matchedProduct.hsnSac) item.hsn = matchedProduct.hsnSac;
        if (matchedProduct.rate) item.rate = matchedProduct.rate;
        if (matchedProduct.unit) item.unit = matchedProduct.unit;
        item.amount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
      }
    }

    newItems[index] = item;
    const newTotal = calculateTotal(newItems);
    const updates = { items: newItems, total: newTotal, amountInWords: numberToWordsIndian(newTotal) };
    if (onUpdateInvoice) {
      onUpdateInvoice(updates);
    } else {
      updateInvoiceData(updates);
    }

    // Auto-save logic
    // We only auto-save automatically for non-description fields (like rate, hsn)
    // For description, we wait until the user finishes (onDone) to avoid spamming the DB
    if (field !== "description") {
      autoSaveInventoryProduct(item);
    }
  };

  const autoSaveInventoryProduct = (item: InvoiceItem) => {
    if (autoSaveProducts && item.description && item.description.trim() !== "") {
      const existingItem = inventoryItems.find(i => i.title === item.description);
      const inventoryItemToSave = {
        id: existingItem?.id || `inv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        title: item.description,
        hsnSac: item.hsn,
        unit: item.unit,
        rate: Number(item.rate) || 0,
      };
      
      saveInventoryItem(inventoryItemToSave).then(() => {
        // Fetch to ensure we have the latest items with the new auto-saved product
        fetchItems();
      });
    }
  };

  const addItem = () => {
    useHistoryStore.getState().commit();
    const newItem: InvoiceItem = {
      id: `item_${Date.now()}`,
      description: "",
      hsn: "",
      quantity: 1,
      rate: 0,
      unit: "NOS",
      amount: 0,
    };
    const newItems = [...data.items, newItem];
    if (onUpdateInvoice) {
      onUpdateInvoice({ items: newItems });
    } else {
      updateInvoiceData({ items: newItems });
    }
  };

  const removeItem = (index: number) => {
    useHistoryStore.getState().commit();
    const newItems = data.items.filter((_, i) => i !== index);
    const newTotal = calculateTotal(newItems);
    const updates = { items: newItems, total: newTotal, amountInWords: numberToWordsIndian(newTotal) };
    if (onUpdateInvoice) {
      onUpdateInvoice(updates);
    } else {
      updateInvoiceData(updates);
    }
  };

  // removed bankInfo object condition

  const billSize = company?.billSize || "A4";

  const getPageDimensions = () => {
    switch (billSize) {
      case "A5": return { width: "559px", minHeight: "794px" };
      case "Letter": return { width: "816px", minHeight: "1056px" };
      case "Legal": return { width: "816px", minHeight: "1344px" };
      case "A4":
      default: return { width: "800px", minHeight: "1131px" };
    }
  };

  const dimensions = getPageDimensions();
  const numericHeight = parseInt(dimensions.minHeight);

  const getPageChunks = (items: InvoiceItem[]) => {
    const chunks: InvoiceItem[][] = [];
    let currentIndex = 0;

    const rowHeight = 30; // Approx pixel height of a single product row
    const padding = 80;   // 40px top + 40px bottom padding
    const headerHeight = 330; // Estimated height of the invoice header section
    const footerHeight = 220; // Estimated height of the invoice footer (totals + signatures)

    // Calculate maximum items per page based on the physical height of the selected paper size
    const FIRST_PAGE_MAX = Math.max(1, Math.floor((numericHeight - padding - headerHeight - footerHeight) / rowHeight));
    const FIRST_PAGE_NO_FOOTER_MAX = Math.max(1, Math.floor((numericHeight - padding - headerHeight) / rowHeight));
    const MIDDLE_PAGE_MAX = Math.max(1, Math.floor((numericHeight - padding) / rowHeight));
    const LAST_PAGE_MAX = Math.max(1, Math.floor((numericHeight - padding - footerHeight) / rowHeight));

    if (items.length <= FIRST_PAGE_MAX) {
      return [items];
    }

    chunks.push(items.slice(currentIndex, currentIndex + FIRST_PAGE_NO_FOOTER_MAX));
    currentIndex += FIRST_PAGE_NO_FOOTER_MAX;

    while (currentIndex < items.length) {
      const remaining = items.length - currentIndex;
      if (remaining <= LAST_PAGE_MAX) {
        chunks.push(items.slice(currentIndex, currentIndex + remaining));
        break;
      } else {
        chunks.push(items.slice(currentIndex, currentIndex + MIDDLE_PAGE_MAX));
        currentIndex += MIDDLE_PAGE_MAX;
      }
    }

    return chunks;
  };

  const pages = getPageChunks(data.items);
  const totalPages = Math.max(1, pages.length);
  const totalQuantity = data.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0);

  return (
    <CompanyContext.Provider value={company}>
      <div className="invoice-print-area flex flex-col gap-8 pb-8">
        {/* Popovers handle autocomplete now */}

      {pages.map((pageItems, pageIndex) => {
        const isLastPage = pageIndex === totalPages - 1;
        const globalItemStartIndex = pages.slice(0, pageIndex).reduce((sum, page) => sum + page.length, 0);

        return (
          <div
            key={pageIndex}
            data-invoice-page
            className="bg-white text-xs flex flex-col shadow-2xl relative transition-all"
            style={{ width: dimensions.width, minHeight: dimensions.minHeight, padding: "40px", color: company?.masterColor || 'inherit' }}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-2">
              <div className="w-1/3">
                {totalPages > 1 && (
                  <span className="text-[10px]">
                    Page {pageIndex + 1} of {totalPages}
                  </span>
                )}
              </div>
              <div className="w-1/3 text-center flex flex-col items-center justify-center">
                <EditableText
                  isEditing={isEditing}
                  value={labels['taxInvoice'] || "Tax Invoice"}
                  onChange={(v) => updateLabel('taxInvoice', v)}
                  className="font-bold text-lg leading-tight !w-auto text-center"
                  styleKey="taxInvoice"
                />
                <EditableText
                  isEditing={isEditing}
                  value={labels['billOfSupply'] || "Bill of Supply"}
                  onChange={(v) => updateLabel('billOfSupply', v)}
                  className="text-[10px] leading-tight !w-auto text-center"
                  styleKey="billOfSupply"
                />
              </div>
              <div className="w-1/3 text-right italic text-[10px] font-medium pt-1">
                <EditableText
                  isEditing={isEditing}
                  value={labels['originalRecipient'] || "(ORIGINAL FOR RECIPIENT)"}
                  onChange={(v) => updateLabel('originalRecipient', v)}
                  className="inline-block !w-auto"
                  styleKey="originalRecipient"
                />
              </div>
            </div>

            {/* Main Container - Bordered */}
            <div className="border border-black flex-1 flex flex-col">
              {/* Top Section - Only on first page */}
              {pageIndex === 0 && (
                <div className="flex border-b border-black min-h-[280px]">
                  {/* Left Side */}
                  <div className="w-[50%] border-r border-black flex flex-col">
                    {/* Block 1: Company Details */}
                    <div className="p-1 border-b border-black flex flex-col group/company">
                      <div className="font-bold">
                        <EditableText 
                          isEditing={isEditing}
                          lockableKey="companyName"
                          value={data.sellerName || ""}
                          onChange={(val) => updateInvoiceData({ sellerName: val })}
                          className="font-bold text-xs uppercase"
                          placeholder="Company Name"
                        />
                      </div>
                      <div className="text-[10px] leading-tight flex-1 mt-1 flex flex-col">
                        <EditableText 
                          isEditing={isEditing}
                          lockableKey="addressLine1"
                          value={data.sellerAddressLine1 || ""}
                          onChange={(val) => updateInvoiceData({ sellerAddressLine1: val })}
                          placeholder="Address Line 1"
                        />
                        <EditableText 
                          isEditing={isEditing}
                          lockableKey="addressLine2"
                          value={data.sellerAddressLine2 || ""}
                          onChange={(val) => updateInvoiceData({ sellerAddressLine2: val })}
                          placeholder="Address Line 2"
                        />
                        <div className="flex gap-1">
                          <EditableText 
                            isEditing={isEditing}
                            lockableKey="city"
                            value={data.sellerCity || ""}
                            onChange={(val) => updateInvoiceData({ sellerCity: val })}
                            placeholder="City"
                          />
                          <EditableText 
                            isEditing={isEditing}
                            lockableKey="pincode"
                            value={data.sellerPincode || ""}
                            onChange={(val) => updateInvoiceData({ sellerPincode: val })}
                            placeholder="Pincode"
                          />
                        </div>
                      </div>
                      <div className="text-[10px] mt-1 flex items-center">
                        <EditableText
                          isEditing={isEditing}
                          value={labels['emailLabel'] || "E-MAIL :"}
                          onChange={(v) => updateLabel('emailLabel', v)}
                          className="whitespace-nowrap inline-block !w-auto"
                          styleKey="emailLabel"
                        />
                        <EditableText
                          lockableKey="email"
                          isEditing={isEditing}
                          value={data.sellerEmail || ""}
                          onChange={(v) => updateInvoiceData({ sellerEmail: v })}
                          placeholder="Email Address"
                          className="ml-1 flex-1 !w-auto"
                        />
                      </div>
                    </div>

                    {/* Block 2: Consignee */}
                    <div className="p-1 border-b border-black flex flex-col">
                      <EditableText
                        isEditing={isEditing}
                        value={labels['consigneeLabel'] || "Consignee (Ship to)"}
                        onChange={(v) => updateLabel('consigneeLabel', v)}
                        className="text-[9px] mb-1 inline-block !w-auto"
                        styleKey="consigneeLabel"
                      />
                      <strong className="text-[11px] whitespace-pre-line mb-1">
                        <EditableText
                          lockableKey="consigneeName"
                          isEditing={isEditing}
                          value={data.consigneeName || ""}
                          onChange={(v) => updateField("consigneeName", v)}
                          placeholder="Consignee Name"
                          className="font-bold text-[11px]"
                        />
                      </strong>
                      <div className="grid grid-cols-[80px_1fr] text-[10px] mt-auto">
                        <EditableText
                          isEditing={isEditing}
                          value={labels['gstinLabel'] || "GSTIN/UIN"}
                          onChange={(v) => updateLabel('gstinLabel', v)}
                          className="flex items-center inline-block !w-auto"
                          styleKey="gstinLabel"
                        />
                        <span className="flex items-center">
                          <span className="whitespace-nowrap mr-1">:</span>
                          <EditableText
                            lockableKey="consigneeGst"
                            isEditing={isEditing}
                            value={data.consigneeGst || ""}
                            onChange={(v) => updateField("consigneeGst", v)}
                            className="font-semibold flex-1 !w-auto"
                            placeholder="GSTIN"
                          />
                        </span>
                        <EditableText
                          isEditing={isEditing}
                          value={labels['stateNameLabel'] || "State Name"}
                          onChange={(v) => updateLabel('stateNameLabel', v)}
                          className="flex items-center inline-block !w-auto"
                          styleKey="stateNameLabel"
                        />
                        <span className="flex items-center">
                          <span className="whitespace-nowrap mr-1">:</span>
                          <EditableText
                            lockableKey="consigneeState"
                            isEditing={isEditing}
                            value={data.consigneeState || ""}
                            onChange={(v) => updateField("consigneeState", v)}
                            className="flex-1 !w-auto"
                            placeholder="State"
                          />
                        </span>
                      </div>
                    </div>

                    {/* Block 3: Buyer */}
                    <div className="p-1 flex flex-col flex-1 relative group/section">
                      <EditableText
                        isEditing={isEditing}
                        value={labels['buyerLabel'] || "Buyer (Bill to)"}
                        onChange={(v) => updateLabel('buyerLabel', v)}
                        className="text-[9px] mb-1 inline-block !w-auto"
                        styleKey="buyerLabel"
                      />
                      
                      <strong className="text-[11px] leading-tight whitespace-pre-line mb-0.5">
                        <EditableText
                          lockableKey="buyerName"
                          isEditing={isEditing}
                          value={data.buyerName || ""}
                          onChange={(v) => updateField("buyerName", v)}
                          placeholder="Buyer Name"
                          className="font-bold text-[11px]"
                        />
                      </strong>
                      <div className="text-[10px] leading-tight mt-0.5 flex flex-col flex-1 mb-1">
                        <EditableText
                          lockableKey="buyerAddressLine1"
                          isEditing={isEditing}
                          value={data.buyerAddressLine1 || ""}
                          onChange={(v) => updateField("buyerAddressLine1", v)}
                          placeholder="Address Line 1"
                        />
                        <EditableText
                          lockableKey="buyerAddressLine2"
                          isEditing={isEditing}
                          value={data.buyerAddressLine2 || ""}
                          onChange={(v) => updateField("buyerAddressLine2", v)}
                          placeholder="Address Line 2"
                        />
                        <div className="flex gap-1">
                          <EditableText
                            lockableKey="buyerCity"
                            isEditing={isEditing}
                            value={data.buyerCity || ""}
                            onChange={(v) => updateField("buyerCity", v)}
                            placeholder="City"
                          />
                          <EditableText
                            lockableKey="buyerPincode"
                            isEditing={isEditing}
                            value={data.buyerPincode || ""}
                            onChange={(v) => updateField("buyerPincode", v)}
                            placeholder="Pincode"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-[80px_1fr] text-[10px] mt-1">
                        <span className="flex items-center">GSTIN/UIN</span>
                        <span className="flex items-center">
                          <span className="whitespace-nowrap mr-1">:</span>
                          <EditableText
                            lockableKey="buyerGst"
                            isEditing={isEditing}
                            value={data.buyerGst || ""}
                            onChange={(v) => updateField("buyerGst", v)}
                            className="font-semibold flex-1 !w-auto"
                            placeholder="GSTIN"
                          />
                        </span>
                        <span className="flex items-center">State Name</span>
                        <span className="flex items-center flex-nowrap">
                          <span className="whitespace-nowrap mr-1">:</span>
                          <EditableText
                            lockableKey="buyerState"
                            isEditing={isEditing}
                            value={data.buyerState || ""}
                            onChange={(v) => updateField("buyerState", v)}
                            className="mr-2 !w-auto"
                            placeholder="State"
                          />
                          <span className="flex items-center whitespace-nowrap">
                            Code :
                            <EditableText
                              lockableKey="buyerStateCode"
                              isEditing={isEditing}
                              value={data.buyerStateCode || ""}
                              onChange={(v) => updateField("buyerStateCode", v)}
                              className="ml-1 w-[40px] !w-auto"
                              placeholder="Code"
                            />
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Side - Grid */}
                  <div className="w-[50%] grid grid-cols-2 grid-rows-7">
                    {/* Row 1 */}
                    <div className="border-b border-r border-black p-1 flex flex-col justify-start">
                      <span className="text-[9px]">Invoice No.</span>
                      <strong className="mt-1">
                        <EditableText
                          lockableKey="invoiceNumber"
                          isEditing={isEditing}
                          value={data.invoiceNumber || ""}
                          onChange={(v) => {
                            updateField("invoiceNumber", v);
                            updateCompanyField("invoiceNumber", v);
                          }}
                          placeholder="INV-XXX"
                          className="font-bold"
                        />
                      </strong>
                    </div>
                    <div className="border-b border-black p-1 flex flex-col justify-start">
                      <span className="text-[9px]">Dated</span>
                      <strong className="mt-1">
                        <EditableDate
                          lockableKey="date"
                          isEditing={isEditing}
                          value={data.date || ""}
                          onChange={(v) => updateField("date", v)}
                          className="font-bold"
                        />
                      </strong>
                    </div>

                    {/* Row 2 */}
                    <div className="border-b border-r border-black p-1 flex flex-col justify-start">
                      <span className="text-[9px]">Delivery Note</span>
                      <strong className="mt-1">
                        <EditableText
                          lockableKey="deliveryNote"
                          isEditing={isEditing}
                          value={data.deliveryNote || ""}
                          onChange={(v) => updateField("deliveryNote", v)}
                          placeholder="Delivery Note"
                          className="font-bold"
                        />
                      </strong>
                    </div>
                    <div className="border-b border-black p-1 flex flex-col justify-start">
                      <span className="text-[9px]">Mode/Terms of Payment</span>
                      <strong className="mt-1">
                        <EditableText
                          lockableKey="modeOfPayment"
                          isEditing={isEditing}
                          value={data.modeOfPayment || ""}
                          onChange={(v) => updateField("modeOfPayment", v)}
                          placeholder="Payment Terms"
                          className="font-bold"
                        />
                      </strong>
                    </div>

                    {/* Row 3 */}
                    <div className="border-b border-r border-black p-1 flex flex-col justify-start">
                      <span className="text-[9px]">Reference No. & Date.</span>
                      <strong className="mt-1">
                        <EditableText
                          lockableKey="referenceNo"
                          isEditing={isEditing}
                          value={data.referenceNo || ""}
                          onChange={(v) => updateField("referenceNo", v)}
                          placeholder="Reference No."
                          className="font-bold"
                        />
                      </strong>
                    </div>
                    <div className="border-b border-black p-1 flex flex-col justify-start">
                      <span className="text-[9px]">Other References</span>
                      <strong className="mt-1">
                        <EditableText
                          lockableKey="otherReferences"
                          isEditing={isEditing}
                          value={data.otherReferences || ""}
                          onChange={(v) => updateField("otherReferences", v)}
                          placeholder="Other References"
                          className="font-bold"
                        />
                      </strong>
                    </div>

                    {/* Row 4 */}
                    <div className="border-b border-r border-black p-1 flex flex-col justify-start">
                      <span className="text-[9px]">Buyer's Order No.</span>
                      <strong className="mt-1">
                        <EditableText
                          lockableKey="buyersOrderNo"
                          isEditing={isEditing}
                          value={data.buyersOrderNo || ""}
                          onChange={(v) => updateField("buyersOrderNo", v)}
                          placeholder="Order No."
                          className="font-bold"
                        />
                      </strong>
                    </div>
                    <div className="border-b border-black p-1 flex flex-col justify-start">
                      <span className="text-[9px]">Dated</span>
                      <strong className="mt-1">
                        <EditableDate
                          lockableKey="buyersOrderDate"
                          isEditing={isEditing}
                          value={data.buyersOrderDate || ""}
                          onChange={(v) => updateField("buyersOrderDate", v)}
                          className="font-bold"
                        />
                      </strong>
                    </div>

                    {/* Row 5 */}
                    <div className="border-b border-r border-black p-1 flex flex-col justify-start">
                      <span className="text-[9px]">Dispatch Doc No.</span>
                      <strong className="mt-1">
                        <EditableText
                          lockableKey="dispatchDocNo"
                          isEditing={isEditing}
                          value={data.dispatchDocNo || ""}
                          onChange={(v) => updateField("dispatchDocNo", v)}
                          placeholder="Dispatch Doc No."
                          className="font-bold"
                        />
                      </strong>
                    </div>
                    <div className="border-b border-black p-1 flex flex-col justify-start">
                      <span className="text-[9px]">Delivery Note Date</span>
                      <strong className="mt-1">
                        <EditableDate
                          lockableKey="deliveryNoteDate"
                          isEditing={isEditing}
                          value={data.deliveryNoteDate || ""}
                          onChange={(v) => updateField("deliveryNoteDate", v)}
                          className="font-bold"
                        />
                      </strong>
                    </div>

                    {/* Row 6 */}
                    <div className="border-b border-r border-black p-1 flex flex-col justify-start">
                      <span className="text-[9px]">Dispatched through</span>
                      <strong className="mt-1">
                        <EditableText
                          lockableKey="dispatchedThrough"
                          isEditing={isEditing}
                          value={data.dispatchedThrough || ""}
                          onChange={(v) => updateField("dispatchedThrough", v)}
                          placeholder="Dispatched Through"
                          className="font-bold"
                        />
                      </strong>
                    </div>
                    <div className="border-b border-black p-1 flex flex-col justify-start">
                      <span className="text-[9px]">Destination</span>
                      <strong className="mt-1">
                        <EditableText
                          lockableKey="destination"
                          isEditing={isEditing}
                          value={data.destination || ""}
                          onChange={(v) => updateField("destination", v)}
                          placeholder="Destination"
                          className="font-bold"
                        />
                      </strong>
                    </div>

                    {/* Row 7 */}
                    <div className="col-span-2 p-1 flex flex-col justify-start">
                      <span className="text-[9px]">Terms of Delivery</span>
                      <strong className="text-[10px] mt-1 whitespace-pre-line">
                        <EditableText
                          lockableKey="termsOfDelivery"
                          isEditing={isEditing}
                          value={data.termsOfDelivery || ""}
                          onChange={(v) => updateField("termsOfDelivery", v)}
                          multiline
                          placeholder="Terms of Delivery"
                          className="font-bold text-[10px]"
                        />
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Items Table */}
              <div className="flex-1 flex flex-col relative group/section mt-[-1px]">
                
                {/* Header */}
                <div className="flex border-t border-b border-black text-[10px]">
                  <div style={{ width: widths.sl }} className="relative border-r border-black p-1 text-center font-bold flex items-center justify-center shrink-0">
                    Sl No.
                    <ColumnResizer width={widths.sl} onResize={(w) => updateColumnWidth('sl', w)} onResizeEnd={(w) => saveColumnWidths('sl', w)} />
                  </div>
                  <div className="flex-1 border-r border-black p-1 text-center font-bold flex items-center justify-center min-w-[50px]">
                    Description of Services
                  </div>
                  <div style={{ width: widths.hsn }} className="relative border-r border-black p-1 text-center font-bold flex items-center justify-center shrink-0">
                    <ColumnResizer isLeftAligned width={widths.hsn} onResize={(w) => updateColumnWidth('hsn', w)} onResizeEnd={(w) => saveColumnWidths('hsn', w)} />
                    HSN/SAC
                  </div>
                  <div style={{ width: widths.qty }} className="relative border-r border-black p-1 text-center font-bold flex items-center justify-center shrink-0">
                    <ColumnResizer isLeftAligned width={widths.qty} onResize={(w) => updateColumnWidth('qty', w)} onResizeEnd={(w) => saveColumnWidths('qty', w)} />
                    Quantity
                  </div>
                  <div style={{ width: widths.rate }} className="relative border-r border-black p-1 text-center font-bold flex items-center justify-center shrink-0">
                    <ColumnResizer isLeftAligned width={widths.rate} onResize={(w) => updateColumnWidth('rate', w)} onResizeEnd={(w) => saveColumnWidths('rate', w)} />
                    Rate
                  </div>
                  <div style={{ width: widths.per }} className="relative border-r border-black p-1 text-center font-bold flex items-center justify-center shrink-0">
                    <ColumnResizer isLeftAligned width={widths.per} onResize={(w) => updateColumnWidth('per', w)} onResizeEnd={(w) => saveColumnWidths('per', w)} />
                    per
                  </div>
                  <div style={{ width: widths.amount }} className="relative p-1 text-center font-bold flex items-center justify-center shrink-0">
                    <ColumnResizer isLeftAligned width={widths.amount} onResize={(w) => updateColumnWidth('amount', w)} onResizeEnd={(w) => saveColumnWidths('amount', w)} />
                    Amount
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 flex relative">
                  {/* Column Borders Layer */}
                  <div className="absolute inset-0 flex pointer-events-none">
                    <div style={{ width: widths.sl }} className="border-r border-black shrink-0"></div>
                    <div className="flex-1 border-r border-black"></div>
                    <div style={{ width: widths.hsn }} className="border-r border-black shrink-0"></div>
                    <div style={{ width: widths.qty }} className="border-r border-black shrink-0"></div>
                    <div style={{ width: widths.rate }} className="border-r border-black shrink-0"></div>
                    <div style={{ width: widths.per }} className="border-r border-black shrink-0"></div>
                    <div style={{ width: widths.amount }} className="shrink-0"></div>
                  </div>

                  {/* Content Layer */}
                  <div className="w-full flex flex-col z-10 pb-8">
                    {pageItems.map((item, localIndex) => {
                      const globalIndex = globalItemStartIndex + localIndex;
                      return (
                        <div key={item.id} className="flex align-top group relative">
                          <div style={{ width: widths.sl }} className="p-1 pt-1.5 text-center break-words break-all shrink-0">{globalIndex + 1}</div>
                          <div className="flex-1 p-1 pl-2 pt-1.5 break-words break-all whitespace-normal">
                            <strong className="block">
                              <EditableServices
                                isEditing={isEditing}
                                value={item.description || ""}
                                onChange={(v) => updateItem(globalIndex, "description", v)}
                                onSelectProduct={(product) => {
                                  updateItem(globalIndex, "description", product.title);
                                }}
                                onDone={(val) => {
                                  autoSaveInventoryProduct({ ...item, description: val });
                                }}
                                inventoryItems={inventoryItems}
                                placeholder="Item Description"
                                className="font-bold block w-full"
                                styleKey={`item_desc_${globalIndex}`}
                              />
                            </strong>
                          </div>
                          <div style={{ width: widths.hsn }} className="p-1 pt-1.5 text-center break-words break-all shrink-0">
                            <EditableText
                              isEditing={isEditing}
                              value={item.hsn || ""}
                              onChange={(v) => updateItem(globalIndex, "hsn", v)}
                              className="text-center"
                              placeholder="HSN"
                              styleKey={`item_hsn_${globalIndex}`}
                            />
                          </div>
                          <div style={{ width: widths.qty }} className="p-1 pt-1.5 text-center font-bold break-words break-all shrink-0">
                            <EditableQuantity
                              isEditing={isEditing}
                              value={item.quantity || ""}
                              onChange={(v) => updateItem(globalIndex, "quantity", v)}
                              className="text-center font-bold"
                            />
                          </div>
                          <div style={{ width: widths.rate }} className="p-1 pr-2 pt-1.5 text-right break-words break-all shrink-0">
                            <EditableCash
                              isEditing={isEditing}
                              value={item.rate || ""}
                              onChange={(v) => updateItem(globalIndex, "rate", v)}
                              className="text-right"
                            />
                          </div>
                          <div style={{ width: widths.per }} className="p-1 pt-1.5 text-center text-[10px] break-words break-all leading-tight flex items-start justify-center shrink-0">
                            <EditableText
                              isEditing={isEditing}
                              value={item.unit || ""}
                              onChange={(v) => updateItem(globalIndex, "unit", v)}
                              className="text-center text-[10px]"
                              placeholder="Unit"
                              styleKey={`item_unit_${globalIndex}`}
                            />
                          </div>
                          <div style={{ width: widths.amount }} className="p-1 pr-2 pt-1.5 text-right font-bold break-words break-all shrink-0">
                            {formatNumber(Number(item.amount).toFixed(2), (company?.numberFormat as "indian" | "international") || "indian")}
                          </div>
                          {isEditing && (
                            <div className="absolute right-0 translate-x-full top-0 h-full flex items-center justify-center px-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={() => removeItem(globalIndex)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded p-1"
                                title="Remove Item"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {/* Add Item Button */}
                    {isEditing && isLastPage && (
                      <div className="relative flex mt-1 group">
                        <div className="absolute right-0 translate-x-full w-8 flex items-center justify-center">
                          <button
                            onClick={addItem}
                            className="flex items-center justify-center w-6 h-6 text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-500 rounded-full shadow-sm border border-blue-200 transition-all opacity-70 hover:opacity-100"
                            title="Add Product"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Total Row */}
              {isLastPage && (
                <div className="flex border-t border-b border-black font-bold">
                  <div style={{ width: widths.sl }} className="border-r border-black shrink-0"></div>
                  <div className="flex-1 border-r border-black p-1 pr-4 text-right flex items-center justify-end">Total</div>
                  <div style={{ width: widths.hsn }} className="border-r border-black shrink-0"></div>
                  <div style={{ width: widths.qty }} className="border-r border-black p-1 text-center flex items-center justify-center shrink-0">{formatNumber(totalQuantity, (company?.numberFormat as "indian" | "international") || "indian")}</div>
                  <div style={{ width: widths.rate }} className="border-r border-black shrink-0"></div>
                  <div style={{ width: widths.per }} className="border-r border-black shrink-0"></div>
                  <div style={{ width: widths.amount }} className="p-1 text-right flex items-center justify-end shrink-0">₹ {formatNumber(data.total.toFixed(2), (company?.numberFormat as "indian" | "international") || "indian")}</div>
                </div>
              )}

              {/* Footer Section */}
              {isLastPage && (
                <div className="flex flex-col text-[10px]">
                  <div className="flex flex-col p-1 border-b border-black border-opacity-20 mb-2">
                    <div className="flex justify-between">
                      <span className="text-[10px]">Amount Chargeable (in words)</span>
                      <span className="text-[10px] italic pr-2">E. & O.E</span>
                    </div>
                    <strong className="text-[11px] mt-1 pl-2 font-bold">{numberToWordsIndian(data.total)}</strong>
                  </div>

                  <div className="flex">
                    <div className="w-1/2 p-1 flex flex-col justify-end pb-2">
                      <div className="mb-1">
                        <span className="underline text-[10px]">Declaration</span>
                        <p className="text-[10px] leading-tight mt-1">
                          We declare that this invoice shows the actual price of the goods
                          <br />
                          described and that all particulars are true and correct.
                        </p>
                      </div>
                    </div>
                    <div className="w-1/2 flex flex-col relative group/section">
                      
                      <div className={cn("flex flex-col", !showBankDetails && "opacity-0 pointer-events-none")}>
                        <div className="text-right p-1 pr-2 pb-0">Company's Bank Details</div>
                        <div className="pl-4 pb-1 grid grid-cols-[110px_1fr] text-[10px] leading-tight">
                          <span className="flex items-center">A/c Holder's Name</span>
                          <span className="flex items-center">
                            : <EditableText lockableKey="accountName" isEditing={isEditing} value={data.bankAccountName || ""} onChange={(v) => updateInvoiceData({ bankAccountName: v })} className="ml-1" placeholder="Name" />
                          </span>
                          <span className="flex items-center">Bank Name</span>
                          <span className="flex items-center">
                            : <EditableText lockableKey="bankName" isEditing={isEditing} value={data.bankName || ""} onChange={(v) => updateInvoiceData({ bankName: v })} className="font-bold ml-1" placeholder="Bank" />
                          </span>
                          <span className="flex items-center">A/c No.</span>
                          <span className="flex items-center">
                            : <EditableText lockableKey="accountNumber" isEditing={isEditing} value={data.bankAccountNumber || ""} onChange={(v) => updateInvoiceData({ bankAccountNumber: v })} className="ml-1" placeholder="A/C No." />
                          </span>
                          <span className="flex items-center">Branch & IFS Code</span>
                          <span className="flex items-center">
                            : <EditableText lockableKey="ifscCode" isEditing={isEditing} value={data.bankIfscCode || ""} onChange={(v) => updateInvoiceData({ bankIfscCode: v })} className="ml-1" placeholder="IFSC" />
                          </span>
                        </div>
                      </div>
                      
                      {(showDigitalSignature || showSignatureImage) && (
                        <div className="border-t border-l border-black flex-1 flex p-2 relative overflow-visible group/section mt-auto" style={{ minHeight: showSignatureImage ? '96px' : 'auto' }}>
                          
                          {showDigitalSignature && (
                            <div className={cn("flex flex-col z-10", (!showSignatureImage) ? "items-center text-center mx-auto" : "items-start text-left flex-1")}>
                              <span className="text-[8px] uppercase text-black/60 font-semibold tracking-wider">
                                Digitally Signed By
                              </span>
                              <strong className="text-[14px] mt-0.5 break-words text-black/90 leading-tight">
                                <EditableText
                                  isEditing={isEditing}
                                  value={company?.digitalSignatureName || ""}
                                  onChange={(val) => updateCompanyField("digitalSignatureName", val)}
                                  placeholder="Signatory Name"
                                  className={cn("font-bold text-[14px] !w-auto whitespace-nowrap", !showSignatureImage && "text-center")}
                                />
                              </strong>
                              <span className="text-[9px] mt-0.5 text-black/80">
                                Date: {new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}
                              </span>
                              {!showSignatureImage && (
                                <span className="text-[10px] font-semibold text-black/90 whitespace-nowrap pt-4 mt-auto">
                                  Authorized Signatory
                                </span>
                              )}
                            </div>
                          )}
                          
                          {showSignatureImage && (
                            <div className={cn("flex flex-col items-center justify-end w-[160px] z-10 relative group/section", (!showDigitalSignature) ? "mx-auto" : "ml-auto")}>
                              <div className="relative w-full h-16 pointer-events-none flex items-end justify-center">
                                <Rnd
                                  disableDragging={!isEditing}
                                  enableResizing={isEditing}
                                  position={{ x: company?.signatureOffsetX || 0, y: company?.signatureOffsetY || 0 }}
                                  size={{ width: 160 * (company?.signatureScale || 1) * 1.35, height: 'auto' }}
                                  onDragStop={(e, d) => {
                                    updateCompanyFields({
                                      signatureOffsetX: d.x,
                                      signatureOffsetY: d.y,
                                    });
                                  }}
                                  onResizeStop={(e, direction, ref, delta, position) => {
                                    const newScale = ref.offsetWidth / (160 * 1.35);
                                    updateCompanyFields({
                                      signatureScale: newScale,
                                      signatureOffsetX: position.x,
                                      signatureOffsetY: position.y,
                                    });
                                  }}
                                  className={cn("absolute z-20", isEditing && "hover:ring-1 ring-blue-500/50 rounded pointer-events-auto")}
                                >
                                  <EditableImage
                                    isEditing={isEditing}
                                    value={company?.signature || ""}
                                    onChange={(v) => updateCompanyField("signature", v)}
                                    placeholder="Upload Signature"
                                    className="w-full h-full object-contain pointer-events-auto"
                                  />
                                </Rnd>
                              </div>
                              <span className="text-[10px] font-semibold text-black/90 whitespace-nowrap pt-4 mt-auto">
                                Authorized Signatory
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="text-center text-[9px] mt-2 italic">This is a Computer Generated Invoice</div>
          </div>
        );
      })}
    </div>
    </CompanyContext.Provider>
  );
}
