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
} from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { initDb } from "@/database/db";
import { getCompanySettings } from "@/services/company.service";
import { useCompanyStore } from "@/stores";
import { InvoiceEditor } from "@/features/invoice-editor/InvoiceEditor";
import { Settings } from "@/features/settings/Settings";
import { HistoryPage } from "@/features/history/History";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { to: "/", icon: LayoutDashboard, label: "Editor" },
  { to: "/history", icon: History, label: "History" },
] as const;

function NavItem({
  to,
  icon: Icon,
  label,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
}) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Link
            to={to}
            className={cn(
              "flex items-center justify-center h-9 w-9 rounded-md transition-colors",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
            )}
          >
            <Icon className="h-[18px] w-[18px]" />
          </Link>
        }
      ></TooltipTrigger>
      <TooltipContent side="right" sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

function Sidebar() {
  const location = useLocation();
  const isSettingsActive = location.pathname === "/settings";

  return (
    <aside className="flex h-full w-14 flex-col items-center border-r border-sidebar-border bg-sidebar py-4 gap-1">
      {/* App icon */}
      <div className="flex items-center justify-center h-9 w-9 rounded-md bg-primary text-primary-foreground text-xs font-bold mb-4">
        IE
      </div>

      {/* Navigation */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="flex flex-col items-center gap-1 mt-auto">
        <ThemeToggle />
        <Tooltip>
          <TooltipTrigger
            render={
              <Link
                to="/settings"
                className={cn(
                  "flex items-center justify-center h-9 w-9 rounded-md transition-colors",
                  isSettingsActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50",
                )}
              >
                <SettingsIcon className="h-[18px] w-[18px]" />
              </Link>
            }
          ></TooltipTrigger>
          <TooltipContent side="right" sideOffset={8}>
            Settings
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
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

function App() {
  const [dbReady, setDbReady] = useState(false);
  const { setCompany } = useCompanyStore();

  useEffect(() => {
    initDb()
      .then(async () => {
        setDbReady(true);
        const c = await getCompanySettings("default_company");
        if (c) setCompany(c);
      })
      .catch((e) => console.error("Failed to init DB:", e));
  }, [setCompany]);

  if (!dbReady) return <LoadingShell />;

  return (
    <BrowserRouter>
      <div className="flex h-screen w-screen overflow-hidden bg-background text-foreground">
        <Sidebar />
        <main className="flex-1 overflow-hidden">
          <Routes>
            <Route path="/" element={<InvoiceEditor />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default function AppWithProviders() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="invoice-app-theme">
      <TooltipProvider>
        <App />
        <Toaster richColors position="bottom-right" />
      </TooltipProvider>
    </ThemeProvider>
  );
}
