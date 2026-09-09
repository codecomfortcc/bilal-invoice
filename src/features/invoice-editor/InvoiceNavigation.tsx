import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useSessionStore, useInvoiceStore } from "@/stores";
import { getInvoice } from "@/services/invoice.service";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip";

export function InvoiceNavigation() {
  const { canGoBack, canGoForward, goBack, goForward, pushInvoice } = useSessionStore();
  const { invoiceData, updateInvoiceData } = useInvoiceStore();

  // On mount or when invoice ID changes, push to session
  useEffect(() => {
    if (invoiceData.id) {
      pushInvoice(invoiceData.id);
    }
  }, [invoiceData.id, pushInvoice]);

  const loadInvoice = async (id: string | null) => {
    if (!id) return;
    try {
      const invoice = await getInvoice(id);
      if (invoice) {
        // Only load if it exists
        updateInvoiceData(invoice);
      } else {
        toast.error("Invoice no longer exists.");
      }
    } catch (e) {
      toast.error("Failed to load invoice.");
      console.error(e);
    }
  };

  const handleBack = () => {
    const prevId = goBack();
    loadInvoice(prevId);
  };

  const handleForward = () => {
    const nextId = goForward();
    loadInvoice(nextId);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-lg border border-black/5 dark:border-white/5 mr-2">
        <Tooltip>
          <TooltipTrigger render={
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              disabled={!canGoBack}
              onClick={handleBack}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
            </Button>
          } />
          <TooltipContent>Back</TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger render={
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-md"
              disabled={!canGoForward}
              onClick={handleForward}
            >
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          } />
          <TooltipContent>Forward</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
