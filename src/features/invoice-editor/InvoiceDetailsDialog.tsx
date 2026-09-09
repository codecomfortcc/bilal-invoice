import { useState } from "react";
import { useInvoiceStore, useCompanyStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useShortcut } from "@/hooks/use-shortcuts";

export function InvoiceDetailsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { invoiceData, updateInvoiceData } = useInvoiceStore();
  const company = useCompanyStore((state) => state.company);

  useShortcut({ key: "y", ctrl: true }, () => setIsOpen(!isOpen));

  let lockedFields: Record<string, any> = {};
  if (company?.lockedFields) {
    try {
      lockedFields = JSON.parse(company.lockedFields);
    } catch (e) {}
  }

  const isLocked = (key: string) => !!lockedFields[key];

  const handleUpdate = (field: keyof typeof invoiceData, value: string) => {
    updateInvoiceData({ [field]: value });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invoice Details (Ctrl + Y)</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Invoice Info</h4>
            <div className="space-y-2">
              <label className="text-xs font-medium">Invoice Number</label>
              <Input 
                value={invoiceData.invoiceNumber || ""} 
                onChange={e => handleUpdate("invoiceNumber", e.target.value)}
                disabled={isLocked("invoiceNumber")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Date</label>
              <Input 
                type="date"
                value={invoiceData.date || ""} 
                onChange={e => handleUpdate("date", e.target.value)}
                disabled={isLocked("date")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Reference No</label>
              <Input 
                value={invoiceData.referenceNo || ""} 
                onChange={e => handleUpdate("referenceNo", e.target.value)}
                disabled={isLocked("referenceNo")}
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Buyer Details</h4>
            <div className="space-y-2">
              <label className="text-xs font-medium">Buyer Name</label>
              <Input 
                value={invoiceData.buyerName || ""} 
                onChange={e => handleUpdate("buyerName", e.target.value)}
                disabled={isLocked("buyerName")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Buyer GST</label>
              <Input 
                value={invoiceData.buyerGst || ""} 
                onChange={e => handleUpdate("buyerGst", e.target.value)}
                disabled={isLocked("buyerGst")}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium">Buyer City</label>
              <Input 
                value={invoiceData.buyerCity || ""} 
                onChange={e => handleUpdate("buyerCity", e.target.value)}
                disabled={isLocked("buyerCity")}
              />
            </div>
          </div>

          <div className="col-span-2 space-y-4 mt-4">
            <h4 className="font-semibold text-sm">Shipping Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-medium">Consignee Name</label>
                <Input 
                  value={invoiceData.consigneeName || ""} 
                  onChange={e => handleUpdate("consigneeName", e.target.value)}
                  disabled={isLocked("consigneeName")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Destination</label>
                <Input 
                  value={invoiceData.destination || ""} 
                  onChange={e => handleUpdate("destination", e.target.value)}
                  disabled={isLocked("destination")}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-medium">Dispatched Through</label>
                <Input 
                  value={invoiceData.dispatchedThrough || ""} 
                  onChange={e => handleUpdate("dispatchedThrough", e.target.value)}
                  disabled={isLocked("dispatchedThrough")}
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
