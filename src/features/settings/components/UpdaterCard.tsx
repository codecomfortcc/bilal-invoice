import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getVersion } from "@tauri-apps/api/app";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw, Download } from "lucide-react";

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
  const [updateInfo, setUpdateInfo] = useState<UpdateInfo | null>(null);
  const [progress, setProgress] = useState(0);
  const [currentVersion, setCurrentVersion] = useState<string>("");

  useEffect(() => {
    getVersion().then(setCurrentVersion).catch(console.error);

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

  const checkForUpdates = async () => {
    setIsChecking(true);
    setUpdateInfo(null);
    try {
      const update = await invoke<UpdateInfo | null>("check_for_updates");
      if (update) {
        setUpdateInfo(update);
      } else {
        toast.success("Application is up to date");
      }
    } catch (e: any) {
      if (typeof e === "string" && e.includes("Could not fetch a valid release JSON")) {
        toast.success("Application is up to date");
      } else {
        toast.error("Failed to check for updates");
        console.error(e);
      }
    } finally {
      setIsChecking(false);
    }
  };

  const installUpdate = async () => {
    setIsDownloading(true);
    setProgress(0);
    try {
      await invoke("install_update");
      // The app will restart automatically on success
    } catch (e) {
      toast.error("Failed to install update");
      console.error(e);
      setIsDownloading(false);
    }
  };

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
              <h4 className="font-medium text-sm mb-1">New Version Available: v{updateInfo.version}</h4>
              {updateInfo.body && (
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">{updateInfo.body}</p>
              )}
            </div>

            {isDownloading ? (
              <div className="space-y-2">
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
