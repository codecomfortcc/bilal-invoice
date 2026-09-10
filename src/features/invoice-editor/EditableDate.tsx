import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Lock, Unlock, CalendarIcon, RotateCcw, Type, Baseline, CaseUpper, Check, ChevronsUpDown, Trash2 } from "lucide-react";
import { useCompanyStore, useHistoryStore, useUiStore } from "@/stores";
import { saveCompanySettings } from "@/services/settings.service";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Separator } from "@/components/ui/separator";
import { Calendar } from "@/components/ui/calendar";
import { formatFontVariant, parseFontVariant } from "@/lib/utils";
import { format, parse, isValid } from "date-fns";
import { CompanyContext } from "./InvoicePreview";

const FALLBACK_FONTS = [
  "Arial", "Times New Roman", "Courier New", "Georgia", "Verdana", "Tahoma", "Trebuchet MS", "Impact"
];

const SIZES = ["10px", "12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"];

export const EditableDate = ({
  value,
  onChange,
  className,
  placeholder = "Select Date",
  lockableKey,
  styleKey,
  isEditing = true,
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  lockableKey?: string;
  styleKey?: string;
  isEditing?: boolean;
}) => {
  const [openPopover, setOpenPopover] = useState(false);
  const [openFontDropdown, setOpenFontDropdown] = useState(false);
  const [isAltHover, setIsAltHover] = useState(false);
  const [computedSize, setComputedSize] = useState("");
  const [computedVariant, setComputedVariant] = useState("");
  
  // Date state
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  const spanRef = React.useRef<HTMLSpanElement>(null);
  
  const { company: globalCompany } = useCompanyStore();
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
  
  // Initialize state from prop value
  useEffect(() => {
    if (value) {
      const parsedDate = new Date(value);
      if (isValid(parsedDate)) {
        setDate(parsedDate);
        setDay(format(parsedDate, "dd"));
        setMonth(format(parsedDate, "MM"));
        setYear(format(parsedDate, "yyyy"));
        setCalendarMonth(parsedDate);
      }
    }
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
        value: value,
      };
    } else {
      delete currentLocked[lockableKey];
    }
    const updatedCompany = { ...company, lockedFields: JSON.stringify(currentLocked) } as any;
    useCompanyStore.getState().setCompany(updatedCompany);
    saveCompanySettings(updatedCompany);
  };

  const updateStyle = (key: string, val: any) => {
    if (!company || !uniqueKey) return;
    useHistoryStore.getState().commit();
    let currentStyles = { ...fieldStyles };
    if (!currentStyles[uniqueKey]) currentStyles[uniqueKey] = {};
    currentStyles[uniqueKey][key] = val;
    
    const updatedCompany = { ...company, fieldStyles: JSON.stringify(currentStyles) } as any;
    useCompanyStore.getState().setCompany(updatedCompany);
    saveCompanySettings(updatedCompany);
  };

  const resetStyles = () => {
    if (!company || !uniqueKey) return;
    useHistoryStore.getState().commit();
    let currentStyles = { ...fieldStyles };
    delete currentStyles[uniqueKey];
    const updatedCompany = { ...company, fieldStyles: JSON.stringify(currentStyles) } as any;
    useCompanyStore.getState().setCompany(updatedCompany);
    saveCompanySettings(updatedCompany);
  };

  // Format the output date based on company settings
  const getFormattedDisplay = () => {
    if (!date || !isValid(date)) return value || placeholder;
    const formatStr = company?.dateFormat || "YYYY-MM-DD";
    switch (formatStr) {
      case "DD-MM-YYYY": return format(date, "dd-MM-yyyy");
      case "DD-MM-YY": return format(date, "dd-MM-yy");
      case "DD/MM/YYYY": return format(date, "dd/MM/yyyy");
      case "DD MMM YYYY": return format(date, "dd MMM yyyy");
      case "DD MMMM YYYY": return format(date, "dd MMMM yyyy");
      case "YYYY-MM-DD":
      default: return format(date, "yyyy-MM-dd");
    }
  };

  // Sync from Calendar to Inputs and Parent
  const handleSelectDate = (newDate: Date | undefined) => {
    setDate(newDate);
    if (newDate && isValid(newDate)) {
      setDay(format(newDate, "dd"));
      setMonth(format(newDate, "MM"));
      setYear(format(newDate, "yyyy"));
      setCalendarMonth(newDate);
      onChange(format(newDate, "yyyy-MM-dd"));
    } else {
      setDay("");
      setMonth("");
      setYear("");
      onChange("");
    }
  };

  // Sync from Inputs to Calendar and Parent
  const handleInputUpdate = (d: string, m: string, y: string) => {
    setDay(d);
    setMonth(m);
    setYear(y);

    if (d.length > 0 && m.length > 0 && y.length === 4) {
      const parsedDate = parse(`${y}-${m}-${d}`, "yyyy-MM-dd", new Date());
      if (isValid(parsedDate)) {
        setDate(parsedDate);
        setCalendarMonth(parsedDate);
        onChange(format(parsedDate, "yyyy-MM-dd"));
      } else {
        setDate(undefined);
      }
    } else {
      setDate(undefined);
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

  if (!isEditing) {
    if (!value) return <span className={cn("inline-block min-h-[1em]", className)}>&nbsp;</span>;
    return <span style={styleObj} className={cn("whitespace-pre-line break-words", className)}>{getFormattedDisplay()}</span>;
  }

  return (
    <Popover open={openPopover} onOpenChange={setOpenPopover}>
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
          title={developerMode && isAltHover && uniqueKey ? `Key: ${uniqueKey}` : "Double-click to edit date and formatting"}
          onMouseEnter={(e) => setIsAltHover(e.altKey)}
          onMouseMove={(e) => setIsAltHover(e.altKey)}
          onMouseLeave={() => setIsAltHover(false)}
        >
          <span className="relative z-10 flex items-center justify-between group/field">
             <span ref={spanRef} style={styleObj}>{getFormattedDisplay()}</span>
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

        {/* Date Editor Area */}
        <div className="relative flex flex-col p-2 border border-border rounded-md bg-background">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleSelectDate}
            month={calendarMonth}
            onMonthChange={setCalendarMonth}

            className="w-full flex justify-center [&>div]:w-full [&_table]:w-full [&_td]:w-full [&_button]:aspect-auto [&_button]:h-9"
          />
          <div className="flex gap-2 items-center justify-center mt-2 pt-4 border-t border-border">
            <Input 
              value={day} 
              onChange={(e) => handleInputUpdate(e.target.value, month, year)} 
              placeholder="DD" 
              maxLength={2}
              className="w-16 text-center h-9"
            />
            <span className="text-muted-foreground text-sm font-medium">/</span>
            <Input 
              value={month} 
              onChange={(e) => handleInputUpdate(day, e.target.value, year)} 
              placeholder="MM" 
              maxLength={2}
              className="w-16 text-center h-9"
            />
            <span className="text-muted-foreground text-sm font-medium">/</span>
            <Input 
              value={year} 
              onChange={(e) => handleInputUpdate(day, month, e.target.value)} 
              placeholder="YYYY" 
              maxLength={4}
              className="w-20 text-center h-9"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={resetStyles} className="h-7 text-xs px-2 text-muted-foreground hover:text-foreground">
              <RotateCcw className="w-3 h-3 mr-1" /> Reset Format
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setDay(""); setMonth(""); setYear(""); setDate(undefined); onChange(""); }} className="h-7 text-xs px-2 text-red-500 hover:text-red-600 hover:bg-red-50">
              <Trash2 className="w-3 h-3 mr-1" /> Clear
            </Button>
            {lockableKey && (
              <Button
                variant={isLocked ? "secondary" : "ghost"}
                size="sm"
                onClick={toggleLock}
                className={cn("h-7 text-xs px-2", isLocked && "text-blue-600 bg-blue-50 hover:bg-blue-100")}
              >
                {isLocked ? <Lock className="w-3 h-3 mr-1" /> : <Unlock className="w-3 h-3 mr-1" />}
                {isLocked ? "Locked" : "Lock Field"}
              </Button>
            )}
          </div>
          <Button size="sm" onClick={() => setOpenPopover(false)} className="h-7 px-3 text-xs">
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
