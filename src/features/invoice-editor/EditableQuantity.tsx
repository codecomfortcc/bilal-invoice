import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { Minus, Plus } from "lucide-react";
import { useHistoryStore } from "@/stores";
import { ContentEditable } from "@/components/ui/content-editable";

export const EditableQuantity = ({
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

  const handleIncrement = () => {
    const current = Number(localValue) || 0;
    const newVal = String(current + 1);
    setLocalValue(newVal);
    onChange(newVal);
  };

  const handleDecrement = () => {
    const current = Number(localValue) || 0;
    if (current > 1) {
      const newVal = String(current - 1);
      setLocalValue(newVal);
      onChange(newVal);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let newVal = e.target.value;
    if (numericOnly) {
      newVal = newVal.replace(/[^0-9.,]/g, '');
    }
    setLocalValue(newVal);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (newVal !== String(value || "")) {
        onChange(newVal);
      }
    }, 300);
  };

  const handleSave = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (localValue !== String(value || "")) {
      useHistoryStore.getState().commit();
      onChange(localValue);
    }
    if (onDone) onDone(localValue);
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
        <div className="relative py-4 flex flex-col items-center justify-center">
          <div className="inline-flex items-center justify-center gap-1.5 group bg-background rounded-md px-2 py-1 border border-input shadow-sm transition-colors hover:border-ring/50 focus-within:border-ring focus-within:ring-1 focus-within:ring-ring">
            <button
              onClick={handleDecrement}
              className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent active:scale-95 transition-all outline-none"
            >
              <Minus className="w-4 h-4" />
            </button>
            
            <input
              type="text"
              autoFocus
              value={localValue}
              onChange={handleTextChange}
              className="bg-transparent border-none outline-none text-center text-foreground font-medium p-0 m-0"
              style={{
                ...styleObj,
                width: `${Math.max(1, localValue.length) + 1}ch`,
                minWidth: "2ch",
              }}
            />
            
            <button
              onClick={handleIncrement}
              className="w-8 h-8 rounded flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent active:scale-95 transition-all outline-none"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
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
