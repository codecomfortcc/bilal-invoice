import { useCallback, useEffect, useRef } from "react";
import { useInvoiceStore, useUiStore, useCompanyStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  Trash2,
  Plus,
  FileText,
  ZoomIn,
  ZoomOut,
  Wand2,
  PackagePlus,
} from "lucide-react";
import { generatePdf } from "@/services/pdf.service";
import {
  generateInvoiceNumber,
  calculateItemAmount,
  calculateTotal,
  saveInvoice,
} from "@/services/invoice.service";
import { InvoicePreview } from "./InvoicePreview";
import { toast } from "sonner";

export function InvoiceEditor() {
  const { invoiceData, updateInvoiceData } = useInvoiceStore();
  const { company } = useCompanyStore();
  const { zoom, zoomIn, zoomOut } = useUiStore();
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-populate consignee from company settings if empty
  useEffect(() => {
    if (company && !invoiceData.consigneeName && !invoiceData.consigneeGst && !invoiceData.buyerName) {
      updateInvoiceData({
        consigneeName: company.consigneeName || "",
        consigneeGst: company.consigneeGst || "",
        consigneeState: company.consigneeState || "",
        buyerName: company.consigneeName || "",
        buyerAddress: company.consigneeAddress || "",
        buyerGst: company.consigneeGst || "",
        buyerState: company.consigneeState || "",
      });
    }
  }, [company, invoiceData.id, updateInvoiceData]);

  // Auto-save draft (debounced 2s)
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

  const handleAddItem = useCallback(() => {
    updateInvoiceData({
      items: [
        ...invoiceData.items,
        {
          id: `item_${Date.now()}`,
          description: "",
          hsn: "",
          quantity: 1,
          rate: 0,
          unit: "pcs",
          amount: 0,
        },
      ],
    });
  }, [invoiceData.items, updateInvoiceData]);

  const handleUpdateItem = useCallback(
    (
      id: string,
      field: keyof (typeof invoiceData.items)[0],
      value: string | number,
    ) => {
      const newItems = invoiceData.items.map((item) => {
        if (item.id === id) {
          const newItem = { ...item, [field]: value };
          if (field === "quantity" || field === "rate") {
            newItem.amount = calculateItemAmount(
              Number(newItem.quantity),
              Number(newItem.rate),
            );
          }
          return newItem;
        }
        return item;
      });
      updateInvoiceData({ items: newItems, total: calculateTotal(newItems) });
    },
    [invoiceData.items, updateInvoiceData],
  );

  const handleRemoveItem = useCallback(
    (id: string) => {
      const newItems = invoiceData.items.filter((item) => item.id !== id);
      updateInvoiceData({ items: newItems, total: calculateTotal(newItems) });
    },
    [invoiceData.items, updateInvoiceData],
  );

  const handleGeneratePdf = useCallback(async () => {
    const result = await generatePdf(invoiceData);
    if (result.success) {
      toast.success(`PDF exported: ${result.filename}`);
      // Update invoice data with export metadata
      const updatedData = {
        ...invoiceData,
        exportFileName: result.filename,
        exportFolder: result.folder,
        exportDate: result.date,
      };
      updateInvoiceData(updatedData);
      await saveInvoice(updatedData);
    } else if (result.error !== "Export cancelled") {
      toast.error(result.error || "Failed to generate PDF");
    }
  }, [invoiceData, updateInvoiceData]);

  const paymentModeValue = ["Prepaid", "COD"].includes(
    invoiceData.modeOfPayment || "",
  )
    ? invoiceData.modeOfPayment!
    : invoiceData.modeOfPayment
      ? "Custom"
      : "";

  return (
    <ResizablePanelGroup orientation="horizontal" className="h-full">
      {/* Editor Panel */}
      <ResizablePanel defaultSize={45} minSize={30}>
        <div className="h-full overflow-auto p-5 space-y-5">
          {/* Invoice Header */}
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Invoice</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Fill in the details below. Changes auto-save.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Invoice Number</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-5 px-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    updateInvoiceData({
                      invoiceNumber: generateInvoiceNumber(),
                    })
                  }
                >
                  <Wand2 className="h-3 w-3 mr-1" />
                  Auto
                </Button>
              </div>
              <Input
                placeholder="INV-001"
                value={invoiceData.invoiceNumber}
                onChange={(e) =>
                  updateInvoiceData({ invoiceNumber: e.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={invoiceData.date}
                onChange={(e) => updateInvoiceData({ date: e.target.value })}
              />
            </div>
            <div className="col-span-2 space-y-1.5">
              <Label className="text-xs">Remarks</Label>
              <Input
                placeholder="Optional description or remarks"
                value={invoiceData.remarks}
                onChange={(e) => updateInvoiceData({ remarks: e.target.value })}
              />
            </div>
          </div>

          <Separator />

          {/* Other Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Dispatch & Delivery</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Delivery Note</Label>
                <Input
                  placeholder="Delivery note"
                  value={invoiceData.deliveryNote || ""}
                  onChange={(e) =>
                    updateInvoiceData({ deliveryNote: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Mode of Payment</Label>
                <Select
                  value={paymentModeValue}
                  onValueChange={(val) => {
                    if (val === "Custom") {
                      updateInvoiceData({ modeOfPayment: "" });
                    } else {
                      updateInvoiceData({ modeOfPayment: val as any });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Prepaid">Prepaid</SelectItem>
                    <SelectItem value="COD">COD</SelectItem>
                    <SelectItem value="Custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
                {paymentModeValue === "Custom" && (
                  <Input
                    className="mt-1.5"
                    placeholder="Custom payment mode"
                    value={invoiceData.modeOfPayment || ""}
                    onChange={(e) =>
                      updateInvoiceData({ modeOfPayment: e.target.value })
                    }
                  />
                )}
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Reference No.</Label>
                <Input
                  placeholder="Ref no. & date"
                  value={invoiceData.referenceNo || ""}
                  onChange={(e) =>
                    updateInvoiceData({ referenceNo: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Other References</Label>
                <Input
                  placeholder="Other references"
                  value={invoiceData.otherReferences || ""}
                  onChange={(e) =>
                    updateInvoiceData({ otherReferences: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Buyer's Order No.</Label>
                <Input
                  placeholder="Order number"
                  value={invoiceData.buyersOrderNo || ""}
                  onChange={(e) =>
                    updateInvoiceData({ buyersOrderNo: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Order Date</Label>
                <Input
                  type="date"
                  value={invoiceData.buyersOrderDate || ""}
                  onChange={(e) =>
                    updateInvoiceData({ buyersOrderDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Dispatch Doc No.</Label>
                <Input
                  placeholder="Doc number"
                  value={invoiceData.dispatchDocNo || ""}
                  onChange={(e) =>
                    updateInvoiceData({ dispatchDocNo: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Delivery Note Date</Label>
                <Input
                  type="date"
                  value={invoiceData.deliveryNoteDate || ""}
                  onChange={(e) =>
                    updateInvoiceData({ deliveryNoteDate: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Dispatched Through</Label>
                <Input
                  placeholder="Transport"
                  value={invoiceData.dispatchedThrough || ""}
                  onChange={(e) =>
                    updateInvoiceData({ dispatchedThrough: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Destination</Label>
                <Input
                  placeholder="Destination"
                  value={invoiceData.destination || ""}
                  onChange={(e) =>
                    updateInvoiceData({ destination: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1 col-span-2 md:col-span-3">
                <Label className="text-xs">Terms of Delivery</Label>
                <Input
                  placeholder="Terms of delivery"
                  value={invoiceData.termsOfDelivery || ""}
                  onChange={(e) =>
                    updateInvoiceData({ termsOfDelivery: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Line Items</h3>
              <Button size="sm" variant="outline" onClick={handleAddItem}>
                <Plus className="h-3.5 w-3.5 mr-1.5" />
                Add Item
              </Button>
            </div>

            {invoiceData.items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 rounded-md border border-dashed border-border text-muted-foreground">
                <PackagePlus className="h-8 w-8 mb-2 opacity-40" />
                <p className="text-sm">No items added yet</p>
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={handleAddItem}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add your first item
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-md border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40 hover:bg-muted/40">
                        <TableHead className="text-xs w-[35%]">
                          Description
                        </TableHead>
                        <TableHead className="text-xs w-[12%]">
                          HSN/SAC
                        </TableHead>
                        <TableHead className="text-xs w-[10%] text-right">
                          Qty
                        </TableHead>
                        <TableHead className="text-xs w-[10%]">Unit</TableHead>
                        <TableHead className="text-xs w-[13%] text-right">
                          Rate
                        </TableHead>
                        <TableHead className="text-xs w-[13%] text-right">
                          Amount
                        </TableHead>
                        <TableHead className="text-xs w-[7%]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {invoiceData.items.map((item) => (
                        <TableRow key={item.id} className="group">
                          <TableCell className="py-1.5">
                            <Input
                              className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent"
                              placeholder="Item description"
                              value={item.description}
                              onChange={(e) =>
                                handleUpdateItem(
                                  item.id,
                                  "description",
                                  e.target.value,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="py-1.5">
                            <Input
                              className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent"
                              placeholder="HSN"
                              value={item.hsn}
                              onChange={(e) =>
                                handleUpdateItem(item.id, "hsn", e.target.value)
                              }
                            />
                          </TableCell>
                          <TableCell className="py-1.5">
                            <Input
                              type="number"
                              className="h-8 text-xs text-right border-transparent hover:border-input focus:border-input bg-transparent"
                              value={item.quantity}
                              onChange={(e) =>
                                handleUpdateItem(
                                  item.id,
                                  "quantity",
                                  Number(e.target.value),
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="py-1.5">
                            <Input
                              className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent"
                              placeholder="pcs"
                              value={item.unit}
                              onChange={(e) =>
                                handleUpdateItem(
                                  item.id,
                                  "unit",
                                  e.target.value,
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="py-1.5">
                            <Input
                              type="number"
                              className="h-8 text-xs text-right border-transparent hover:border-input focus:border-input bg-transparent"
                              value={item.rate}
                              onChange={(e) =>
                                handleUpdateItem(
                                  item.id,
                                  "rate",
                                  Number(e.target.value),
                                )
                              }
                            />
                          </TableCell>
                          <TableCell className="py-1.5 text-xs text-right font-medium tabular-nums">
                            ₹{item.amount.toFixed(2)}
                          </TableCell>
                          <TableCell className="py-1.5">
                            <AlertDialog>
                              <AlertDialogTrigger
                                render={
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                  </Button>
                                }
                              ></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Remove item?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This will remove "
                                    {item.description || "this item"}" from the
                                    invoice.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    onClick={() => handleRemoveItem(item.id)}
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Total */}
                <div className="flex justify-end">
                  <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">Total</span>
                    <span className="font-semibold tabular-nums text-base">
                      ₹{invoiceData.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Bottom spacer */}
          <div className="h-8" />
        </div>
      </ResizablePanel>

      <ResizableHandle withHandle />

      {/* Preview Panel */}
      <ResizablePanel defaultSize={55} minSize={30}>
        <div className="h-full overflow-auto bg-muted/30 flex flex-col">
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <span className="text-sm font-medium text-muted-foreground">
              Preview
            </span>
            <div className="flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={zoomOut}
                    >
                      <ZoomOut className="h-4 w-4" />
                    </Button>
                  }
                ></TooltipTrigger>
                <TooltipContent>Zoom Out</TooltipContent>
              </Tooltip>

              <span className="text-xs text-muted-foreground tabular-nums w-10 text-center">
                {Math.round(zoom * 100)}%
              </span>

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={zoomIn}
                    >
                      <ZoomIn className="h-4 w-4" />
                    </Button>
                  }
                ></TooltipTrigger>
                <TooltipContent>Zoom In</TooltipContent>
              </Tooltip>

              <Separator orientation="vertical" className="h-5 mx-1" />

              <Tooltip>
                <TooltipTrigger
                  render={
                    <Button
                      variant="default"
                      size="sm"
                      className="h-8"
                      onClick={handleGeneratePdf}
                    >
                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                      Export PDF
                    </Button>
                  }
                ></TooltipTrigger>
                <TooltipContent>Generate PDF</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Preview content */}
          <div className="flex-1 flex justify-center p-6">
            <div
              data-preview-scale
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top center",
                transition: "transform 0.15s ease",
              }}
            >
              <InvoicePreview data={invoiceData} />
            </div>
          </div>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
