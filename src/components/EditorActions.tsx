import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
  PopoverHeader,
  PopoverTitle
} from "@/components/ui/popover";
import { ZoomIn, ZoomOut, FileText, Layers, Trash2, GripVertical, Eye, Pencil } from "lucide-react";
import { Reorder, motion, AnimatePresence } from "framer-motion";
import { useInvoiceStore, useUiStore, useHistoryStore } from "@/stores";
import { executeExportWorkflow } from "@/lib/exportWorkflow";
import { toast } from "sonner";
import { useShortcut } from "@/hooks/use-shortcuts";

export function EditorActions() {
  const { invoiceData, updateInvoiceData, pdfQueue, queueSnapshot, clearQueue, removeFromQueue, reorderQueue } = useInvoiceStore();
  const { zoom, zoomIn, zoomOut, isEditing, setIsEditing } = useUiStore();
  
  const [showQueueAnim, setShowQueueAnim] = useState(false);

  const handleGeneratePdf = useCallback(async () => {
    const wasEditing = isEditing;
    if (wasEditing) setIsEditing(false);
    
    setTimeout(async () => {
      const result = await executeExportWorkflow(invoiceData);
      if (result.success) {
        toast.success(`PDF exported: ${result.filename}`);
        if (pdfQueue.length > 0) {
          clearQueue();
        }
        updateInvoiceData({
          ...invoiceData,
          exportFileName: result.filename,
          exportFolder: result.folder,
          exportDate: result.date,
        });
      } else if (result.error !== "Export cancelled") {
        toast.error(result.error || "Failed to generate PDF");
      }
      
      if (wasEditing) setIsEditing(true);
    }, 100);
  }, [invoiceData, updateInvoiceData, isEditing, setIsEditing, pdfQueue.length, clearQueue]);

  // Global Shortcuts for Editor actions
  useShortcut(
    { key: "+", ctrl: true }, 
    zoomIn, 
    { 
      id: "shortcut-zoom-in",
      title: "Zoom In Invoice",
      description: "Increase the visual size of the invoice editor",
      category: "Navigation",
      allowInInputs: true 
    }
  );
  useShortcut(
    { key: "-", ctrl: true }, 
    zoomOut, 
    { 
      id: "shortcut-zoom-out",
      title: "Zoom Out Invoice",
      description: "Decrease the visual size of the invoice editor",
      category: "Navigation",
      allowInInputs: true 
    }
  );
  useShortcut(
    { key: "Enter", ctrl: true }, 
    handleGeneratePdf, 
    { 
      id: "shortcut-generate-pdf-enter",
      title: "Generate PDF",
      description: "Generate and save the invoice as a PDF document",
      category: "Invoice Actions",
      allowInInputs: true 
    }
  );
  useShortcut(
    { key: "s", ctrl: true }, 
    () => handleGeneratePdf(), 
    { 
      id: "shortcut-save-pdf",
      title: "Save PDF",
      description: "Alternative shortcut to generate and save the invoice as a PDF",
      category: "Invoice Actions",
      allowInInputs: true 
    }
  );
  useShortcut(
    { key: "q", ctrl: true }, 
    () => {
      queueSnapshot();
      setShowQueueAnim(true);
      toast.success("Snapshot added to queue");
      setTimeout(() => setShowQueueAnim(false), 800);
    }, 
    { 
      id: "shortcut-queue-snapshot",
      title: "Queue Snapshot",
      description: "Add a snapshot of the current invoice to the export queue",
      category: "Invoice Actions",
      allowInInputs: true 
    }
  );

  return (
    <div className="flex items-center gap-2">
      {/* Preview Mode Toggle */}
      <Tooltip>
        <TooltipTrigger render={
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsEditing(!isEditing)}
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
          >
            {isEditing ? <Eye className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
          </Button>
        } />
        <TooltipContent side="bottom">Preview Mode</TooltipContent>
      </Tooltip>

      {/* Queue Indicator */}
      {pdfQueue.length > 0 && (
        <Popover>
          <PopoverTrigger render={
            <div className="relative flex items-center justify-center">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10">
                <Layers className="h-4 w-4" />
              </Button>
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[9px] font-bold text-white shadow-sm">
                {pdfQueue.length}
              </span>
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
          } />
          <PopoverContent className="w-80 p-0" align="end" sideOffset={8}>
            <PopoverHeader className="p-3 border-b border-border bg-muted/50 rounded-t-md">
              <PopoverTitle className="text-sm font-medium flex items-center justify-between">
                Invoice Queue
                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:bg-destructive/10" onClick={clearQueue} title="Clear Queue">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </PopoverTitle>
            </PopoverHeader>
            <div className="max-h-64 overflow-y-auto custom-scrollbar bg-background rounded-b-md">
              <Reorder.Group axis="y" values={pdfQueue} onReorder={reorderQueue} className="flex flex-col">
                {pdfQueue.map((item, index) => (
                  <Reorder.Item 
                    key={item.queueId} 
                    value={item} 
                    className="flex items-center gap-2 p-2 border-b border-border hover:bg-muted/50 group"
                  >
                    <div className="cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing">
                      <GripVertical className="h-4 w-4" />
                    </div>
                    <div className="flex-1 flex flex-col min-w-0">
                      <span className="text-sm truncate">
                        {item.invoice.invoiceNumber ? `Invoice #${item.invoice.invoiceNumber}` : 'Draft Invoice'}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {item.invoice.customerId || 'No Customer'}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10 transition-opacity" 
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
          <Button 
            size="icon" 
            onClick={handleGeneratePdf} 
            className="h-6 w-6 bg-[#60cdff] hover:bg-[#4dbbee] active:bg-[#39a3d7] text-slate-950 shadow-sm rounded-md transition-all active:scale-95 p-0"
          >
            <FileText className="h-3.5 w-3.5 stroke-[1.5]" />
          </Button>
        } />
        <TooltipContent side="bottom">Generate PDF (Ctrl+Enter)</TooltipContent>
      </Tooltip>
    </div>
  );
}
