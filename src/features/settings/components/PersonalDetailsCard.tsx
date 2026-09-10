import { useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";
import { User, Upload, X, Settings, Trash2, MoveHorizontal, MoveVertical, Maximize2, ImageIcon } from "lucide-react";
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
          
          <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/20">
            <div className="space-y-0.5">
              <h4 className="text-[13px] font-medium text-foreground">Date Format</h4>
              <p className="text-[11px] text-muted-foreground">Choose how dates are rendered on invoices.</p>
            </div>
            <Controller
              control={form.control}
              name="dateFormat"
              render={({ field }) => (
                <Select value={field.value || "YYYY-MM-DD"} onValueChange={field.onChange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select date format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YYYY-MM-DD">2026-09-09 (YYYY-MM-DD)</SelectItem>
                    <SelectItem value="DD-MM-YYYY">09-09-2026 (DD-MM-YYYY)</SelectItem>
                    <SelectItem value="DD-MM-YY">09-09-26 (DD-MM-YY)</SelectItem>
                    <SelectItem value="DD/MM/YYYY">09/09/2026 (DD/MM/YYYY)</SelectItem>
                    <SelectItem value="DD MMM YYYY">09 Sep 2026</SelectItem>
                    <SelectItem value="DD MMMM YYYY">09 September 2026</SelectItem>
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
                <div className="space-y-3">
                  {/* Signature Preview Card */}
                  <div className="rounded-lg border border-border/50 overflow-hidden">
                    <div
                      className="relative p-8 flex items-center justify-center"
                      style={{
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 50%, #f0f1f3 100%)',
                      }}
                    >
                      <div
                        className="absolute inset-0 opacity-[0.06]"
                        style={{
                          backgroundImage: 'radial-gradient(circle, #94a3b8 0.5px, transparent 0.5px)',
                          backgroundSize: '12px 12px',
                        }}
                      />
                      <img
                        src={signature}
                        alt="Signature Preview"
                        className="max-h-24 object-contain relative z-10 drop-shadow-sm"
                      />
                      {/* Overlay Remove Button */}
                      <button
                        type="button"
                        className="absolute top-2.5 right-2.5 z-20 p-1.5 rounded-md bg-black/40 hover:bg-red-500/80 text-white/70 hover:text-white backdrop-blur-sm transition-all duration-200 cursor-pointer"
                        onClick={() => form.setValue("signature", "", { shouldDirty: true })}
                        title="Remove signature"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Adjustment Controls Bar */}
                    <div className="border-t border-border/50 bg-muted/30 px-4 py-3">
                      <div className="flex items-center gap-1.5 mb-2.5">
                        <ImageIcon className="h-3 w-3 text-muted-foreground/60" />
                        <span className="text-[11px] font-medium text-muted-foreground/80 uppercase tracking-wider">Position & Scale</span>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="flex items-center gap-2 bg-background/60 rounded-md px-3 py-2 border border-border/40">
                          <MoveHorizontal className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span className="text-[10px] text-muted-foreground/60 leading-none">X Offset</span>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="0"
                              className="h-auto p-0 border-0 bg-transparent text-[13px] font-medium shadow-none focus-visible:ring-0"
                              onKeyDown={(e) => {
                                if (!/[\d.\-]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'].includes(e.key)) e.preventDefault();
                              }}
                              {...form.register("signatureOffsetX", { valueAsNumber: true })}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-background/60 rounded-md px-3 py-2 border border-border/40">
                          <MoveVertical className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span className="text-[10px] text-muted-foreground/60 leading-none">Y Offset</span>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="0"
                              className="h-auto p-0 border-0 bg-transparent text-[13px] font-medium shadow-none focus-visible:ring-0"
                              onKeyDown={(e) => {
                                if (!/[\d.\-]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'].includes(e.key)) e.preventDefault();
                              }}
                              {...form.register("signatureOffsetY", { valueAsNumber: true })}
                            />
                          </div>
                        </div>
                        <div className="flex items-center gap-2 bg-background/60 rounded-md px-3 py-2 border border-border/40">
                          <Maximize2 className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span className="text-[10px] text-muted-foreground/60 leading-none">Scale</span>
                            <Input
                              type="text"
                              inputMode="decimal"
                              placeholder="1"
                              className="h-auto p-0 border-0 bg-transparent text-[13px] font-medium shadow-none focus-visible:ring-0"
                              onKeyDown={(e) => {
                                if (!/[\d.\-]/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab','Home','End'].includes(e.key)) e.preventDefault();
                              }}
                              {...form.register("signatureScale", { valueAsNumber: true })}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Re-upload Button */}
                  <label
                    htmlFor="signature-reupload"
                    className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-md border border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all duration-200 group"
                  >
                    <Upload className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary/70 transition-colors" />
                    <span className="text-[12px] text-muted-foreground group-hover:text-primary/70 transition-colors">Replace with another image</span>
                    <input
                      id="signature-reupload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleSignatureUpload}
                    />
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="signature-upload"
                  className="flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 cursor-pointer transition-all duration-200 group"
                >
                  <div className="p-2.5 rounded-full bg-muted/50 group-hover:bg-primary/10 transition-colors mb-2.5">
                    <Upload className="h-5 w-5 text-muted-foreground group-hover:text-primary/70 transition-colors" />
                  </div>
                  <span className="text-[13px] font-medium text-muted-foreground group-hover:text-foreground/80 transition-colors">Click to upload signature</span>
                  <span className="text-[11px] text-muted-foreground/50 mt-1">PNG, JPG up to 2MB</span>
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
