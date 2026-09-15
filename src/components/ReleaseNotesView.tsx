import { Sparkles, Bug, Zap } from "lucide-react";
import type { ParsedReleaseNotes } from "@/lib/releaseNotesParser";

interface ReleaseNotesViewProps {
  notes: ParsedReleaseNotes;
  className?: string;
}

export function ReleaseNotesView({ notes, className = "" }: ReleaseNotesViewProps) {
  const hasFeatures = notes.features && notes.features.length > 0;
  const hasImprovements = notes.improvements && notes.improvements.length > 0;
  const hasFixes = notes.fixes && notes.fixes.length > 0;

  if (!hasFeatures && !hasImprovements && !hasFixes) {
    return null;
  }

  return (
    <div className={`space-y-4 text-xs ${className}`}>
      {hasFeatures && (
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
          <h4 className="text-xs font-semibold flex items-center gap-1.5 text-emerald-400">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            What's New in this Version
          </h4>
          <ul className="space-y-1.5">
            {notes.features.map((feature, i) => (
              <li key={i} className="text-muted-foreground/90 pl-4 relative text-[11px] leading-relaxed">
                <span className="absolute left-1 top-1.5 h-1.5 w-1.5 rounded-full bg-emerald-400/80" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasImprovements && (
        <div className="rounded-xl border border-sky-500/20 bg-sky-500/5 p-3 space-y-2">
          <h4 className="text-xs font-semibold flex items-center gap-1.5 text-sky-400">
            <Zap className="h-3.5 w-3.5 text-sky-400" />
            Key Improvements
          </h4>
          <ul className="space-y-1.5">
            {notes.improvements.map((improvement, i) => (
              <li key={i} className="text-muted-foreground/90 pl-4 relative text-[11px] leading-relaxed">
                <span className="absolute left-1 top-1.5 h-1.5 w-1.5 rounded-full bg-sky-400/80" />
                {improvement}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasFixes && (
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 space-y-2">
          <h4 className="text-xs font-semibold flex items-center gap-1.5 text-amber-400">
            <Bug className="h-3.5 w-3.5 text-amber-400" />
            Bug Fixes & Polish
          </h4>
          <ul className="space-y-1.5">
            {notes.fixes.map((fix, i) => (
              <li key={i} className="text-muted-foreground/90 pl-4 relative text-[11px] leading-relaxed">
                <span className="absolute left-1 top-1.5 h-1.5 w-1.5 rounded-full bg-amber-400/80" />
                {fix}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

