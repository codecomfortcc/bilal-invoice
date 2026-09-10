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
  Settings as SettingsIcon,
  Package,
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { GlobalUpdateChecker } from "@/components/GlobalUpdateChecker";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { getCompanySettings } from "@/services/settings.service";
import { useCompanyStore, useInvoiceStore, useUiStore } from "@/stores";
import { InvoiceEditor } from "@/features/invoice-editor/InvoiceEditor";
import { Settings } from "@/features/settings/Settings";
import { HistoryPage } from "@/features/history/History";
import { Inventory } from "@/features/inventory/Inventory";
import { cn } from "@/lib/utils";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { Titlebar } from "@/components/titlebar";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Editor" },
  { to: "/items", icon: Package, label: "Items" },
  { to: "/history", icon: History, label: "History" },
] as const;

function Logo() {
  const { toggleSidebar, state } = useSidebar();
  
  return (
    <button 
      onClick={toggleSidebar}
      className="flex items-center gap-2 overflow-hidden hover:bg-sidebar-accent hover:text-sidebar-accent-foreground rounded-md transition-colors p-1 outline-none ring-sidebar-ring focus-visible:ring-2"
    >
      <div className="flex items-center justify-center h-6 w-6 shrink-0 rounded-md">
        <img src="/icon.png" alt="Logo" className="h-full w-full object-contain drop-shadow-sm" />
      </div>
      {state === "expanded" && (
        <span className="font-semibold text-sm whitespace-nowrap mr-2">Invoice Editor</span>
      )}
    </button>
  );
}

function AppSidebar() {
  const location = useLocation();
  const isSettingsActive = location.pathname === "/settings";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar">
      <SidebarHeader className="py-2 px-2">
        <Logo />
      </SidebarHeader>
      
      <SidebarContent>
        <SidebarMenu className="px-2 space-y-1">
          {NAV_ITEMS.map((item) => (
            <SidebarMenuItem key={item.to}>
              <SidebarMenuButton 
                isActive={location.pathname === item.to}
                tooltip={item.label}
                render={<Link to={item.to} />}
              >
                <item.icon className="h-[18px] w-[18px]" />
                <span>{item.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="py-4">
        <SidebarMenu className="space-y-1">
          <SidebarMenuItem>
            <ThemeToggle />
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton 
              isActive={isSettingsActive}
              tooltip="Settings"
              render={<Link to="/settings" />}
            >
              <SettingsIcon className="h-[18px] w-[18px]" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

function MobileTopNav() {
  const location = useLocation();
  const { toggleSidebar } = useSidebar();
  
  return (
    <div className="md:hidden flex items-center p-2 border-b border-border bg-background/95 backdrop-blur-xs sticky top-0 z-50 overflow-x-auto no-scrollbar shadow-sm">
      <button 
        onClick={toggleSidebar}
        className="flex items-center justify-center h-8 w-8 shrink-0 rounded-md mr-3"
      >
        <img src="/icon.png" alt="Logo" className="h-full w-full object-contain drop-shadow-sm" />
      </button>
      
      <div className="flex items-center gap-1">
        {NAV_ITEMS.map((item) => (
          <Link 
            key={item.to} 
            to={item.to}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0",
              location.pathname === item.to 
                ? "bg-primary/10 text-primary" 
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <item.icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        ))}
        <Link
          to="/settings"
          className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors shrink-0 ml-1",
            location.pathname === "/settings"
              ? "bg-primary/10 text-primary"
              : "text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          <SettingsIcon className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </div>
    </div>
  );
}

function LoadingShell() {
  return (
    <div className="flex h-screen w-screen bg-background">
      {/* Sidebar skeleton */}
      <div className="flex h-full w-14 flex-col items-center border-r border-border py-4 gap-3">
        <Skeleton className="h-9 w-9 rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md mt-4" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </div>
      {/* Content skeleton */}
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

function App() {
  const [dbReady, setDbReady] = useState(false);
  const { setCompany } = useCompanyStore();
  const { setInvoiceData, setTemplateData, createNewInvoice } = useInvoiceStore();
  const { loadSystemFonts, loadPreferences } = useUiStore();

  useEffect(() => {
    loadSystemFonts();
    loadPreferences();
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
        
        setDbReady(true);
      })
      .catch((e) => {
        console.error("Failed to load initial data:", e);
        setDbReady(true);
      });
  }, [setCompany, setTemplateData, setInvoiceData, createNewInvoice]);

  if (!dbReady) return <LoadingShell />;

  return (
    <BrowserRouter>
      <GlobalUpdateChecker />
      <SidebarProvider defaultOpen={false}>
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col overflow-hidden bg-background">
          <MobileTopNav />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<InvoiceEditor />} />
              <Route path="/items" element={<Inventory />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </BrowserRouter>
  );
}

export default function AppWithProviders() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="invoice-app-theme">
      <TooltipProvider>
        <div className="flex flex-col h-screen w-screen overflow-hidden">
          <Titlebar />
          <div className="flex-1 flex overflow-hidden">
            <App />
          </div>
        </div>
        <Toaster richColors position="bottom-right" />
      </TooltipProvider>
    </ThemeProvider>
  );
}
