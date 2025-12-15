import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all duration-200",
  {
    variants: {
      variant: {
        active: "bg-success/15 text-success",
        inactive: "bg-muted text-muted-foreground",
        pending: "bg-warning/15 text-warning",
        error: "bg-destructive/15 text-destructive",
        primary: "bg-primary/15 text-primary",
      },
    },
    defaultVariants: {
      variant: "active",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  showDot?: boolean;
}

const StatusBadge = React.forwardRef<HTMLDivElement, StatusBadgeProps>(
  ({ className, variant, showDot = true, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(statusBadgeVariants({ variant }), className)}
        {...props}
      >
        {showDot && (
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              variant === "active" && "bg-success",
              variant === "inactive" && "bg-muted-foreground",
              variant === "pending" && "bg-warning",
              variant === "error" && "bg-destructive",
              variant === "primary" && "bg-primary"
            )}
          />
        )}
        {children}
      </div>
    );
  }
);

StatusBadge.displayName = "StatusBadge";

export { StatusBadge, statusBadgeVariants };
