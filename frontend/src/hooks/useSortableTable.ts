import { useState, useMemo } from 'react';

export type SortDirection = 'asc' | 'desc';
export type SortConfig<T> = { key: keyof T | string; direction: SortDirection } | null;

export function useSortableTable<T>(items: T[], initialConfig: SortConfig<T> = null) {
  const [sortConfig, setSortConfig] = useState<SortConfig<T>>(initialConfig);

  const sortedItems = useMemo(() => {
    if (!sortConfig) return items;
    
    return [...items].sort((a: any, b: any) => {
      // Split by dot for nested keys (e.g. data.value)
      const getNestedValue = (obj: any, path: string) => {
        return path.split('.').reduce((acc, part) => acc && acc[part], obj);
      };

      let aVal = getNestedValue(a, sortConfig.key as string);
      let bVal = getNestedValue(b, sortConfig.key as string);

      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      // Boolean sorting
      if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
         if (aVal === bVal) return 0;
         if (aVal) return sortConfig.direction === 'asc' ? -1 : 1;
         return sortConfig.direction === 'asc' ? 1 : -1;
      }

      // Convert to string identically for comparison if not strict numbers
      const aStr = String(aVal);
      const bStr = String(bVal);
      
      // Basic numeric sorting
      const aNum = Number(aStr);
      const bNum = Number(bStr);
      if (aStr !== '' && bStr !== '' && !isNaN(aNum) && !isNaN(bNum)) {
        if (aNum < bNum) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aNum > bNum) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      }

      // String sorting
      if (aStr.toLowerCase() < bStr.toLowerCase()) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aStr.toLowerCase() > bStr.toLowerCase()) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [items, sortConfig]);

  const requestSort = (key: keyof T | string) => {
    let direction: SortDirection = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  return { items: sortedItems, requestSort, sortConfig };
}
