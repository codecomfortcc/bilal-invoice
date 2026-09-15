import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Package,
  History,
  Search,
  FileText,
  Sliders,
  ChevronDown,
  Check,
  Zap,
} from "lucide-react";
import { useUiStore, useCompanyStore, useInventoryStore } from "@/stores";
import { useTheme } from "@/components/theme-provider";
import { listInvoices } from "@/services/invoice.service";
import { InvoiceData } from "@/types";
import { ALL_SETTINGS_REGISTRY, RegistryContext } from "@/lib/settingsRegistry";

type SearchMode = "plain" | "items" | "history" | "settings";

export function GlobalSearchModal() {
  const navigate = useNavigate();
  const {
    showGlobalSearch,
    setShowGlobalSearch,
    globalSearchInitialMode,
    developerMode,
    setDeveloperMode,
  } = useUiStore();
  const { company, setCompany } = useCompanyStore();
  const { items: inventoryItems, fetchItems } = useInventoryStore();
  const { theme, setTheme } = useTheme();

  const [searchMode, setSearchMode] = useState<SearchMode>("plain");
  const [inputValue, setInputValue] = useState("");
  const [historyInvoices, setHistoryInvoices] = useState<InvoiceData[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync mode and auto-focus input automatically whenever search modal opens
  useEffect(() => {
    if (showGlobalSearch) {
      setSearchMode(globalSearchInitialMode || "plain");
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [showGlobalSearch, globalSearchInitialMode]);

  // Registry Context for dynamic getters and actions
  const registryCtx: RegistryContext = {
    company,
    setCompany,
    uiStore: { developerMode, setDeveloperMode },
    themeStore: { theme, setTheme },
    navigate,
  };

  // Listen for Ctrl+K / Cmd+K and Ctrl+Shift+P / Cmd+Shift+P
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (useUiStore.getState().isRecordingShortcut) return;
      const isCtrl = e.ctrlKey || e.metaKey;
      if (isCtrl && e.shiftKey && e.key.toLowerCase() === "p") {
        e.preventDefault();
        useUiStore.getState().openGlobalSearch("settings");
      } else if (isCtrl && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (showGlobalSearch) {
          setShowGlobalSearch(false);
        } else {
          useUiStore.getState().openGlobalSearch("plain");
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showGlobalSearch, setShowGlobalSearch]);

  // Load items and invoice history when search modal opens
  useEffect(() => {
    if (showGlobalSearch) {
      if (inventoryItems.length === 0) {
        fetchItems();
      }
      listInvoices()
        .then((data) => setHistoryInvoices(data || []))
        .catch(console.error);
    }
  }, [showGlobalSearch, fetchItems, inventoryItems.length]);

  const handleClose = () => {
    setShowGlobalSearch(false);
    setInputValue("");
    setSearchMode("plain");
  };

  // Smart input change handler
  const handleInputChange = (val: string) => {
    if (val.length > 0) {
      const firstChar = val[0];
      if (firstChar === "@") {
        setSearchMode("items");
        setInputValue(val.slice(1));
        return;
      } else if (firstChar === "$") {
        setSearchMode("history");
        setInputValue(val.slice(1));
        return;
      } else if (firstChar === ">") {
        setSearchMode("settings");
        setInputValue(val.slice(1));
        return;
      }
    }
    setInputValue(val);
  };

  const searchTerm = inputValue.trim().toLowerCase();
  const isSearchValid = searchTerm.length >= 3;

  // Filter dynamic settings registry dynamically
  const filteredSettings = ALL_SETTINGS_REGISTRY.filter((s) => {
    if (!searchTerm) return true;
    const matchTitle = s.title.toLowerCase().includes(searchTerm);
    const matchDesc = s.description.toLowerCase().includes(searchTerm);
    const matchCat = s.category.toLowerCase().includes(searchTerm);
    const matchKw = s.keywords?.some((k) => k.toLowerCase().includes(searchTerm));
    return matchTitle || matchDesc || matchCat || matchKw;
  });

  const filteredItems = inventoryItems.filter(
    (item) =>
      item.title.toLowerCase().includes(searchTerm) ||
      (item.hsnSac && item.hsnSac.toLowerCase().includes(searchTerm))
  );

  const filteredHistory = historyInvoices.filter(
    (inv) =>
      (inv.invoiceNumber && inv.invoiceNumber.toLowerCase().includes(searchTerm)) ||
      (inv.buyerName && inv.buyerName.toLowerCase().includes(searchTerm)) ||
      (inv.exportFileName && inv.exportFileName.toLowerCase().includes(searchTerm))
  );

  const navigateToSetting = (targetId?: string) => {
    handleClose();
    navigate("/settings");
    if (targetId) {
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 150);
    }
  };

  const navigateToInventory = () => {
    handleClose();
    navigate("/items");
  };

  const navigateToHistory = () => {
    handleClose();
    navigate("/history");
  };

  const renderModePill = () => {
    switch (searchMode) {
      case "items":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
            <Package className="w-3 h-3" /> @ Items
          </span>
        );
      case "history":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <History className="w-3 h-3" /> $ History
          </span>
        );
      case "settings":
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-500/15 text-purple-400 border border-purple-500/30">
            <Sliders className="w-3 h-3" /> &gt; Settings
          </span>
        );
      case "plain":
      default:
        return (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-muted text-muted-foreground border border-border/40">
            <Search className="w-3 h-3" /> All
          </span>
        );
    }
  };

  return (
    <CommandDialog open={showGlobalSearch} onOpenChange={setShowGlobalSearch}>
      {/* Top Input Header with Integrated Mode Dropdown */}
      <div className="flex items-center gap-2 p-2.5 border-b border-border bg-popover">
        <DropdownMenu>
          <DropdownMenuTrigger className="outline-none focus:outline-none cursor-pointer">
            <div className="flex items-center gap-1 hover:opacity-80 transition-opacity">
              {renderModePill()}
              <ChevronDown className="w-3 h-3 text-muted-foreground opacity-60" />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44 z-[99999]">
            <DropdownMenuItem onClick={() => setSearchMode("plain")} className="text-xs cursor-pointer">
              <Search className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
              <span>All Categories</span>
              {searchMode === "plain" && <Check className="ml-auto w-3.5 h-3.5" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchMode("items")} className="text-xs cursor-pointer">
              <Package className="w-3.5 h-3.5 mr-2 text-sky-400" />
              <span>@ Items</span>
              {searchMode === "items" && <Check className="ml-auto w-3.5 h-3.5" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchMode("history")} className="text-xs cursor-pointer">
              <History className="w-3.5 h-3.5 mr-2 text-emerald-400" />
              <span>$ History</span>
              {searchMode === "history" && <Check className="ml-auto w-3.5 h-3.5" />}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setSearchMode("settings")} className="text-xs cursor-pointer">
              <Sliders className="w-3.5 h-3.5 mr-2 text-purple-400" />
              <span>&gt; Settings</span>
              {searchMode === "settings" && <Check className="ml-auto w-3.5 h-3.5" />}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <CommandInput
          ref={inputRef}
          autoFocus
          value={inputValue}
          onValueChange={handleInputChange}
          placeholder={
            searchMode === "items"
              ? "Search inventory items..."
              : searchMode === "history"
              ? "Search invoice history..."
              : searchMode === "settings"
              ? "Search settings & toggles..."
              : "Search items, history, settings..."
          }
          className="flex-1 text-sm bg-transparent border-none outline-none shadow-none focus:ring-0"
        />
      </div>

      <CommandList className="p-0">
        {!isSearchValid ? (
          /* Helper Guidance State when < 3 Characters */
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center select-none bg-popover">
            <div className="w-9 h-9 rounded-full bg-muted/60 flex items-center justify-center mb-2.5 text-muted-foreground">
              <Search className="w-4 h-4 opacity-60" />
            </div>
            <p className="text-xs font-semibold text-foreground mb-1">
              Type at least 3 characters to search
            </p>
            <p className="text-[11px] text-muted-foreground">
              Use <code className="bg-muted px-1 py-0.5 rounded font-mono">@</code> for items,{" "}
              <code className="bg-muted px-1 py-0.5 rounded font-mono">$</code> for history, or{" "}
              <code className="bg-muted px-1 py-0.5 rounded font-mono">&gt;</code> for settings.
            </p>
          </div>
        ) : (
          /* Scroll Area for Results - Max ~3 items visible */
          <ScrollArea className="max-h-[220px] overflow-y-auto">
            <CommandEmpty className="py-8 text-center text-xs text-muted-foreground">
              No results found for "{inputValue}".
            </CommandEmpty>

            {/* DYNAMIC SETTINGS REGISTRY GROUP */}
            {(searchMode === "settings" || searchMode === "plain") && filteredSettings.length > 0 && (
              <CommandGroup heading={searchMode === "settings" ? "Settings & Controls" : "Settings"}>
                {filteredSettings.map((setting) => {
                  const isDevRestricted = Boolean(setting.requiresDeveloperMode && !developerMode);

                  return (
                    <CommandItem
                      key={setting.id}
                      value={`setting-${setting.title}-${setting.description}`}
                      onSelect={() => {
                        if (setting.targetId) {
                          navigateToSetting(setting.targetId);
                        } else if (setting.onExecute) {
                          setting.onExecute(registryCtx);
                          handleClose();
                        }
                      }}
                      className="flex items-center justify-between py-2 px-3 rounded-md cursor-pointer hover:bg-accent/60 group"
                    >
                      <div className="flex items-start gap-2.5 flex-1 min-w-0 pr-2">
                        <Sliders className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs font-medium text-foreground group-hover:text-purple-400 transition-colors">
                              {setting.title}
                            </span>
                            <span className="text-[9px] px-1 py-0 rounded font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 shrink-0">
                              {setting.category}
                            </span>
                            {isDevRestricted && (
                              <span className="text-[9px] px-1 py-0 rounded font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30 shrink-0">
                                Dev Mode OFF
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground truncate mt-0.5">
                            {setting.description}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 pl-2" onClick={(e) => e.stopPropagation()}>
                        {setting.controlType === "toggle" && (
                          <Switch
                            checked={setting.getValue?.(registryCtx) ?? false}
                            onCheckedChange={(checked) => {
                              setting.onToggle?.(checked, registryCtx);
                            }}
                          />
                        )}

                        {setting.controlType === "select" && setting.options && (
                          <Select
                            value={setting.getSelectValue?.(registryCtx) || ""}
                            onValueChange={(val) => {
                              if (val) setting.onSelectChange?.(val, registryCtx);
                            }}
                          >
                            <SelectTrigger className="h-7 w-[130px] text-xs">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                            <SelectContent className="z-[99999]">
                              {setting.options.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value} className="text-xs">
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}

                        {setting.controlType === "action" && (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className={`h-7 text-xs px-2.5 gap-1 border-border/80 ${
                              isDevRestricted
                                ? "opacity-50 cursor-not-allowed hover:bg-amber-500/10 hover:text-amber-400"
                                : "hover:bg-purple-500/10 hover:text-purple-400"
                            }`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setting.onExecute?.(registryCtx);
                              if (!isDevRestricted) {
                                handleClose();
                              }
                            }}
                          >
                            <Zap className={`w-3 h-3 ${isDevRestricted ? "text-amber-400" : "text-purple-400"}`} />
                            {setting.actionLabel || "Run"}
                          </Button>
                        )}
                      </div>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}

            {/* INVENTORY GROUP */}
            {(searchMode === "items" || searchMode === "plain") && filteredItems.length > 0 && (
              <>
                {searchMode === "plain" && filteredSettings.length > 0 && <CommandSeparator />}
                <CommandGroup heading={searchMode === "items" ? "Inventory Items" : "Inventory"}>
                  {filteredItems.map((item) => (
                    <CommandItem
                      key={item.id}
                      value={`item-${item.title}-${item.hsnSac || ""}`}
                      onSelect={navigateToInventory}
                      className="flex items-center justify-between py-2 px-3 rounded-md cursor-pointer hover:bg-accent/60 group"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <Package className="w-4 h-4 text-sky-400 shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-medium text-foreground group-hover:text-sky-400 transition-colors">
                            {item.title}
                          </span>
                          {item.hsnSac && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              HSN/SAC: {item.hsnSac}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.rate !== undefined && (
                          <span className="text-xs font-semibold text-foreground bg-muted/60 px-2 py-0.5 rounded">
                            ₹{item.rate}
                          </span>
                        )}
                        {item.unit && (
                          <span className="text-[10px] text-muted-foreground uppercase">
                            {item.unit}
                          </span>
                        )}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}

            {/* HISTORY GROUP */}
            {(searchMode === "history" || searchMode === "plain") && filteredHistory.length > 0 && (
              <>
                {(searchMode === "history" ||
                  (searchMode === "plain" &&
                    (filteredSettings.length > 0 || filteredItems.length > 0))) && (
                  <CommandSeparator />
                )}
                <CommandGroup heading={searchMode === "history" ? "Invoice History" : "History"}>
                  {filteredHistory.map((inv) => (
                    <CommandItem
                      key={inv.id}
                      value={`history-${inv.invoiceNumber || "Draft"}-${inv.buyerName || ""}`}
                      onSelect={navigateToHistory}
                      className="flex items-center justify-between py-2 px-3 rounded-md cursor-pointer hover:bg-accent/60 group"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <FileText className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-semibold text-foreground group-hover:text-emerald-400 transition-colors">
                              {inv.invoiceNumber || "Draft Invoice"}
                            </span>
                            {inv.buyerName && (
                              <span className="text-[11px] text-muted-foreground truncate">
                                • {inv.buyerName}
                              </span>
                            )}
                          </div>
                          {inv.exportFileName && (
                            <span className="text-[10px] text-muted-foreground truncate">
                              {inv.exportFileName}
                            </span>
                          )}
                        </div>
                      </div>

                      {inv.exportDate && (
                        <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                          {new Date(inv.exportDate).toLocaleDateString()}
                        </span>
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            )}
          </ScrollArea>
        )}
      </CommandList>
    </CommandDialog>
  );
}
