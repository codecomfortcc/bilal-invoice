import { useEffect, useState } from "react";
import { useCompanyStore, useHistoryStore, useUiStore } from "@/stores";
import { saveCompanySettings } from "@/services/settings.service";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn, formatFontVariant } from "@/lib/utils";
import { useShortcut } from "@/hooks/use-shortcuts";
import { motion, AnimatePresence } from "framer-motion";

export function GlobalStyleQuickEditor() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  
  const company = useCompanyStore((state) => state.company);
  const setCompany = useCompanyStore((state) => state.setCompany);
  const systemFonts = useUiStore((state) => state.systemFonts);
  
  const [openFontDropdown, setOpenFontDropdown] = useState(false);

  useEffect(() => {
    const updateMouse = (e: MouseEvent) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", updateMouse);
    return () => window.removeEventListener("mousemove", updateMouse);
  }, []);

  useShortcut({ key: "t", ctrl: true }, () => {
    if (!isOpen) {
      // Clamp position to viewport to avoid overflow
      const width = 320; // approximate width
      const height = 180; // approximate height
      const x = Math.min(mousePos.x, window.innerWidth - width - 20);
      const y = Math.min(mousePos.y, window.innerHeight - height - 20);
      setPosition({ x, y });
    }
    setIsOpen(!isOpen);
  });

  // Close on escape
  useShortcut({ key: "Escape" }, () => {
    if (isOpen) setIsOpen(false);
  });

  const handleMasterFontChange = (font: string | null) => {
    if (!company || !font) return;
    useHistoryStore.getState().commit();
    const updatedCompany = {
      ...company,
      masterFont: font,
    } as import("@/types").Company;
    setCompany(updatedCompany);
    saveCompanySettings(updatedCompany);
  };

  const handleMasterFontVariantChange = (variant: string | null) => {
    if (!company || !variant) return;
    useHistoryStore.getState().commit();
    const updatedCompany = {
      ...company,
      masterFontVariant: variant,
    } as import("@/types").Company;
    setCompany(updatedCompany);
    saveCompanySettings(updatedCompany);
  };

  const handleMasterColorChange = (color: string) => {
    if (!company) return;
    useHistoryStore.getState().commit();
    const updatedCompany = {
      ...company,
      masterColor: color,
    } as import("@/types").Company;
    setCompany(updatedCompany);
    saveCompanySettings(updatedCompany);
  };

  const selectedFontObj = systemFonts.find(f => f.family === (company?.masterFont || "Segoe UI"));
  const availableVariants = selectedFontObj?.variants || ["Regular", "Italic", "Bold", "Bold Italic"];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          style={{
            position: "fixed",
            left: position.x,
            top: position.y,
            zIndex: 1000,
          }}
          className="w-[320px] bg-background border border-border rounded-xl shadow-xl p-4 flex flex-col gap-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold tracking-tight">Global Styles Quick Edit</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6 -mr-1 text-muted-foreground" onClick={() => setIsOpen(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex-1 space-y-1.5">
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Master Font</label>
              <Popover open={openFontDropdown} onOpenChange={setOpenFontDropdown}>
                <PopoverTrigger render={<Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={openFontDropdown}
                    className="w-full justify-between h-8 text-xs font-normal"
                  >
                    <span className="truncate">{company?.masterFont || "Segoe UI"}</span>
                    <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                  </Button>}>
                  
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0" align="start">
                  <Command>
                    <CommandInput placeholder="Search font..." />
                    <CommandList>
                      <CommandEmpty>No font found.</CommandEmpty>
                      <CommandGroup>
                        {systemFonts.map((font) => (
                          <CommandItem
                            key={font.family}
                            value={font.family}
                            onSelect={(currentValue) => {
                              handleMasterFontChange(currentValue);
                              setOpenFontDropdown(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                company?.masterFont === font.family ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {font.family}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            <div className="w-[100px] space-y-1.5">
              <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Variant</label>
              <Select value={company?.masterFontVariant || "Regular"} onValueChange={handleMasterFontVariantChange}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Variant" />
                </SelectTrigger>
                <SelectContent>
                  {availableVariants.map(v => (
                    <SelectItem 
                      key={v} 
                      value={v}
                      className={cn(
                        v.includes("Bold") && "font-bold",
                        v.includes("Italic") && "italic"
                      )}
                    >
                      {formatFontVariant(v)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              Master Color
              <ColorPicker
                color={company?.masterColor || "#000000"}
                onChange={handleMasterColorChange}
              />
            </label>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
