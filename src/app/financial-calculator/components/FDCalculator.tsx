'use client';

import { useState } from 'react';
import { calculateFd, formatINR, parseNumber, type FdFrequency } from '@/lib/calculators';
import CalculatorLayout, { ResultsPanel, ValidationBanner } from './shared/CalculatorLayout';
import NumberField from './shared/NumberField';
import ResultCard, { ResultGrid } from './shared/ResultCard';
import BreakdownTable from './shared/BreakdownTable';
import { CorpusAreaChart } from './shared/CorpusChart';
import { useAutoCalculate } from './shared/useAutoCalculate';

export default function FDCalculator() {
  const [principal, setPrincipal] = useState('100000');
  const [annualRate, setAnnualRate] = useState('7');
  const [years, setYears] = useState('5');
  const [frequency, setFrequency] = useState<FdFrequency>('quarterly');

  const P = parseNumber(principal);
  const r = parseNumber(annualRate);
  const t = parseNumber(years);
  const errors: string[] = [];
  if (P === null || P <= 0) errors.push('Deposit amount must be greater than 0');
  if (r === null || r <= 0) errors.push('Interest rate must be greater than 0');
  if (t === null || t <= 0) errors.push('Tenure must be greater than 0');

  const result = useAutoCalculate(() => {
    if (errors.length || P === null || r === null || t === null) return null;
    const calc = calculateFd(P, r, t, frequency);
    return {
      ...calc,
      series: calc.yearlyBreakdown.map((row) => ({ year: row.year, invested: P, value: row.endingValue })),
    };
  }, [principal, annualRate, years, frequency]);

  return (
    <CalculatorLayout
      results={result && (
        <ResultsPanel title="FD maturity">
          <ResultGrid>
            <ResultCard label="Principal" value={formatINR(P ?? 0)} />
            <ResultCard label="Interest earned" value={formatINR(result.interestEarned)} tone="green" />
            <ResultCard label="Maturity value" value={formatINR(result.maturityValue)} tone="blue" />
          </ResultGrid>
          <CorpusAreaChart data={result.series} investedKey="invested" valueKey="value" />
          <BreakdownTable
            title="Year-by-year"
            rows={result.yearlyBreakdown}
            columns={[
              { key: 'year', header: 'Year', render: (row) => row.year },
              { key: 'start', header: 'Starting value', align: 'right', render: (row) => formatINR(row.startingValue) },
              { key: 'int', header: 'Interest', align: 'right', className: 'text-green-600 dark:text-green-400', render: (row) => formatINR(row.interest) },
              { key: 'end', header: 'Ending value', align: 'right', className: 'text-blue-600 dark:text-blue-400', render: (row) => formatINR(row.endingValue) },
            ]}
          />
        </ResultsPanel>
      )}
    >
      <ValidationBanner errors={errors} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <NumberField label="Deposit amount" kind="currency" value={principal} onChange={setPrincipal} />
        <NumberField label="Interest rate" kind="percent" value={annualRate} onChange={setAnnualRate} />
        <NumberField label="Tenure" kind="years" value={years} onChange={setYears} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Compounding</span>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value as FdFrequency)} className="app-input">
            <option value="quarterly">Quarterly (typical bank FD)</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </label>
      </div>
    </CalculatorLayout>
  );
}
