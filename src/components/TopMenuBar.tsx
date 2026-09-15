import { invoke } from "@tauri-apps/api/core";
import { toast } from "sonner";
import { useInvoiceStore, useHistoryStore, useUiStore } from "@/stores";
import { exportProjectData, importProjectData } from "@/services/importExport.service";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { useShortcut } from "@/hooks/use-shortcuts";

export function TopMenuBar() {
  const { createNewInvoice, queueSnapshot } = useInvoiceStore();
  const { undo, redo, clear: clearHistory } = useHistoryStore();
  const { setShowImportModal, setShowExportModal } = useUiStore();

  useShortcut(
    { key: "i", ctrl: true }, 
    () => setShowImportModal(true), 
    { 
      id: "shortcut-import-modal",
      title: "Open Import Modal & History",
      description: "Open centered modal for drag & drop file import and previous import history",
      category: "File" 
    }
  );

  useShortcut(
    { key: "e", ctrl: true }, 
    () => setShowExportModal(true), 
    { 
      id: "shortcut-export-modal",
      title: "Open Export Options Modal",
      description: "Open centered modal to select fields and export invoice to JSON",
      category: "File" 
    }
  );

  useShortcut(
    { key: "i", ctrl: true, alt: true }, 
    importProjectData, 
    { 
      id: "shortcut-import-json",
      title: "Direct Import File",
      description: "Directly open file dialog to import an invoice JSON project",
      category: "File" 
    }
  );

  useShortcut(
    { key: "e", ctrl: true, alt: true }, 
    exportProjectData, 
    { 
      id: "shortcut-export-json",
      title: "Direct Export File",
      description: "Directly export current invoice project to JSON file",
      category: "File" 
    }
  );

  const handleManualUpdateCheck = async () => {
    toast.info("Checking for updates...");
    try {
      const update = await invoke("check_for_updates");
      if (update) {
        toast.success(`Update v${(update as any).version} available! Open Settings to install.`);
      } else {
        toast.success("Application is up to date.");
      }
    } catch (e: any) {
      if (typeof e === "string" && e.includes("Could not fetch a valid release JSON")) {
        toast.success("Application is up to date.");
      } else {
        toast.error("Failed to check for updates");
      }
    }
  };

  return (
    <div className="flex items-center h-full px-2 font-sans text-[13px] select-none">
      <DropdownMenu>
        <DropdownMenuTrigger className="px-2.5 py-1 rounded hover:bg-sidebar-accent outline-none cursor-default focus:bg-sidebar-accent data-[state=open]:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground data-[state=open]:text-sidebar-foreground transition-colors">
          File
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56 bg-sidebar text-sidebar-foreground border-sidebar-border shadow-xl">
          <DropdownMenuSub>
            <DropdownMenuSubTrigger className="hover:bg-accent focus:bg-accent">New</DropdownMenuSubTrigger>
            <DropdownMenuSubContent className="w-48 bg-sidebar text-sidebar-foreground border-sidebar-border">
              <DropdownMenuItem className="hover:bg-accent focus:bg-accent cursor-pointer" onClick={() => {
                createNewInvoice();
                clearHistory();
                toast.success("Created new invoice");
              }}>
                New Invoice
              </DropdownMenuItem>
              <DropdownMenuItem className="hover:bg-accent focus:bg-accent cursor-pointer" onClick={() => {
                queueSnapshot();
                createNewInvoice();
                clearHistory();
                toast.success("Added to queue & created new");
              }}>
                Add New Invoice
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          <DropdownMenuSeparator className="bg-sidebar-border" />
          <DropdownMenuItem className="hover:bg-accent focus:bg-accent cursor-pointer flex justify-between items-center" onClick={async () => {
            const { saveBinvProject } = await import("@/services/importExport.service");
            await saveBinvProject();
          }}>
            <span>Save Project...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              Ctrl+S
            </kbd>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-sidebar-border" />
          <DropdownMenuItem className="hover:bg-accent focus:bg-accent cursor-pointer flex justify-between items-center" onClick={() => setShowImportModal(true)}>
            <span>Import Modal & History...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              Ctrl+I
            </kbd>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-accent focus:bg-accent cursor-pointer flex justify-between items-center" onClick={() => setShowExportModal(true)}>
            <span>Export Options Modal...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              Ctrl+E
            </kbd>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-sidebar-border" />
          <DropdownMenuItem className="hover:bg-accent focus:bg-accent cursor-pointer flex justify-between items-center" onClick={importProjectData}>
            <span>Direct Import File</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              Ctrl+Alt+I
            </kbd>
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-accent focus:bg-accent cursor-pointer flex justify-between items-center" onClick={exportProjectData}>
            <span>Direct Export File</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
              Ctrl+Alt+E
            </kbd>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-sidebar-border" />
          <DropdownMenuItem disabled>Preferences</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger className="px-2.5 py-1 rounded hover:bg-sidebar-accent outline-none cursor-default focus:bg-sidebar-accent data-[state=open]:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground data-[state=open]:text-sidebar-foreground transition-colors">
          Edit
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 bg-sidebar text-sidebar-foreground border-sidebar-border shadow-xl">
          <DropdownMenuItem className="hover:bg-accent focus:bg-accent cursor-pointer" onClick={undo}>Undo</DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-accent focus:bg-accent cursor-pointer" onClick={redo}>Redo</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger className="px-2.5 py-1 rounded hover:bg-sidebar-accent outline-none cursor-default focus:bg-sidebar-accent data-[state=open]:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground data-[state=open]:text-sidebar-foreground transition-colors">
          Select
        </DropdownMenuTrigger>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger className="px-2.5 py-1 rounded hover:bg-sidebar-accent outline-none cursor-default focus:bg-sidebar-accent data-[state=open]:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground data-[state=open]:text-sidebar-foreground transition-colors">
          Tools
        </DropdownMenuTrigger>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger className="px-2.5 py-1 rounded hover:bg-sidebar-accent outline-none cursor-default focus:bg-sidebar-accent data-[state=open]:bg-sidebar-accent text-sidebar-foreground/70 hover:text-sidebar-foreground data-[state=open]:text-sidebar-foreground transition-colors">
          Help
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48 bg-sidebar text-sidebar-foreground border-sidebar-border shadow-xl">
          <DropdownMenuItem className="hover:bg-accent focus:bg-accent cursor-pointer">
            Documentation
          </DropdownMenuItem>
          <DropdownMenuItem className="hover:bg-accent focus:bg-accent cursor-pointer">
            Keyboard Shortcuts
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-sidebar-border" />
          <DropdownMenuItem className="hover:bg-accent focus:bg-accent cursor-pointer" onClick={handleManualUpdateCheck}>
            Check for Updates...
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-sidebar-border" />
          <DropdownMenuItem className="hover:bg-accent focus:bg-accent cursor-pointer">
            About Bilal Invoice
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
