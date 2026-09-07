import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label?: string;
  htmlFor?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
  icon?: React.ElementType;
}

export const FormField = React.forwardRef<HTMLDivElement, FormFieldProps>(
  ({ label, htmlFor, required, error, helperText, icon: Icon, children, className, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("space-y-2", className)} {...props}>
        {label && (
          <Label htmlFor={htmlFor} className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            {Icon && <Icon className="h-4 w-4 text-muted-foreground shrink-0" />}
            <span>{label}</span>
            {required && <span className="text-destructive">*</span>}
          </Label>
        )}
        <div className="relative">{children}</div>
        {error ? (
          <p className="text-xs text-destructive font-medium animate-fadeIn">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
FormField.displayName = "FormField";
