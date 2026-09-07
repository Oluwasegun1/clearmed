import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

interface SearchFilterBarProps {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  statusFilter?: string;
  onStatusFilterChange?: (status: string) => void;
  statusOptions?: FilterOption[];
  extraFilters?: React.ReactNode;
  onResetFilters?: () => void;
  className?: string;
}

export function SearchFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search...',
  statusFilter,
  onStatusFilterChange,
  statusOptions = [],
  extraFilters,
  onResetFilters,
  className = '',
}: SearchFilterBarProps) {
  const hasActiveFilters = Boolean(
    searchValue || (statusFilter && statusFilter !== 'ALL' && statusFilter !== 'all')
  );

  return (
    <div className={`flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between bg-card p-4 border border-border rounded-xl shadow-xs ${className}`}>
      {/* Search Input */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          type="text"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-9 pr-9 h-10 w-full"
        />
        {searchValue && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Tabs / Options */}
      <div className="flex flex-wrap items-center gap-2">
        {statusOptions.length > 0 && onStatusFilterChange && (
          <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border text-xs font-medium">
            {statusOptions.map((opt) => {
              const isActive = statusFilter === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => onStatusFilterChange(opt.value)}
                  className={`px-3 py-1.5 rounded-md transition-all ${
                    isActive
                      ? 'bg-background text-foreground shadow-xs font-semibold'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {opt.label}
                  {opt.count !== undefined && (
                    <span className={`ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] ${
                      isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}>
                      {opt.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {extraFilters}

        {hasActiveFilters && onResetFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onResetFilters}
            className="h-9 px-2 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}
