'use client';

interface ResultCardProps {
  label: string;
  value: string;
  tone?: 'default' | 'green' | 'blue' | 'orange' | 'purple' | 'red';
  hint?: string;
}

const tones: Record<NonNullable<ResultCardProps['tone']>, string> = {
  default: 'text-slate-800 dark:text-slate-100',
  green: 'text-green-600 dark:text-green-400',
  blue: 'text-blue-600 dark:text-blue-400',
  orange: 'text-orange-600 dark:text-orange-400',
  purple: 'text-purple-600 dark:text-purple-400',
  red: 'text-red-600 dark:text-red-400',
};

export default function ResultCard({ label, value, tone = 'default', hint }: ResultCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</div>
      <div className={`mt-1 text-2xl font-bold ${tones[tone]}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</div>}
    </div>
  );
}

export function ResultGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
