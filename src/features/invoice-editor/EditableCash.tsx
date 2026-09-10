import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Lock, Unlock, RotateCcw, Type, Baseline, CaseUpper, Check, ChevronsUpDown, Trash2 } from "lucide-react";
import { useCompanyStore, useHistoryStore, useUiStore } from "@/stores";
import { saveCompanySettings } from "@/services/settings.service";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { formatFontVariant, parseFontVariant } from "@/lib/utils";
import { CompanyContext } from "./InvoicePreview";

const FALLBACK_FONTS = [
  "Arial", "Times New Roman", "Courier New", "Georgia", "Verdana", "Tahoma", "Trebuchet MS", "Impact"
];

const SIZES = ["10px", "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];

export const EditableCash = ({
  value,
  onChange,
  isEditing,
  className,
  placeholder = "",
  options,
  lockableKey,
  styleKey,
  numericOnly = false,
  type,
  multiline,
  onDone,
}: {
  value: string | number;
  onChange: (val: string) => void;
  isEditing: boolean;
  className?: string;
  placeholder?: string;
  options?: string[];
  lockableKey?: string;
  styleKey?: string;
  numericOnly?: boolean;
  type?: string;
  multiline?: boolean;
  onDone?: (val: string) => void;
}) => {
  const [openPopover, setOpenPopover] = useState(false);
  const [openFontDropdown, setOpenFontDropdown] = useState(false);
  const [localValue, setLocalValue] = useState(String(value || ""));
  const [isAltHover, setIsAltHover] = useState(false);
  const [computedSize, setComputedSize] = useState("");
  const [computedVariant, setComputedVariant] = useState("");
  const spanRef = React.useRef<HTMLSpanElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const { company: globalCompany, setCompany } = useCompanyStore();
  const contextCompany = React.useContext(CompanyContext);
  const company = contextCompany || globalCompany;
  const developerMode = useUiStore((state) => state.developerMode);
  const systemFonts = useUiStore((state) => state.systemFonts);
  const FONTS = systemFonts.length > 0 ? systemFonts.map(f => f.family) : FALLBACK_FONTS;

  // Parse locked fields
  let lockedFields: Record<string, any> = {};
  if (company?.lockedFields) {
    try {
      lockedFields = JSON.parse(company.lockedFields);
    } catch (e) {}
  }
  const isLocked = lockableKey ? !!lockedFields[lockableKey] : false;

  // Parse styles
  let fieldStyles: Record<string, any> = {};
  if (company?.fieldStyles) {
    try {
      fieldStyles = JSON.parse(company.fieldStyles);
    } catch (e) {}
  }
  
  const uniqueKey = lockableKey || styleKey;
  const myStyle = uniqueKey ? fieldStyles[uniqueKey] : undefined;

  const currentFontFamily = myStyle?.font || company?.masterFont || "Segoe UI";
  const selectedFontObj = systemFonts.find(f => f.family === currentFontFamily);
  const availableVariants = selectedFontObj?.variants || ["Regular", "Italic", "Bold", "Bold Italic"];

  // Sync value
  useEffect(() => {
    setLocalValue(String(value || ""));
  }, [value]);

  const toggleLock = () => {
    if (!company || !lockableKey) return;
    useHistoryStore.getState().commit();
    let currentLocked = { ...lockedFields };
    if (!isLocked) {
      currentLocked[lockableKey] = {
        id: lockableKey,
        isLocked: true,
        label: placeholder || lockableKey,
        value: String(localValue || value || "")
      };
    } else {
      delete currentLocked[lockableKey];
    }
    const updatedCompany = { ...company, lockedFields: JSON.stringify(currentLocked) } as import("@/types").Company;
    setCompany(updatedCompany);
    saveCompanySettings(updatedCompany);
  };

  const updateStyle = (key: string, val: any) => {
    if (!company || !uniqueKey) return;
    useHistoryStore.getState().commit();
    let currentStyles = { ...fieldStyles };
    if (!currentStyles[uniqueKey]) currentStyles[uniqueKey] = {};
    currentStyles[uniqueKey][key] = val;
    
    const updatedCompany = { ...company, fieldStyles: JSON.stringify(currentStyles) } as import("@/types").Company;
    setCompany(updatedCompany);
    saveCompanySettings(updatedCompany);
  };

  const updateStyles = (updates: Record<string, any>) => {
    if (!company || !uniqueKey) return;
    useHistoryStore.getState().commit();
    let currentStyles = { ...fieldStyles };
    if (!currentStyles[uniqueKey]) currentStyles[uniqueKey] = {};
    Object.assign(currentStyles[uniqueKey], updates);
    
    const updatedCompany = { ...company, fieldStyles: JSON.stringify(currentStyles) } as import("@/types").Company;
    setCompany(updatedCompany);
    saveCompanySettings(updatedCompany);
  };

  const resetStyles = () => {
    if (!company || !uniqueKey) return;
    useHistoryStore.getState().commit();
    let currentStyles = { ...fieldStyles };
    delete currentStyles[uniqueKey];
    const updatedCompany = { ...company, fieldStyles: JSON.stringify(currentStyles) } as import("@/types").Company;
    setCompany(updatedCompany);
    saveCompanySettings(updatedCompany);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newVal = e.target.value.replace(/[^0-9.]/g, "");
    
    const parts = newVal.split(".");
    if (parts.length > 2) {
      newVal = parts[0] + "." + parts.slice(1).join("");
    }
    
    setLocalValue(newVal);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (newVal !== String(value || "")) {
        onChange(newVal);
      }
    }, 400);
  };

  const handleSave = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    let finalValue = localValue;
    if (localValue && !isNaN(Number(localValue))) {
      finalValue = Number(localValue).toFixed(2);
      if (finalValue !== localValue) {
        setLocalValue(finalValue);
      }
    }
    
    if (finalValue !== String(value || "")) {
      useHistoryStore.getState().commit();
      onChange(finalValue);
    }
  };

  const localVariant = parseFontVariant(myStyle?.variant || ((myStyle?.bold ? "700 " : "") + (myStyle?.italic ? "Italic" : "")));

  const styleObj: React.CSSProperties = {
    fontFamily: myStyle?.font || undefined,
    fontWeight: localVariant.weight !== "normal" ? localVariant.weight : undefined,
    fontStyle: localVariant.style !== "normal" ? localVariant.style : undefined,
    textDecoration: myStyle?.underline ? "underline" : undefined,
    textTransform: myStyle?.capsLock ? "uppercase" : undefined,
    color: myStyle?.color || undefined,
    fontSize: myStyle?.size ? (!isNaN(Number(myStyle?.size)) ? `${myStyle?.size}px` : myStyle?.size) : undefined,
  };

  useEffect(() => {
    if (openPopover && spanRef.current) {
      const style = window.getComputedStyle(spanRef.current);
      // It typically returns pixels, e.g., "14px"
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
  }, [openPopover]);

  if (!isEditing) {
    if (!value && value !== 0) return <span className={cn("inline-block min-h-[1em]", className)}>&nbsp;</span>;
    return <span style={styleObj} className={cn("whitespace-pre-line break-words", className)}>{value}</span>;
  }

  return (
    <Popover open={openPopover} onOpenChange={(open) => {
      if (!open) {
        handleSave(); // Save on close
      }
      setOpenPopover(open);
    }}>
      <PopoverTrigger render={
        <button
          type="button"
          data-editable-field="true"
          onDoubleClick={(e) => {
            e.stopPropagation();
            setOpenPopover(true);
          }}
          className={cn(
            "whitespace-pre-line break-words cursor-text hover:bg-black/5 hover:ring-1 hover:ring-black/10 rounded-md px-1.5 -ml-1.5 transition-all block w-full min-h-[1.2em] min-w-[30px] text-left border-none bg-transparent appearance-none",
            "relative before:absolute before:-inset-y-4 before:-inset-x-2 before:content-[''] before:z-0",
            className
          )}
          title={developerMode && isAltHover && uniqueKey ? `Key: ${uniqueKey}` : "Double-click to edit text and formatting"}
          onMouseEnter={(e) => setIsAltHover(e.altKey)}
          onMouseMove={(e) => setIsAltHover(e.altKey)}
          onMouseLeave={() => setIsAltHover(false)}
        >
          <span className="relative z-10 flex items-center justify-between group/field">
             <span ref={spanRef} style={styleObj}>{value || (placeholder ? <span className="opacity-40 italic font-normal">{placeholder}</span> : <span>&nbsp;</span>)}</span>
             {lockableKey && isLocked && (
               <Lock className="h-3 w-3 text-muted-foreground/40 opacity-100 ml-1 shrink-0" />
             )}
          </span>
        </button>
      } />

      <PopoverContent className="w-[440px] p-2 flex flex-col gap-2 z-[200]" align="start" sideOffset={8}>
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

        {/* Editing Area */}
        <div className="relative py-4 flex items-center justify-center">
          <div className="inline-flex items-center justify-end gap-1 bg-background rounded-md px-3 py-2 border border-input shadow-sm transition-colors hover:border-ring/50 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
            <span className="text-muted-foreground font-medium select-none text-lg">₹</span>
            <input
              type="text"
              autoFocus
              value={localValue}
              onChange={handleTextChange}
              className="bg-transparent border-none outline-none text-right text-foreground font-medium p-0 m-0 text-lg"
              style={{
                ...styleObj,
                width: `${Math.max(1, localValue.length) + 1}ch`,
                minWidth: "3ch",
              }}
            />
          </div>
          
          {/* Autocomplete Dropdown */}
          {options && options.length > 0 && (
             <div className="mt-1 w-full bg-white border border-border shadow-md rounded-md max-h-[150px] overflow-y-auto">
               <ul className="flex flex-col py-1 m-0 p-0 list-none">
                 {options.filter(o => o.toLowerCase().includes(String(localValue || "").toLowerCase())).map((option) => (
                   <li
                     key={option}
                     className="px-3 py-1.5 text-sm hover:bg-muted cursor-pointer"
                     onClick={() => {
                        setLocalValue(option);
                        onChange(option);
                     }}
                   >
                     {option}
                   </li>
                 ))}
               </ul>
             </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={resetStyles} className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground">
              <RotateCcw className="w-3 h-3 mr-1" /> Reset Format
            </Button>
          </div>
          <Button size="sm" onClick={() => setOpenPopover(false)} className="h-7 px-4 text-xs font-semibold shadow-sm">
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

