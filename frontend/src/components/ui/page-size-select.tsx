import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface PageSizeSelectProps {
  value: number;
  onChange: (value: number) => void;
  options?: number[];
  label?: string;
  className?: string;
}

export function PageSizeSelect({
  value,
  onChange,
  options = [5, 10, 20, 50],
  label = "Rows",
  className,
}: PageSizeSelectProps) {
  return (
    <div className={className}>
      <Label htmlFor="page-size" className="text-sm text-muted-foreground mr-2">
        {label}
      </Label>
      <Select value={String(value)} onValueChange={(v) => onChange(Number(v))}>
        <SelectTrigger id="page-size" className="w-20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={String(option)}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
