import { useState } from "react";
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
import { Check, ChevronsUpDown, Type } from "lucide-react";
import { cn, formatFontVariant } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

export function GlobalStylesCard() {
  const company = useCompanyStore((state) => state.company);
  const setCompany = useCompanyStore((state) => state.setCompany);
  const systemFonts = useUiStore((state) => state.systemFonts);

  const [openFontDropdown, setOpenFontDropdown] = useState(false);

  const handleResetStyles = () => {
    if (!company) return;
    useHistoryStore.getState().commit();
    const updatedCompany = { ...company } as any;
    updatedCompany.fieldStyles = undefined;
    for (const key of Object.keys(updatedCompany)) {
      if (key.startsWith('master')) {
        updatedCompany[key] = undefined;
      }
    }
    useCompanyStore.getState().setCompany(updatedCompany as import("@/types").Company);
    saveCompanySettings(updatedCompany);
  };

  const handleMasterFontChange = (font: string | null) => {
    if (!company || !font) return;
    useHistoryStore.getState().commit();
    const updatedCompany = {
      ...company,
      masterFont: font,
    } as import("@/types").Company;
    setCompany(updatedCompany);
    saveCompanySettings(updatedCompany);
    setOpenFontDropdown(false);
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

  const currentFont = company?.masterFont || "Segoe UI";
  const selectedFontObj = systemFonts.find((f) => f.family === currentFont);
  const availableVariants = selectedFontObj?.variants || ["Regular"];

  return (
    <Card className="shadow-none border-border">
      <CardHeader className="pb-4 border-b border-border mb-6">
        <div className="flex items-center gap-2">
          <Type className="h-4 w-4 text-muted-foreground" />
          <CardTitle className="text-[15px]">Global Styles</CardTitle>
        </div>
        <CardDescription>
          Configure default fonts and styling for your invoice.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/20">
          <div className="space-y-0.5 pr-4">
            <h4 className="text-[13px] font-medium text-foreground">
              Master Font
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Select the global font family for your invoice.
            </p>
          </div>
          <Popover open={openFontDropdown} onOpenChange={setOpenFontDropdown}>
            <PopoverTrigger
              render={
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={openFontDropdown}
                  className="w-[180px] justify-between font-normal shrink-0"
                >
                  <span className="truncate">{currentFont}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              }
            ></PopoverTrigger>
            <PopoverContent className="w-[300px] p-0" align="end">
              <Command>
                <CommandInput placeholder="Search font..." />
                <CommandList>
                  <CommandEmpty>No font found.</CommandEmpty>
                  <CommandGroup>
                    {systemFonts.map((font) => (
                      <CommandItem
                        key={font.family}
                        value={font.family}
                        onSelect={() => handleMasterFontChange(font.family)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            currentFont === font.family
                              ? "opacity-100"
                              : "opacity-0",
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

        <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/20">
          <div className="space-y-0.5 pr-4">
            <h4 className="text-[13px] font-medium text-foreground">
              Font Variant
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Select the weight and style of the master font.
            </p>
          </div>
          <Select
            value={company?.masterFontVariant || "Regular"}
            onValueChange={handleMasterFontVariantChange}
          >
            <SelectTrigger className="w-[180px] shrink-0">
              <SelectValue placeholder="Variant" />
            </SelectTrigger>
            <SelectContent>
              {availableVariants.map((v) => (
                <SelectItem
                  key={v}
                  value={v}
                  className={cn(
                    v.includes("Bold") && "font-bold",
                    v.includes("Italic") && "italic",
                  )}
                >
                  {formatFontVariant(v)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/20">
          <div className="space-y-0.5 pr-4">
            <h4 className="text-[13px] font-medium text-foreground">
              Master Color
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Select the global text color for your invoice.
            </p>
          </div>
          <div className="shrink-0 flex items-center justify-end w-[180px]">
             <ColorPicker 
               color={company?.masterColor || "#000000"} 
               onChange={handleMasterColorChange} 
             />
          </div>
        </div>

        <div className="flex items-center justify-between p-3 border border-border rounded-md bg-muted/20">
          <div className="space-y-0.5 pr-4">
            <h4 className="text-[13px] font-medium text-foreground">
              Reset All Styles
            </h4>
            <p className="text-[11px] text-muted-foreground">
              Remove custom formatting applied to individual fields and revert
              to the master font.
            </p>
          </div>
          <Button
            onClick={handleResetStyles}
            variant="outline"
            className="text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
            size="sm"
          >
            Reset Styles
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
