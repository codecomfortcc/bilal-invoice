import { useState, useEffect, useRef } from "react";
import { getVersion } from "@tauri-apps/api/app";
import { useUiStore } from "@/stores";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Keyboard, 
  Command, 
  Layout, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  X,
  FileText,
  ArrowRight,
  ChevronsLeftRight
} from "lucide-react";
import semver from "semver";
import { ReleaseNotesView } from "@/components/ReleaseNotesView";
import { parseReleaseNotes, type ParsedReleaseNotes } from "@/lib/releaseNotesParser";
import { motion, AnimatePresence } from "framer-motion";

function BeforeAfterSlider({
  oldImage,
  newImage,
}: {
  oldImage: string;
  newImage: string;
}) {
  const [sliderPos, setSliderPos] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const percent = (x / rect.width) * 100;
    setSliderPos(percent);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    handleMove(e.clientX);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      className="relative w-full h-64 sm:h-72 md:h-80 rounded-2xl bg-zinc-950 border border-border/60 overflow-hidden select-none shadow-2xl cursor-ew-resize group"
    >
      {/* Layer 1: New UI (Right side underneath) */}
      <div className="absolute inset-0 flex items-center justify-center p-3">
        <div className="absolute top-3 right-3 z-10 px-2.5 py-0.5 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-400 text-[10px] font-semibold backdrop-blur-md shadow-xs flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-emerald-400" />
          <span>New UI (Top Tab Bar)</span>
        </div>
        <img
          src={newImage}
          alt="New UI"
          className="max-w-full max-h-full object-contain rounded-lg pointer-events-none"
        />
      </div>

      {/* Layer 2: Old UI (Left side clipped) */}
      <div
        className="absolute inset-0 flex items-center justify-center p-3"
        style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
      >
        <div className="absolute top-3 left-3 z-10 px-2.5 py-0.5 rounded-full bg-red-950/90 border border-red-500/40 text-red-400 text-[10px] font-semibold backdrop-blur-md shadow-xs pointer-events-none">
          Old UI (Sidebar)
        </div>
        <img
          src={oldImage}
          alt="Old UI"
          className="max-w-full max-h-full object-contain rounded-lg pointer-events-none"
        />
      </div>

      {/* Middle Vertical Divider Line & Drag Handle */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)] z-20 pointer-events-none"
        style={{ left: `${sliderPos}%` }}
      >
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-zinc-950 shadow-2xl border-2 border-sky-400 flex items-center justify-center z-30">
          <ChevronsLeftRight className="w-4 h-4 text-zinc-950" />
        </div>
      </div>
    </div>
  );
}

const FALLBACK_NOTES: ParsedReleaseNotes = {
  features: [
    "New Top Tab Navigation: Ditching the old sidebar for a sleek, zero-layout-shift top bar.",
    "Keyboard Shortcuts Manager (Ctrl+/): Fully customizable keybindings with collision detection.",
    "Native Rust Backend Persistence: Shortcuts are stored directly in SQLite preferences.",
    "Command Palette (Ctrl+K / Ctrl+Shift+P): Instant search for items, history, and settings.",
    "Automatic Dialog Dismissal: Press Escape or click empty backdrop space to close any modal.",
    "Instant Export History: Shimmer loading skeletons + zero split-second delay.",
  ],
  fixes: [
    "Fixed shortcut keybinding reverting on page refresh or component remount.",
    "Fixed header height jump when switching between Editor, Items, and History pages.",
  ],
  improvements: [
    "Redesigned Titlebar with custom asset icons and distinct App Tools section.",
    "Enhanced Popover & Dialog keyboard accessibility.",
  ]
};

const FEATURE_SLIDES = [
  {
    id: "new-ui",
    badge: "New Layout",
    title: "Streamlined Top Navigation Bar",
    description: "Replaced the old sidebar with a clean, zero-layout-shift top tab navigation bar and fixed header height.",
    icon: Layout,
    image: "/new-ui.png",
    altImage: "/old-ui.png",
    altLabel: "Compare with Old UI",
    bulletPoints: [
      "No layout shifts when switching views.",
      "Dedicated App Tools and Titlebar actions.",
      "Sleek workspace switcher & quick preview mode."
    ]
  },
  {
    id: "shortcuts",
    badge: "Shortcuts",
    title: "Custom Shortcuts Manager",
    description: "Remap any shortcut (Ctrl+/) with instant collision detection & native Rust SQLite persistence.",
    icon: Keyboard,
    image: "/shortcuts-page.png",
    bulletPoints: [
      "Custom keybinding recorder with single-key & multi-modifier support.",
      "Collision warning when assigning an already-in-use shortcut.",
      "Instant background synchronization with Rust SQLite backend."
    ]
  },
  {
    id: "command-palette",
    badge: "Search & Palette",
    title: "Universal Command Palette (Ctrl+K / Ctrl+Shift+P)",
    description: "Instantly search items, invoice history, or jump directly into Settings with > mode.",
    icon: Command,
    image: "/search.png",
    bulletPoints: [
      "Press Ctrl+K to open global search modal.",
      "Press Ctrl+Shift+P to open directly in Settings search mode (>).",
      "Keyboard shortcut hints displayed next to every action."
    ]
  },
  {
    id: "smart-toggles",
    badge: "Smart Features",
    title: "Auto Date & Digital Text Signatures",
    description: "Automatic current date selection & rich text or image signature customization.",
    icon: Calendar,
    image: "/digital-text-signature.png",
    bulletPoints: [
      "Automatic date field auto-update on new or duplicated invoices.",
      "Digital Text Signature with multiple typography styles.",
      "Click-outside backdrop & Escape key auto-dismiss for all dialogs."
    ]
  },
  {
    id: "changelog",
    badge: "Full Release Notes",
    title: "Complete v3.1.0 Changelog",
    description: "Review all new features, performance improvements, and bug fixes included in this release.",
    icon: FileText,
    image: "",
    bulletPoints: []
  }
];

export function WhatsNewModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentVersion, setCurrentVersion] = useState<string>("3.1.0");
  const [notes, setNotes] = useState<ParsedReleaseNotes | null>(null);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [showCompareOldUi, setShowCompareOldUi] = useState(false);
  const { lastSeenVersion, setLastSeenVersion, showWhatsNew, setShowWhatsNew } = useUiStore();

  useEffect(() => {
    if (showWhatsNew) {
      if (!notes) {
        setNotes(FALLBACK_NOTES);
      }
      setIsOpen(true);
    }
  }, [showWhatsNew, notes]);

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
          
          setNotes(FALLBACK_NOTES);
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
    if (showWhatsNew) {
      setShowWhatsNew(false);
    }
    if (currentVersion) {
      setLastSeenVersion(currentVersion);
    }
  };

  const nextSlide = () => {
    if (activeSlideIdx < FEATURE_SLIDES.length - 1) {
      setActiveSlideIdx((prev) => prev + 1);
      setShowCompareOldUi(false);
    } else {
      handleClose();
    }
  };

  const prevSlide = () => {
    if (activeSlideIdx > 0) {
      setActiveSlideIdx((prev) => prev - 1);
      setShowCompareOldUi(false);
    }
  };

  if (!notes) return null;

  const currentSlide = FEATURE_SLIDES[activeSlideIdx];
  const IconComp = currentSlide.icon;
  const isLastSlide = activeSlideIdx === FEATURE_SLIDES.length - 1;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent 
        showCloseButton={false} 
        className="sm:max-w-3xl md:max-w-4xl max-h-[92vh] flex flex-col p-5 md:p-6 gap-4 rounded-3xl border border-border/80 shadow-2xl bg-popover/98 backdrop-blur-2xl overflow-hidden"
      >
        
        {/* Header Section (Clean with Non-Overlapping Close Button) */}
        <DialogHeader className="flex flex-row items-center justify-between gap-4 shrink-0 pb-2 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-xs">
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              <span>v{currentVersion} Major Release</span>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-muted/60 border border-border/40 text-muted-foreground font-medium">
              Slide {activeSlideIdx + 1} of {FEATURE_SLIDES.length}
            </span>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </DialogHeader>

        {/* Modal Body */}
        {isLastSlide ? (
          /* FINAL SLIDE: Text-Only Full Release Notes Overview */
          <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-4 py-2 custom-scrollbar">
            <div className="space-y-1 bg-muted/20 border border-border/50 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-2 rounded-xl bg-primary/15 text-primary shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                  Complete Changelog
                </span>
              </div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">
                What's New in Bilal Invoice v{currentVersion}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Here is the complete summary of all major features, performance updates, and bug fixes included in this update.
              </p>
            </div>

            {/* Complete Release Notes Component */}
            <ReleaseNotesView notes={notes} />
          </div>
        ) : (
          /* FEATURE SLIDES (0-3): Clean Split 2-Column Layout */
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 flex-1 min-h-0 overflow-y-auto md:overflow-hidden py-1">
            
            {/* Left Column: Direct Media Image Viewport (md:col-span-7) */}
            <div className="md:col-span-7 flex items-center justify-center">
              {currentSlide.altImage ? (
                /* Interactive Before/After Image Slider (Slide 1) */
                <BeforeAfterSlider
                  oldImage={currentSlide.altImage}
                  newImage={currentSlide.image}
                />
              ) : (
                /* Standard Single Image Frame for Slides 2-4 */
                <div className="relative w-full h-64 sm:h-72 md:h-80 rounded-2xl bg-zinc-950 border border-border/60 overflow-hidden flex items-center justify-center p-3 shadow-2xl group">
                  <AnimatePresence mode="wait">
                    <motion.img
                      key={currentSlide.id}
                      src={currentSlide.image}
                      alt={currentSlide.title}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 24 24" fill="none" stroke="%239ca3af" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
                        (e.target as HTMLImageElement).className = 'w-10 h-10 opacity-30';
                      }}
                    />
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Right Column: Slide Details & Highlights (md:col-span-5) */}
            <div className="md:col-span-5 flex flex-col justify-between gap-4 py-1">
              
              {/* Slide Title & Description */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-primary/15 text-primary shrink-0">
                    <IconComp className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {currentSlide.badge}
                  </span>
                </div>

                <DialogTitle className="text-lg font-bold tracking-tight text-foreground leading-snug">
                  {currentSlide.title}
                </DialogTitle>
                
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {currentSlide.description}
                </p>
              </div>

              {/* Bullet Points Highlights */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3 custom-scrollbar">
                <div className="rounded-xl border border-border/60 bg-muted/10 p-3.5 space-y-2.5">
                  <h5 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Key Highlights
                  </h5>
                  <ul className="space-y-2">
                    {currentSlide.bulletPoints.map((point, idx) => (
                      <li key={idx} className="text-xs text-muted-foreground flex items-start gap-2 leading-relaxed">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Status Hint */}
              <div className="text-[11px] text-muted-foreground/80 bg-muted/30 p-2.5 rounded-xl border border-border/30 flex items-center justify-between">
                <span>Press <kbd className="px-1.5 py-0.5 bg-background rounded border border-border text-[10px] font-mono">Esc</kbd> anytime to dismiss.</span>
                <span className="font-mono text-[10px]">{activeSlideIdx + 1}/{FEATURE_SLIDES.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Control & Action Bar */}
        <div className="flex items-center justify-between pt-3 border-t border-border/40 shrink-0">
          {/* Left: Skip Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClose}
            className="text-xs text-muted-foreground hover:text-foreground cursor-pointer px-3"
          >
            Skip for now
          </Button>

          {/* Right: Navigation Controls (Back, Next / Got It!) */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={prevSlide}
              disabled={activeSlideIdx === 0}
              className="h-8 text-xs px-3 rounded-lg cursor-pointer font-medium disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              Back
            </Button>

            {!isLastSlide ? (
              <Button
                variant="default"
                size="sm"
                onClick={nextSlide}
                className="h-8 text-xs px-4 rounded-lg cursor-pointer font-semibold bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs flex items-center gap-1.5"
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={handleClose}
                className="h-8 text-xs px-5 rounded-lg cursor-pointer font-bold bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white shadow-md shadow-emerald-500/20 active:scale-95 flex items-center gap-1.5 transition-all"
              >
                <span>Got it!</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}



