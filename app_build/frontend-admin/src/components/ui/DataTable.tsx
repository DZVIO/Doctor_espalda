import React, { useState, useMemo } from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  maxRows?: number;
  rowHeightPx?: number;
  fillHeight?: boolean;
  unstyled?: boolean;
}

export function DataTable<T extends { id: number | string }>({
  columns,
  data,
  loading = false,
  onRowClick,
  emptyMessage = 'No se encontraron resultados',
  maxRows,
  rowHeightPx = 56,
  fillHeight = false,
  unstyled = false,
}: DataTableProps<T>) {
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const sortedData = useMemo(() => {
    // Backend data is assumed to be in descending order by default
    if (sortOrder === 'desc') return data;
    return [...data].reverse();
  }, [data, sortOrder]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <svg className="animate-spin h-10 w-10 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    );
  }

  const shouldScroll = maxRows != null && sortedData.length > maxRows;
  const scrollMaxHeight = maxRows != null ? maxRows * rowHeightPx : undefined;

  const toggleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const renderHead = () => (
    <thead className={`bg-gray-50${fillHeight ? ' sticky top-0 z-10' : ''}`}>
      <tr>
        {columns.map((column, index) => (
          <th
            key={index}
            scope="col"
            className={`px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.className || ''}`}
          >
            <div className="flex items-center gap-1">
              {column.header}
              {column.sortable && (
                <button
                  onClick={toggleSort}
                  className="p-1 hover:bg-gray-200 rounded transition-colors focus:outline-none"
                  title={sortOrder === 'desc' ? 'Ver más antiguos primero' : 'Ver más recientes primero'}
                >
                  {sortOrder === 'desc' ? (
                    <ChevronDownIcon className="h-4 w-4 text-blue-600" />
                  ) : (
                    <ChevronUpIcon className="h-4 w-4 text-blue-600" />
                  )}
                </button>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );

  const renderBody = () => (
    <tbody className="bg-white divide-y divide-gray-200">
      {sortedData.length > 0 ? (
        sortedData.map((item) => (
          <tr
            key={item.id}
            onClick={() => onRowClick?.(item)}
            className={`${onRowClick ? 'cursor-pointer hover:bg-gray-50 transition-colors' : ''}`}
          >
            {columns.map((column, index) => (
              <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {typeof column.accessor === 'function'
                  ? column.accessor(item)
                  : (item[column.accessor] as React.ReactNode)}
              </td>
            ))}
          </tr>
        ))
      ) : (
        <tr>
          <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-gray-500 italic">
            {emptyMessage}
          </td>
        </tr>
      )}
    </tbody>
  );

  if (shouldScroll) {
    return (
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            {renderHead()}
          </table>
        </div>
        <div
          className="overflow-y-auto overflow-x-auto"
          style={{ maxHeight: `${scrollMaxHeight}px` }}
        >
          <table className="min-w-full divide-y divide-gray-200">
            {renderBody()}
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className={`${fillHeight ? 'h-full overflow-auto' : 'overflow-x-auto'}${unstyled ? '' : ' bg-white shadow rounded-lg border border-gray-200'}`}>
      <table className="min-w-full divide-y divide-gray-200">
        {renderHead()}
        {renderBody()}
      </table>
    </div>
  );
}
