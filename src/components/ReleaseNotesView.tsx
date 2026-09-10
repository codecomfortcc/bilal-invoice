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
    <div className={`space-y-6 ${className}`}>
      {hasFeatures && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <Sparkles className="h-4 w-4 text-emerald-500" />
            New Features
          </h4>
          <ul className="space-y-2">
            {notes.features.map((feature, i) => (
              <li key={i} className="text-sm text-muted-foreground pl-6 relative">
                <span className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-emerald-500/50" />
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasImprovements && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <Zap className="h-4 w-4 text-blue-500" />
            Improvements
          </h4>
          <ul className="space-y-2">
            {notes.improvements.map((improvement, i) => (
              <li key={i} className="text-sm text-muted-foreground pl-6 relative">
                <span className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-blue-500/50" />
                {improvement}
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasFixes && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
            <Bug className="h-4 w-4 text-amber-500" />
            Bug Fixes
          </h4>
          <ul className="space-y-2">
            {notes.fixes.map((fix, i) => (
              <li key={i} className="text-sm text-muted-foreground pl-6 relative">
                <span className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-amber-500/50" />
                {fix}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
