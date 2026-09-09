import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useInvoiceStore } from "@/stores";

export const invoiceFormSchema = z.object({
  invoiceNumber: z.string(),
  date: z.string(),
  buyersOrderDate: z.string().optional(),
  deliveryNoteDate: z.string().optional(),
  remarks: z.string().optional(),
  deliveryNote: z.string().optional(),
  referenceNo: z.string().optional(),
  dispatchDocNo: z.string().optional(),
  dispatchedThrough: z.string().optional(),
  destination: z.string().optional(),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;

export function useInvoiceForm() {
  const { invoiceData, updateInvoiceData } = useInvoiceStore();

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: {
      invoiceNumber: invoiceData.invoiceNumber || "",
      date: invoiceData.date || "",
      buyersOrderDate: invoiceData.buyersOrderDate || "",
      deliveryNoteDate: invoiceData.deliveryNoteDate || "",
      remarks: invoiceData.remarks || "",
      deliveryNote: invoiceData.deliveryNote || "",
      referenceNo: invoiceData.referenceNo || "",
      dispatchDocNo: invoiceData.dispatchDocNo || "",
      dispatchedThrough: invoiceData.dispatchedThrough || "",
      destination: invoiceData.destination || "",
    },
  });

  // Watch for changes in the form and sync them to the global store so the preview updates
  useEffect(() => {
    const subscription = form.watch((value) => {
      // Cast the partial value back to InvoiceData updates
      updateInvoiceData(value as any);
    });
    return () => subscription.unsubscribe();
  }, [form, updateInvoiceData]);

  // When the store changes externally (e.g. loading a draft, or auto-generating invoice number),
  // sync the form state to match.
  useEffect(() => {
    form.reset({
      invoiceNumber: invoiceData.invoiceNumber || "",
      date: invoiceData.date || "",
      buyersOrderDate: invoiceData.buyersOrderDate || "",
      deliveryNoteDate: invoiceData.deliveryNoteDate || "",
      remarks: invoiceData.remarks || "",
      deliveryNote: invoiceData.deliveryNote || "",
      referenceNo: invoiceData.referenceNo || "",
      dispatchDocNo: invoiceData.dispatchDocNo || "",
      dispatchedThrough: invoiceData.dispatchedThrough || "",
      destination: invoiceData.destination || "",
    }, { keepDefaultValues: true });
  }, [
    invoiceData.id, invoiceData.invoiceNumber, invoiceData.date, invoiceData.buyersOrderDate, 
    invoiceData.deliveryNoteDate, invoiceData.deliveryNote, invoiceData.referenceNo, 
    invoiceData.dispatchDocNo, invoiceData.dispatchedThrough, invoiceData.destination, form
  ]);

  return form;
}
