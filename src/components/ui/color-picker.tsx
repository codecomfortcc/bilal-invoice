import React, { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Paintbrush } from "lucide-react";
import { cn } from "@/lib/utils";

const PRESET_COLORS = [
  "#000000", "#ffffff", "#ef4444", "#f97316", "#f59e0b",
  "#84cc16", "#22c55e", "#06b6d4", "#3b82f6", "#6366f1",
  "#a855f7", "#ec4899", "#64748b", "#78716c"
];

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [recentColors, setRecentColors] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("recentColors");
      if (saved) {
        setRecentColors(JSON.parse(saved));
      }
    } catch (e) {}
  }, []);

  const saveRecentColor = (newColor: string) => {
    if (!newColor || PRESET_COLORS.includes(newColor.toLowerCase())) return;
    
    setRecentColors(prev => {
      const newRecent = [newColor, ...prev.filter(c => c !== newColor)].slice(0, 7);
      localStorage.setItem("recentColors", JSON.stringify(newRecent));
      return newRecent;
    });
  };

  const handleColorChange = (newColor: string) => {
    onChange(newColor);
    saveRecentColor(newColor);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={ <Button
          variant="outline"
          size="sm"
          className={cn("w-8 h-8 p-0 flex items-center justify-center", className)}
          title="Text Color"
        >
          <Paintbrush className="w-4 h-4" style={{ color: color || "currentColor" }} />
        </Button>} />
      <PopoverContent className="w-64 p-3" align="start">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div 
              className="w-6 h-6 rounded-md border border-border" 
              style={{ backgroundColor: color || "#000000" }} 
            />
            <Input 
              value={color || "#000000"} 
              onChange={(e) => onChange(e.target.value)}
              onBlur={(e) => saveRecentColor(e.target.value)}
              className="flex-1 h-8 text-xs font-mono"
            />
          </div>
          
          <div className="space-y-1.5">
            <div className="text-xs font-medium text-muted-foreground">Presets</div>
            <div className="grid grid-cols-7 gap-1">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  className="w-6 h-6 rounded-md border border-border/50 hover:scale-110 transition-transform cursor-pointer"
                  style={{ backgroundColor: c }}
                  onClick={() => {
                    handleColorChange(c);
                    setOpen(false);
                  }}
                  title={c}
                />
              ))}
            </div>
          </div>

          {recentColors.length > 0 && (
            <div className="space-y-1.5">
              <div className="text-xs font-medium text-muted-foreground">Recent</div>
              <div className="grid grid-cols-7 gap-1">
                {recentColors.map((c) => (
                  <button
                    key={c}
                    className="w-6 h-6 rounded-md border border-border/50 hover:scale-110 transition-transform cursor-pointer"
                    style={{ backgroundColor: c }}
                    onClick={() => {
                      handleColorChange(c);
                      setOpen(false);
                    }}
                    title={c}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
