import { useState, useEffect, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Download, Loader2 } from "lucide-react";
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

export function GlobalUpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const developerMode = useUiStore((s) => s.developerMode);
  const addLog = useDebugLogStore((s) => s.addLog);

  useEffect(() => {
    // Check for updates silently on mount
    const checkSilent = async () => {
      addLog("info", "[Global] Checking for updates silently...");
      try {
        const update = await invoke<UpdateInfo | null>("check_for_updates");
        if (update) {
          // Try to fetch live release notes from GitHub API so user can edit them dynamically
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
          addLog("success", `[Global] Update available: v${update.version}`, update.body || undefined);
        } else {
          addLog("info", "[Global] Application is up to date");
        }
      } catch (e: any) {
        const errMsg = typeof e === "string" ? e : e?.message || JSON.stringify(e);
        if (typeof e === "string" && e.includes("Could not fetch a valid release JSON")) {
           addLog("info", "[Global] No release JSON found — app is up to date");
        } else {
           addLog("error", "[Global] Failed to check for updates", errMsg);
        }
      }
    };

    checkSilent();

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

  const handleInstall = async () => {
    setIsDownloading(true);
    setIsInstalling(false);
    setProgress(0);
    addLog("info", "[Global] Starting update download & install...");
    try {
      await invoke("install_update");
      addLog("success", "[Global] Update installed — restarting app");
      // App will restart on success
    } catch (e: any) {
      const errMsg = typeof e === "string" ? e : e?.message || JSON.stringify(e);
      if (developerMode) {
        toast.error(`Install failed: ${errMsg}`, { duration: 8000 });
      } else {
        toast.error("Failed to install update");
      }
      addLog("error", "[Global] Failed to install update", errMsg);
      setIsDownloading(false);
      setIsInstalling(false);
      setUpdateInfo(null);
    }
  };

  const parsedNotes = useMemo(() => {
    if (!updateInfo?.body) return null;
    return parseReleaseNotes(updateInfo.body);
  }, [updateInfo]);

  return (
    <AlertDialog open={!!updateInfo}>
      <AlertDialogContent className="sm:max-w-[500px]">
        <AlertDialogHeader>
          <AlertDialogTitle>Update Available</AlertDialogTitle>
          <AlertDialogDescription>
            A new version of Bilal Invoice (v{updateInfo?.version}) is available. Would you like to download and install it now?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {parsedNotes && (
          <div className="py-2 max-h-[40vh] overflow-y-auto pr-2 bg-muted/30 rounded-md p-4">
             <ReleaseNotesView notes={parsedNotes} />
          </div>
        )}

        {isDownloading && (
          <div className="space-y-2 py-4">
            <div className="flex justify-between text-xs text-muted-foreground">
              {isInstalling ? (
                <span className="flex items-center text-primary font-medium">
                  <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
                  Installing... Please wait
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
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setUpdateInfo(null)} disabled={isDownloading}>
            Later
          </AlertDialogCancel>
          <Button onClick={handleInstall} disabled={isDownloading}>
            <Download className="mr-2 h-4 w-4" />
            {isDownloading ? "Downloading..." : "Install Now"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Temporary Button wrapper to avoid import errors since Button isn't imported from ui
function Button({ children, disabled, onClick }: any) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
    >
      {children}
    </button>
  );
}
