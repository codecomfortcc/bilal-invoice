import { useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, Download, Loader2 } from "lucide-react";
import { useUiStore, useUpdaterStore } from "@/stores";
import { useDebugLogStore } from "@/stores/debug.store";
import { parseReleaseNotes } from "@/lib/releaseNotesParser";
import { ReleaseNotesView } from "@/components/ReleaseNotesView";

export function UpdaterCard() {
  const { 
    status, setStatus, 
    updateInfo, setUpdateInfo, 
    progress, downloadSpeed, setProgress, setDownloadSpeed
  } = useUpdaterStore();

  const developerMode = useUiStore((s) => s.developerMode);
  const addLog = useDebugLogStore((s) => s.addLog);

  useEffect(() => {
    // Current version is fetched natively, but let's just let it be handled locally if needed.
    // Actually, getting current version is useful for the card header.
  }, []);

  const checkForUpdates = async () => {
    setStatus('checking');
    addLog("info", "[UpdaterCard] Checking for updates...");
    try {
      const update = await invoke<{version: string, body?: string} | null>("check_for_updates");
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
        
        // Check if it's already downloaded
        const isDownloaded = await invoke<boolean>("check_downloaded_update", { version: update.version });
        if (isDownloaded) {
          setStatus('downloaded');
          setProgress(100);
          addLog("success", `Update v${update.version} already downloaded.`, update.body || undefined);
        } else {
          setStatus('available');
          addLog("success", `Update available: v${update.version}`, update.body || undefined);
          if (developerMode) {
            toast.success(`Update found: v${update.version}`);
          }
        }
      } else {
        setStatus('idle');
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
      setStatus('idle');
    }
  };

  const startDownload = async () => {
    setStatus('downloading');
    setProgress(0);
    setDownloadSpeed('0 B/s');
    addLog("info", "Starting update download in background...");
    try {
      await invoke("download_update");
      // status changes to 'downloaded' automatically via GlobalUpdateChecker events
    } catch (e: any) {
      const errMsg = typeof e === "string" ? e : e?.message || JSON.stringify(e);
      if (developerMode) {
        toast.error(`Download failed: ${errMsg}`, { duration: 8000 });
      } else {
        toast.error("Failed to download update");
      }
      addLog("error", "Failed to download update", errMsg);
      setStatus('available');
    }
  };

  const installUpdate = async () => {
    setStatus('installing');
    addLog("info", "Restarting to apply update...");
    try {
      await invoke("install_update");
    } catch (e: any) {
      const errMsg = typeof e === "string" ? e : e?.message || JSON.stringify(e);
      toast.error(`Install failed: ${errMsg}`);
      addLog("error", "Failed to install update", errMsg);
      setStatus('downloaded');
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

            {status === 'downloading' && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Downloading update...</span>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-primary/80">{downloadSpeed}</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
            
            {status === 'downloaded' && (
              <div className="flex items-center gap-3">
                <Button onClick={installUpdate} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white">
                  Restart to Update
                </Button>
                <span className="text-xs text-muted-foreground">Download complete. Restart to apply.</span>
              </div>
            )}
            
            {status === 'installing' && (
               <div className="flex items-center text-primary font-medium text-sm">
                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                 Applying update and restarting...
               </div>
            )}

            {status === 'available' && (
              <Button onClick={startDownload} className="w-full sm:w-auto">
                <Download className="mr-2 h-4 w-4" />
                Download Update
              </Button>
            )}
          </div>
        ) : (
          <Button onClick={checkForUpdates} disabled={status === 'checking'} variant="outline" className="w-full sm:w-auto">
            <RefreshCw className={`mr-2 h-4 w-4 ${status === 'checking' ? "animate-spin" : ""}`} />
            {status === 'checking' ? "Checking..." : "Check for Updates"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
