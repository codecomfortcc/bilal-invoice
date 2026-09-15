import React, { useState, useEffect, useRef } from "react";
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
  UploadCloud,
  FileSpreadsheet,
  History,
  Trash2,
  RefreshCw,
  FileCode,
  Clock,
  User,
  X,
} from "lucide-react";
import { useUiStore } from "@/stores";
import {
  getImportHistory,
  applyImportedData,
  deleteImportHistoryRecord,
  clearImportHistory,
  ImportHistoryRecord,
} from "@/services/importExport.service";
import { open as openTauriDialog } from "@tauri-apps/plugin-dialog";
import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export function ImportModal() {
  const { showImportModal, setShowImportModal } = useUiStore();
  const [history, setHistory] = useState<ImportHistoryRecord[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load backend import history when modal opens
  useEffect(() => {
    if (showImportModal) {
      getImportHistory()
        .then(setHistory)
        .catch((e) => console.error("Failed to load import history:", e));
    }
  }, [showImportModal]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const processFileObject = async (file: File) => {
    setIsLoading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const content = event.target?.result as string;
          const parsed = JSON.parse(content);
          const success = await applyImportedData(parsed, file.name);
          if (success) {
            setShowImportModal(false);
            const updated = await getImportHistory();
            setHistory(updated);
          }
        } catch (e) {
          toast.error("Invalid JSON file content. Could not parse invoice data.");
        } finally {
          setIsLoading(false);
        }
      };
      reader.readAsText(file);
    } catch (e) {
      toast.error("Failed to read file");
      setIsLoading(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      await processFileObject(files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processFileObject(files[0]);
    }
  };

  const handleNativeBrowse = async () => {
    try {
      const selected = await openTauriDialog({
        multiple: false,
        filters: [
          {
            name: "Bilal Invoice Data",
            extensions: ["bjson", "json"],
          },
        ],
      });

      if (selected && typeof selected === "string") {
        setIsLoading(true);
        const importedInvoice = await invoke("import_invoice_from_file", {
          filePath: selected,
        });

        const fileName = selected.split(/[/\\]/).pop() || "imported_file.bjson";
        const { useInvoiceStore, useCompanyStore } = await import("@/stores");
        useInvoiceStore.getState().setInvoiceData(importedInvoice as any);

        const { getCompanySettings } = await import("@/services/settings.service");
        const updatedCompany = await getCompanySettings();
        if (updatedCompany) {
          useCompanyStore.getState().setCompany(updatedCompany);
        }

        const { saveImportHistoryRecord } = await import("@/services/importExport.service");
        await saveImportHistoryRecord({
          fileName,
          invoiceNumber: (importedInvoice as any).invoiceNumber || "INV-DRAFT",
          clientName:
            (importedInvoice as any).client?.name ||
            (importedInvoice as any).billTo?.name ||
            "Client",
          totalAmount: (importedInvoice as any).total || 0,
          data: { invoiceData: importedInvoice, company: updatedCompany },
        });

        toast.success("Invoice project imported successfully");
        setShowImportModal(false);
        const updated = await getImportHistory();
        setHistory(updated);
      }
    } catch (e) {
      console.error(e);
      fileInputRef.current?.click();
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestoreFromHistory = async (record: ImportHistoryRecord) => {
    setIsLoading(true);
    try {
      const success = await applyImportedData(record.data, record.fileName);
      if (success) {
        setShowImportModal(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteHistoryRecord = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = await deleteImportHistoryRecord(id);
    setHistory(updated);
    toast.success("Removed record from import history");
  };

  const handleClearAllHistory = async () => {
    await clearImportHistory();
    setHistory([]);
    toast.success("Cleared all import history");
  };

  return (
    <Dialog open={showImportModal} onOpenChange={setShowImportModal}>
      <DialogContent
        showCloseButton={false}
        className="w-[92vw] max-w-xl max-h-[85vh] flex flex-col bg-card border-border shadow-2xl p-0 overflow-hidden rounded-2xl"
      >
        {/* Header with Safe Area & Dedicated Close Button */}
        <DialogHeader className="p-5 sm:p-6 pb-4 border-b border-border/60 bg-muted/30 shrink-0 relative pr-12">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0">
                <UploadCloud className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                  Import Invoice Data
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Drag & drop a JSON file, browse from disk, or restore a previously imported invoice
                </DialogDescription>
              </div>
            </div>

            {/* Dedicated Top-Right Close Button */}
            <DialogClose className="absolute top-4 right-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer">
              <X className="w-4 h-4" />
              <span className="sr-only">Close</span>
            </DialogClose>
          </div>
        </DialogHeader>

        {/* Dynamic Scrollable Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 custom-scrollbar space-y-5">
          {/* Drag and Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleNativeBrowse}
            className={`relative border-2 border-dashed rounded-2xl p-5 sm:p-7 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2.5 ${
              isDragging
                ? "border-primary bg-primary/10 scale-[1.01]"
                : "border-border/80 hover:border-primary/60 bg-muted/20 hover:bg-muted/40"
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.bjson"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="p-3 sm:p-3.5 rounded-full bg-background border border-border shadow-xs text-primary">
              <FileSpreadsheet className="w-6 sm:w-7 h-6 sm:h-7 stroke-[1.5]" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-semibold text-foreground">
                {isDragging ? "Drop your JSON file here" : "Drag & drop your invoice file here"}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                Supports <code className="text-primary font-mono font-medium">.bjson</code> and <code className="text-primary font-mono font-medium">.json</code> format
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-0.5 gap-2 rounded-xl text-xs font-medium h-8"
              disabled={isLoading}
            >
              <FileCode className="w-3.5 h-3.5" />
              Browse Computer
            </Button>
          </div>

          {/* Previously Imported Files Section */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Previously Imported Files
                </h3>
                {history.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary">
                    {history.length}
                  </span>
                )}
              </div>
              {history.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllHistory}
                  className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear History
                </button>
              )}
            </div>

            <div className="max-h-[220px] overflow-y-auto rounded-xl border border-border/60 bg-muted/10 p-2 space-y-2 custom-scrollbar">
              {history.length === 0 ? (
                <div className="py-8 flex flex-col items-center justify-center text-center p-4 text-muted-foreground">
                  <Clock className="w-7 h-7 opacity-40 mb-2" />
                  <p className="text-xs font-medium">No previously imported files</p>
                  <p className="text-[11px] opacity-70 mt-0.5">
                    Files imported here will be saved automatically to your backend history
                  </p>
                </div>
              ) : (
                history.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleRestoreFromHistory(item)}
                    className="group flex flex-wrap sm:flex-nowrap items-center justify-between p-3 rounded-xl border border-border/50 bg-card hover:bg-accent/50 hover:border-primary/30 transition-all cursor-pointer shadow-xs gap-2"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                        <FileCode className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs sm:text-sm font-semibold text-foreground truncate">
                            {item.invoiceNumber || item.fileName}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-mono truncate">
                            {item.fileName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2.5 text-[11px] sm:text-xs text-muted-foreground mt-0.5 flex-wrap">
                          <span className="flex items-center gap-1 truncate">
                            <User className="w-3 h-3 opacity-60" />
                            {item.clientName || "Client"}
                          </span>
                          {item.totalAmount !== undefined && (
                            <span className="font-medium text-foreground">
                              ${item.totalAmount.toFixed(2)}
                            </span>
                          )}
                          <span className="text-[10px] opacity-60">
                            {formatDistanceToNow(new Date(item.importedAt), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-90 group-hover:opacity-100 shrink-0 ml-auto sm:ml-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-[11px] text-primary font-medium hover:bg-primary/10"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Re-import
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => handleDeleteHistoryRecord(item.id, e)}
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
