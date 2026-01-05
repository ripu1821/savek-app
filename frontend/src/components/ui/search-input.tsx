import * as React from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SearchInputProps extends Omit<React.ComponentProps<"input">, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  debounceMs?: number;
  showClearButton?: boolean;
  containerClassName?: string;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onClear,
      debounceMs = 300,
      showClearButton = true,
      placeholder = "Search...",
      containerClassName,
      className,
      ...props
    },
    ref
  ) => {
    const [localValue, setLocalValue] = React.useState(value);
    const debounceTimerRef = React.useRef<NodeJS.Timeout | null>(null);

    // Update local value when external value changes
    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);

      // Clear existing timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Set new timer for debounced update
      debounceTimerRef.current = setTimeout(() => {
        onChange(newValue);
      }, debounceMs);
    };

    const handleClear = () => {
      setLocalValue("");
      onChange("");
      onClear?.();
    };

    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current);
        }
      };
    }, []);

    return (
      <div className={cn("relative", containerClassName)}>
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        <Input
          ref={ref}
          type="search"
          value={localValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={cn(
            "pl-9 pr-9",
            showClearButton && localValue && "pr-9",
            className
          )}
          {...props}
        />
        {showClearButton && localValue && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={handleClear}
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 hover:bg-transparent"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
          </Button>
        )}
      </div>
    );
  }
);

SearchInput.displayName = "SearchInput";
