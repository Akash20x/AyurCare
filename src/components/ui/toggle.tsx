import * as React from "react";
import { cn } from "@/lib/utils";

interface ToggleProps extends React.HTMLAttributes<HTMLButtonElement> {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function Toggle({
  checked,
  onCheckedChange,
  disabled,
  className,
  children,
  ...props
}: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      data-state={checked ? "on" : "off"}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "group inline-flex items-center justify-between gap-2",
        "w-full px-4 py-2 rounded-lg text-sm",
        "bg-white dark:bg-gray-800",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <span className="font-medium">{children}</span>
      <div
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          "bg-gray-200 dark:bg-gray-700",
          checked && "bg-primary"
        )}
      >
        <div
          className={cn(
            "absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white transition-transform",
            checked && "translate-x-5"
          )}
        />
      </div>
    </button>
  );
}
