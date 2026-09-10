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
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useUiStore } from "@/stores";
import { UpdaterCard } from "./components/UpdaterCard";
import { invoke } from "@tauri-apps/api/core";
import { useDebugLogStore, type LogLevel } from "@/stores/debug.store";
import { Terminal, Trash2, ExternalLink, Bug } from "lucide-react";

export function Settings() {
  const { setCompany: setGlobalCompany } = useCompanyStore();
  const { developerMode, setDeveloperMode } = useUiStore();
  const [isSaving, setIsSaving] = useState(false);
  const methods = useSettingsForm();
  const skipNextResetRef = (methods as any).__skipNextReset as React.MutableRefObject<boolean>;
  const logs = useDebugLogStore((s) => s.logs);
  const clearLogs = useDebugLogStore((s) => s.clearLogs);

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

  const openDevTools = async () => {
    try {
      await invoke("open_devtools");
    } catch (e) {
      console.error("Failed to open DevTools:", e);
    }
  };

  const levelColors: Record<LogLevel, string> = {
    info: "text-blue-400",
    warn: "text-yellow-400",
    error: "text-red-400",
    success: "text-emerald-400",
  };

  const levelBg: Record<LogLevel, string> = {
    info: "bg-blue-400/10",
    warn: "bg-yellow-400/10",
    error: "bg-red-400/10",
    success: "bg-emerald-400/10",
  };

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
          <CardContent className="space-y-3">
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

            {developerMode && (
              <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                {/* Developer Tools Bar */}
                <div className="flex items-center gap-2 p-3 border border-border rounded-md bg-muted/20">
                  <Bug className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[13px] font-medium text-foreground flex-1">Developer Tools</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xs gap-1.5"
                    onClick={openDevTools}
                  >
                    <ExternalLink className="h-3 w-3" />
                    Open DevTools
                  </Button>
                </div>

                {/* Debug Log Panel */}
                <div className="border border-border rounded-md overflow-hidden">
                  <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-b border-border">
                    <div className="flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-[12px] font-medium text-muted-foreground uppercase tracking-wider">Debug Log</span>
                      {logs.length > 0 && (
                        <span className="text-[10px] text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded-full ml-1">{logs.length}</span>
                      )}
                    </div>
                    {logs.length > 0 && (
                      <button
                        type="button"
                        onClick={clearLogs}
                        className="text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="max-h-48 overflow-y-auto bg-background/50">
                    {logs.length === 0 ? (
                      <div className="flex items-center justify-center py-6 text-[12px] text-muted-foreground/50">
                        No debug logs yet. Try checking for updates.
                      </div>
                    ) : (
                      <div className="divide-y divide-border/30">
                        {logs.map((log) => (
                          <div
                            key={log.id}
                            className={`px-3 py-2 text-[12px] flex items-start gap-2 ${levelBg[log.level]}`}
                          >
                            <span className="text-[10px] text-muted-foreground/60 font-mono shrink-0 mt-0.5 min-w-[55px]">
                              {log.timestamp.toLocaleTimeString()}
                            </span>
                            <span className={`font-mono font-semibold uppercase text-[10px] shrink-0 mt-0.5 min-w-[42px] ${levelColors[log.level]}`}>
                              {log.level}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="text-foreground/90">{log.message}</span>
                              {log.detail && (
                                <p className="text-[11px] text-muted-foreground/70 mt-0.5 font-mono break-all">{log.detail}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
