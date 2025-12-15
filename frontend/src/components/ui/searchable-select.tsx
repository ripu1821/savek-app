import * as React from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface SelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const SearchableSelect = React.forwardRef<HTMLButtonElement, SearchableSelectProps>(
  ({ options, value, onChange, placeholder = "Select...", label, error, disabled, className }, ref) => {
    const [open, setOpen] = React.useState(false);
    const selectedOption = options.find((option) => option.value === value);

    return (
      <div className="relative w-full">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              ref={ref}
              type="button"
              disabled={disabled}
              className={cn(
                "flex w-full items-center justify-between rounded-xl border bg-card px-4 py-3 text-sm transition-all duration-200",
                "border-border hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                "disabled:cursor-not-allowed disabled:opacity-50",
                error && "border-destructive focus:border-destructive focus:ring-destructive/20",
                !selectedOption && "text-muted-foreground",
                className
              )}
            >
              {label && (
                <span
                  className={cn(
                    "pointer-events-none absolute left-4 transition-all duration-200",
                    selectedOption || open
                      ? "top-1 text-xs text-primary"
                      : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              )}
              <span className={cn(label && (selectedOption || open) && "pt-3")}>
                {selectedOption ? selectedOption.label : (!label ? placeholder : "")}
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  open && "rotate-180"
                )}
              />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
            <Command className="rounded-xl">
              <CommandInput placeholder={`Search ${label || placeholder}...`} className="border-0" />
              <CommandList className="max-h-60 custom-scrollbar">
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  {options.map((option) => (
                    <CommandItem
                      key={option.value}
                      value={option.label}
                      onSelect={() => {
                        onChange?.(option.value);
                        setOpen(false);
                      }}
                      className="cursor-pointer"
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4 transition-opacity",
                          value === option.value ? "opacity-100" : "opacity-0"
                        )}
                      />
                      {option.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        {error && (
          <p className="mt-1.5 text-xs text-destructive animate-fade-in">{error}</p>
        )}
      </div>
    );
  }
);

SearchableSelect.displayName = "SearchableSelect";

export { SearchableSelect };
