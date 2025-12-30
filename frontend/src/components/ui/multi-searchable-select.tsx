import { useState, useMemo, useRef, useEffect } from "react";
import { X, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Option {
  value: string;
  label: string;
}

interface Props {
  label?: string;
  options: Option[];
  value: string[];
  onChange: (vals: string[]) => void;
  error?: string;
}

export function MultiSearchableSelect({
  label,
  options,
  value,
  onChange,
  error,
}: Props) {
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  /* ---------------- close on outside click ---------------- */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOptions = options.filter((o) => value.includes(o.value));

  const filteredOptions = useMemo(() => {
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(search.toLowerCase()) &&
        !value.includes(o.value)
    );
  }, [options, search, value]);

  return (
    <div className="space-y-1" ref={ref}>
      {label && <label className="text-sm font-medium">{label}</label>}

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className={cn(
          "w-full flex items-center justify-between rounded-md border px-3 py-2 text-left",
          error && "border-destructive"
        )}
      >
        <span className="text-sm">
          {selectedOptions.length
            ? `${selectedOptions.length} selected`
            : "Select users"}
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform",
            open && "rotate-180"
          )}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="rounded-md border bg-background shadow-md p-2 space-y-2">
          {/* Selected Chips */}
          {selectedOptions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedOptions.map((o) => (
                <span
                  key={o.value}
                  className="flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs"
                >
                  {o.label}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() =>
                      onChange(value.filter((v) => v !== o.value))
                    }
                  />
                </span>
              ))}
            </div>
          )}

          {/* Search */}
          <input
            autoFocus
            placeholder="Search users..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border px-2 py-1 text-sm outline-none"
          />

          {/* Options */}
          <div className="max-h-48 overflow-auto">
            {filteredOptions.length ? (
              filteredOptions.map((o) => (
                <div
                  key={o.value}
                  onClick={() => {
                    onChange([...value, o.value]);
                    setSearch("");
                  }}
                  className="cursor-pointer rounded px-2 py-2 hover:bg-muted text-sm"
                >
                  {o.label}
                </div>
              ))
            ) : (
              <p className="px-2 py-2 text-xs text-muted-foreground">
                No results
              </p>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
