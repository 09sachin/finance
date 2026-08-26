'use client';

import { useState } from 'react';
import { addYearsIso, formatINR, monthsToTarget, parseNumber, requiredSipAmount, todayIso } from '@/lib/calculators';
import CalculatorLayout, { ResultsPanel, StepUpToggle, ValidationBanner } from './shared/CalculatorLayout';
import NumberField from './shared/NumberField';
import ResultCard, { ResultGrid } from './shared/ResultCard';
import { useAutoCalculate } from './shared/useAutoCalculate';

interface Lump {
  id: string;
  amount: string;
  date: string;
}

export default function TargetSIPCalculator() {
  const [mode, setMode] = useState<'time' | 'amount'>('time');
  const [target, setTarget] = useState('1000000');
  const [monthly, setMonthly] = useState('10000');
  const [years, setYears] = useState('10');
  const [annualRate, setAnnualRate] = useState('12');
  const [stepUpEnabled, setStepUpEnabled] = useState(false);
  const [stepUpRate, setStepUpRate] = useState('10');
  const [includeLumpsum, setIncludeLumpsum] = useState(false);
  const [lumpsums, setLumpsums] = useState<Lump[]>([{ id: '1', amount: '100000', date: todayIso() }]);

  const T = parseNumber(target);
  const P = parseNumber(monthly);
  const Y = parseNumber(years);
  const R = parseNumber(annualRate);
  const errors: string[] = [];
  if (T === null || T <= 0) errors.push('Target amount must be greater than 0');
  if (mode === 'time' && (P === null || P <= 0)) errors.push('Monthly SIP must be greater than 0');
  if (mode === 'amount' && (Y === null || Y <= 0)) errors.push('Time period must be greater than 0');
  if (R === null || R <= 0) errors.push('Expected return must be greater than 0');

  const lumps = includeLumpsum
    ? lumpsums
        .map((l) => ({ amount: parseNumber(l.amount) ?? 0, date: new Date(`${l.date}T00:00:00`) }))
        .filter((l) => l.amount > 0)
    : [];

  const result = useAutoCalculate(() => {
    if (errors.length || T === null || R === null) return null;
    const stepUpPercent = stepUpEnabled ? parseNumber(stepUpRate) ?? 0 : 0;
    if (mode === 'time') {
      if (P === null) return null;
      return monthsToTarget({ target: T, monthlyAmount: P, annualPercent: R, lumpsums: lumps, stepUpPercent });
    }
    if (Y === null) return null;
    return requiredSipAmount({ target: T, years: Y, annualPercent: R, lumpsums: lumps, stepUpPercent });
  }, [mode, target, monthly, years, annualRate, stepUpEnabled, stepUpRate, includeLumpsum, lumpsums]);

  return (
    <CalculatorLayout
      results={result && (
        <ResultsPanel title="Target result" accent="purple">
          {!result.reachable && <p className="text-sm text-red-700 dark:text-red-300">{result.message}</p>}
          {result.reachable && result.message && <p className="text-sm text-slate-600 dark:text-slate-300">{result.message}</p>}
          {result.reachable && (
            <>
              <ResultGrid>
                <ResultCard label="Target" value={formatINR(result.targetAmount)} tone="purple" />
                <ResultCard label="Monthly SIP" value={formatINR(result.monthlyAmount)} />
                <ResultCard label="Time needed" value={`${result.years} years`} hint={`${result.months} months`} tone="blue" />
                <ResultCard label="Expected returns" value={formatINR(result.totalReturns)} tone="green" />
              </ResultGrid>
              <ResultGrid>
                <ResultCard label="Total investment" value={formatINR(result.totalInvestment)} />
                {result.lumpsumInvested > 0 && <ResultCard label="Lumpsum future value" value={formatINR(result.lumpsumFutureValue)} tone="green" />}
              </ResultGrid>
            </>
          )}
        </ResultsPanel>
      )}
    >
      <ValidationBanner errors={errors} />
      <div className="rounded-lg bg-slate-50 p-4 dark:bg-slate-800/50">
        <div className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">What do you want to find?</div>
        <label className="flex items-center text-sm">
          <input type="radio" className="text-purple-600" checked={mode === 'time'} onChange={() => setMode('time')} />
          <span className="ml-2">Time to reach the target with a fixed SIP</span>
        </label>
        <label className="mt-2 flex items-center text-sm">
          <input type="radio" className="text-purple-600" checked={mode === 'amount'} onChange={() => setMode('amount')} />
          <span className="ml-2">SIP amount needed in a fixed time</span>
        </label>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <NumberField label="Target amount" kind="currency" value={target} onChange={setTarget} />
        {mode === 'time' ? (
          <NumberField label="Monthly SIP" kind="currency" value={monthly} onChange={setMonthly} />
        ) : (
          <NumberField label="Time period" kind="years" value={years} onChange={setYears} />
        )}
        <NumberField label="Expected return" kind="percent" value={annualRate} onChange={setAnnualRate} />
      </div>
      <StepUpToggle enabled={stepUpEnabled} rate={stepUpRate} onEnabled={setStepUpEnabled} onRate={setStepUpRate} hint={`SIP increases by ${stepUpRate || 0}% each year.`} />
      <label className="flex items-center text-sm">
        <input type="checkbox" checked={includeLumpsum} onChange={(e) => setIncludeLumpsum(e.target.checked)} className="rounded text-purple-600" />
        <span className="ml-2">Include lumpsum investments</span>
      </label>
      {includeLumpsum && lumpsums.map((lump) => (
        <div key={lump.id} className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <NumberField label="Lumpsum amount" kind="currency" value={lump.amount} onChange={(v) => setLumpsums((rows) => rows.map((r) => (r.id === lump.id ? { ...r, amount: v } : r)))} />
          <NumberField label="Investment date" kind="date" value={lump.date} onChange={(v) => setLumpsums((rows) => rows.map((r) => (r.id === lump.id ? { ...r, date: v } : r)))} />
          <div className="flex items-end">
            {lumpsums.length > 1 && (
              <button type="button" onClick={() => setLumpsums((rows) => rows.filter((r) => r.id !== lump.id))} className="rounded-md bg-red-500 px-3 py-2 text-sm text-white">Remove</button>
            )}
          </div>
        </div>
      ))}
      {includeLumpsum && (
        <button type="button" onClick={() => setLumpsums((rows) => [...rows, { id: Date.now().toString(), amount: '50000', date: addYearsIso(todayIso(), 1) }])} className="rounded-md bg-green-600 px-4 py-2 text-sm text-white">
          Add lumpsum
        </button>
      )}
    </CalculatorLayout>
  );
}
