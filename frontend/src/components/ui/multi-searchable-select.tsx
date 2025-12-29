import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface MultiSearchableSelectProps {
  label?: string;
  options: Option[];
  value: string[];
  onChange: (v: string[]) => void;
  error?: string;
  placeholder?: string;
}

export function MultiSearchableSelect({
  label,
  options = [],
  value = [],
  onChange,
  error,
  placeholder = "Select users",
}: MultiSearchableSelectProps) {
  const [open, setOpen] = useState(false);

  const toggleValue = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const removeValue = (val: string) => {
    onChange(value.filter((v) => v !== val));
  };

  const selectedOptions = options.filter((o) => value.includes(o.value));

  return (
    <div className="space-y-2">
      {label && <label className="text-sm font-medium">{label}</label>}

      {/* SELECTED CHIPS */}
      {selectedOptions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedOptions.map((opt) => (
            <span
              key={opt.value}
              className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-full text-xs"
            >
              {opt.label}
              <button
                type="button"
                onClick={() => removeValue(opt.value)}
                className="hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* DROPDOWN BUTTON */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "w-full border rounded-md px-3 py-2 flex justify-between items-center",
          error && "border-destructive"
        )}
      >
        <span className="truncate">
          {value.length === 0
            ? placeholder
            : `${value.length} user${value.length > 1 ? "s" : ""} selected`}
        </span>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </button>

      {/* DROPDOWN LIST */}
      {open && (
        <div className="border rounded-md max-h-60 overflow-y-auto bg-background">
          {options.map((opt) => {
            const selected = value.includes(opt.value);
            return (
              <div
                key={opt.value}
                onClick={() => toggleValue(opt.value)}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-muted"
              >
                <Check
                  className={cn(
                    "h-4 w-4",
                    selected ? "opacity-100" : "opacity-0"
                  )}
                />
                <span>{opt.label}</span>
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
