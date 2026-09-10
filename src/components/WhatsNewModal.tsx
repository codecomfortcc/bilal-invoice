import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { useUiStore } from "@/stores";
import { CHANGELOG } from "@/data/changelog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import semver from "semver";
import { ReleaseNotesView } from "@/components/ReleaseNotesView";
import type { ParsedReleaseNotes } from "@/lib/releaseNotesParser";

export function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string>("");
  const { lastSeenVersion, setLastSeenVersion } = useUiStore();

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const appVersion = await getVersion();
        setCurrentVersion(appVersion);

        if (!lastSeenVersion || semver.gt(appVersion, lastSeenVersion)) {
          if (CHANGELOG[appVersion]) {
            setIsOpen(true);
          } else {
            setLastSeenVersion(appVersion);
          }
        }
      } catch (e) {
        console.error("Failed to check version for What's New modal", e);
      }
    };

    const timer = setTimeout(() => {
      checkVersion();
    }, 1000);

    return () => clearTimeout(timer);
  }, [lastSeenVersion, setLastSeenVersion]);

  const handleClose = () => {
    setIsOpen(false);
    if (currentVersion) {
      setLastSeenVersion(currentVersion);
    }
  };

  const rawNotes = currentVersion ? CHANGELOG[currentVersion] : null;
  // Map ChangelogVersion to ParsedReleaseNotes format
  const notes: ParsedReleaseNotes | null = rawNotes ? {
    features: rawNotes.features || [],
    fixes: rawNotes.fixes || [],
    improvements: rawNotes.improvements || []
  } : null;

  if (!notes) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            What's New in v{currentVersion}
          </DialogTitle>
          <DialogDescription>
            We've been hard at work improving Bilal Invoice. Here's what changed!
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 max-h-[60vh] overflow-y-auto pr-2">
          <ReleaseNotesView notes={notes} />
        </div>

        <DialogFooter>
          <Button onClick={handleClose} className="w-full sm:w-auto">
            I Understand
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
