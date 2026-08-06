import { useEffect, useState } from "react";
import { FileText, Edit2, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InvoiceData } from "@/types";
import { listInvoices } from "@/services/invoice.service";
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

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
      // Only show exported invoices in history
      setInvoices(data.filter((inv) => inv.exportFileName));
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
        toast.error("The exported PDF could not be found. It may have been moved or deleted.");
        return;
      }
      await openPath(filePath);
    } catch (e) {
      console.error(e);
      toast.error("Failed to open file.");
    }
  };

  if (invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-muted-foreground">
        <div className="flex items-center justify-center h-16 w-16 rounded-full bg-muted">
          <FileText className="h-8 w-8" />
        </div>
        <div className="text-center space-y-1">
          <h2 className="text-lg font-semibold text-foreground">No invoices yet</h2>
          <p className="text-sm max-w-xs">
            Exported invoices will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto p-8">
      <Card className="max-w-5xl mx-auto">
        <CardHeader>
          <CardTitle>Export History</CardTitle>
          <CardDescription>View and manage your previously exported invoices.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>File Name</TableHead>
                  <TableHead>Export Date</TableHead>
                  <TableHead>Export Folder</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.invoiceNumber || "Draft"}</TableCell>
                    <TableCell>{invoice.exportFileName}</TableCell>
                    <TableCell>
                      {invoice.exportDate
                        ? new Date(invoice.exportDate).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })
                        : "Unknown"}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground max-w-[200px] truncate"
                      title={invoice.exportFolder}
                    >
                      {invoice.exportFolder}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" onClick={() => handleEdit(invoice)}>
                          <Edit2 className="h-3 w-3 mr-1.5" />
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleOpen(invoice)}>
                          <ExternalLink className="h-3 w-3 mr-1.5" />
                          Open
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
  );
}
