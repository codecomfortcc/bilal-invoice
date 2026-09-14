import React, { useState, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { InventoryItem } from "@/types/inventory";
import { ContentEditable } from "@/components/ui/content-editable";
import { cn } from "@/lib/utils";

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
  const [localValue, setLocalValue] = useState(String(value || ""));
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  };

  const handleClear = () => {
    setLocalValue("");
    onChange("");
  };

  const filteredItems = inventoryItems.filter((item) =>
    item.title.toLowerCase().includes(localValue.toLowerCase()),
  );

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
      )}
    </ContentEditable>
  );
};
