import { useEffect, useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
} from "react-router-dom";
import {
  LayoutDashboard,
  History,
  Package,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { GlobalUpdateChecker } from "@/components/GlobalUpdateChecker";
import { WhatsNewModal } from "@/components/WhatsNewModal";
import { ThemeProvider } from "@/components/theme-provider";
import {
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { getCompanySettings } from "@/services/settings.service";
import { useCompanyStore, useInvoiceStore, useUiStore } from "@/stores";
import { InvoiceEditor } from "@/features/invoice-editor/InvoiceEditor";
import { Settings } from "@/features/settings/Settings";
import { HistoryPage } from "@/features/history/History";
import { Inventory } from "@/features/inventory/Inventory";
import { Shortcuts } from "@/features/shortcuts/Shortcuts";
import { cn } from "@/lib/utils";
import { Titlebar } from "@/components/titlebar";
import { EditorActions } from "@/components/EditorActions";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Editor" },
  { to: "/items", icon: Package, label: "Items" },
  { to: "/history", icon: History, label: "History" },
] as const;

function TopTabBar() {
  const location = useLocation();

  // Settings and Shortcuts pages hide the tabs to provide full focus
  if (location.pathname === "/settings" || location.pathname === "/shortcuts") {
    return null;
  }

  return (
    <div className="flex items-center justify-between px-4 h-10 bg-sidebar border-b border-border gap-2 overflow-x-auto no-scrollbar shrink-0">
      <div className="flex gap-2 h-full items-end">
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 border-b-2 transition-colors text-xs font-medium h-[33px]",
                isActive 
                  ? "border-primary text-primary bg-background rounded-t-md" 
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-t-md"
              )}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          );
        })}
      </div>
      
      {/* Right side action container with fixed vertical alignment */}
      <div className="flex items-center h-full">
        {location.pathname === "/" ? (
          <EditorActions />
        ) : (
          <div className="h-8 w-1" />
        )}
      </div>
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="flex flex-col h-full w-full bg-background">
      <div className="flex px-4 pt-2 gap-2 border-b border-border bg-sidebar">
        <Skeleton className="h-9 w-24 rounded-t-lg rounded-b-none" />
        <Skeleton className="h-9 w-24 rounded-t-lg rounded-b-none" />
        <Skeleton className="h-9 w-24 rounded-t-lg rounded-b-none" />
      </div>
      <div className="flex-1 p-8 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-2 gap-4 mt-8">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      </div>
    </div>
  );
}

import { getPreference } from "@/services/system.service";

import { GlobalSearchModal } from "@/components/GlobalSearchModal";
import { GlobalShortcutsHandler } from "@/components/GlobalShortcutsHandler";
import { ImportModal } from "@/components/ImportModal";
import { ExportModal } from "@/components/ExportModal";

function App() {
  const [dbReady, setDbReady] = useState(false);
  const { setCompany } = useCompanyStore();
  const { setInvoiceData, setTemplateData, createNewInvoice } = useInvoiceStore();
  const { loadSystemFonts, loadPreferences } = useUiStore();

  useEffect(() => {
    loadSystemFonts();
    loadPreferences();
    import("@/stores").then(({ useShortcutStore }) => {
      useShortcutStore.getState().loadShortcuts();
    });
    Promise.all([
      getCompanySettings("default_company"),
      getPreference("default_invoice_template").catch(() => null)
    ])
      .then(async ([c, templateStr]) => {
        if (c) setCompany(c);
        if (templateStr && typeof templateStr === "string") {
          try {
            const template = JSON.parse(templateStr);
            setTemplateData(template);
          } catch (e) {
            console.error("Failed to parse default template:", e);
          }
        }
        
        // Always start with a fresh invoice inheriting locked fields
        try {
          await createNewInvoice();
        } catch (e) {
          console.error("Failed to create new invoice:", e);
        }

        try {
          const { invoke } = await import("@tauri-apps/api/core");
          const initialFile = await invoke<string | null>("get_initial_file");
          if (initialFile) {
            const { openBinvProject } = await import("@/services/importExport.service");
            await openBinvProject(initialFile);
          }
        } catch (e) {
          console.error("Failed to check initial file:", e);
        }
        
        setDbReady(true);
      })
      .catch((e) => {
        console.error("Failed to load initial data:", e);
        setDbReady(true);
      });
  }, [setCompany, setTemplateData, setInvoiceData, createNewInvoice]);

  if (!dbReady) return <LoadingShell />;

  return (
    <>
      <GlobalShortcutsHandler />
      <GlobalUpdateChecker />
      <WhatsNewModal />
      <GlobalSearchModal />
      <ImportModal />
      <ExportModal />
      <div className="flex flex-col flex-1 h-full w-full overflow-hidden bg-background">
        <TopTabBar />
        <main className="flex-1 overflow-auto relative">
          <Routes>
            <Route path="/" element={<InvoiceEditor />} />
            <Route path="/items" element={<Inventory />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/shortcuts" element={<Shortcuts />} />
          </Routes>
        </main>
      </div>
    </>
  );
}

export default function AppWithProviders() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="invoice-app-theme">
      <TooltipProvider>
        <BrowserRouter>
          <div className="flex flex-col h-screen w-screen overflow-hidden">
            <Titlebar />
            <div className="flex-1 flex overflow-hidden">
              <App />
            </div>
          </div>
          <Toaster richColors position="bottom-right" />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  );
}
