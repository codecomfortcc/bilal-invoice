import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getVersion } from "@tauri-apps/api/app";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, Download, Loader2 } from "lucide-react";
import { useUiStore } from "@/stores";
import { useDebugLogStore } from "@/stores/debug.store";
import { parseReleaseNotes } from "@/lib/releaseNotesParser";
import { ReleaseNotesView } from "@/components/ReleaseNotesView";

interface UpdateInfo {
  version: string;
  body?: string;
}

interface ProgressPayload {
  downloaded: number;
  total?: number;
}

export function UpdaterCard() {
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentVersion, setCurrentVersion] = useState<string>("");
  const developerMode = useUiStore((s) => s.developerMode);
  const addLog = useDebugLogStore((s) => s.addLog);

  useEffect(() => {
    getVersion().then(setCurrentVersion).catch(console.error);

    let downloadedBytes = 0;
    const unlistenProgress = listen<ProgressPayload>("updater-progress", (event) => {
      const { downloaded, total } = event.payload;
      downloadedBytes += downloaded;
      if (total) {
        setProgress((downloadedBytes / total) * 100);
        if (downloadedBytes >= total) {
          setIsInstalling(true);
        }
      }
    });

    const unlistenStatus = listen<string>("updater-status", (event) => {
      if (event.payload === "downloaded") {
        setIsInstalling(true);
        setProgress(100);
      }
    });

    return () => {
      unlistenProgress.then((f) => f());
      unlistenStatus.then((f) => f());
    };
  }, []);

  const checkForUpdates = async () => {
    setIsChecking(true);
    setUpdateInfo(null);
    addLog("info", "Checking for updates...");
    try {
      const update = await invoke<UpdateInfo | null>("check_for_updates");
      if (update) {
        try {
          const res = await fetch(`https://api.github.com/repos/codecomfortcc/bilal-invoice/releases/tags/v${update.version}`);
          if (res.ok) {
            const data = await res.json();
            if (data.body) {
              update.body = data.body;
            }
          }
        } catch (githubErr) {
          console.error("Failed to fetch live release notes", githubErr);
        }
        setUpdateInfo(update);
        addLog("success", `Update available: v${update.version}`, update.body || undefined);
        if (developerMode) {
          toast.success(`Update found: v${update.version}`);
        }
      } else {
        toast.success("Application is up to date");
        addLog("info", "Application is up to date");
      }
    } catch (e: any) {
      const errMsg = typeof e === "string" ? e : e?.message || JSON.stringify(e);
      if (typeof e === "string" && e.includes("Could not fetch a valid release JSON")) {
        toast.success("Application is up to date");
        addLog("info", "No release JSON found — app is up to date");
      } else {
        if (developerMode) {
          toast.error(`Update check failed: ${errMsg}`);
        } else {
          toast.error("Failed to check for updates");
        }
        addLog("error", "Failed to check for updates", errMsg);
      }
    } finally {
      setIsChecking(false);
    }
  };

  const installUpdate = async () => {
    setIsDownloading(true);
    setIsInstalling(false);
    setProgress(0);
    addLog("info", "Starting update download & install...");
    try {
      await invoke("install_update");
      addLog("success", "Update installed — restarting app");
      // The app will restart automatically on success
    } catch (e: any) {
      const errMsg = typeof e === "string" ? e : e?.message || JSON.stringify(e);
      if (developerMode) {
        toast.error(`Install failed: ${errMsg}`, { duration: 8000 });
      } else {
        toast.error("Failed to install update");
      }
      addLog("error", "Failed to install update", errMsg);
      setIsDownloading(false);
      setIsInstalling(false);
    }
  };

  const parsedNotes = useMemo(() => {
    if (!updateInfo?.body) return null;
    return parseReleaseNotes(updateInfo.body);
  }, [updateInfo]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Application Update</CardTitle>
            <CardDescription>Check for new versions and install updates automatically.</CardDescription>
          </div>
          {currentVersion && (
            <div className="text-sm font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md">
              v{currentVersion}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {updateInfo ? (
          <div className="space-y-4">
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium text-sm mb-4">New Version Available: v{updateInfo.version}</h4>
              {parsedNotes ? (
                <ReleaseNotesView notes={parsedNotes} />
              ) : updateInfo.body ? (
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{updateInfo.body}</p>
              ) : null}
            </div>

            {isDownloading ? (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  {isInstalling ? (
                    <span className="flex items-center text-primary font-medium">
                      <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                      Installing... Please wait (app will restart)
                    </span>
                  ) : (
                    <span>Downloading update...</span>
                  )}
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${isInstalling ? 'bg-primary/60 animate-pulse' : 'bg-primary'}`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <Button onClick={installUpdate} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Download & Install
              </Button>
            )}
          </div>
        ) : (
          <Button onClick={checkForUpdates} disabled={isChecking} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className={`mr-2 h-4 w-4 ${isChecking ? "animate-spin" : ""}`} />
            {isChecking ? "Checking..." : "Check for Updates"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
