import { useState, useEffect } from "react";
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
import { Download } from "lucide-react";
import { useUiStore } from "@/stores";
import { useDebugLogStore } from "@/stores/debug.store";

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
        // Silently ignore errors (e.g. 404 no release, or no internet)
      }
    };

    checkSilent();

    const unlistenProgress = listen<ProgressPayload>("updater-progress", (event) => {
      const { downloaded, total } = event.payload;
      if (total) {
        setProgress((downloaded / total) * 100);
      }
    });

    const unlistenStatus = listen<string>("updater-status", (event) => {
      if (event.payload === "downloaded") {
        setIsDownloading(false);
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
      setUpdateInfo(null);
    }
  };

  return (
    <AlertDialog open={!!updateInfo}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Update Available</AlertDialogTitle>
          <AlertDialogDescription>
            A new version of Bilal Invoice (v{updateInfo?.version}) is available. Would you like to download and install it now?
          </AlertDialogDescription>
        </AlertDialogHeader>

        {isDownloading && (
          <div className="space-y-2 py-4">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Downloading update...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
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
