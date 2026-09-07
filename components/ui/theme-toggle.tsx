"use client";

import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ThemeToggleProps {
  collapsed?: boolean;
  iconOnly?: boolean;
  className?: string;
}

export function ThemeToggle({ collapsed = false, iconOnly = false, className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch — only render after mount
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    if (iconOnly) {
      return (
        <Button variant="outline" size="icon" className={cn("h-9 w-9 rounded-md", className)}>
          <span className="h-4 w-4" />
        </Button>
      );
    }
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-md px-3 py-2",
          collapsed && "justify-center px-2",
          className,
        )}
      >
        <span className="flex-shrink-0 h-4 w-4" />
      </div>
    );
  }

  const isDark = theme === "dark";
  const toggleTheme = () => setTheme(isDark ? "light" : "dark");

  if (iconOnly) {
    return (
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        title={isDark ? "Switch to light mode" : "Switch to dark mode"}
        onClick={toggleTheme}
        className={cn("h-9 w-9 rounded-md relative cursor-pointer", className)}
      >
        <Sun
          className={cn(
            "h-4 w-4 transition-all duration-300 absolute",
            isDark ? "opacity-0 rotate-90 scale-0" : "opacity-100 rotate-0 scale-100 text-amber-500"
          )}
        />
        <Moon
          className={cn(
            "h-4 w-4 transition-all duration-300 absolute",
            isDark ? "opacity-100 rotate-0 scale-100 text-blue-400" : "opacity-0 -rotate-90 scale-0"
          )}
        />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  return (
    <button
      type="button"
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggleTheme}
      className={cn(
        "flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200 cursor-pointer",
        "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "group",
        collapsed && "justify-center px-2",
        className,
      )}
    >
      <span className="relative flex-shrink-0 flex h-4 w-4 items-center justify-center">
        <Sun
          className={cn(
            "absolute h-4 w-4 transition-all duration-300",
            isDark
              ? "opacity-0 rotate-90 scale-0"
              : "opacity-100 rotate-0 scale-100 text-amber-500",
          )}
        />
        <Moon
          className={cn(
            "absolute h-4 w-4 transition-all duration-300",
            isDark
              ? "opacity-100 rotate-0 scale-100 text-blue-400"
              : "opacity-0 -rotate-90 scale-0",
          )}
        />
      </span>
      {!collapsed && (
        <span className="truncate">
          {isDark ? "Light Mode" : "Dark Mode"}
        </span>
      )}
    </button>
  );
}
