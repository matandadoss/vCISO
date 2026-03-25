import React from 'react';
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SortableHeaderProps {
  label: string;
  sortKey: string;
  currentSort: { key: any; direction: 'asc' | 'desc' } | null;
  requestSort: (key: any) => void;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function SortableHeader({ label, sortKey, currentSort, requestSort, className, align = 'left' }: SortableHeaderProps) {
  const isActive = currentSort?.key === sortKey;
  
  return (
    <th 
      className={cn("px-6 py-4 font-medium uppercase tracking-wider cursor-pointer hover:bg-muted/50 select-none group transition-colors", className)}
      onClick={() => requestSort(sortKey)}
    >
      <div className={cn("flex items-center gap-2", 
        align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'
      )}>
        {label}
        <span className="text-muted-foreground/50 group-hover:text-foreground transition-colors shrink-0">
          {isActive ? (
            currentSort.direction === 'asc' ? <ArrowUp className="w-4 h-4 text-primary" /> : <ArrowDown className="w-4 h-4 text-primary" />
          ) : (
            <ArrowUpDown className="w-4 h-4" />
          )}
        </span>
      </div>
    </th>
  );
}
