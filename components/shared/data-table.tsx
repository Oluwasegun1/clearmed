import React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { EmptyState } from '@/components/shared/empty-state';
import { LucideIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Column<T> {
  header: string | React.ReactNode;
  accessorKey?: keyof T | string;
  cell?: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  onRowClick?: (item: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: LucideIcon;
  emptyActionLabel?: string;
  onEmptyAction?: () => void;
  pageIndex?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  className?: string;
  keyExtractor?: (item: T, index: number) => string | number;
}

export function DataTable<T>({
  columns,
  data,
  isLoading = false,
  onRowClick,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching your criteria at this time.',
  emptyIcon,
  emptyActionLabel,
  onEmptyAction,
  pageIndex = 1,
  pageSize = 10,
  totalItems,
  onPageChange,
  className = '',
  keyExtractor,
}: DataTableProps<T>) {
  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 1;

  if (isLoading) {
    return (
      <div className={`w-full rounded-xl border border-border bg-card p-8 flex flex-col items-center justify-center min-h-[250px] ${className}`}>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-3"></div>
        <p className="text-sm text-muted-foreground font-medium">Loading data...</p>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={emptyIcon}
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
        className={className}
      />
    );
  }

  return (
    <div className={`w-full rounded-xl border border-border bg-card overflow-hidden shadow-xs ${className}`}>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              {columns.map((col, idx) => (
                <TableHead key={idx} className={`text-xs font-semibold uppercase tracking-wider text-muted-foreground py-3.5 ${col.headerClassName || ''}`}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item, rowIndex) => {
              const rowKey = keyExtractor
                ? keyExtractor(item, rowIndex)
                : (item as any)?.id || rowIndex;

              return (
                <TableRow
                  key={rowKey}
                  onClick={() => onRowClick?.(item)}
                  className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}`}
                >
                  {columns.map((col, colIndex) => {
                    const value = col.accessorKey
                      ? (item as any)[col.accessorKey]
                      : undefined;

                    return (
                      <TableCell key={colIndex} className={`py-3.5 ${col.className || ''}`}>
                        {col.cell ? col.cell(item, rowIndex) : (value ?? '-')}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer if totalItems provided */}
      {totalItems !== undefined && onPageChange && totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card">
          <p className="text-xs text-muted-foreground">
            Showing <span className="font-semibold text-foreground">{(pageIndex - 1) * pageSize + 1}</span> to{' '}
            <span className="font-semibold text-foreground">
              {Math.min(pageIndex * pageSize, totalItems)}
            </span>{' '}
            of <span className="font-semibold text-foreground">{totalItems}</span> results
          </p>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pageIndex - 1)}
              disabled={pageIndex <= 1}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="sr-only">Previous Page</span>
            </Button>
            <span className="text-xs font-medium px-2">
              Page {pageIndex} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange(pageIndex + 1)}
              disabled={pageIndex >= totalPages}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="h-4 w-4" />
              <span className="sr-only">Next Page</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
