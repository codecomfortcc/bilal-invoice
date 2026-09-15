import { useCallback, useEffect, useRef, useState } from "react";
import { useShortcut } from "@/hooks/use-shortcuts";
import { useInvoiceStore, useUiStore, useCompanyStore, useHistoryStore } from "@/stores";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverHeader,
  PopoverTitle
} from "@/components/ui/popover";
import { Reorder } from "framer-motion";
import { ZoomIn, ZoomOut, FileText, Layers, Trash2, GripVertical } from "lucide-react";
import { executeExportWorkflow } from "@/lib/exportWorkflow";
import { saveInvoice } from "@/services/invoice.service";
import { EditableText } from "./EditableText";
import { saveCompanySettings } from "@/services/settings.service";
import { exportProjectData, importProjectData } from "@/services/importExport.service";
import { InvoicePreview } from "./InvoicePreview";
import { InvoiceNavigation } from "./InvoiceNavigation";
import { GlobalStyleQuickEditor } from "./GlobalStyleQuickEditor";
import { InvoiceDetailsDialog } from "./InvoiceDetailsDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { InvoiceData } from "@/types";
import { parseFontVariant } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";

export function InvoiceEditor() {
  const { invoiceData, updateInvoiceData, pdfQueue, updateQueueItemInvoice, updateQueueItemCompany } = useInvoiceStore();
  const company = useCompanyStore((state) => state.company);
  const { zoom, zoomIn, zoomOut, isEditing } = useUiStore();
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Zoom indicator state
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstMount = useRef(true);

  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    setShowZoomIndicator(true);
    if (zoomTimer.current) clearTimeout(zoomTimer.current);
    zoomTimer.current = setTimeout(() => setShowZoomIndicator(false), 1500);
    return () => {
      if (zoomTimer.current) clearTimeout(zoomTimer.current);
    }
  }, [zoom]);

  // Auto-populate invoiceNumber from company settings if empty
  useEffect(() => {
    if (!company) return;
    
    const updates: Partial<InvoiceData> = {};
    let shouldUpdate = false;
    
    if (!invoiceData.invoiceNumber) {
      if (company.invoiceNumber) {
        updates.invoiceNumber = company.invoiceNumber;
        shouldUpdate = true;
      } else {
        updates.invoiceNumber = "INV-001";
        shouldUpdate = true;
      }
    }

    if (shouldUpdate) {
      updateInvoiceData(updates);
    }
  }, [company, invoiceData.id, updateInvoiceData]);

  // Auto-save draft
  useEffect(() => {
    if (!invoiceData.id) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      try {
        await saveInvoice(invoiceData);
      } catch (e) {
        console.error("Auto-save failed:", e);
      }
    }, 2000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [invoiceData]);

  const globalVariant = parseFontVariant(company?.masterFontVariant);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-muted/20 relative">
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
          {/* The Document */}
          <div className="flex justify-center min-h-full items-start pb-12">
            <div 
              className="transition-all bg-transparent duration-300 origin-top"
              style={{ 
                transform: `scale(${zoom / 100})`,
                fontFamily: company?.masterFont || '"Segoe UI", sans-serif',
                fontWeight: globalVariant.weight,
                fontStyle: globalVariant.style,
                color: company?.masterColor || '#000000'
              }}
            >
              <div id="pdf-preview-container">
                {/* When generating PDF, we only render the queue if it exists, otherwise just the current invoice. But wait, we can't conditionally render and immediately capture because React needs to render.
                   Actually, let's render the queue invisibly alongside the current preview. */}
                {pdfQueue.length === 0 ? (
                  <InvoicePreview data={invoiceData} isEditing={isEditing} />
                ) : (
                  <div className="flex flex-col gap-8">
                    {pdfQueue.map((snapshot, index) => {
                      const snapVariant = parseFontVariant(snapshot.company?.masterFontVariant);
                      return (
                        <div 
                          key={index} 
                          className="invoice-print-area"
                          style={{
                            fontFamily: snapshot.company?.masterFont || '"Segoe UI", sans-serif',
                            fontWeight: snapVariant.weight,
                            fontStyle: snapVariant.style,
                            color: snapshot.company?.masterColor || '#000000'
                          }}
                        >
                          <InvoicePreview 
                            data={snapshot.invoice} 
                            isEditing={isEditing} 
                            overrideCompany={snapshot.company}
                            onUpdateInvoice={(updates) => updateQueueItemInvoice(snapshot.queueId, updates)}
                            onUpdateCompany={(updates) => updateQueueItemCompany(snapshot.queueId, updates)}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <GlobalStyleQuickEditor />
        <InvoiceDetailsDialog />

        <AnimatePresence>
          {showZoomIndicator && (
            <motion.div
              initial={{ opacity: 0, y: 10, x: "-50%" }}
              animate={{ opacity: 1, y: 0, x: "-50%" }}
              exit={{ opacity: 0, y: 10, x: "-50%" }}
              className="absolute bottom-6 left-1/2 bg-black/60 dark:bg-black/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-full text-xs font-medium z-50 pointer-events-none shadow-lg"
            >
              Zoom: {zoom}%
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}
