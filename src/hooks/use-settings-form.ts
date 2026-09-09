import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useCompanyStore } from "@/stores";

export const settingsFormSchema = z.object({
  name: z.string().optional(),
  addressLine1: z.string().optional(),
  addressLine2: z.string().optional(),
  city: z.string().optional(),
  pincode: z.string().optional(),
  address: z.string().optional(),
  gst: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().optional(),
  
  consigneeName: z.string().optional(),
  consigneeAddressLine1: z.string().optional(),
  consigneeAddressLine2: z.string().optional(),
  consigneeCity: z.string().optional(),
  consigneePincode: z.string().optional(),
  consigneeAddress: z.string().optional(),
  consigneeGst: z.string().optional(),
  consigneeState: z.string().optional(),
  consigneeStateCode: z.string().optional(),
  
  digitalSignatureName: z.string().optional(),
  signatureOffsetX: z.number().optional(),
  signatureOffsetY: z.number().optional(),
  signatureScale: z.number().optional(),
  termsOfDelivery: z.string().optional(),
  signature: z.string().optional(),
  showDigitalSignature: z.boolean().optional(),
  showSignatureImage: z.boolean().optional(),
  autoSaveProducts: z.boolean().optional(),
  billSize: z.string().optional(),
  
  accountName: z.string().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),

  modeOfPayment: z.string().optional(),
  numberFormat: z.string().optional(),
});

export type SettingsFormValues = z.infer<typeof settingsFormSchema>;

export function useSettingsForm() {
  const { company } = useCompanyStore();

  let bankInfo = {
    accountName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  };

  if (company?.bankDetails) {
    try {
      bankInfo = JSON.parse(company.bankDetails);
    } catch (e) {
      console.error("Failed to parse bank details", e);
    }
  }

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      name: company?.name || "",
      addressLine1: company?.addressLine1 || "",
      addressLine2: company?.addressLine2 || "",
      city: company?.city || "",
      pincode: company?.pincode || "",
      address: company?.address || "",
      gst: company?.gst || "",
      phone: company?.phone || "",
      email: company?.email || "",
      
      consigneeName: company?.consigneeName || "",
      consigneeAddressLine1: company?.consigneeAddressLine1 || "",
      consigneeAddressLine2: company?.consigneeAddressLine2 || "",
      consigneeCity: company?.consigneeCity || "",
      consigneePincode: company?.consigneePincode || "",
      consigneeAddress: company?.consigneeAddress || "",
      consigneeGst: company?.consigneeGst || "",
      consigneeState: company?.consigneeState || "",
      consigneeStateCode: company?.consigneeStateCode || "",
      
      digitalSignatureName: company?.digitalSignatureName || "",
      signatureOffsetX: company?.signatureOffsetX || 0,
      signatureOffsetY: company?.signatureOffsetY || 0,
      signatureScale: company?.signatureScale || 1,
      termsOfDelivery: company?.termsOfDelivery || "",
      signature: company?.signature || "",
      showDigitalSignature: company?.showDigitalSignature ?? true,
      showSignatureImage: company?.showSignatureImage ?? true,
      autoSaveProducts: company?.autoSaveProducts ?? true,
      billSize: company?.billSize || "A4",
      
      accountName: bankInfo.accountName || "",
      bankName: bankInfo.bankName || "",
      accountNumber: bankInfo.accountNumber || "",
      ifscCode: bankInfo.ifscCode || "",

      modeOfPayment: company?.modeOfPayment || "",
      numberFormat: company?.numberFormat || "indian",
    },
  });

  // Re-sync if global company changes
  useEffect(() => {
    let newBankInfo = {
      accountName: "",
      bankName: "",
      accountNumber: "",
      ifscCode: "",
    };
    if (company?.bankDetails) {
      try {
        newBankInfo = JSON.parse(company.bankDetails);
      } catch (e) {}
    }

    form.reset({
      name: company?.name || "",
      addressLine1: company?.addressLine1 || "",
      addressLine2: company?.addressLine2 || "",
      city: company?.city || "",
      pincode: company?.pincode || "",
      address: company?.address || "",
      gst: company?.gst || "",
      phone: company?.phone || "",
      email: company?.email || "",
      
      consigneeName: company?.consigneeName || "",
      consigneeAddressLine1: company?.consigneeAddressLine1 || "",
      consigneeAddressLine2: company?.consigneeAddressLine2 || "",
      consigneeCity: company?.consigneeCity || "",
      consigneePincode: company?.consigneePincode || "",
      consigneeAddress: company?.consigneeAddress || "",
      consigneeGst: company?.consigneeGst || "",
      consigneeState: company?.consigneeState || "",
      consigneeStateCode: company?.consigneeStateCode || "",
      
      digitalSignatureName: company?.digitalSignatureName || "",
      signatureOffsetX: company?.signatureOffsetX || 0,
      signatureOffsetY: company?.signatureOffsetY || 0,
      signatureScale: company?.signatureScale || 1,
      termsOfDelivery: company?.termsOfDelivery || "",
      signature: company?.signature || "",
      showDigitalSignature: company?.showDigitalSignature ?? true,
      showSignatureImage: company?.showSignatureImage ?? true,
      autoSaveProducts: company?.autoSaveProducts ?? true,
      billSize: company?.billSize || "A4",
      
      accountName: newBankInfo.accountName || "",
      bankName: newBankInfo.bankName || "",
      accountNumber: newBankInfo.accountNumber || "",
      ifscCode: newBankInfo.ifscCode || "",

      modeOfPayment: company?.modeOfPayment || "",
      numberFormat: company?.numberFormat || "indian",
    }, { keepDefaultValues: true });
  }, [company, form]);

  return form;
}
