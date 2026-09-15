import React, { useEffect, useState } from "react";
import { format, parse, isValid } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { useCompanyStore } from "@/stores";
import { Company } from "@/types";
import { CompanyContext } from "./InvoicePreview";
import { ContentEditable } from "@/components/ui/content-editable";
import { Switch } from "@/components/ui/switch";
import { saveCompanySettings } from "@/services/settings.service";
import { cn } from "@/lib/utils";

export const EditableDate = ({
  value,
  onChange,
  className,
  placeholder = "Select Date",
  lockableKey,
  styleKey,
  isEditing = true,
  showAutoDateToggle = false,
  autoDateConfigKey,
}: {
  value: string;
  onChange: (val: string) => void;
  className?: string;
  placeholder?: string;
  lockableKey?: string;
  styleKey?: string;
  isEditing?: boolean;
  showAutoDateToggle?: boolean;
  autoDateConfigKey?: keyof Company;
}) => {
  const [date, setDate] = useState<Date | undefined>(undefined);
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());
  
  const { company: globalCompany, setCompany } = useCompanyStore();
  const contextCompany = React.useContext(CompanyContext);
  const company = contextCompany || globalCompany;

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

  const getFormattedDisplay = () => {
    const isAutoDate = showAutoDateToggle && autoDateConfigKey && company?.[autoDateConfigKey] !== false;
    if (!isAutoDate && (!date || !isValid(date))) {
      return value || (isEditing && placeholder ? <span className="opacity-40 italic font-normal">{placeholder}</span> : <span>&nbsp;</span>);
    }
    
    const dateToFormat = isAutoDate ? new Date() : (date as Date);
    const formatStr = company?.dateFormat || "YYYY-MM-DD";
    switch (formatStr) {
      case "DD-MM-YYYY": return format(dateToFormat, "dd-MM-yyyy");
      case "DD-MM-YY": return format(dateToFormat, "dd-MM-yy");
      case "DD/MM/YYYY": return format(dateToFormat, "dd/MM/yyyy");
      case "DD MMM YYYY": return format(dateToFormat, "dd MMM yyyy");
      case "DD MMMM YYYY": return format(dateToFormat, "dd MMMM yyyy");
      case "YYYY-MM-DD":
      default: return format(dateToFormat, "yyyy-MM-dd");
    }
  };

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

  const handleClear = () => {
    setDay("");
    setMonth("");
    setYear("");
    setDate(undefined);
    onChange("");
  };

  return (
    <ContentEditable
      isEditing={isEditing}
      value={value}
      placeholder={placeholder}
      lockableKey={lockableKey}
      styleKey={styleKey}
      className={className}
      onClear={handleClear}
      renderDisplay={(styleObj) => (
        <span style={styleObj} className={cn("whitespace-pre-line break-words inline-block w-full", className)}>
          {getFormattedDisplay()}
        </span>
      )}
    >
      {() => (
        <div className="relative flex flex-col p-2 border border-border rounded-md bg-background">
          {showAutoDateToggle && autoDateConfigKey && (
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
              <span className="text-sm font-medium">Auto Date</span>
              <Switch 
                checked={company?.[autoDateConfigKey] !== false}
                onCheckedChange={(checked) => {
                  const updatedCompany = { ...company, [autoDateConfigKey]: checked } as any;
                  setCompany(updatedCompany);
                  saveCompanySettings(updatedCompany);
                }}
              />
            </div>
          )}
          
          {(showAutoDateToggle && autoDateConfigKey && company?.[autoDateConfigKey] !== false) ? (
            <div className="text-sm text-center py-4 text-muted-foreground flex flex-col items-center gap-1">
              <span>Automatically using today's date.</span>
              <span className="text-xs">Turn off to pick manually.</span>
            </div>
          ) : (
            <>
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
            </>
          )}
        </div>
      )}
    </ContentEditable>
  );
};
