'use client';

type FieldKind = 'currency' | 'percent' | 'years' | 'number' | 'date' | 'text';

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  kind?: FieldKind;
  hint?: string;
  min?: string;
  max?: string;
  step?: string;
  prefix?: string;
  suffix?: string;
}

export default function NumberField({
  label,
  value,
  onChange,
  kind = 'number',
  hint,
  min,
  max,
  step,
  prefix,
  suffix,
}: NumberFieldProps) {
  const type = kind === 'date' ? 'date' : kind === 'text' ? 'text' : 'number';
  const resolvedPrefix = prefix ?? (kind === 'currency' ? '₹' : undefined);
  const resolvedSuffix = suffix ?? (kind === 'percent' ? '%' : kind === 'years' ? 'yrs' : undefined);

  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
      <div className="relative">
        {resolvedPrefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            {resolvedPrefix}
          </span>
        )}
        <input
          type={type}
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => onChange(e.target.value)}
          className={`app-input ${resolvedPrefix ? 'pl-10' : ''} ${resolvedSuffix ? 'pr-10' : ''}`}
        />
        {resolvedSuffix && (
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
            {resolvedSuffix}
          </span>
        )}
      </div>
      {hint && <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
    </label>
  );
}
