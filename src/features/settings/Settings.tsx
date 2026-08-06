import { useState, useEffect } from "react";
import { Company } from "@/types";
import { saveCompanySettings } from "@/services/company.service";
import { useCompanyStore } from "@/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Save, Upload, X, Building2, Landmark, PenTool, User } from "lucide-react";

export function Settings() {
  const { company: globalCompany, setCompany: setGlobalCompany } = useCompanyStore();

  const [company, setCompany] = useState<Company>({
    id: "default_company",
    name: "",
    address: "",
    gst: "",
    phone: "",
    email: "",
    bankDetails: "",
    logo: "",
    signature: "",
    digitalSignatureName: "",
    consigneeName: "",
    consigneeAddress: "",
    consigneeGst: "",
    consigneeState: "",
  });

  const [bankInfo, setBankInfo] = useState({
    accountName: "",
    bankName: "",
    accountNumber: "",
    ifscCode: "",
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (globalCompany) {
      setCompany(globalCompany);
      if (globalCompany.bankDetails) {
        try {
          setBankInfo(JSON.parse(globalCompany.bankDetails));
        } catch (e) {
          console.error("Failed to parse bank details", e);
        }
      }
    }
  }, [globalCompany]);

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompany({ ...company, signature: reader.result as string });
        toast.success("Signature uploaded");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updatedCompany = {
        ...company,
        bankDetails: JSON.stringify(bankInfo),
      };
      await saveCompanySettings(updatedCompany);
      setGlobalCompany(updatedCompany);
      toast.success("Settings saved");
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto py-8 px-6 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your company details and preferences.
          </p>
        </div>

        <Separator />

        <Tabs defaultValue="personal" className="w-full flex flex-col">
          <TabsList className="grid w-full grid-cols-2 mb-6 h-10">
            <TabsTrigger value="personal">Personal Details</TabsTrigger>
            <TabsTrigger value="company">Company Details</TabsTrigger>
          </TabsList>

          {/* Personal Details Tab */}
          <TabsContent value="personal" className="space-y-6 mt-0">
            {/* Signature Info */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Digital Signature</CardTitle>
                </div>
                <CardDescription>
                  Configure your digital signature details.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="digital-signature-name">Digital Signature Name</Label>
                  <Input
                    id="digital-signature-name"
                    placeholder="e.g. John Smith"
                    value={company.digitalSignatureName || ""}
                    onChange={(e) => setCompany({ ...company, digitalSignatureName: e.target.value })}
                  />
                  <p className="text-[10px] text-muted-foreground">This name automatically appears inside every invoice signature section.</p>
                </div>

                {company.signature ? (
                  <div className="space-y-4 mt-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 rounded-md border border-border bg-muted/30 p-4 flex items-center justify-center">
                        <img
                          src={company.signature}
                          alt="Signature Preview"
                          className="max-h-20 object-contain"
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setCompany({ ...company, signature: "" })}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="space-y-2">
                        <Label htmlFor="sig-x">Horizontal Offset (px)</Label>
                        <Input
                          id="sig-x"
                          type="number"
                          placeholder="0"
                          value={company.signatureOffsetX || 0}
                          onChange={(e) => setCompany({ ...company, signatureOffsetX: Number(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="sig-y">Vertical Offset (px)</Label>
                        <Input
                          id="sig-y"
                          type="number"
                          placeholder="0"
                          value={company.signatureOffsetY || 0}
                          onChange={(e) => setCompany({ ...company, signatureOffsetY: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <label
                    htmlFor="signature-upload"
                    className="flex flex-col items-center justify-center h-28 rounded-md border-2 border-dashed border-border hover:border-muted-foreground/50 cursor-pointer transition-colors mt-4"
                  >
                    <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload signature
                    </span>
                    <span className="text-xs text-muted-foreground/60 mt-0.5">
                      PNG, JPG up to 2MB
                    </span>
                    <input
                      id="signature-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleSignatureUpload}
                    />
                  </label>
                )}
              </CardContent>
            </Card>

            {/* Bank Details */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Landmark className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Payee / Bank Details</CardTitle>
                </div>
                <CardDescription>
                  Bank information displayed on invoices for payment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bank-holder">Account Holder's Name</Label>
                  <Input
                    id="bank-holder"
                    placeholder="Account holder name"
                    value={bankInfo.accountName}
                    onChange={(e) => setBankInfo({ ...bankInfo, accountName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank-name">Bank Name</Label>
                  <Input
                    id="bank-name"
                    placeholder="Bank name"
                    value={bankInfo.bankName}
                    onChange={(e) => setBankInfo({ ...bankInfo, bankName: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bank-account">Account Number</Label>
                    <Input
                      id="bank-account"
                      placeholder="Account number"
                      value={bankInfo.accountNumber}
                      onChange={(e) => setBankInfo({ ...bankInfo, accountNumber: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank-ifsc">Branch & IFSC Code</Label>
                    <Input
                      id="bank-ifsc"
                      placeholder="IFSC code"
                      value={bankInfo.ifscCode}
                      onChange={(e) => setBankInfo({ ...bankInfo, ifscCode: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Company Details Tab */}
          <TabsContent value="company" className="space-y-6 mt-0">
            {/* Primary Details */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Company Details</CardTitle>
                </div>
                <CardDescription>
                  This information appears on your invoices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input
                    id="company-name"
                    placeholder="Enter company name"
                    value={company.name}
                    onChange={(e) => setCompany({ ...company, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-address">Company Address</Label>
                  <Input
                    id="company-address"
                    placeholder="Full address"
                    value={company.address}
                    onChange={(e) => setCompany({ ...company, address: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company-gst">Tax Information (GST Number)</Label>
                    <Input
                      id="company-gst"
                      placeholder="22AAAAA0000A1Z5"
                      value={company.gst}
                      onChange={(e) => setCompany({ ...company, gst: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="company-phone">Phone Details</Label>
                    <Input
                      id="company-phone"
                      placeholder="+91 98765 43210"
                      value={company.phone}
                      onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-email">Email</Label>
                  <Input
                    id="company-email"
                    type="email"
                    placeholder="accounts@company.com"
                    value={company.email}
                    onChange={(e) => setCompany({ ...company, email: e.target.value })}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Consignee Details */}
            <Card>
              <CardHeader className="pb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-base">Consignee Information</CardTitle>
                </div>
                <CardDescription>
                  Default consignee details automatically populated on new invoices.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="consignee-name">Consignee Name</Label>
                  <Input
                    id="consignee-name"
                    placeholder="Consignee company name"
                    value={company.consigneeName || ""}
                    onChange={(e) => setCompany({ ...company, consigneeName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="consignee-address">Consignee Address</Label>
                  <Input
                    id="consignee-address"
                    placeholder="Consignee full address"
                    value={company.consigneeAddress || ""}
                    onChange={(e) => setCompany({ ...company, consigneeAddress: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="consignee-gst">Consignee GSTIN</Label>
                    <Input
                      id="consignee-gst"
                      placeholder="GST number"
                      value={company.consigneeGst || ""}
                      onChange={(e) => setCompany({ ...company, consigneeGst: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="consignee-state">Consignee State</Label>
                    <Input
                      id="consignee-state"
                      placeholder="State name"
                      value={company.consigneeState || ""}
                      onChange={(e) => setCompany({ ...company, consigneeState: e.target.value })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Save button */}
        <div className="flex justify-end pb-8">
          <Button onClick={handleSave} disabled={isSaving} className="min-w-32">
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
