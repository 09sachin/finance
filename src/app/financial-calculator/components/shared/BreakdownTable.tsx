'use client';

import type { ReactNode } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  align?: 'left' | 'right';
  render: (row: T, index: number) => ReactNode;
  className?: string;
}

export default function BreakdownTable<T>({
  title,
  columns,
  rows,
  maxHeight = '24rem',
}: {
  title?: string;
  columns: Column<T>[];
  rows: T[];
  maxHeight?: string;
}) {
  if (rows.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      {title && (
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-600 dark:bg-slate-700">
          <h4 className="font-medium text-slate-800 dark:text-slate-200">{title}</h4>
        </div>
      )}
      <div className="overflow-auto" style={{ maxHeight }}>
        <table className="w-full">
          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-700">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 dark:text-slate-400 ${
                    col.align === 'right' ? 'text-right' : 'text-left'
                  }`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
            {rows.map((row, i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-4 py-3 text-sm ${col.align === 'right' ? 'text-right' : 'text-left'} ${
                      col.className ?? 'text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {col.render(row, i)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
