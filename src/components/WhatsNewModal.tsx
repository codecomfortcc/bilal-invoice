import { useState, useEffect } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { useUiStore } from "@/stores";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Image as ImageIcon, Settings2 } from "lucide-react";
import semver from "semver";
import { ReleaseNotesView } from "@/components/ReleaseNotesView";
import { parseReleaseNotes, type ParsedReleaseNotes } from "@/lib/releaseNotesParser";
import { motion } from "framer-motion";

export function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string>("");
  const [notes, setNotes] = useState<ParsedReleaseNotes | null>(null);
  const { lastSeenVersion, setLastSeenVersion } = useUiStore();

  useEffect(() => {
    const checkVersion = async () => {
      try {
        const appVersion = await getVersion();
        setCurrentVersion(appVersion);

        if (!lastSeenVersion || semver.gt(appVersion, lastSeenVersion)) {
          try {
            const res = await fetch(`https://api.github.com/repos/codecomfortcc/bilal-invoice/releases/tags/v${appVersion}`);
            if (res.ok) {
              const data = await res.json();
              if (data.body) {
                const parsed = parseReleaseNotes(data.body);
                if (Object.keys(parsed).length > 0) {
                  setNotes(parsed);
                  setIsOpen(true);
                  return;
                }
              }
            }
          } catch (githubErr) {
            console.error("Failed to fetch live release notes", githubErr);
          }
          
          setNotes({
            features: [
              "Added 'Auto Date' toggle to automatically pick the current date.",
              "Signatures can now be toggled between Text and Image formats.",
              "Invoice headings and dates now support full font styling."
            ],
            fixes: [],
            improvements: []
          });
          setIsOpen(true);
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

  if (!notes) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-[420px] max-h-[85vh] flex flex-col p-5 gap-4 rounded-2xl border border-border/80 shadow-xl bg-popover overflow-hidden">
        
        {/* Compact Header */}
        <DialogHeader className="text-left gap-1 shrink-0">
          <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>v{currentVersion} Update</span>
          </div>
          <DialogTitle className="text-lg font-bold tracking-tight">
            What's New
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            We've supercharged signatures and dates with new styling options and smart toggles!
          </DialogDescription>
        </DialogHeader>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 gap-3 select-none shrink-0">
          
          {/* Highlight 1: Auto Date Toggle */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-muted/30 border border-border/40 overflow-hidden group">
            <div className="flex items-center gap-1.5 text-primary text-xs font-semibold mb-1">
              <Settings2 className="h-3.5 w-3.5" />
              Smart Toggles
            </div>
            
            {/* Image Container with Zoom Animation */}
            <div className="relative w-full h-20 rounded-lg bg-background/50 border border-border/60 overflow-hidden flex items-center justify-center">
              <motion.img 
                src="/auto-date-update.png" 
                alt="Auto Date Toggle Feature" 
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.15 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                onError={(e) => {
                  // Fallback if user hasn't dropped the image yet
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                  (e.target as HTMLImageElement).className = 'w-8 h-8 opacity-50';
                }}
              />
            </div>
            
            <p className="text-[10px] text-muted-foreground mt-1">
              Automatically use today's date in your invoices.
            </p>
          </div>

          {/* Highlight 2: Text Signature */}
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-muted/30 border border-border/40 overflow-hidden group">
            <div className="flex items-center gap-1.5 text-primary text-xs font-semibold mb-1">
              <ImageIcon className="h-3.5 w-3.5" />
              Text Signatures
            </div>
            
            {/* Image Container with Zoom Animation */}
            <div className="relative w-full h-20 rounded-lg bg-background/50 border border-border/60 overflow-hidden flex items-center justify-center">
              <motion.img 
                src="/digital-text-signature.png" 
                alt="Text Signature Feature" 
                className="w-full h-full object-cover"
                whileHover={{ scale: 1.15 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                onError={(e) => {
                  // Fallback if user hasn't dropped the image yet
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                  (e.target as HTMLImageElement).className = 'w-8 h-8 opacity-50';
                }}
              />
            </div>
            
            <p className="text-[10px] text-muted-foreground mt-1">
              Easily type your signature or use an image.
            </p>
          </div>

        </div>

        {/* Release Notes View */}
        <div className="flex-1 min-h-[80px] overflow-y-auto pr-1">
          <ReleaseNotesView notes={notes} />
        </div>

        {/* Action Button */}
        <DialogFooter className="pt-2 sm:justify-stretch shrink-0">
          <Button 
            onClick={handleClose}
            className="w-full h-9 text-xs font-medium rounded-lg"
          >
            Got it
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
