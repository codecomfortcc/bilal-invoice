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
import { ZoomIn, ZoomOut, FileText, Layers } from "lucide-react";
import { executeExportWorkflow } from "@/lib/exportWorkflow";
import { saveInvoice } from "@/services/invoice.service";
import { EditableText } from "./EditableText";
import { saveCompanySettings } from "@/services/settings.service";
import { InvoicePreview } from "./InvoicePreview";
import { InvoiceNavigation } from "./InvoiceNavigation";
import { GlobalStyleQuickEditor } from "./GlobalStyleQuickEditor";
import { InvoiceDetailsDialog } from "./InvoiceDetailsDialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { InvoiceData } from "@/types";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { parseFontVariant } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { invoke } from "@tauri-apps/api/core";

export function InvoiceEditor() {
  const { invoiceData, updateInvoiceData, pdfQueue, queueSnapshot, clearQueue, createNewInvoice } = useInvoiceStore();
  const { undo, redo, clear: clearHistory } = useHistoryStore();
  const company = useCompanyStore((state) => state.company);
  const setCompany = useCompanyStore((state) => state.setCompany);
  const { zoom, zoomIn, zoomOut, systemFonts } = useUiStore();
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [isEditing, setIsEditing] = useState(true);

  // Auto-populate from company settings if empty
  useEffect(() => {
    if (!company) return;
    
    const updates: Partial<InvoiceData> = {};
    let shouldUpdate = false;
    
    // Auto-populate consignee if entirely empty
    if (!invoiceData.consigneeName && !invoiceData.consigneeGst) {
      if (company.consigneeName || company.consigneeGst || company.consigneeAddressLine1) {
        updates.consigneeName = company.consigneeName || "";
        updates.consigneeAddressLine1 = company.consigneeAddressLine1 || "";
        updates.consigneeAddressLine2 = company.consigneeAddressLine2 || "";
        updates.consigneeCity = company.consigneeCity || "";
        updates.consigneePincode = company.consigneePincode || "";
        updates.consigneeAddress = company.consigneeAddress || "";
        updates.consigneeGst = company.consigneeGst || "";
        updates.consigneeState = company.consigneeState || "";
        updates.consigneeStateCode = company.consigneeStateCode || "";
        shouldUpdate = true;
      }
    }
    
    // Auto-populate buyer if entirely empty
    if (!invoiceData.buyerName && !invoiceData.buyerGst) {
      const hasCompanyBuyer = Boolean(
        company.buyerName || company.buyerGst || company.buyerAddressLine1 || 
        company.buyerAddressLine2 || company.buyerCity || company.buyerPincode || 
        company.buyerState || company.buyerStateCode
      );
      
      if (hasCompanyBuyer) {
        updates.buyerName = company.buyerName || "";
        updates.buyerAddressLine1 = company.buyerAddressLine1 || "";
        updates.buyerAddressLine2 = company.buyerAddressLine2 || "";
        updates.buyerCity = company.buyerCity || "";
        updates.buyerPincode = company.buyerPincode || "";
        updates.buyerAddress = company.buyerAddress || "";
        updates.buyerGst = company.buyerGst || "";
        updates.buyerState = company.buyerState || "";
        updates.buyerStateCode = company.buyerStateCode || "";
        shouldUpdate = true;
      } 
      // Fallback: copy from consignee if no permanent buyer data exists
      else if (company.consigneeName || invoiceData.consigneeName) {
        const source = company.consigneeName ? company : invoiceData;
        updates.buyerName = source.consigneeName || "";
        updates.buyerAddressLine1 = source.consigneeAddressLine1 || "";
        updates.buyerAddressLine2 = source.consigneeAddressLine2 || "";
        updates.buyerCity = source.consigneeCity || "";
        updates.buyerPincode = source.consigneePincode || "";
        updates.buyerAddress = source.consigneeAddress || "";
        updates.buyerGst = source.consigneeGst || "";
        updates.buyerState = source.consigneeState || "";
        updates.buyerStateCode = source.consigneeStateCode || "";
        shouldUpdate = true;
      }
    }
    
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

  const handleGeneratePdf = useCallback(async () => {
    // Disable editing temporarily to ensure no edit controls are captured
    const wasEditing = isEditing;
    if (wasEditing) setIsEditing(false);
    
    // Give react time to render view mode before capture
    setTimeout(async () => {
      const result = await executeExportWorkflow(invoiceData);
      if (result.success) {
        toast.success(`PDF exported: ${result.filename}`);
        if (pdfQueue.length > 0) {
          clearQueue();
        }
        const updatedData = {
          ...invoiceData,
          exportFileName: result.filename,
          exportFolder: result.folder,
          exportDate: result.date,
        };
        updateInvoiceData(updatedData);
      } else if (result.error !== "Export cancelled") {
        toast.error(result.error || "Failed to generate PDF");
      }
      
      if (wasEditing) setIsEditing(true);
    }, 100);
  }, [invoiceData, updateInvoiceData, isEditing]);

  const handleManualUpdateCheck = async () => {
    toast.info("Checking for updates...");
    try {
      const update = await invoke("check_for_updates");
      if (update) {
        toast.success(`Update v${(update as any).version} available! Open Settings to install.`);
      } else {
        toast.success("Application is up to date.");
      }
    } catch (e: any) {
      if (typeof e === "string" && e.includes("Could not fetch a valid release JSON")) {
        toast.success("Application is up to date.");
      } else {
        toast.error("Failed to check for updates");
      }
    }
  };

  // Global Keyboard Shortcuts
  useShortcut({ key: "z", alt: true }, undo, { allowInInputs: false });
  useShortcut({ key: "y", ctrl: true }, redo, { allowInInputs: false });
  useShortcut({ key: "z", ctrl: true, shift: true }, redo, { allowInInputs: false });
  useShortcut({ key: "+", ctrl: true }, zoomIn, { allowInInputs: true });
  useShortcut({ key: "-", ctrl: true }, zoomOut, { allowInInputs: true });
  useShortcut({ key: "Enter", ctrl: true }, handleGeneratePdf, { allowInInputs: true });
  useShortcut("ctrl+s", () => handleGeneratePdf(), { allowInInputs: true });
  
  const [showQueueAnim, setShowQueueAnim] = useState(false);
  useShortcut({ key: "q", ctrl: true }, () => {
    queueSnapshot();
    setShowQueueAnim(true);
    toast.success("Snapshot added to queue");
    setTimeout(() => setShowQueueAnim(false), 800);
  }, { allowInInputs: true });

  const globalVariant = parseFontVariant(company?.masterFontVariant);

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-muted/20">
        {/* Top Menubar (VS Style) */}
        <div className="sticky top-0 z-30 flex items-center px-2 h-8 bg-[#18181b] dark:bg-[#1e1e1e] text-[#cccccc] border-b border-[#333333] shrink-0 font-sans text-[13px] select-none">
          <FileText className="h-4 w-4 mr-3 ml-1 text-blue-400" />
          
          <DropdownMenu>
            <DropdownMenuTrigger className="px-2.5 py-1 rounded hover:bg-white/10 outline-none cursor-default focus:bg-white/10 data-[state=open]:bg-white/10">
              File
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-[#252526] text-[#cccccc] border-[#3e3e42] shadow-xl">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="hover:bg-blue-600 focus:bg-blue-600">New</DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-48 bg-[#252526] text-[#cccccc] border-[#3e3e42]">
                  <DropdownMenuItem className="hover:bg-blue-600 focus:bg-blue-600" onClick={() => {
                    createNewInvoice();
                    clearHistory();
                    toast.success("Created new invoice");
                  }}>
                    New Invoice
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-blue-600 focus:bg-blue-600" onClick={() => {
                    queueSnapshot();
                    createNewInvoice();
                    clearHistory();
                    toast.success("Added to queue & created new");
                  }}>
                    Add New Invoice
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuSeparator className="bg-[#3e3e42]" />
              <DropdownMenuItem disabled>Import</DropdownMenuItem>
              <DropdownMenuItem disabled>Export</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#3e3e42]" />
              <DropdownMenuItem disabled>Preferences</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="px-2.5 py-1 rounded hover:bg-white/10 outline-none cursor-default focus:bg-white/10 data-[state=open]:bg-white/10">
              Edit
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-[#252526] text-[#cccccc] border-[#3e3e42] shadow-xl">
              <DropdownMenuItem className="hover:bg-blue-600 focus:bg-blue-600" onClick={undo}>Undo</DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-blue-600 focus:bg-blue-600" onClick={redo}>Redo</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="px-2.5 py-1 rounded hover:bg-white/10 outline-none cursor-default focus:bg-white/10 data-[state=open]:bg-white/10">
              Select
            </DropdownMenuTrigger>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="px-2.5 py-1 rounded hover:bg-white/10 outline-none cursor-default focus:bg-white/10 data-[state=open]:bg-white/10">
              Tools
            </DropdownMenuTrigger>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger className="px-2.5 py-1 rounded hover:bg-white/10 outline-none cursor-default focus:bg-white/10 data-[state=open]:bg-white/10">
              Help
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-[#252526] text-[#cccccc] border-[#3e3e42] shadow-xl">
              <DropdownMenuItem className="hover:bg-blue-600 focus:bg-blue-600 cursor-pointer">
                Documentation
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-blue-600 focus:bg-blue-600 cursor-pointer">
                Keyboard Shortcuts
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#3e3e42]" />
              <DropdownMenuItem className="hover:bg-blue-600 focus:bg-blue-600 cursor-pointer" onClick={handleManualUpdateCheck}>
                Check for Updates...
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-[#3e3e42]" />
              <DropdownMenuItem className="hover:bg-blue-600 focus:bg-blue-600 cursor-pointer">
                About Bilal Invoice
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1"></div>

          <div className="flex items-center gap-2">
            <div className="text-[11px] text-[#858585] bg-[#333333] px-2 py-0.5 rounded">
              Search Ctrl+Q
            </div>
            <div className="text-[11px] text-[#858585] bg-[#333333] px-2 py-0.5 rounded">
              Invoice Editor
            </div>
          </div>
        </div>

        {/* Secondary Toolbar (VS Style) */}
        <div className="sticky top-8 z-20 flex items-center justify-between px-3 h-9 bg-[#1e1e1e] border-b border-[#333333] shadow-sm shrink-0">
          <div className="flex items-center gap-1">
            <div className="opacity-80 hover:opacity-100 transition-opacity">
               <InvoiceNavigation /> 
            </div>
            
            <div className="w-px h-5 bg-[#333333] mx-1"></div>
            
            <Tooltip>
              <TooltipTrigger render={
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded text-[#cccccc] hover:bg-white/10 hover:text-white" onClick={undo}>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.14645 2.14645C7.34171 1.95118 7.65829 1.95118 7.85355 2.14645C8.04882 2.34171 8.04882 2.65829 7.85355 2.85355L4.70711 6H13.5C13.7761 6 14 6.22386 14 6.5C14 8.433 12.433 10 10.5 10H5.5C5.22386 10 5 9.77614 5 9.5C5 9.22386 5.22386 9 5.5 9H10.5C11.8807 9 13 7.88071 13 6.5C13 6.42583 12.9968 6.35246 12.9905 6.28003H4.70711L7.85355 9.42647C8.04882 9.62174 8.04882 9.93832 7.85355 10.1336C7.65829 10.3288 7.34171 10.3288 7.14645 10.1336L3.14645 6.13358C2.95118 5.93832 2.95118 5.62174 3.14645 5.42647L7.14645 1.42647Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                </Button>
              } />
              <TooltipContent>Undo</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger render={
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded text-[#cccccc] hover:bg-white/10 hover:text-white" onClick={redo}>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7.85355 2.14645C7.65829 1.95118 7.34171 1.95118 7.14645 2.14645C6.95118 2.34171 6.95118 2.65829 7.14645 2.85355L10.2929 6H1.5C1.22386 6 1 6.22386 1 6.5C1 8.433 2.567 10 4.5 10H9.5C9.77614 10 10 9.77614 10 9.5C10 9.22386 9.77614 9 9.5 9H4.5C3.11929 9 2 7.88071 2 6.5C2 6.42583 2.0032 6.35246 2.00947 6.28003H10.2929L7.14645 9.42647C6.95118 9.62174 6.95118 9.93832 7.14645 10.1336C7.34171 10.3288 7.65829 10.3288 7.85355 10.1336L11.8536 6.13358C12.0488 5.93832 12.0488 5.62174 11.8536 5.42647L7.85355 1.42647Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                </Button>
              } />
              <TooltipContent>Redo</TooltipContent>
            </Tooltip>
            
            <div className="w-px h-5 bg-[#333333] mx-1"></div>
            
            <Tooltip>
              <TooltipTrigger render={
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded text-[#cccccc] hover:bg-white/10 hover:text-white" onClick={handleGeneratePdf}>
                  <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 1C1.67157 1 1 1.67157 1 2.5V12.5C1 13.3284 1.67157 14 2.5 14H12.5C13.3284 14 14 13.3284 14 12.5V5.20711C14 4.80928 13.842 4.42772 13.5607 4.14645L10.8536 1.43934C10.5723 1.15804 10.1907 1 9.79289 1H2.5ZM2 2.5C2 2.22386 2.22386 2 2.5 2H9.79289C9.9255 2 10.0527 2.05268 10.1464 2.14645L12.8536 4.85355C12.9473 4.94732 13 5.0745 13 5.20711V12.5C13 12.7761 12.7761 13 12.5 13H2.5C2.22386 13 2 12.7761 2 12.5V2.5ZM6 3V6.5C6 6.77614 6.22386 7 6.5 7H11.5C11.7761 7 12 6.77614 12 6.5V3H6ZM6.5 2V6H11V2H6.5ZM4 9.5C4 9.22386 4.22386 9 4.5 9H10.5C10.7761 9 11 9.22386 11 9.5V12H4V9.5ZM5 10V12H10V10H5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path></svg>
                </Button>
              } />
              <TooltipContent>Save PDF (Ctrl+Enter)</TooltipContent>
            </Tooltip>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Zoom Controls inside a dark container */}
            <div className="flex items-center gap-1 bg-[#2d2d2d] border border-[#3e3e42] p-0.5 rounded text-[#cccccc]">
              <Tooltip>
                <TooltipTrigger render={
                  <div
                    className="flex items-center justify-center h-6 w-6 rounded hover:bg-white/10 transition-all text-[#cccccc]"
                    onClick={zoomOut}
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </div>
                } />
                <TooltipContent>Zoom Out (Ctrl+-)</TooltipContent>
              </Tooltip>
              <div className="w-10 text-center text-[11px] font-semibold tabular-nums cursor-default select-none">
                {zoom}%
              </div>
              <Tooltip>
                <TooltipTrigger render={
                  <div
                    className="flex items-center justify-center h-6 w-6 rounded hover:bg-white/10 transition-all text-[#cccccc]"
                    onClick={zoomIn}
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </div>
                } />
                <TooltipContent>Zoom In (Ctrl++)</TooltipContent>
              </Tooltip>
            </div>


            {/* Queue Indicator */}
            {pdfQueue.length > 0 && (
              <div className="relative">
                <Button variant="outline" size="sm" className="shadow-sm border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-700">
                  <Layers className="h-4 w-4 mr-2" />
                  Queue ({pdfQueue.length})
                </Button>
                <AnimatePresence>
                  {showQueueAnim && (
                    <motion.div
                      initial={{ opacity: 0, scale: 2, x: "-50vw", y: "30vh" }}
                      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      className="absolute inset-0 pointer-events-none flex items-center justify-center z-[200]"
                    >
                      <div className="bg-blue-500 text-white p-2 rounded-md shadow-lg">
                        <FileText className="h-6 w-6" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Generate PDF Button */}
            <Tooltip>
              <TooltipTrigger render={
                <Button onClick={handleGeneratePdf} size="sm" className="shadow-sm">
                  <FileText className="h-4 w-4 mr-2" />
                  Generate PDF
                </Button>
              } />
              <TooltipContent>Generate PDF (Ctrl+Enter)</TooltipContent>
            </Tooltip>
          </div>
        </div>

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
                          <InvoicePreview data={snapshot.invoice} isEditing={false} overrideCompany={snapshot.company} />
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
      </div>
    </TooltipProvider>
  );
}
