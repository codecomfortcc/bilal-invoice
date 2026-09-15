import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { toast } from "sonner";
import { Download, Loader2, ArrowUpCircle, X } from "lucide-react";
import { useUiStore, useUpdaterStore } from "@/stores";
import { useDebugLogStore } from "@/stores/debug.store";
import { Button } from "@/components/ui/button";


interface UpdateInfo {
  version: string;
  body?: string;
}

interface ProgressPayload {
  downloaded: number;
  total?: number;
}

export function GlobalUpdateChecker() {
  const { 
    status, setStatus, 
    updateInfo, setUpdateInfo, 
    progress, setProgress, 
    downloadSpeed, setDownloadSpeed,
    isWidgetDismissed, dismissWidget
  } = useUpdaterStore();
  
  const developerMode = useUiStore((s) => s.developerMode);
  const addLog = useDebugLogStore((s) => s.addLog);

  const lastBytesRef = useRef(0);
  const lastTimeRef = useRef(Date.now());

  useEffect(() => {
    // Check for updates silently on mount
    const checkSilent = async () => {
      setStatus('checking');
      addLog("info", "[Updater] Checking for updates...");
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
          
          // Check if it's already downloaded to disk
          const isDownloaded = await invoke<boolean>("check_downloaded_update", { version: update.version });
          if (isDownloaded) {
            setStatus('downloaded');
            setProgress(100);
            addLog("success", `[Updater] Update v${update.version} already downloaded. Ready to install.`);
          } else {
            setStatus('available');
            addLog("success", `[Updater] Update available: v${update.version}`, update.body || undefined);
          }
        } else {
          setStatus('idle');
          addLog("info", "[Updater] Application is up to date");
        }
      } catch (e: any) {
        const errMsg = typeof e === "string" ? e : e?.message || JSON.stringify(e);
        setStatus('idle');
        if (typeof e === "string" && e.includes("Could not fetch a valid release JSON")) {
           addLog("info", "[Updater] No release JSON found — app is up to date");
        } else {
           addLog("error", "[Updater] Failed to check for updates", errMsg);
        }
      }
    };

    checkSilent();

    let downloadedBytes = 0;
    const unlistenProgress = listen<ProgressPayload>("updater-progress", (event) => {
      const { downloaded, total } = event.payload;
      downloadedBytes += downloaded;
      
      const now = Date.now();
      const timeDiff = (now - lastTimeRef.current) / 1000; // seconds
      
      if (timeDiff >= 0.5) {
        const bytesDiff = downloadedBytes - lastBytesRef.current;
        const speedBps = bytesDiff / timeDiff;
        let speedStr = `${(speedBps / 1024).toFixed(1)} KB/s`;
        if (speedBps > 1024 * 1024) {
          speedStr = `${(speedBps / (1024 * 1024)).toFixed(1)} MB/s`;
        }
        setDownloadSpeed(speedStr);
        lastTimeRef.current = now;
        lastBytesRef.current = downloadedBytes;
      }

      if (total) {
        setProgress((downloadedBytes / total) * 100);
      }
    });

    const unlistenStatus = listen<string>("updater-status", (event) => {
      if (event.payload === "downloaded") {
        setStatus('downloaded');
        setProgress(100);
        addLog("success", "[Updater] Download complete. Ready to install.");
      }
    });

    return () => {
      unlistenProgress.then((f) => f());
      unlistenStatus.then((f) => f());
    };
  }, []);

  const startDownload = async () => {
    setStatus('downloading');
    setProgress(0);
    setDownloadSpeed('0 B/s');
    lastBytesRef.current = 0;
    lastTimeRef.current = Date.now();
    
    addLog("info", "[Updater] Starting background download...");
    try {
      await invoke("download_update");
      // Status will be set to 'downloaded' via event listener
    } catch (e: any) {
      const errMsg = typeof e === "string" ? e : e?.message || JSON.stringify(e);
      if (developerMode) {
        toast.error(`Download failed: ${errMsg}`);
      } else {
        toast.error("Failed to download update");
      }
      addLog("error", "[Updater] Download failed", errMsg);
      setStatus('available');
    }
  };

  const installUpdate = async () => {
    setStatus('installing');
    addLog("info", "[Updater] Installing update and restarting...");
    try {
      await invoke("install_update");
    } catch (e: any) {
      const errMsg = typeof e === "string" ? e : e?.message || JSON.stringify(e);
      toast.error(`Install failed: ${errMsg}`);
      addLog("error", "[Updater] Install failed", errMsg);
      setStatus('downloaded');
    }
  };

  // Render a subtle floating widget for update states
  if (status === 'idle' || status === 'checking' || isWidgetDismissed) {
    return null; 
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 bg-background/95 backdrop-blur-md border border-border shadow-xl rounded-xl overflow-hidden flex flex-col transition-all animate-in slide-in-from-bottom-5">
      <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-2">
          <ArrowUpCircle className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">
            {status === 'downloading' ? 'Downloading Update...' : 
             status === 'installing' ? 'Installing...' : 'Update Ready'}
          </span>
        </div>
        {status === 'downloaded' && (
          <button onClick={dismissWidget} className="text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 space-y-3">
        {status === 'downloading' && (
          <>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{Math.round(progress)}%</span>
              <span className="font-mono">{downloadSpeed}</span>
            </div>
            {/* Dashed preparing animation if progress is 0 */}
            <div className="relative w-full h-1.5 bg-muted rounded-full overflow-hidden">
              {progress === 0 ? (
                <div className="absolute inset-0 bg-primary/40" style={{
                  backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,.15) 50%, rgba(255,255,255,.15) 75%, transparent 75%, transparent)',
                  backgroundSize: '1rem 1rem',
                  animation: 'progress-bar-stripes 1s linear infinite'
                }} />
              ) : (
                <div 
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              )}
            </div>
          </>
        )}

        {status === 'available' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Version {updateInfo?.version} is available.
            </p>
            <Button onClick={startDownload} size="sm" className="w-full">
              <Download className="mr-2 h-4 w-4" />
              Download Update
            </Button>
          </div>
        )}

        {status === 'downloaded' && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-muted-foreground">
              Version {updateInfo?.version} is ready. Restart to apply the update seamlessly.
            </p>
            <Button onClick={installUpdate} size="sm" className="w-full bg-sky-500 hover:bg-sky-600 text-white">
              Restart Now
            </Button>
          </div>
        )}
        
        {status === 'installing' && (
          <div className="flex items-center justify-center py-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Applying update...
          </div>
        )}
      </div>
    </div>
  );
}
