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
  const { invoiceData, updateInvoiceData, pdfQueue, queueSnapshot, clearQueue, createNewInvoice, removeFromQueue, reorderQueue, updateQueueItemInvoice, updateQueueItemCompany } = useInvoiceStore();
  const { undo, redo, clear: clearHistory } = useHistoryStore();
  const company = useCompanyStore((state) => state.company);
  const setCompany = useCompanyStore((state) => state.setCompany);
  const { zoom, zoomIn, zoomOut, systemFonts } = useUiStore();
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const [isEditing, setIsEditing] = useState(true);

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
  useShortcut({ key: "s", ctrl: true }, () => handleGeneratePdf(), { allowInInputs: true });
  
  // Import/Export Shortcuts
  useShortcut({ key: "e", ctrl: true }, exportProjectData, { allowInInputs: true });
  useShortcut({ key: "i", ctrl: true }, importProjectData, { allowInInputs: true });
  
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
              <DropdownMenuItem className="hover:bg-blue-600 focus:bg-blue-600 cursor-pointer flex justify-between items-center" onClick={importProjectData}>
                <span>Import JSON</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-[#3e3e42] bg-[#1e1e1e] px-1.5 font-mono text-[10px] font-medium text-[#858585]">
                  Ctrl+I
                </kbd>
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-blue-600 focus:bg-blue-600 cursor-pointer flex justify-between items-center" onClick={exportProjectData}>
                <span>Export JSON</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-[#3e3e42] bg-[#1e1e1e] px-1.5 font-mono text-[10px] font-medium text-[#858585]">
                  Ctrl+E
                </kbd>
              </DropdownMenuItem>
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

        </div>

        {/* Secondary Toolbar (VS Style) */}
        <div className="sticky top-8 z-20 flex items-center justify-end px-3 h-9 bg-[#1e1e1e] border-b border-[#333333] shadow-sm shrink-0">
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


            {/* Preview Mode Toggle */}
            <Tooltip>
              <TooltipTrigger render={
                <Button 
                  variant={isEditing ? "outline" : "default"} 
                  size="sm" 
                  onClick={() => setIsEditing(!isEditing)}
                  className="shadow-sm"
                >
                  {isEditing ? "Preview Mode" : "Edit Mode"}
                </Button>
              } />
              <TooltipContent>{isEditing ? "View Invoice without edit outlines" : "Return to Edit Mode"}</TooltipContent>
            </Tooltip>

            {/* Queue Indicator */}
            {pdfQueue.length > 0 && (
              <Popover>
                <PopoverTrigger render={
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
                          className="absolute inset-0 pointer-events-none flex items-center justify-center z-200"
                        >
                          <div className="bg-blue-500 text-white p-2 rounded-md shadow-lg">
                            <FileText className="h-6 w-6" />
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                } />
                <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
                  <PopoverHeader className="p-3 border-b border-[#3e3e42] bg-[#2d2d2d] rounded-t-md">
                    <PopoverTitle className="text-sm font-medium text-[#cccccc] flex items-center justify-between">
                      Invoice Queue
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={clearQueue} title="Clear Queue">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </PopoverTitle>
                  </PopoverHeader>
                  <div className="max-h-64 overflow-y-auto custom-scrollbar bg-[#1e1e1e] rounded-b-md">
                    <Reorder.Group axis="y" values={pdfQueue} onReorder={reorderQueue} className="flex flex-col">
                      {pdfQueue.map((item, index) => (
                        <Reorder.Item 
                          key={item.queueId} 
                          value={item} 
                          className="flex items-center gap-2 p-2 border-b border-[#333333] hover:bg-[#2a2a2a] group"
                        >
                          <div className="cursor-grab text-[#666666] hover:text-[#cccccc] active:cursor-grabbing">
                            <GripVertical className="h-4 w-4" />
                          </div>
                          <div className="flex-1 flex flex-col min-w-0">
                            <span className="text-sm text-[#cccccc] truncate">
                              {item.invoice.invoiceNumber ? `Invoice #${item.invoice.invoiceNumber}` : 'Draft Invoice'}
                            </span>
                            <span className="text-xs text-[#858585] truncate">
                              {item.invoice.customerId || 'No Customer'}
                            </span>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 hover:bg-red-400/10 transition-opacity" 
                            onClick={() => removeFromQueue(index)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                  </div>
                </PopoverContent>
              </Popover>
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
      </div>
    </TooltipProvider>
  );
}
