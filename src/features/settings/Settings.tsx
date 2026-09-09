import { useState, useEffect } from "react";
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
import { useUiStore } from "@/stores";
import { UpdaterCard } from "./components/UpdaterCard";

export function Settings() {
  const { setCompany: setGlobalCompany, company } = useCompanyStore();
  const { developerMode, setDeveloperMode } = useUiStore();
  const [isSaving, setIsSaving] = useState(false);
  const methods = useSettingsForm();

  const onSubmit = async (data: SettingsFormValues) => {
    if (!methods.formState.isDirty) return;
    
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
      };

      await saveCompanySettings(updatedCompany as any);
      setGlobalCompany(updatedCompany as any);
      
      // Reset isDirty state to prevent continuous saving loops
      methods.reset(data, { keepDefaultValues: true });
    } catch (error) {
      toast.error("Failed to save settings");
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const subscription = methods.watch(() => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // We use handleSubmit to validate, but onSubmit handles the dirty check
        methods.handleSubmit((data) => {
           // Call the latest onSubmit function
           onSubmit(data);
        })();
      }, 500);
    });
    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, [methods.watch, methods.handleSubmit, methods.formState.isDirty]);

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

        <Separator />
        
        <div className="py-2">
          <h3 className="text-lg font-medium mb-4">Advanced Tools</h3>
          <div className="flex items-center space-x-2">
            <Switch 
              id="developer-mode" 
              checked={developerMode}
              onCheckedChange={setDeveloperMode}
            />
            <Label htmlFor="developer-mode" className="flex flex-col">
              <span>Developer Mode</span>
              <span className="font-normal text-sm text-muted-foreground">
                Hold Alt and hover over text fields to reveal their internal identifiers.
              </span>
            </Label>
          </div>
        </div>
      </div>
    </div>
  );
}

