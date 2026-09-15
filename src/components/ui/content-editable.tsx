import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ColorPicker } from "@/components/ui/color-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { Lock, Unlock, RotateCcw, Baseline, CaseUpper, Check, ChevronsUpDown, Trash2 } from "lucide-react";
import { useCompanyStore, useHistoryStore, useUiStore } from "@/stores";
import { saveCompanySettings } from "@/services/settings.service";
import { formatFontVariant, parseFontVariant } from "@/lib/utils";
import { CompanyContext } from "@/features/invoice-editor/InvoicePreview";

const FALLBACK_FONTS = [
  "Arial", "Helvetica", "Times New Roman", "Courier New", "Georgia", "Verdana", "Tahoma", "Trebuchet MS", "Impact", "Segoe UI"
];

const SIZES = ["10px", "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];

export interface ContentEditableProps {
  value: any;
  placeholder?: string;
  isEditing?: boolean;
  className?: string;
  lockableKey?: string;
  styleKey?: string;
  
  // Feature flags
  showFormatting?: boolean;
  showClear?: boolean;
  showLock?: boolean;
  
  // Renderers
  renderDisplay?: (styleObj: React.CSSProperties) => React.ReactNode;
  children: (props: { styleObj: React.CSSProperties; handleClose: () => void }) => React.ReactNode;
  
  onClear?: () => void;
  onSave?: () => void;
  
  popoverWidth?: string;
}

export function ContentEditable({
  value,
  placeholder = "",
  isEditing = true,
  className,
  lockableKey,
  styleKey,
  showFormatting = true,
  showClear = true,
  showLock = true,
  renderDisplay,
  children,
  onClear,
  onSave,
  popoverWidth = "w-[440px]",
}: ContentEditableProps) {
  const [openPopover, setOpenPopover] = useState(false);
  const [openFontDropdown, setOpenFontDropdown] = useState(false);
  const [isAltHover, setIsAltHover] = useState(false);
  
  // Font sync states
  const [computedSize, setComputedSize] = useState("");
  const [computedVariant, setComputedVariant] = useState("");
  const spanRef = useRef<HTMLSpanElement>(null);
  
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

  const toggleLock = () => {
    if (!company || !lockableKey) return;
    useHistoryStore.getState().commit();
    let currentLocked = { ...lockedFields };
    if (!isLocked) {
      currentLocked[lockableKey] = {
        id: lockableKey,
        isLocked: true,
        label: placeholder || lockableKey,
        value: String(value || "")
      };
    } else {
      delete currentLocked[lockableKey];
    }
    const updatedCompany = { ...company, lockedFields: JSON.stringify(currentLocked) } as any;
    setCompany(updatedCompany);
    saveCompanySettings(updatedCompany);
  };

  const updateStyle = (key: string, val: any) => {
    if (!company || !uniqueKey) return;
    useHistoryStore.getState().commit();
    let currentStyles = { ...fieldStyles };
    if (!currentStyles[uniqueKey]) currentStyles[uniqueKey] = {};
    currentStyles[uniqueKey][key] = val;
    
    const updatedCompany = { ...company, fieldStyles: JSON.stringify(currentStyles) } as any;
    setCompany(updatedCompany);
    saveCompanySettings(updatedCompany);
  };

  const resetStyles = () => {
    if (!company || !uniqueKey) return;
    useHistoryStore.getState().commit();
    let currentStyles = { ...fieldStyles };
    delete currentStyles[uniqueKey];
    const updatedCompany = { ...company, fieldStyles: JSON.stringify(currentStyles) } as any;
    setCompany(updatedCompany);
    saveCompanySettings(updatedCompany);
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
  };

  if (!myStyle?.color && company?.masterColor) {
    styleObj.color = company.masterColor;
  }

  useEffect(() => {
    if (openPopover && spanRef.current) {
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
  }, [openPopover]);

  const handleClose = () => {
    if (onSave) onSave();
    setOpenPopover(false);
  };

  if (!isEditing) {
    if (renderDisplay) {
      return <>{renderDisplay(styleObj)}</>;
    }
    if (!value && value !== 0) {
      return <span className={cn("inline-block min-h-[1em]", className)}>&nbsp;</span>;
    }
    return (
      <span style={styleObj} className={cn("whitespace-pre-line break-words inline-block w-full", className)}>
        {value}
      </span>
    );
  }

  return (
    <Popover open={openPopover} onOpenChange={(open) => {
      if (!open && onSave) {
        onSave(); // Save on close
      }
      setOpenPopover(open);
    }}>
      <PopoverTrigger render={ renderDisplay ? (
          <div
            ref={spanRef as any}
            data-editable-field="true"
            onDoubleClick={(e) => { e.stopPropagation(); setOpenPopover(true); }}
            className={className}
          >
            {renderDisplay(styleObj)}
          </div>
        ) : (
          <button
            type="button"
            data-editable-field="true"
            onDoubleClick={(e) => {
              e.stopPropagation();
              setOpenPopover(true);
            }}
            onClick={(e) => {
              if (isAltHover && lockableKey) {
                e.preventDefault();
                e.stopPropagation();
                toggleLock();
              }
            }}
            className={cn(
              "relative inline-flex items-center justify-start text-left w-full transition-all rounded-sm border border-transparent outline-none",
              "hover:bg-blue-50/50 hover:border-blue-200/50 hover:shadow-[0_0_0_2px_rgba(59,130,246,0.1)]",
              "focus:bg-blue-50/50 focus:border-blue-200 focus:shadow-[0_0_0_2px_rgba(59,130,246,0.2)]",
              !value && "text-muted-foreground/60",
              className
            )}
            title={developerMode && isAltHover && uniqueKey ? `Key: ${uniqueKey}` : "Double-click to edit"}
            onKeyDown={(e) => { if (e.key === "Alt") setIsAltHover(true); }}
            onKeyUp={(e) => { if (e.key === "Alt") setIsAltHover(false); }}
            onMouseEnter={(e) => { if (e.altKey) setIsAltHover(true); }}
            onMouseLeave={() => setIsAltHover(false)}
          >
            {lockableKey && isLocked && !isAltHover && (
              <Lock className="absolute -left-3 top-1/2 -translate-y-1/2 w-2.5 h-2.5 text-muted-foreground/40" />
            )}
            {lockableKey && isAltHover && showLock && (
              <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center cursor-pointer shadow-sm z-10 hover:bg-blue-200 transition-colors">
                {isLocked ? (
                  <Unlock className="w-2.5 h-2.5 text-blue-600" />
                ) : (
                  <Lock className="w-2.5 h-2.5 text-blue-600" />
                )}
              </div>
            )}
            <span ref={spanRef} style={styleObj} className="break-words break-all whitespace-normal block w-full">
               {value || (isEditing && placeholder ? <span className="opacity-40 italic font-normal">{placeholder}</span> : <span>&nbsp;</span>)}
            </span>
          </button>
        )}>
       
      </PopoverTrigger>

      <PopoverContent className={cn(popoverWidth, "p-2 flex flex-col gap-2 z-[200]")} align="start" sideOffset={8}>
        {/* Formatting Toolbar */}
        {showFormatting && (
          <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-md border border-border">
            <Popover open={openFontDropdown} onOpenChange={setOpenFontDropdown}>
              <PopoverTrigger render={   <Button
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
                          <Check className={cn("mr-2 h-4 w-4", currentFontFamily === font ? "opacity-100" : "opacity-0")} />
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
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Separator orientation="vertical" className="h-6 mx-1" />

            <Select 
              value={myStyle?.variant || ((myStyle?.bold ? "700 " : "") + (myStyle?.italic ? "Italic" : "")).trim() || computedVariant || company?.masterFontVariant || "Regular"} 
              onValueChange={(v) => updateStyle("variant", v)}
            >
              <SelectTrigger className="h-8 text-xs w-[110px] bg-background">
                <SelectValue placeholder="Variant" />
              </SelectTrigger>
              <SelectContent className="z-[210]">
                {availableVariants.map(v => (
                  <SelectItem 
                    key={v} 
                    value={v}
                    className={cn(v.includes("Bold") && "font-bold", v.includes("Italic") && "italic")}
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
            
            <ColorPicker color={myStyle?.color || company?.masterColor || "#000000"} onChange={(c) => updateStyle("color", c)} />
          </div>
        )}

        {/* Editor Area (Provided as children) */}
        {children({ styleObj, handleClose })}

        {/* Footer Actions */}
        {(showFormatting || showClear || (showLock && lockableKey)) && (
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {showFormatting && (
                <Button variant="ghost" size="sm" onClick={resetStyles} className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground">
                  <RotateCcw className="w-3 h-3 mr-1" /> Reset Format
                </Button>
              )}
              {showClear && onClear && (
                <Button variant="ghost" size="sm" onClick={() => { onClear(); if (!showFormatting) setOpenPopover(false); }} className="h-7 text-xs px-2 text-red-400 hover:text-red-300 hover:bg-red-400/10">
                  <Trash2 className="w-3 h-3 mr-1" /> Clear
                </Button>
              )}
              {showLock && lockableKey && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleLock}
                  className={cn("h-7 text-xs px-2", isLocked && "bg-primary/15 text-primary hover:bg-primary/25")}
                >
                  {isLocked ? <Lock className="w-3 h-3 mr-1" /> : <Unlock className="w-3 h-3 mr-1" />}
                  {isLocked ? "Locked" : "Lock Field"}
                </Button>
              )}
            </div>
            <Button size="sm" onClick={handleClose} className="h-7 px-3 text-xs">
              <Check className="w-3 h-3 mr-1" /> Done
            </Button>
          </div>
        )}
        
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
}
