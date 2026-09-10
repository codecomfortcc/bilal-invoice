import React, { useState, useRef, useEffect } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCompanyStore, useUiStore } from "@/stores";
import { InventoryItem } from "@/types/inventory";
import {
  Baseline,
  Check,
  Trash2,
  RotateCcw,
  ChevronsUpDown,
  Lock,
  Unlock,
  CaseUpper,
} from "lucide-react";
import { ColorPicker } from "@/components/ui/color-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { formatFontVariant, parseFontVariant } from "@/lib/utils";

const FALLBACK_FONTS = [
  "Arial",
  "Helvetica",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Georgia",
  "Palatino",
  "Garamond",
  "Bookman",
  "Comic Sans MS",
  "Trebuchet MS",
  "Arial Black",
  "Impact",
  "Segoe UI",
  "Tahoma",
];

const SIZES = [
  "10px",
  "12px",
  "14px",
  "16px",
  "18px",
  "20px",
  "24px",
  "28px",
  "32px",
];

interface EditableServicesProps {
  value: string;
  onChange: (val: string) => void;
  onSelectProduct: (product: InventoryItem) => void;
  inventoryItems: InventoryItem[];
  isEditing?: boolean;
  className?: string;
  placeholder?: string;
  multiline?: boolean;
  styleKey?: string;
  lockableKey?: string;
  onDone?: (val: string) => void;
}

export const EditableServices = ({
  value,
  onChange,
  onSelectProduct,
  inventoryItems,
  isEditing = false,
  className,
  placeholder,
  multiline = false,
  styleKey,
  lockableKey,
  onDone,
}: EditableServicesProps) => {
  const [openPopover, setOpenPopover] = useState(false);
  const [openFontDropdown, setOpenFontDropdown] = useState(false);
  const [localValue, setLocalValue] = useState(String(value || ""));
  const [isAltHover, setIsAltHover] = useState(false);
  const [computedSize, setComputedSize] = useState("");
  const [computedVariant, setComputedVariant] = useState("");
  const spanRef = React.useRef<HTMLSpanElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { company: globalCompany, setCompany } = useCompanyStore();
  const company = globalCompany;
  const developerMode = useUiStore((state) => state.developerMode);
  const systemFonts = useUiStore((state) => state.systemFonts);
  const FONTS =
    systemFonts.length > 0 ? systemFonts.map((f) => f.family) : FALLBACK_FONTS;

  const fieldStyles = company?.fieldStyles
    ? JSON.parse(company.fieldStyles)
    : {};
  const lockedFields = company?.lockedFields
    ? JSON.parse(company.lockedFields)
    : {};
  const isLocked = lockableKey ? !!lockedFields[lockableKey] : false;

  const uniqueKey = lockableKey || styleKey;
  const myStyle = uniqueKey ? fieldStyles[uniqueKey] : undefined;

  const currentFontFamily = myStyle?.font || company?.masterFont || "Segoe UI";
  const selectedFontObj = systemFonts.find(
    (f) => f.family === currentFontFamily,
  );
  const availableVariants = selectedFontObj?.variants || [
    "Regular",
    "Italic",
    "Bold",
    "Bold Italic",
  ];

  const toggleLock = () => {
    if (!company || !lockableKey) return;
    const currentLocked = company.lockedFields
      ? JSON.parse(company.lockedFields)
      : {};
    if (currentLocked[lockableKey]) {
      delete currentLocked[lockableKey];
    } else {
      currentLocked[lockableKey] = true;
    }
    const updatedCompany = {
      ...company,
      lockedFields: JSON.stringify(currentLocked),
    } as import("@/types").Company;
    setCompany(updatedCompany);
  };

  const updateStyle = (key: string, val: any) => {
    if (!company || !uniqueKey) return;
    const currentStyles = company.fieldStyles
      ? JSON.parse(company.fieldStyles)
      : {};
    currentStyles[uniqueKey] = { ...currentStyles[uniqueKey], [key]: val };
    const updatedCompany = {
      ...company,
      fieldStyles: JSON.stringify(currentStyles),
    } as import("@/types").Company;
    setCompany(updatedCompany);
  };

  const updateStyles = (updates: Record<string, any>) => {
    if (!company || !uniqueKey) return;
    const currentStyles = company.fieldStyles
      ? JSON.parse(company.fieldStyles)
      : {};
    currentStyles[uniqueKey] = { ...currentStyles[uniqueKey], ...updates };
    const updatedCompany = {
      ...company,
      fieldStyles: JSON.stringify(currentStyles),
    } as import("@/types").Company;
    setCompany(updatedCompany);
  };

  const resetStyles = () => {
    if (!company || !uniqueKey) return;
    const currentStyles = company.fieldStyles
      ? JSON.parse(company.fieldStyles)
      : {};
    delete currentStyles[uniqueKey];
    const updatedCompany = {
      ...company,
      fieldStyles: JSON.stringify(currentStyles),
    } as import("@/types").Company;
    setCompany(updatedCompany);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocalValue(val);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onChange(val);
    }, 300);
  };

  useEffect(() => {
    if (String(value) !== localValue) {
      setLocalValue(String(value || ""));
    }
  }, [value]);

  const handleSave = () => {
    onChange(localValue);
    if (onDone) onDone(localValue);
    setOpenPopover(false);
  };

  const localVariant = parseFontVariant(myStyle?.variant || ((myStyle?.bold ? "700 " : "") + (myStyle?.italic ? "Italic" : "")));

  const styleObj: React.CSSProperties = {
    fontFamily: currentFontFamily,
    fontWeight: localVariant.weight !== "normal" ? localVariant.weight : undefined,
    fontStyle: localVariant.style !== "normal" ? localVariant.style : undefined,
    textDecoration: myStyle?.underline ? "underline" : undefined,
    textTransform: myStyle?.capsLock ? "uppercase" : undefined,
    color: myStyle?.color || undefined,
    fontSize: myStyle?.size ? (!isNaN(Number(myStyle?.size)) ? `${myStyle?.size}px` : myStyle?.size) : undefined,
    textAlign: myStyle?.align || undefined,
    minHeight: "1em",
  };

  useEffect(() => {
    if (spanRef.current) {
      const style = window.getComputedStyle(spanRef.current);
      setComputedSize(style.fontSize);

      const weight = style.fontWeight;
      const fStyle = style.fontStyle;
      let variantStr = "";
      if (weight === "bold" || parseInt(weight) >= 600) {
        variantStr += "700 ";
      } else if (parseInt(weight) <= 300) {
        variantStr += "300 ";
      }
      
      if (fStyle === "italic") {
        variantStr += "Italic";
      }
      
      setComputedVariant(variantStr.trim() || "Regular");
    }
  }, [myStyle, company?.masterFont, value]);

  const filteredItems = inventoryItems.filter((item) =>
    item.title.toLowerCase().includes(localValue.toLowerCase()),
  );

  const displayValue = value || placeholder;

  if (!isEditing) {
    return (
      <span
        ref={spanRef}
        style={styleObj}
        className={cn(
          "inline-block w-full break-words break-all whitespace-normal",
          className,
        )}
      >
        {displayValue}
      </span>
    );
  }

  return (
    <Popover open={openPopover} onOpenChange={setOpenPopover}>
      <PopoverTrigger
        render={
          <button
            ref={spanRef as any}
            className={cn(
              "relative inline-flex items-center justify-start text-left w-full transition-all rounded-sm border border-transparent outline-none",
              "hover:bg-blue-50/50 hover:border-blue-200/50 hover:shadow-[0_0_0_2px_rgba(59,130,246,0.1)]",
              "focus:bg-blue-50/50 focus:border-blue-200 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.2)]",
              !value && "text-muted-foreground/60",
              className,
            )}
            style={styleObj}
            onClick={(e) => {
              if (isAltHover && lockableKey) {
                e.preventDefault();
                e.stopPropagation();
                toggleLock();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === "Alt") setIsAltHover(true);
            }}
            onKeyUp={(e) => {
              if (e.key === "Alt") setIsAltHover(false);
            }}
            onMouseEnter={(e) => {
              if (e.altKey) setIsAltHover(true);
            }}
            onMouseLeave={() => setIsAltHover(false)}
          >
            {lockableKey && isLocked && !isAltHover && (
              <Lock className="absolute -left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground/40" />
            )}
            {lockableKey && isAltHover && (
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center cursor-pointer shadow-sm z-10 hover:bg-blue-200 transition-colors">
                {isLocked ? (
                  <Unlock className="w-2.5 h-2.5 text-blue-600" />
                ) : (
                  <Lock className="w-2.5 h-2.5 text-blue-600" />
                )}
              </div>
            )}

            <span className="break-words break-all whitespace-normal">
              {displayValue}
            </span>
          </button>
        }
      ></PopoverTrigger>

      <PopoverContent
        className="w-[440px] p-2 flex flex-col gap-2 z-[200]"
        align="start"
        sideOffset={8}
      >
        {/* Formatting Toolbar */}
        <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md border border-border">
          <Popover open={openFontDropdown} onOpenChange={setOpenFontDropdown}>
            <PopoverTrigger render={ <Button
                variant="outline"
                role="combobox"
                aria-expanded={openFontDropdown}
                className="h-8 text-xs w-[120px] justify-between font-normal px-2 bg-background"
              >
                <span className="truncate">{currentFontFamily}</span>
                <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
              </Button>}>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0 z-[210]" align="start">
              <Command>
                <CommandInput placeholder="Search font..." />
                <CommandList>
                  <CommandEmpty>No font found.</CommandEmpty>
                  <CommandGroup>
                    {FONTS.map((font) => (
                      <CommandItem
                        key={font}
                        value={font}
                        onSelect={() => {
                          updateStyle("font", font);
                          setOpenFontDropdown(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            currentFontFamily === font ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {font}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          <Select 
            value={myStyle?.size || computedSize || "12px"}
            onValueChange={(v) => updateStyle("size", v)}
          >
            <SelectTrigger className="h-8 text-xs w-[70px] bg-background px-2">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent className="z-[210]">
              {SIZES.map(s => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Separator orientation="vertical" className="h-6 mx-1" />

          <Select 
            value={myStyle?.variant || ((myStyle?.bold ? "700 " : "") + (myStyle?.italic ? "Italic" : "")).trim() || computedVariant || company?.masterFontVariant || "Regular"} 
            onValueChange={(v) => {
              updateStyle("variant", v);
            }}
          >
            <SelectTrigger className="h-8 text-xs w-[110px] bg-background">
              <SelectValue placeholder="Variant" />
            </SelectTrigger>
            <SelectContent className="z-[210]">
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

          <Button
            variant={myStyle?.underline ? "secondary" : "ghost"}
            size="sm"
            className="w-8 h-8 p-0"
            onClick={() => updateStyle("underline", !myStyle?.underline)}
          >
            <Baseline className="w-4 h-4" />
          </Button>

          <Button
            variant={myStyle?.capsLock ? "secondary" : "ghost"}
            size="sm"
            className="w-8 h-8 p-0"
            onClick={() => updateStyle("capsLock", !myStyle?.capsLock)}
          >
            <CaseUpper className="w-4 h-4" />
          </Button>
          
          <ColorPicker 
            color={myStyle?.color || company?.masterColor || "#000000"} 
            onChange={(c) => updateStyle("color", c)} 
          />
        </div>

        {/* Editing Area with Custom Autocomplete */}
        <div className="relative">
          <Input
            autoFocus
            className="w-full h-10 px-3 text-sm bg-background rounded-md border-input shadow-sm focus-visible:ring-1 focus-visible:ring-primary/50"
            value={localValue}
            onChange={handleTextChange}
            placeholder={placeholder}
            style={{ ...styleObj, minHeight: "unset" }}
          />

          {/* Windows 11 Style Modern Dropdown */}
          <div className="mt-1 w-full bg-background border border-border shadow-lg rounded-md max-h-[220px] overflow-y-auto overflow-x-hidden flex flex-col p-1">
            {filteredItems.length > 0 ? (
              filteredItems.map((item) => (
                <button
                  key={item.id}
                  className="flex items-center justify-between px-3 py-2 w-full text-left text-sm rounded-sm transition-colors hover:bg-accent/80 focus:bg-accent/80 focus:outline-none group"
                  onClick={() => {
                    setLocalValue(item.title);
                    onChange(item.title);
                    onSelectProduct(item);
                  }}
                >
                  <span className="font-medium truncate flex-1 text-foreground">
                    {item.title}
                  </span>
                  {item.rate !== undefined && (
                    <span className="ml-3 text-xs font-semibold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border/50 group-hover:bg-background/80 transition-colors">
                      ₹{item.rate}
                    </span>
                  )}
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-sm text-center text-muted-foreground italic">
                {localValue
                  ? `No products matching "${localValue}"`
                  : "Start typing to search inventory..."}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={resetStyles}
              className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="w-3 h-3 mr-1" /> Reset Format
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setLocalValue("");
                onChange("");
              }}
              className="h-7 text-xs px-2 text-red-500 hover:text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-3 h-3 mr-1" /> Clear
            </Button>
          </div>
          <Button size="sm" onClick={handleSave} className="h-7 text-xs px-4">
            <Check className="w-3 h-3 mr-1" /> Done
          </Button>
        </div>

        {developerMode && (
          <div className="mt-2 p-2 bg-slate-100 rounded text-xs font-mono break-words border border-slate-200 text-slate-500">
            <div className="font-bold text-slate-700 mb-1">Developer Info</div>
            <div>styleKey/lockableKey: {uniqueKey || "none"}</div>
            <div>isLocked: {isLocked ? "true" : "false"}</div>
            <div>myStyle: {JSON.stringify(myStyle)}</div>
            <div>localVariant: {JSON.stringify(localVariant)}</div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
