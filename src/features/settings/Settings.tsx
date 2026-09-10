import { useState, useEffect, useRef, useCallback } from "react";
import { FormProvider } from "react-hook-form";
import { saveCompanySettings } from "@/services/settings.service";
import { useCompanyStore } from "@/stores";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { useSettingsForm, type SettingsFormValues } from "@/hooks/use-settings-form";

// Import Settings Components
import { PersonalDetailsCard } from "./components/PersonalDetailsCard";
import { GlobalStylesCard } from "./components/GlobalStylesCard";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useUiStore } from "@/stores";
import { UpdaterCard } from "./components/UpdaterCard";

export function Settings() {
  const { setCompany: setGlobalCompany } = useCompanyStore();
  const { developerMode, setDeveloperMode } = useUiStore();
  const [isSaving, setIsSaving] = useState(false);
  const methods = useSettingsForm();
  const skipNextResetRef = (methods as any).__skipNextReset as React.MutableRefObject<boolean>;

  const doSave = useCallback(async (data: SettingsFormValues) => {
    setIsSaving(true);
    try {
      // Use the latest company state from the store to avoid stale closures
      const currentCompany = useCompanyStore.getState().company;
      
      // Merge with existing company settings to preserve fields edited in the invoice editor
      const updatedCompany = {
        ...(currentCompany || {}),
        id: "default_company",
        digitalSignatureName: data.digitalSignatureName || "",
        signatureOffsetX: data.signatureOffsetX || 0,
        signatureOffsetY: data.signatureOffsetY || 0,
        signatureScale: data.signatureScale || 1,
        signature: data.signature || "",
        showDigitalSignature: data.showDigitalSignature ?? true,
        showSignatureImage: data.showSignatureImage ?? true,
        autoSaveProducts: data.autoSaveProducts ?? true,
        billSize: data.billSize || "A4",
        numberFormat: data.numberFormat || "indian",
        dateFormat: data.dateFormat || "YYYY-MM-DD",
      };

      await saveCompanySettings(updatedCompany as any);
      
      // Tell useSettingsForm to NOT reset the form when it sees the company update we're about to trigger
      skipNextResetRef.current = true;
      setGlobalCompany(updatedCompany as any);
      
      // Reset isDirty state to prevent continuous saving loops
      methods.reset(data, { keepDefaultValues: true });
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  }, [methods, setGlobalCompany, skipNextResetRef]);

  // Auto-save on form changes with debounce
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const subscription = methods.watch((_value, { type }) => {
      // Only auto-save on actual user changes, not programmatic resets
      if (type !== "change") return;
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        methods.handleSubmit((data) => {
          doSave(data);
        })();
      }, 500);
    });
    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [methods, doSave]);

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto py-8 px-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage your signature image and advanced configurations. (Most details are now edited directly on your invoice preview).
            </p>
          </div>
          {isSaving && <div className="text-sm text-muted-foreground animate-pulse">Saving...</div>}
        </div>

        <Separator />

        <FormProvider {...methods}>
          <form className="space-y-6 pb-8">
            <div className="space-y-6">
              <UpdaterCard />
              <GlobalStylesCard />
              <PersonalDetailsCard />
            </div>
          </form>
        </FormProvider>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Advanced Tools</CardTitle>
            <CardDescription>Extra configurations and tools for advanced users.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/20">
              <div className="space-y-0.5">
                <Label htmlFor="developer-mode" className="text-[13px] font-medium text-foreground cursor-pointer">
                  Developer Mode
                </Label>
                <p className="text-[11px] text-muted-foreground">
                  Hold Alt and hover over text fields to reveal their internal identifiers.
                </p>
              </div>
              <Switch 
                id="developer-mode" 
                checked={developerMode}
                onCheckedChange={setDeveloperMode}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
