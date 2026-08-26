'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CALCULATOR_CATEGORIES, CALCULATOR_REGISTRY } from './calculatorRegistry';

export default function CalculatorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
      <aside className="md:col-span-1">
        <div className="app-card p-4 md:sticky md:top-20 md:max-h-[calc(100vh-6rem)] md:overflow-y-auto">
          <h3 className="mb-4 text-lg font-medium text-slate-800 dark:text-slate-200">Calculators</h3>
          <div className="space-y-4">
            {CALCULATOR_CATEGORIES.map((category) => (
              <div key={category}>
                <div className="mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {category}
                </div>
                <div className="space-y-1">
                  {CALCULATOR_REGISTRY.filter((c) => c.category === category).map((calc) => {
                    const href = `/financial-calculator/${calc.id}`;
                    const active = pathname === href || pathname.startsWith(`${href}/`);
                    return (
                      <Link
                        key={calc.id}
                        href={href}
                        className={`block rounded-md px-3 py-2 text-left text-sm font-medium ${
                          active
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        {calc.name}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
      <div className="md:col-span-3">
        <div className="app-card p-6">{children}</div>
      </div>
    </div>
  );
}
