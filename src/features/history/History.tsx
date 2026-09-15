import { useEffect, useState } from "react";
import {
  FileText,
  ExternalLink,
  FileArchive,
  Folder,
  Share2,
  MessageCircle,
  Mail,
  FolderOpen,
  Search,
  RefreshCw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InvoiceData } from "@/types";
import { listInvoices, saveInvoice } from "@/services/invoice.service";
import { useInvoiceStore } from "@/stores";
import { openPath } from "@tauri-apps/plugin-opener";
import { exists } from "@tauri-apps/plugin-fs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function HistoryPage() {
  const [invoices, setInvoices] = useState<InvoiceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();
  const { setInvoiceData } = useInvoiceStore();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    setIsLoading(true);
    try {
      const data = await listInvoices();
      const exported = data.filter((inv) => inv.exportFileName && inv.exportFolder);

      const sorted = exported.sort((a, b) => {
        return (
          new Date(b.exportDate || 0).getTime() -
          new Date(a.exportDate || 0).getTime()
        );
      });

      // Instantly render invoices from DB without waiting for disk file verification
      setInvoices(sorted);
      setIsLoading(false);

      // Asynchronously verify files in background to clean up missing/deleted exports
      const validInvoices: InvoiceData[] = [];
      let missingCount = 0;

      for (const inv of sorted) {
        const filePath = `${inv.exportFolder}\\${inv.exportFileName}`;
        const fileExists = await exists(filePath);
        if (fileExists) {
          validInvoices.push(inv);
        } else {
          missingCount++;
          await saveInvoice({
            ...inv,
            exportFileName: undefined,
            exportFolder: undefined,
            exportDate: undefined,
          });
        }
      }

      if (missingCount > 0) {
        setInvoices(validInvoices);
      }
    } catch (e) {
      console.error("Failed to load invoices", e);
      setIsLoading(false);
    }
  };

  const handleEdit = (invoice: InvoiceData) => {
    setInvoiceData(invoice);
    navigate("/");
  };

  const handleOpen = async (invoice: InvoiceData) => {
    if (!invoice.exportFolder || !invoice.exportFileName) {
      toast.error("Export metadata is missing.");
      return;
    }
    const filePath = `${invoice.exportFolder}\\${invoice.exportFileName}`;
    try {
      const fileExists = await exists(filePath);
      if (!fileExists) {
        toast.error(
          "The exported PDF could not be found. It may have been moved or deleted."
        );
        return;
      }
      await openPath(filePath);
    } catch (e) {
      console.error(e);
      toast.error("Failed to open file. Please check permissions.");
    }
  };

  const handleShare = (
    invoice: InvoiceData,
    platform: "whatsapp" | "mailto" | "gmail" | "folder"
  ) => {
    const subject = encodeURIComponent(
      `Invoice ${invoice.invoiceNumber || ""}`
    );
    const body = encodeURIComponent(
      `Hello, please find the invoice ${invoice.invoiceNumber || ""} attached.\n\nThank you!`
    );

    const filePath = `${invoice.exportFolder}\\${invoice.exportFileName}`;

    let url = "";
    if (platform === "whatsapp") {
      url = `https://wa.me/?text=${body}`;
    } else if (platform === "mailto") {
      url = `mailto:?subject=${subject}&body=${body}&attach=${encodeURIComponent(filePath)}`;
    } else if (platform === "gmail") {
      url = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${subject}&body=${body}`;
    } else if (platform === "folder") {
      openPath(invoice.exportFolder!).catch((e) => {
        console.error(e);
        toast.error("Failed to open folder.");
      });
      return;
    }

    if (url) {
      openPath(url).catch((e) => {
        console.error(e);
        toast.error("Failed to open share link.");
      });
    }
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      (inv.invoiceNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.exportFileName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.exportFolder || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="h-full overflow-auto p-6 md:p-8 custom-scrollbar bg-transparent">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground font-sans">
              Export History
            </h1>
            <p className="text-[13px] text-muted-foreground mt-1 font-sans">
              View and manage your previously generated PDF invoices.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={loadInvoices}
              className="h-9 px-3 text-xs gap-1.5 cursor-pointer"
              title="Refresh export history"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        {!isLoading && invoices.length > 0 && (
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history by invoice # or filename..."
              className="pl-9 text-xs bg-card/60 backdrop-blur-md"
            />
          </div>
        )}

        {/* Loading Skeleton View */}
        {isLoading ? (
          <Card className="border-border/50 bg-card/60 backdrop-blur-2xl shadow-sm rounded-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4 space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-border/40">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between py-2 gap-4">
                    <Skeleton className="h-5 w-28 rounded" />
                    <Skeleton className="h-5 w-44 rounded" />
                    <Skeleton className="h-5 w-32 rounded" />
                    <Skeleton className="h-5 w-48 rounded" />
                    <Skeleton className="h-8 w-24 rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : invoices.length === 0 ? (
          /* Empty State View */
          <div className="flex flex-col items-center justify-center py-16 px-8 bg-transparent">
            <div className="flex flex-col items-center justify-center p-8 bg-card/60 backdrop-blur-2xl border border-border/50 rounded-xl shadow-sm max-w-sm w-full text-center">
              <div className="flex items-center justify-center mb-4 text-muted-foreground/70">
                <FileArchive className="h-12 w-12 stroke-[1.5]" />
              </div>
              <h2 className="text-[15px] font-semibold text-foreground tracking-tight mb-2">
                No exported invoices
              </h2>
              <p className="text-[13px] text-muted-foreground mb-6 leading-relaxed">
                Your generated PDF invoices will appear here automatically. Generate
                your first invoice to get started.
              </p>
              <Button
                className="w-full h-8 text-[13px] rounded-md shadow-sm cursor-pointer"
                onClick={() => navigate("/")}
              >
                Create Invoice
              </Button>
            </div>
          </div>
        ) : filteredInvoices.length === 0 ? (
          /* Search No Match View */
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <p className="text-sm">No exported invoices match &quot;{searchTerm}&quot;</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="mt-2 text-xs"
            >
              Clear Search
            </Button>
          </div>
        ) : (
          /* History Table View */
          <Card className="border-border/50 bg-card/60 backdrop-blur-2xl shadow-sm rounded-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-b border-border/50 hover:bg-transparent">
                      <TableHead className="w-[180px] font-medium text-[12px] text-muted-foreground h-10 px-4">
                        Invoice Number
                      </TableHead>
                      <TableHead className="font-medium text-[12px] text-muted-foreground h-10">
                        File Name
                      </TableHead>
                      <TableHead className="w-[180px] font-medium text-[12px] text-muted-foreground h-10">
                        Export Date
                      </TableHead>
                      <TableHead className="w-[300px] font-medium text-[12px] text-muted-foreground h-10">
                        Location
                      </TableHead>
                      <TableHead className="text-right font-medium text-[12px] text-muted-foreground h-10 w-[200px] px-4">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => (
                      <TableRow
                        key={invoice.id}
                        className="hover:bg-muted/50 transition-none border-b border-border/50 last:border-0 h-12"
                      >
                        <TableCell className="font-medium text-[13px] px-4">
                          {invoice.invoiceNumber ? (
                            <span className="text-foreground font-semibold">{invoice.invoiceNumber}</span>
                          ) : (
                            <span className="text-muted-foreground italic">Draft</span>
                          )}
                        </TableCell>
                        <TableCell className="text-[13px]">
                          <div className="flex items-center text-foreground">
                            <FileText className="w-4 h-4 mr-2.5 opacity-70 stroke-[1.5]" />
                            <span className="truncate max-w-[200px]" title={invoice.exportFileName}>
                              {invoice.exportFileName}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-[12px] tabular-nums">
                          {invoice.exportDate ? (
                            <span>
                              {new Date(invoice.exportDate).toLocaleString(undefined, {
                                year: "numeric",
                                month: "2-digit",
                                day: "2-digit",
                                hour: "numeric",
                                minute: "2-digit",
                              })}
                            </span>
                          ) : (
                            "Unknown"
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center max-w-[280px]">
                            <div className="flex items-center text-[12px] text-muted-foreground truncate" title={invoice.exportFolder}>
                              <Folder className="w-4 h-4 mr-2 opacity-50 shrink-0 stroke-[1.5]" />
                              <span className="truncate">{invoice.exportFolder}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right px-4">
                          <div className="flex justify-end gap-1.5">
                            <Dialog>
                              <DialogTrigger render={
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2.5 text-[12px] rounded-md hover:bg-muted font-normal cursor-pointer"
                                >
                                  <Share2 className="h-3.5 w-3.5 mr-1.5 stroke-[1.5]" /> Share
                                </Button>
                              } />
                              <DialogContent className="sm:max-w-sm bg-card/90 backdrop-blur-2xl border-border/50 rounded-lg p-0 shadow-lg">
                                <DialogHeader className="p-4 pb-2">
                                  <DialogTitle className="text-[15px] font-semibold">
                                    Share Invoice
                                  </DialogTitle>
                                  <p className="text-[12px] text-muted-foreground mt-1 truncate">
                                    {invoice.invoiceNumber || "Draft"} - {invoice.exportFileName}
                                  </p>
                                </DialogHeader>

                                <div className="p-4 bg-muted/20 border-t border-border/50">
                                  <div className="grid grid-cols-4 gap-2">
                                    <button
                                      onClick={() => handleShare(invoice, "whatsapp")}
                                      className="flex flex-col items-center justify-center gap-2 p-3 rounded-md hover:bg-muted/80 transition-none outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
                                    >
                                      <MessageCircle className="h-6 w-6 text-foreground stroke-[1.5]" />
                                      <span className="text-[11px] text-foreground">WhatsApp</span>
                                    </button>

                                    <button
                                      onClick={() => handleShare(invoice, "mailto")}
                                      className="flex flex-col items-center justify-center gap-2 p-3 rounded-md hover:bg-muted/80 transition-none outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
                                    >
                                      <Mail className="h-6 w-6 text-foreground stroke-[1.5]" />
                                      <span className="text-[11px] text-foreground">Mail</span>
                                    </button>

                                    <button
                                      onClick={() => handleShare(invoice, "gmail")}
                                      className="flex flex-col items-center justify-center gap-2 p-3 rounded-md hover:bg-muted/80 transition-none outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
                                    >
                                      <Mail className="h-6 w-6 text-foreground stroke-[1.5]" />
                                      <span className="text-[11px] text-foreground">Gmail</span>
                                    </button>

                                    <button
                                      onClick={() => handleShare(invoice, "folder")}
                                      className="flex flex-col items-center justify-center gap-2 p-3 rounded-md hover:bg-muted/80 transition-none outline-none focus-visible:ring-1 focus-visible:ring-primary cursor-pointer"
                                    >
                                      <FolderOpen className="h-6 w-6 text-foreground stroke-[1.5]" />
                                      <span className="text-[11px] text-foreground">Folder</span>
                                    </button>
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(invoice)}
                              className="h-8 px-2.5 text-[12px] rounded-md hover:bg-muted font-normal cursor-pointer"
                            >
                              Edit
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleOpen(invoice)}
                              className="h-8 px-3 text-[12px] rounded-md shadow-sm font-medium cursor-pointer"
                            >
                              <ExternalLink className="h-3.5 w-3.5 mr-1.5 stroke-[1.5]" /> Open
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

