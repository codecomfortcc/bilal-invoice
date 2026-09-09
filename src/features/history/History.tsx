import { useEffect, useState } from "react";
import {
  FileText,
  ExternalLink,
  FileArchive,
  Folder,
  Clock,
  Hash,
  Share2,
  MessageCircle,
  Mail,
  FolderOpen,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InvoiceData } from "@/types";
import { listInvoices, saveInvoice } from "@/services/invoice.service";
import { useInvoiceStore } from "@/stores";
import { openPath } from "@tauri-apps/plugin-opener";
import { exists } from "@tauri-apps/plugin-fs";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
  const navigate = useNavigate();
  const { setInvoiceData } = useInvoiceStore();

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const data = await listInvoices();
      
      const exported = data.filter((inv) => inv.exportFileName && inv.exportFolder);
      const validInvoices: InvoiceData[] = [];

      // Verify files actually exist
      await Promise.all(
        exported.map(async (inv) => {
          const filePath = `${inv.exportFolder}\\${inv.exportFileName}`;
          const fileExists = await exists(filePath);
          if (fileExists) {
            validInvoices.push(inv);
          } else {
            // Revert missing file to draft
            await saveInvoice({
              ...inv,
              exportFileName: undefined,
              exportFolder: undefined,
              exportDate: undefined,
            });
          }
        })
      );

      setInvoices(
        validInvoices.sort((a, b) => {
          return (
            new Date(b.exportDate || 0).getTime() -
            new Date(a.exportDate || 0).getTime()
          );
        }),
      );
    } catch (e) {
      console.error("Failed to load invoices", e);
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
          "The exported PDF could not be found. It may have been moved or deleted.",
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
    platform: "whatsapp" | "mailto" | "gmail" | "folder",
  ) => {
    const subject = encodeURIComponent(
      `Invoice ${invoice.invoiceNumber || ""}`,
    );
    const body = encodeURIComponent(
      `Hello, please find the invoice ${invoice.invoiceNumber || ""} attached.\n\nThank you!`,
    );

    const filePath = `${invoice.exportFolder}\\${invoice.exportFileName}`;

    let url = "";
    if (platform === "whatsapp") {
      url = `https://wa.me/?text=${body}`;
    } else if (platform === "mailto") {
      // Adding attach parameter works on some desktop clients like Outlook
      url = `mailto:?subject=${subject}&body=${body}&attach=${encodeURIComponent(filePath)}`;
    } else if (platform === "gmail") {
      url = `https://mail.google.com/mail/?view=cm&fs=1&to=&su=${subject}&body=${body}`;
    } else if (platform === "folder") {
      openPath(invoice.exportFolder!).catch(e => {
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

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 bg-transparent">
        <div className="flex flex-col items-center justify-center p-12 bg-card/60 backdrop-blur-2xl border border-white/10 dark:border-white/5 rounded-2xl shadow-lg max-w-md w-full text-center">
          <div className="flex items-center justify-center h-16 w-16 rounded-xl bg-primary/10 text-primary mb-6 ring-1 ring-primary/20">
            <FileArchive className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-semibold text-foreground tracking-tight mb-2">
            No exported invoices
          </h2>
          <p className="text-[13px] text-muted-foreground mb-8">
            Your generated PDF invoices will appear here automatically. Generate
            your first invoice to get started.
          </p>
          <Button
            variant="default"
            className="w-full shadow-sm rounded-lg"
            onClick={() => navigate("/")}
          >
            Create Invoice
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-6 md:p-10 custom-scrollbar bg-background/50 backdrop-blur-3xl relative">
      <div className="max-w-[1200px] mx-auto space-y-6 relative z-10">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Export History
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1.5">
            View and manage your previously generated PDF invoices.
          </p>
        </div>

        <Card className="border-white/20 dark:border-white/10 bg-card/60 backdrop-blur-2xl shadow-sm overflow-hidden rounded-xl">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-transparent">
                  <TableRow className="border-b border-white/10 hover:bg-transparent">
                    <TableHead className="w-[160px] font-medium text-xs text-muted-foreground h-11">
                      <div className="flex items-center">
                        <Hash className="w-3.5 h-3.5 mr-2 opacity-70" /> Invoice
                        Number
                      </div>
                    </TableHead>
                    <TableHead className="font-medium text-xs text-muted-foreground h-11">
                      <div className="flex items-center">
                        <FileText className="w-3.5 h-3.5 mr-2 opacity-70" />{" "}
                        File Name
                      </div>
                    </TableHead>
                    <TableHead className="w-[200px] font-medium text-xs text-muted-foreground h-11">
                      <div className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-2 opacity-70" /> Export
                        Date
                      </div>
                    </TableHead>
                    <TableHead className="w-[280px] font-medium text-xs text-muted-foreground h-11">
                      <div className="flex items-center">
                        <Folder className="w-3.5 h-3.5 mr-2 opacity-70" />{" "}
                        Location
                      </div>
                    </TableHead>
                    <TableHead className="text-right font-medium text-xs text-muted-foreground h-11 w-[180px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow
                      key={invoice.id}
                      className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group h-14"
                    >
                      <TableCell className="font-medium text-[13px]">
                        {invoice.invoiceNumber || "Draft"}
                      </TableCell>
                      <TableCell className="font-medium text-[13px] text-foreground">
                        {invoice.exportFileName}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-[12px] tabular-nums">
                        {invoice.exportDate
                          ? new Date(invoice.exportDate).toLocaleString(
                              undefined,
                              {
                                dateStyle: "medium",
                                timeStyle: "short",
                              },
                            )
                          : "Unknown"}
                      </TableCell>
                      <TableCell>
                        <div
                          className="flex items-center text-muted-foreground text-[12px] max-w-[250px]"
                          title={invoice.exportFolder}
                        >
                          <span className="truncate">
                            {invoice.exportFolder}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <Dialog>
                            <DialogTrigger
                              render={
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-3 text-[12px] rounded-md hover:bg-black/5 dark:hover:bg-white/10"
                                >
                                  <Share2 className="h-3 w-3 mr-1.5" /> Share
                                </Button>
                              }
                            ></DialogTrigger>
                            <DialogContent className="sm:max-w-md bg-card/80 backdrop-blur-3xl border-white/20 dark:border-white/10 rounded-xl overflow-hidden p-0 shadow-2xl">
                              <DialogHeader className="p-5 pb-3">
                                <DialogTitle className="text-xl font-semibold">
                                  Share
                                </DialogTitle>
                                <p className="text-[13px] text-muted-foreground mt-1 truncate">
                                  Invoice {invoice.invoiceNumber || "Draft"} -{" "}
                                  {invoice.exportFileName}
                                </p>
                              </DialogHeader>

                              <div className="px-5 py-4 bg-black/5 dark:bg-white/5 border-t border-b border-black/5 dark:border-white/5">
                                <div className="grid grid-cols-4 gap-4">
                                  <button
                                    onClick={() =>
                                      handleShare(invoice, "whatsapp")
                                    }
                                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors group outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                  >
                                    <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                                      <MessageCircle className="h-6 w-6 text-green-600 dark:text-green-500 fill-green-500/20" />
                                    </div>
                                    <span className="text-[11px] font-medium text-foreground">
                                      WhatsApp
                                    </span>
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleShare(invoice, "mailto")
                                    }
                                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors group outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                  >
                                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                                      <Mail className="h-6 w-6 text-blue-600 dark:text-blue-500 fill-blue-500/20" />
                                    </div>
                                    <span className="text-[11px] font-medium text-foreground">
                                      Mail App
                                    </span>
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleShare(invoice, "gmail")
                                    }
                                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors group outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                  >
                                    <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                                      <Mail className="h-6 w-6 text-red-600 dark:text-red-500 fill-red-500/20" />
                                    </div>
                                    <span className="text-[11px] font-medium text-foreground">
                                      Gmail
                                    </span>
                                  </button>

                                  <button
                                    onClick={() =>
                                      handleShare(invoice, "folder")
                                    }
                                    className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl hover:bg-black/5 dark:hover:bg-white/10 transition-colors group outline-none focus-visible:ring-2 focus-visible:ring-primary"
                                  >
                                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                                      <FolderOpen className="h-6 w-6 text-amber-600 dark:text-amber-500 fill-amber-500/20" />
                                    </div>
                                    <span className="text-[11px] font-medium text-foreground">
                                      Open Folder
                                    </span>
                                  </button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(invoice)}
                            className="h-8 px-3 text-[12px] rounded-md hover:bg-black/5 dark:hover:bg-white/10"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleOpen(invoice)}
                            className="h-8 px-3 text-[12px] rounded-md bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
                          >
                            <ExternalLink className="h-3 w-3 mr-1.5" /> Open
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
      </div>
    </div>
  );
}
