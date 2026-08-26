'use client';

import { useState } from 'react';

export default function HowItWorks({ title = 'How it works', children }: { title?: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-700 dark:text-slate-200"
      >
        {title}
        <span className="text-slate-400">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="space-y-2 px-4 pb-4 text-sm text-slate-600 dark:text-slate-300">{children}</div>}
    </div>
  );
}

export function CollapsibleSection({
  title,
  defaultOpen = true,
  actions,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800">
      <div className="flex items-center justify-between px-4 py-3">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 text-left font-medium text-slate-800 dark:text-slate-200">
          <span className="text-slate-400">{open ? '▾' : '▸'}</span>
          {title}
        </button>
        {actions}
      </div>
      {open && <div className="space-y-4 px-4 pb-4">{children}</div>}
    </div>
  );
}
