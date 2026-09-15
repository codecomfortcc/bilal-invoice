import { DoubleRectangleIcon } from "@/assets/DoubleRectangleIcon";
import { RectangleIcon } from "@/assets/RectangleIcon";
import { MinusIcon } from "@/assets/MinusIcon";
import { CrossIcon } from "@/assets/CrossIcon";
import { Window } from "@tauri-apps/api/window";
import { Settings, Keyboard, Sun, Moon, Monitor, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { useUiStore } from "@/stores/ui.store";
import { useNavigate } from "react-router-dom";
import { useTheme } from "@/components/theme-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal
} from "@/components/ui/dropdown-menu";
import { TopMenuBar } from "@/components/TopMenuBar";

export function Titlebar() {
  const appWindow = new Window("main");
  const [isMaximized, setIsMaximized] = useState(false);
  const { setShowWhatsNew, setShowGlobalSearch } = useUiStore();
  const navigate = useNavigate();
  const { setTheme, theme } = useTheme();

  useEffect(() => {
    // Check initial state
    appWindow.isMaximized().then(setIsMaximized);

    // Listen for resize events
    const unlisten = appWindow.onResized(async () => {
      const maximized = await appWindow.isMaximized();
      setIsMaximized(maximized);
    });

    return () => {
      unlisten.then(f => f());
    };
  }, []);

  return (
    <div
      data-tauri-drag-region
      className="h-8 w-full select-none flex justify-between items-center bg-sidebar border-b border-sidebar-border z-[9999]"
    >
      <div className="pl-3 flex items-center gap-2 h-full">
        {/* Clickable App Logo */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setShowWhatsNew(true);
          }}
          className="flex items-center justify-center h-6 w-6 rounded-md hover:bg-sidebar-accent transition-colors outline-none cursor-pointer relative z-10"
          title="What's New"
        >
          <img src="/icon.png" alt="Logo" className="h-4 w-4 drop-shadow-sm pointer-events-none" />
        </button>

        <TopMenuBar />
      </div>

      <div className="flex h-full items-center">
        {/* App Utility Actions Group */}
        <div className="flex items-center gap-1 mr-2 pr-2 border-r border-sidebar-border/60">
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex justify-center items-center w-7 h-7 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-150 cursor-pointer outline-none" title="Settings & Options">
              <Settings className="w-4 h-4 pointer-events-none" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 mt-1">
              <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Preferences</span>
              </DropdownMenuItem>
              
              <DropdownMenuItem onClick={() => navigate("/shortcuts")} className="cursor-pointer">
                <Keyboard className="mr-2 h-4 w-4" />
                <span>Keyboard Shortcuts</span>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="cursor-pointer">
                  <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 hidden dark:block absolute" />
                  <Moon className="mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 block dark:hidden absolute" />
                  <span className="pl-6">Theme</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme("light")} className={theme === "light" ? "bg-accent cursor-pointer" : "cursor-pointer"}>
                      <Sun className="mr-2 h-4 w-4" />
                      <span>Light</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")} className={theme === "dark" ? "bg-accent cursor-pointer" : "cursor-pointer"}>
                      <Moon className="mr-2 h-4 w-4" />
                      <span>Dark</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")} className={theme === "system" ? "bg-accent cursor-pointer" : "cursor-pointer"}>
                      <Monitor className="mr-2 h-4 w-4" />
                      <span>System Default</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Global Search Button */}
          <button
            type="button"
            onClick={() => setShowGlobalSearch(true)}
            className="inline-flex justify-center items-center w-7 h-7 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-150 cursor-pointer outline-none"
            title="Search (Ctrl+K)"
          >
            <Search className="w-4 h-4 pointer-events-none" />
          </button>
        </div>

        {/* Native Window Controls Group */}
        <div className="flex h-full items-center">
          <div
            className="inline-flex justify-center items-center w-11 h-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-150 cursor-default"
            onClick={() => appWindow.minimize()}
            title="Minimize"
          >
            <MinusIcon size={14} className="pointer-events-none" />
          </div>
          <div
            className="inline-flex justify-center items-center w-11 h-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors duration-150 cursor-default"
            onClick={() => appWindow.toggleMaximize()}
            title={isMaximized ? "Restore" : "Maximize"}
          >
            {isMaximized ? (
              <DoubleRectangleIcon className="w-3.5 h-3.5 pointer-events-none" />
            ) : (
              <RectangleIcon className="w-3 h-3 pointer-events-none" />
            )}
          </div>
          <div
            className="inline-flex justify-center items-center w-11 h-full text-sidebar-foreground/70 hover:bg-destructive hover:text-destructive-foreground transition-colors duration-150 cursor-default"
            onClick={() => appWindow.close()}
            title="Close"
          >
            <CrossIcon size={14} className="pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
}
