import { format, parseISO } from "date-fns";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Eraser } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  date?: string;
  onSelect: (date: string) => void;
  placeholder?: string;
}

export const DatePicker = ({
  date,
  onSelect,
  placeholder = "Pick a date",
}: DatePickerProps) => {
  const parsedDate = date ? parseISO(date) : undefined;

  return (
    <Popover>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-start text-left font-normal bg-background/50 hover:bg-background",
          !date && "text-muted-foreground"
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
        {date ? format(parsedDate!, "PPP") : <span>{placeholder}</span>}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={parsedDate}
          onSelect={(d) => onSelect(d ? format(d, "yyyy-MM-dd") : "")}
        />
        <div className="p-2 border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground hover:text-destructive"
            onClick={() => onSelect("")}
          >
            <Eraser className="h-4 w-4 mr-2" />
            Flush Date
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
