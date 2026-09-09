import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { User, Upload, X, Settings } from "lucide-react";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { SettingsFormValues } from "@/hooks/use-settings-form";

export function PersonalDetailsCard() {
  const form = useFormContext<SettingsFormValues>();
  const signature = form.watch("signature");
  
  const showDigitalSignature = form.watch("showDigitalSignature");
  const showSignatureImage = form.watch("showSignatureImage");

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File too large. Maximum size is 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue("signature", reader.result as string, { shouldDirty: true });
        toast.success("Signature uploaded");
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Card className="shadow-none border-border">
      <CardHeader className="pb-4 border-b border-border mb-6">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-[15px]">Preferences & Signatures</CardTitle>
        </div>
        <CardDescription>Configure your global invoice editor settings.</CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-8">
        
        {/* Invoice Preferences */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/20">
            <div className="space-y-0.5">
              <h4 className="text-[13px] font-medium text-foreground">Invoice Paper Size</h4>
              <p className="text-[11px] text-muted-foreground">Select the paper format for your invoices.</p>
            </div>
            <Controller
              control={form.control}
              name="billSize"
              render={({ field }) => (
                <Select value={field.value || "A4"} onValueChange={field.onChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select paper size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4 (Standard)</SelectItem>
                    <SelectItem value="A5">A5 (Half size)</SelectItem>
                    <SelectItem value="Letter">Letter</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/20">
            <div className="space-y-0.5">
              <h4 className="text-[13px] font-medium text-foreground">Auto-Save Products to Inventory</h4>
              <p className="text-[11px] text-muted-foreground">Automatically save or update products when typing them in the invoice editor.</p>
            </div>
            <Controller
              control={form.control}
              name="autoSaveProducts"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
          
          <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/20">
            <div className="space-y-0.5">
              <h4 className="text-[13px] font-medium text-foreground">Number Formatting Standard</h4>
              <p className="text-[11px] text-muted-foreground">Choose how numbers should be formatted.</p>
            </div>
            <Controller
              control={form.control}
              name="numberFormat"
              render={({ field }) => (
                <Select value={field.value || "indian"} onValueChange={field.onChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="indian">Indian (1,00,000)</SelectItem>
                    <SelectItem value="international">International (100,000)</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>

        {/* Digital Signature */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/20">
            <div className="space-y-0.5">
              <h4 className="text-[13px] font-medium text-foreground">Show Digital Signature</h4>
              <p className="text-[11px] text-muted-foreground">Display the "Digitally Signed By" text block on invoices.</p>
            </div>
            <Controller
              control={form.control}
              name="showDigitalSignature"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          {showDigitalSignature && (
            <div className="pl-2 border-l-2 border-primary/20 ml-2 animate-in fade-in slide-in-from-left-2 duration-300">
              <Field>
                <FieldLabel className="text-[13px] font-medium text-foreground">Digital Signature Name</FieldLabel>
                <Input placeholder="e.g. John Smith" {...form.register("digitalSignatureName")} />
                <p className="text-[10px] text-muted-foreground mt-1">This name automatically appears inside every invoice signature section.</p>
              </Field>
            </div>
          )}
        </div>

        {/* Signature Image */}
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/20">
            <div className="space-y-0.5">
              <h4 className="text-[13px] font-medium text-foreground">Show Signature Image</h4>
              <p className="text-[11px] text-muted-foreground">Display your physical signature image on invoices.</p>
            </div>
            <Controller
              control={form.control}
              name="showSignatureImage"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          {showSignatureImage && (
            <div className="pl-2 border-l-2 border-primary/20 ml-2 animate-in fade-in slide-in-from-left-2 duration-300">
              {signature ? (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-1 rounded-[4px] border border-border bg-muted/30 p-4 flex items-center justify-center">
                      <img
                        src={signature}
                        alt="Signature Preview"
                        className="max-h-20 object-contain"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive shadow-none"
                      onClick={() => form.setValue("signature", "", { shouldDirty: true })}
                    >
                      <X className="h-4 w-4 mr-1" /> Remove
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Field>
                      <FieldLabel className="text-[13px] font-medium text-foreground">Horizontal Offset (px)</FieldLabel>
                      <Input
                        type="number"
                        placeholder="0"
                        {...form.register("signatureOffsetX", { valueAsNumber: true })}
                      />
                    </Field>
                    <Field>
                      <FieldLabel className="text-[13px] font-medium text-foreground">Vertical Offset (px)</FieldLabel>
                      <Input
                        type="number"
                        placeholder="0"
                        {...form.register("signatureOffsetY", { valueAsNumber: true })}
                      />
                    </Field>
                    <Field className="col-span-2">
                      <FieldLabel className="text-[13px] font-medium text-foreground">Scale (e.g. 1 for normal, 1.5 for larger)</FieldLabel>
                      <Input
                        type="number"
                        step="0.1"
                        min="0.1"
                        max="5"
                        placeholder="1"
                        {...form.register("signatureScale", { valueAsNumber: true })}
                      />
                    </Field>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="signature-upload"
                  className="flex flex-col items-center justify-center h-28 rounded-[4px] border-2 border-dashed border-border hover:border-muted-foreground/50 cursor-pointer transition-colors"
                >
                  <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                  <span className="text-[13px] text-muted-foreground">Click to upload signature</span>
                  <span className="text-[11px] text-muted-foreground/60 mt-0.5">PNG, JPG up to 2MB</span>
                  <input
                    id="signature-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleSignatureUpload}
                  />
                </label>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
