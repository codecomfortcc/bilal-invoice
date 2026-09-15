import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  Package,
  Building2,
  UserCheck,
  PenTool,
  Palette,
  Landmark,
  Check,
  CheckCheck,
  RotateCcw,
  X,
} from "lucide-react";
import { useUiStore } from "@/stores";
import { exportFilteredProjectData, ExportFieldOptions } from "@/services/importExport.service";
import { cn } from "@/lib/utils";

interface FieldItemConfig {
  key: keyof ExportFieldOptions;
  label: string;
  description: string;
  icon: React.ElementType;
}

const EXPORT_FIELDS_CONFIG: FieldItemConfig[] = [
  {
    key: "invoiceDetails",
    label: "Invoice Metadata & Number",
    description: "Invoice #, issue date, due date, status, notes, and terms",
    icon: FileText,
  },
  {
    key: "lineItems",
    label: "Line Items & Charges",
    description: "Products/services list, quantities, rates, tax, discounts, and total",
    icon: Package,
  },
  {
    key: "senderCompany",
    label: "Sender & Company Details",
    description: "Business name, contact email, phone, address, and logo image",
    icon: Building2,
  },
  {
    key: "clientDetails",
    label: "Client / Bill-To Details",
    description: "Client business name, email, phone, and billing address",
    icon: UserCheck,
  },
  {
    key: "signatures",
    label: "Signatures & Stamps",
    description: "Authorized signature image, designation, and company stamp",
    icon: PenTool,
  },
  {
    key: "customStyling",
    label: "Custom Styling & Typography",
    description: "Master font selection, font variants, accent colors, and layout setup",
    icon: Palette,
  },
  {
    key: "paymentBankDetails",
    label: "Bank & Payment Credentials",
    description: "Bank name, account number, IBAN, SWIFT code, and payment instructions",
    icon: Landmark,
  },
];

/**
 * Responsive Rounded Tick Toggle component with safe margins & dynamic sizing
 */
function RoundedTickToggle({
  checked,
  onChange,
  label,
  description,
  icon: Icon,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
  icon: React.ElementType;
}) {
  return (
    <div
      onClick={() => onChange(!checked)}
      className={cn(
        "flex items-center justify-between p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer select-none gap-3",
        checked
          ? "bg-primary/5 border-primary/40 shadow-xs"
          : "bg-card border-border/60 opacity-60 hover:opacity-90"
      )}
    >
      <div className="flex items-center gap-3 min-w-0 pr-1">
        <div
          className={cn(
            "p-2 sm:p-2.5 rounded-xl transition-colors shrink-0",
            checked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
          )}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-foreground truncate">{label}</p>
          <p className="text-[11px] sm:text-xs text-muted-foreground leading-tight truncate">{description}</p>
        </div>
      </div>

      {/* Custom Rounded Tick Toggle Switch Design */}
      <div
        className={cn(
          "relative inline-flex h-5 sm:h-6 w-9 sm:w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
          checked ? "bg-primary" : "bg-muted-foreground/30"
        )}
      >
        <span
          className={cn(
            "pointer-events-none flex items-center justify-center h-4 sm:h-5 w-4 sm:w-5 transform rounded-full bg-background shadow-md ring-0 transition duration-200 ease-in-out",
            checked ? "translate-x-4 sm:translate-x-5 text-primary" : "translate-x-0 text-muted-foreground/40"
          )}
        >
          {checked && <Check className="w-2.5 sm:w-3 h-2.5 sm:h-3 stroke-[3]" />}
        </span>
      </div>
    </div>
  );
}

export function ExportModal() {
  const { showExportModal, setShowExportModal } = useUiStore();

  const [options, setOptions] = useState<ExportFieldOptions>({
    invoiceDetails: true,
    lineItems: true,
    senderCompany: true,
    clientDetails: true,
    signatures: true,
    customStyling: true,
    paymentBankDetails: true,
  });

  const handleToggle = (key: keyof ExportFieldOptions, value: boolean) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleSelectAll = () => {
    setOptions({
      invoiceDetails: true,
      lineItems: true,
      senderCompany: true,
      clientDetails: true,
      signatures: true,
      customStyling: true,
      paymentBankDetails: true,
    });
  };

  const handleDeselectAll = () => {
    setOptions({
      invoiceDetails: false,
      lineItems: false,
      senderCompany: false,
      clientDetails: false,
      signatures: false,
      customStyling: false,
      paymentBankDetails: false,
    });
  };

  const handleExport = async () => {
    const success = await exportFilteredProjectData(options);
    if (success) {
      setShowExportModal(false);
    }
  };

  return (
    <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
      <DialogContent
        showCloseButton={false}
        className="w-[92vw] max-w-xl max-h-[85vh] flex flex-col bg-card border-border shadow-2xl p-0 overflow-hidden rounded-2xl"
      >
        {/* Header with Safe Area & Non-Overlapping Controls */}
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-border/60 bg-muted/30 shrink-0 relative pr-12">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                  Export Invoice JSON
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Select which fields and sections to include in your exported JSON file
                </DialogDescription>
              </div>
            </div>

            {/* Dedicated Top-Right Close Button */}
            <DialogClose className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
              <X className="w-4 h-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>

          {/* Action Row */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/40 text-xs">
            <span className="text-muted-foreground font-medium text-[11px] sm:text-xs">
              {Object.values(options).filter(Boolean).length} of {EXPORT_FIELDS_CONFIG.length} selected
            </span>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-primary font-semibold hover:underline flex items-center gap-1 cursor-pointer"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Select All
              </button>
              <span className="text-muted-foreground/30">•</span>
              <button
                type="button"
                onClick={handleDeselectAll}
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Deselect All
              </button>
            </div>
          </div>
        </DialogHeader>

        {/* Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-2.5">
          {EXPORT_FIELDS_CONFIG.map((field) => (
            <RoundedTickToggle
              key={field.key}
              checked={options[field.key]}
              onChange={(val) => handleToggle(field.key, val)}
              label={field.label}
              description={field.description}
              icon={field.icon}
            />
          ))}
        </div>

        {/* Dynamic Footer with Safe Area */}
        <div className="p-4 sm:px-6 border-t border-border/60 bg-muted/30 shrink-0 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-xs text-muted-foreground hidden sm:block">
            {Object.values(options).filter(Boolean).length} of {EXPORT_FIELDS_CONFIG.length} sections selected
          </div>
          <div className="flex items-center justify-end gap-2.5 w-full sm:w-auto">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowExportModal(false)}
              className="rounded-xl flex-1 sm:flex-none text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleExport}
              className="rounded-xl gap-2 shadow-sm font-semibold flex-1 sm:flex-none text-xs"
            >
              <Download className="w-3.5 h-3.5" />
              Export Selected JSON
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
