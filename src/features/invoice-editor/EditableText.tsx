import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useHistoryStore } from "@/stores";
import { ContentEditable } from "@/components/ui/content-editable";

export const EditableText = ({
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

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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

  const handleClear = () => {
    setLocalValue("");
    onChange("");
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
      onClear={handleClear}
    >
      {({ styleObj }) => (
        <div className="relative w-full">
          <textarea
            autoFocus
            className="w-full min-h-[72px] p-2 text-sm bg-background rounded-md border border-input focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shadow-sm resize-none overflow-hidden"
            value={localValue}
            onChange={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
              handleTextChange(e);
            }}
            ref={(e) => {
              if (e) {
                e.style.height = 'auto';
                e.style.height = e.scrollHeight + 'px';
              }
            }}
            placeholder={placeholder}
            style={styleObj}
          />
          
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
