import { Window } from "@tauri-apps/api/window";
import { Minus, Square, X } from "lucide-react";

export function Titlebar() {
  const appWindow = new Window("main");

  return (
    <div
      data-tauri-drag-region
      className="h-8 w-full select-none flex justify-between items-center bg-sidebar border-b border-sidebar-border z-[9999]"
    >
      <div 
        className="pl-3 flex items-center gap-2 pointer-events-none text-xs font-semibold text-sidebar-foreground/70"
        data-tauri-drag-region
      >
        <img src="/icon.png" alt="Logo" className="h-4 w-4 drop-shadow-sm pointer-events-none" />
        Bilal Invoice
      </div>
      <div className="flex h-full">
        <div
          className="inline-flex justify-center items-center w-11 h-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200 ease-in-out cursor-default"
          onClick={() => appWindow.minimize()}
        >
          <Minus className="w-4 h-4 pointer-events-none" />
        </div>
        <div
          className="inline-flex justify-center items-center w-11 h-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-200 ease-in-out cursor-default"
          onClick={() => appWindow.toggleMaximize()}
        >
          <Square className="w-3.5 h-3.5 pointer-events-none" />
        </div>
        <div
          className="inline-flex justify-center items-center w-11 h-full text-sidebar-foreground/70 hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200 ease-in-out cursor-default"
          onClick={() => appWindow.close()}
        >
          <X className="w-4 h-4 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}
