'use client';

import { useMemo, useState } from 'react';
import {
  addYearsIso,
  evaluateSipPlan,
  formatINR,
  parseNumber,
  sipGrowthSeries,
  todayIso,
} from '@/lib/calculators';
import CalculatorLayout, { ResultsPanel, StepUpToggle, ValidationBanner } from './shared/CalculatorLayout';
import NumberField from './shared/NumberField';
import ResultCard, { ResultGrid } from './shared/ResultCard';
import BreakdownTable from './shared/BreakdownTable';
import { CorpusAreaChart } from './shared/CorpusChart';
import { useAutoCalculate } from './shared/useAutoCalculate';

interface SipEntry {
  id: string;
  amount: string;
  startDate: string;
  endDate: string;
  annualRate: string;
  stepUpEnabled: boolean;
  stepUpRate: string;
}

export default function SIPCalculator() {
  const [maturityDate, setMaturityDate] = useState(() => addYearsIso(todayIso(), 10));
  const [sipEntries, setSipEntries] = useState<SipEntry[]>([{
    id: '1',
    amount: '10000',
    startDate: todayIso(),
    endDate: addYearsIso(todayIso(), 5),
    annualRate: '12',
    stepUpEnabled: false,
    stepUpRate: '10',
  }]);

  const errors = useMemo(() => {
    const maturity = new Date(`${maturityDate}T00:00:00`);
    const list: string[] = [];
    sipEntries.forEach((entry, i) => {
      const amount = parseNumber(entry.amount);
      const rate = parseNumber(entry.annualRate);
      const start = new Date(`${entry.startDate}T00:00:00`);
      const end = new Date(`${entry.endDate}T00:00:00`);
      if (!amount || amount <= 0) list.push(`SIP ${i + 1}: amount must be greater than 0`);
      if (!rate || rate <= 0) list.push(`SIP ${i + 1}: expected return must be greater than 0`);
      if (start >= end) list.push(`SIP ${i + 1}: end date must be after start date`);
      if (end > maturity) list.push(`SIP ${i + 1}: end date must be on or before maturity`);
    });
    return list;
  }, [sipEntries, maturityDate]);

  const result = useAutoCalculate(() => {
    if (errors.length) return null;
    const maturity = new Date(`${maturityDate}T00:00:00`);
    const breakdown = sipEntries.map((entry) => {
      const plan = evaluateSipPlan(
        {
          monthlyAmount: parseNumber(entry.amount) ?? 0,
          startDate: new Date(`${entry.startDate}T00:00:00`),
          endDate: new Date(`${entry.endDate}T00:00:00`),
          annualPercent: parseNumber(entry.annualRate) ?? 0,
          stepUpPercent: entry.stepUpEnabled ? parseNumber(entry.stepUpRate) ?? 0 : 0,
        },
        maturity
      );
      return plan ? { ...plan, amount: parseNumber(entry.amount) ?? 0, stepUp: entry.stepUpEnabled } : null;
    });
    if (breakdown.some((row) => !row)) return null;
    const rows = breakdown.filter((row): row is NonNullable<typeof row> => row !== null);
    const totalInvestment = rows.reduce((s, r) => s + r.invested, 0);
    const totalValue = rows.reduce((s, r) => s + r.futureValue, 0);
    const first = sipEntries[0];
    const years = Math.max(1, Math.round((new Date(`${maturityDate}T00:00:00`).getTime() - new Date(`${first.startDate}T00:00:00`).getTime()) / (365.25 * 24 * 3600 * 1000)));
    const series = sipEntries.length === 1
      ? sipGrowthSeries(parseNumber(first.amount) ?? 0, parseNumber(first.annualRate) ?? 0, years, first.stepUpEnabled ? parseNumber(first.stepUpRate) ?? 0 : 0)
      : [];
    return { totalInvestment, totalValue, estimatedReturns: totalValue - totalInvestment, rows, series };
  }, [sipEntries, maturityDate, errors]);

  const update = (id: string, patch: Partial<SipEntry>) => {
    setSipEntries((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  };

  return (
    <CalculatorLayout
      results={result && (
        <ResultsPanel title="Investment summary">
          <ResultGrid>
            <ResultCard label="Total invested" value={formatINR(result.totalInvestment)} />
            <ResultCard label="Estimated returns" value={formatINR(result.estimatedReturns)} tone="green" />
            <ResultCard label="Maturity value" value={formatINR(result.totalValue)} tone="blue" />
          </ResultGrid>
          {result.series.length > 0 && <CorpusAreaChart data={result.series} investedKey="invested" valueKey="value" />}
          <BreakdownTable
            title="SIP-wise breakdown"
            rows={result.rows}
            columns={[
              { key: 'n', header: 'SIP', render: (_r, i) => `#${i + 1}` },
              { key: 'amount', header: 'Monthly', align: 'right', render: (r) => formatINR(r.amount) },
              { key: 'months', header: 'Months', align: 'right', render: (r) => r.months },
              { key: 'invested', header: 'Invested', align: 'right', render: (r) => formatINR(r.invested) },
              { key: 'returns', header: 'Returns', align: 'right', className: 'text-green-600 dark:text-green-400', render: (r) => formatINR(r.returns) },
              { key: 'fv', header: 'Maturity value', align: 'right', className: 'text-blue-600 dark:text-blue-400', render: (r) => formatINR(r.futureValue) },
              { key: 'step', header: 'Step-up', render: (r) => (r.stepUp ? 'Yes' : 'No') },
            ]}
          />
        </ResultsPanel>
      )}
    >
      <ValidationBanner errors={errors} />
      <NumberField label="Target maturity date" kind="date" value={maturityDate} onChange={setMaturityDate} hint="SIP end dates must be on or before this date." />
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">SIP investments</h3>
        <button
          type="button"
          onClick={() => setSipEntries((rows) => [...rows, {
            id: Date.now().toString(),
            amount: '5000',
            startDate: todayIso(),
            endDate: addYearsIso(todayIso(), 3),
            annualRate: '12',
            stepUpEnabled: false,
            stepUpRate: '10',
          }])}
          className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          + Add SIP
        </button>
      </div>
      {sipEntries.map((entry, index) => (
        <div key={entry.id} className="space-y-4 rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-slate-800 dark:text-slate-200">SIP #{index + 1}</h4>
            {sipEntries.length > 1 && (
              <button type="button" onClick={() => setSipEntries((rows) => rows.filter((r) => r.id !== entry.id))} className="text-sm text-red-600">Remove</button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <NumberField label="Monthly amount" kind="currency" value={entry.amount} onChange={(v) => update(entry.id, { amount: v })} />
            <NumberField label="Start date" kind="date" value={entry.startDate} onChange={(v) => update(entry.id, { startDate: v })} />
            <NumberField label="End date" kind="date" value={entry.endDate} onChange={(v) => update(entry.id, { endDate: v })} />
            <NumberField label="Expected return" kind="percent" value={entry.annualRate} onChange={(v) => update(entry.id, { annualRate: v })} />
          </div>
          <StepUpToggle
            enabled={entry.stepUpEnabled}
            rate={entry.stepUpRate}
            onEnabled={(v) => update(entry.id, { stepUpEnabled: v })}
            onRate={(v) => update(entry.id, { stepUpRate: v })}
            hint={`SIP amount increases by ${entry.stepUpRate || 0}% each year.`}
          />
        </div>
      ))}
    </CalculatorLayout>
  );
}
