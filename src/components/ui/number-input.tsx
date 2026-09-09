import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumberInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export const NumberInput = ({
  value,
  onChange,
  className,
  placeholder,
}: NumberInputProps) => {
  return (
    <Input
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      className={cn("tabular-nums", className)}
      value={value}
      onChange={(e) => {
        const val = e.target.value;
        if (/^\d*\.?\d*$/.test(val)) {
          onChange(val);
        }
      }}
    />
  );
};
