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
import { Sparkles, ArrowRight } from "lucide-react";
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
            features: [],
            fixes: [],
            improvements: [
              "We've completely redesigned our logo to feel more modern and fresh.",
              "Squashed a few under-the-hood bugs to keep everything running smoothly."
            ]
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
      <DialogContent className="sm:max-w-[400px] max-h-[80vh] p-5 gap-4 rounded-2xl border border-border/80 shadow-xl bg-popover overflow-hidden">
        
        {/* Compact Header */}
        <DialogHeader className="text-left gap-1">
          <div className="flex items-center gap-1.5 text-primary text-xs font-semibold">
            <Sparkles className="h-3.5 w-3.5" />
            <span>v{currentVersion} Update</span>
          </div>
          <DialogTitle className="text-lg font-bold tracking-tight">
            What's New
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            We've refreshed our brand logo and improved app performance.
          </DialogDescription>
        </DialogHeader>

        {/* Unique Animated Blip Transition Container */}
        <div className="relative overflow-hidden flex items-center justify-between gap-2 p-3.5 rounded-xl bg-muted/40 border border-border/40 select-none">
          {/* Background Ambient Glow */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-primary/10 via-primary/5 to-transparent pointer-events-none" />

          {/* Old Logo Component */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, x: -10 }}
            animate={{ opacity: 0.65, scale: 0.95, x: 0 }}
            whileHover={{ scale: 1, opacity: 0.9 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-2.5 z-10 cursor-pointer"
          >
            <div className="w-12 h-12 rounded-xl bg-background/90 border border-border/60 p-2 shadow-xs flex items-center justify-center">
              <img src="/old-icon.png" alt="Old Logo" className="w-full h-full object-contain filter grayscale opacity-70" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-muted-foreground line-through opacity-80">Old Logo</span>
              <span className="text-[10px] text-muted-foreground/70">Previous</span>
            </div>
          </motion.div>

          {/* Animated Connecting Track with Traveling "Blip" */}
          <div className="flex-1 flex items-center justify-center relative px-2 z-10 h-6">
            {/* Track Line */}
            <div className="w-full h-[2px] bg-border/80 rounded-full relative overflow-hidden">
              {/* Travelling Energy Blip Particle */}
              <motion.div
                animate={{
                  x: ["-100%", "200%"],
                  opacity: [0, 1, 1, 0],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  repeatDelay: 0.4,
                  ease: "easeInOut",
                }}
                className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-primary to-transparent"
              />
            </div>

            {/* Central Blip Pulse Icon */}
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
                boxShadow: [
                  "0 0 0px rgba(14,165,233,0)",
                  "0 0 10px rgba(14,165,233,0.5)",
                  "0 0 0px rgba(14,165,233,0)"
                ]
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                repeatDelay: 0.4,
              }}
              className="absolute bg-background rounded-full p-1 border border-primary/40 shadow-xs z-10"
            >
              <ArrowRight className="h-3.5 w-3.5 text-primary" />
            </motion.div>
          </div>

          {/* New Logo Component with Blip Pulse Effect */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.4, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            whileHover={{ scale: 1.05 }}
            transition={{ 
              duration: 0.6, 
              delay: 0.4,
              type: "spring",
              stiffness: 300,
              damping: 18
            }}
            className="flex items-center gap-2.5 z-10 cursor-pointer"
          >
            <motion.div 
              animate={{ 
                scale: [1, 1.06, 1],
                boxShadow: [
                  "0 0 0px rgba(14,165,233,0)", 
                  "0 0 18px rgba(14,165,233,0.4)", 
                  "0 0 2px rgba(14,165,233,0.1)"
                ] 
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                repeatDelay: 0.4,
                delay: 1.2
              }}
              className="relative w-12 h-12 rounded-xl bg-white border-2 border-primary/50 p-2 shadow-md flex items-center justify-center"
            >
              <img src="/icon.png" alt="New Logo" className="w-full h-full object-contain" />
              
              {/* Blipping NEW Badge */}
              <motion.span 
                animate={{
                  scale: [1, 1.15, 1],
                }}
                transition={{
                  duration: 1.8,
                  repeat: Infinity,
                  repeatDelay: 0.4,
                  delay: 1.3
                }}
                className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-[9px] font-extrabold px-1.5 py-0.3 rounded-full shadow-md tracking-wider uppercase"
              >
                NEW
              </motion.span>
            </motion.div>

            <div className="flex flex-col">
              <motion.span 
                animate={{
                  color: ["var(--primary)", "rgba(14,165,233,0.8)", "var(--primary)"]
                }}
                transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 0.4, delay: 1.2 }}
                className="text-xs font-bold text-primary"
              >
                New Logo
              </motion.span>
              <span className="text-[10px] text-muted-foreground font-medium">Current</span>
            </div>
          </motion.div>

        </div>

        {/* Release Notes View */}
        <div className="max-h-[160px] overflow-y-auto pr-1">
          <ReleaseNotesView notes={notes} />
        </div>

        {/* Action Button */}
        <DialogFooter className="pt-2 sm:justify-stretch">
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
