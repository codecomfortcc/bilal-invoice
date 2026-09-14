import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useHistoryStore } from "@/stores";
import { ContentEditable } from "@/components/ui/content-editable";

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
  const [localValue, setLocalValue] = useState(String(value || ""));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setLocalValue(String(value || ""));
  }, [value]);

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
    if (onDone) onDone(finalValue);
  };

  return (
    <ContentEditable
      isEditing={isEditing}
      value={localValue}
      placeholder={placeholder}
      lockableKey={lockableKey}
      styleKey={styleKey}
      className={className}
      onSave={handleSave}
      showClear={false}
    >
      {({ styleObj }) => (
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
      )}
    </ContentEditable>
  );
};
