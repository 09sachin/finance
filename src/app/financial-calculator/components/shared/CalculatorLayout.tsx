'use client';

export default function CalculatorLayout({
  children,
  results,
  howItWorks,
}: {
  children: React.ReactNode;
  results?: React.ReactNode;
  howItWorks?: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      {howItWorks}
      <div className="space-y-4">{children}</div>
      {results}
    </div>
  );
}

export function StepUpToggle({
  enabled,
  rate,
  onEnabled,
  onRate,
  label = 'Enable annual step-up',
  hint,
}: {
  enabled: boolean;
  rate: string;
  onEnabled: (value: boolean) => void;
  onRate: (value: string) => void;
  label?: string;
  hint?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700/50">
      <div className="flex items-center justify-between">
        <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => onEnabled(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="ml-2">{label}</span>
        </label>
        {enabled && (
          <input
            type="number"
            value={rate}
            onChange={(e) => onRate(e.target.value)}
            className="w-24 rounded border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
          />
        )}
      </div>
      {enabled && hint && <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </div>
  );
}

export function ValidationBanner({ errors }: { errors: string[] }) {
  if (errors.length === 0) return null;
  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
      <ul className="list-disc space-y-1 pl-5">
        {errors.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  );
}

export function TaxSettings({
  enabled,
  rate,
  onEnabled,
  onRate,
}: {
  enabled: boolean;
  rate: string;
  onEnabled: (value: boolean) => void;
  onRate: (value: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-600 dark:bg-slate-700/50">
      <label className="flex items-center text-sm font-medium text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onEnabled(e.target.checked)}
          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="ml-2">Include LTCG on withdrawals</span>
      </label>
      {enabled && (
        <div className="mt-3 max-w-xs">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">LTCG tax rate</span>
            <div className="relative">
              <input
                type="number"
                value={rate}
                onChange={(e) => onRate(e.target.value)}
                className="app-input pr-10"
              />
              <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">%</span>
            </div>
          </label>
          <p className="mt-1 text-xs text-slate-500">Applied on realised gains after the yearly ₹1.25 lakh exemption.</p>
        </div>
      )}
    </div>
  );
}

export function ResultsPanel({
  title,
  accent = 'green',
  children,
}: {
  title: string;
  accent?: 'green' | 'orange' | 'purple' | 'blue';
  children: React.ReactNode;
}) {
  const accents = {
    green: 'from-green-50 to-blue-50 border-green-200 dark:from-green-900/20 dark:to-blue-900/20 dark:border-green-800',
    orange: 'from-orange-50 to-red-50 border-orange-200 dark:from-orange-900/20 dark:to-red-900/20 dark:border-orange-800',
    purple: 'from-purple-50 to-indigo-50 border-purple-200 dark:from-purple-900/20 dark:to-indigo-900/20 dark:border-purple-800',
    blue: 'from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800',
  };

  return (
    <div className={`space-y-6 rounded-2xl border bg-gradient-to-r p-6 ${accents[accent]}`}>
      <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200">{title}</h3>
      {children}
    </div>
  );
}
