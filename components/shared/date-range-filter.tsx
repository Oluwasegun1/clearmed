"use client";

import React, { useState, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type DatePreset = "all" | "today" | "yesterday" | "last7days" | "last30days" | "thisMonth" | "custom";

export interface DateRangeValue {
  preset: DatePreset;
  startDate: string; // YYYY-MM-DD format or ""
  endDate: string;   // YYYY-MM-DD format or ""
}

export interface DateRangeFilterProps {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
  onReset?: () => void;
  className?: string;
  compact?: boolean;
}

export function getDateRangeFromPreset(preset: DatePreset): { startDate: string; endDate: string } {
  const now = new Date();
  const format = (d: Date) => d.toISOString().split("T")[0];

  switch (preset) {
    case "today": {
      const todayStr = format(now);
      return { startDate: todayStr, endDate: todayStr };
    }
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      const yStr = format(y);
      return { startDate: yStr, endDate: yStr };
    }
    case "last7days": {
      const start = new Date(now);
      start.setDate(start.getDate() - 6);
      return { startDate: format(start), endDate: format(now) };
    }
    case "last30days": {
      const start = new Date(now);
      start.setDate(start.getDate() - 29);
      return { startDate: format(start), endDate: format(now) };
    }
    case "thisMonth": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: format(start), endDate: format(now) };
    }
    case "all":
    case "custom":
    default:
      return { startDate: "", endDate: "" };
  }
}

const PRESET_LABELS: Record<DatePreset, string> = {
  all: "All Time",
  today: "Today",
  yesterday: "Yesterday",
  last7days: "Last 7 Days",
  last30days: "Last 30 Days",
  thisMonth: "This Month",
  custom: "Custom",
};

export function DateRangeFilter({
  value,
  onChange,
  onReset,
  className = "",
  compact = false,
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localStart, setLocalStart] = useState(value.startDate || "");
  const [localEnd, setLocalEnd] = useState(value.endDate || "");

  useEffect(() => {
    setLocalStart(value.startDate || "");
    setLocalEnd(value.endDate || "");
  }, [value.startDate, value.endDate]);

  const handlePresetSelect = (preset: DatePreset) => {
    if (preset === "custom") {
      onChange({
        preset: "custom",
        startDate: localStart,
        endDate: localEnd,
      });
      setIsOpen(true);
    } else {
      const range = getDateRangeFromPreset(preset);
      setLocalStart(range.startDate);
      setLocalEnd(range.endDate);
      onChange({
        preset,
        startDate: range.startDate,
        endDate: range.endDate,
      });
      setIsOpen(false);
    }
  };

  const handleApplyCustom = () => {
    onChange({
      preset: "custom",
      startDate: localStart,
      endDate: localEnd,
    });
    setIsOpen(false);
  };

  const isFiltered = value.preset !== "all" || Boolean(value.startDate || value.endDate);

  const displayLabel = () => {
    if (value.preset === "custom") {
      if (value.startDate && value.endDate) {
        return `${value.startDate} to ${value.endDate}`;
      }
      if (value.startDate) return `From ${value.startDate}`;
      if (value.endDate) return `Until ${value.endDate}`;
      return "Custom Range";
    }
    return PRESET_LABELS[value.preset] || "Filter by Date";
  };

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          variant="outline"
          size={compact ? "sm" : "default"}
          onClick={() => setIsOpen(!isOpen)}
          className={`h-10 px-3 text-xs font-medium border rounded-lg transition-colors flex items-center gap-2 bg-card ${
            isFiltered
              ? "border-primary/50 text-primary bg-primary/5 hover:bg-primary/10"
              : "border-border text-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="truncate max-w-[170px]">{displayLabel()}</span>
          <ChevronDown className={`h-3.5 w-3.5 opacity-60 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
        </Button>

        {isFiltered && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const resetVal: DateRangeValue = { preset: "all", startDate: "", endDate: "" };
              setLocalStart("");
              setLocalEnd("");
              onChange(resetVal);
              onReset?.();
              setIsOpen(false);
            }}
            title="Reset Date Filter"
            className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground rounded-lg"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Card */}
          <div className="absolute right-0 mt-2 z-50 w-72 sm:w-80 rounded-xl border border-border bg-card p-4 shadow-xl animate-in fade-in-0 zoom-in-95">
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-border">
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Filter By Date
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-muted-foreground hover:text-foreground text-xs"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Presets Grid */}
            <div className="grid grid-cols-2 gap-1.5 mb-4">
              {(Object.keys(PRESET_LABELS) as DatePreset[]).map((presetKey) => {
                const isActive = value.preset === presetKey;
                return (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => handlePresetSelect(presetKey)}
                    className={`px-2.5 py-1.5 text-xs rounded-md text-left transition-all ${
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {PRESET_LABELS[presetKey]}
                  </button>
                );
              })}
            </div>

            {/* Custom Range Inputs */}
            <div className="space-y-3 pt-2 border-t border-border/80">
              <span className="text-[11px] font-medium text-muted-foreground block">
                Custom Date Range
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={localStart}
                    onChange={(e) => {
                      setLocalStart(e.target.value);
                      if (value.preset !== "custom") {
                        onChange({ ...value, preset: "custom" });
                      }
                    }}
                    className="h-8 text-xs px-2"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={localEnd}
                    onChange={(e) => {
                      setLocalEnd(e.target.value);
                      if (value.preset !== "custom") {
                        onChange({ ...value, preset: "custom" });
                      }
                    }}
                    className="h-8 text-xs px-2"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    const resetVal: DateRangeValue = { preset: "all", startDate: "", endDate: "" };
                    setLocalStart("");
                    setLocalEnd("");
                    onChange(resetVal);
                    onReset?.();
                    setIsOpen(false);
                  }}
                >
                  Clear
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={handleApplyCustom}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
