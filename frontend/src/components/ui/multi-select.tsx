import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";

export interface MultiSelectOption {
  value: string;
  label: string;
}

interface MultiSelectProps {
  options: MultiSelectOption[];
  value?: string[];
  onChange?: (value: string[]) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  maxDisplay?: number;
}

const MultiSelect = React.forwardRef<HTMLButtonElement, MultiSelectProps>(
  ({ options, value = [], onChange, placeholder = "Select...", label, error, disabled, className, maxDisplay = 3 }, ref) => {
    const [open, setOpen] = React.useState(false);
    const selectedOptions = options.filter((option) => value.includes(option.value));

    const handleSelect = (optionValue: string) => {
      const newValue = value.includes(optionValue)
        ? value.filter((v) => v !== optionValue)
        : [...value, optionValue];
      onChange?.(newValue);
    };

    const handleRemove = (optionValue: string, e: React.MouseEvent) => {
      e.stopPropagation();
      onChange?.(value.filter((v) => v !== optionValue));
    };

    return (
      <div className="relative w-full">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <button
              ref={ref}
              type="button"
              disabled={disabled}
              className={cn(
                "flex w-full min-h-[48px] items-center justify-between rounded-xl border bg-card px-4 py-2 text-sm transition-all duration-200",
                "border-border hover:border-primary/50 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20",
                "disabled:cursor-not-allowed disabled:opacity-50",
                error && "border-destructive focus:border-destructive focus:ring-destructive/20",
                className
              )}
            >
              {label && (
                <span
                  className={cn(
                    "pointer-events-none absolute left-4 transition-all duration-200 bg-card px-1",
                    selectedOptions.length > 0 || open
                      ? "-top-2 text-xs text-primary"
                      : "top-1/2 -translate-y-1/2 text-sm text-muted-foreground"
                  )}
                >
                  {label}
                </span>
              )}
              <div className="flex flex-1 flex-wrap gap-1.5">
                {selectedOptions.length === 0 && !label && (
                  <span className="text-muted-foreground">{placeholder}</span>
                )}
                {selectedOptions.slice(0, maxDisplay).map((option) => (
                  <Badge
                    key={option.value}
                    variant="secondary"
                    className="rounded-lg px-2 py-0.5 text-xs font-medium"
                  >
                    {option.label}
                    <button
                      type="button"
                      onClick={(e) => handleRemove(option.value, e)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                {selectedOptions.length > maxDisplay && (
                  <Badge variant="outline" className="rounded-lg px-2 py-0.5 text-xs">
                    +{selectedOptions.length - maxDisplay} more
                  </Badge>
                )}
              </div>
              <ChevronDown
                className={cn(
                  "ml-2 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200",
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
                      onSelect={() => handleSelect(option.value)}
                      className="cursor-pointer"
                    >
                      <div
                        className={cn(
                          "mr-2 flex h-4 w-4 items-center justify-center rounded border transition-all",
                          value.includes(option.value)
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-muted-foreground"
                        )}
                      >
                        <Check
                          className={cn(
                            "h-3 w-3 transition-opacity",
                            value.includes(option.value) ? "opacity-100" : "opacity-0"
                          )}
                        />
                      </div>
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

MultiSelect.displayName = "MultiSelect";

export { MultiSelect };
