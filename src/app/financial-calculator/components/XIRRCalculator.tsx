'use client';

import { useState } from 'react';
import { addYearsIso, calculateXirr, formatINR, formatPercent, parseNumber, todayIso, xirrPerformanceLabel } from '@/lib/calculators';
import CalculatorLayout, { ResultsPanel, ValidationBanner } from './shared/CalculatorLayout';
import NumberField from './shared/NumberField';
import ResultCard, { ResultGrid } from './shared/ResultCard';
import BreakdownTable from './shared/BreakdownTable';
import { useAutoCalculate } from './shared/useAutoCalculate';

interface Flow {
  id: string;
  date: string;
  amount: string;
}

export default function XIRRCalculator() {
  const [flows, setFlows] = useState<Flow[]>([
    { id: '1', date: todayIso(), amount: '-100000' },
    { id: '2', date: addYearsIso(todayIso(), 1), amount: '120000' },
  ]);

  const parsed = flows.map((f) => ({ ...f, amountNum: parseNumber(f.amount), dateObj: new Date(`${f.date}T00:00:00`) }));
  const errors: string[] = [];
  if (parsed.length < 2) errors.push('Enter at least two cash flows');
  if (!parsed.some((f) => (f.amountNum ?? 0) < 0)) errors.push('Enter at least one investment as a negative amount');
  if (!parsed.some((f) => (f.amountNum ?? 0) > 0)) errors.push('Enter at least one inflow as a positive amount');
  if (new Set(parsed.map((f) => f.date)).size < 2) errors.push('Cash flows must be on different dates');

  const result = useAutoCalculate(() => {
    if (errors.length) return null;
    return calculateXirr(parsed.filter((f) => f.amountNum !== null).map((f) => ({ amount: f.amountNum as number, date: f.dateObj })));
  }, [flows]);

  return (
    <CalculatorLayout
      results={result && (
        <ResultsPanel title="XIRR result">
          <ResultGrid>
            <ResultCard label="XIRR" value={formatPercent(result.rate * 100)} tone="green" hint={xirrPerformanceLabel(result.rate)} />
            <ResultCard label="Total invested" value={formatINR(result.invested)} />
            <ResultCard label="Total returned" value={formatINR(result.returned)} tone="blue" />
            <ResultCard label="Net cash" value={formatINR(result.netCash)} tone={result.netCash >= 0 ? 'green' : 'red'} />
            <ResultCard label="5-year growth at this XIRR" value={formatPercent(result.growth5y)} />
            <ResultCard label="10-year growth at this XIRR" value={formatPercent(result.growth10y)} />
          </ResultGrid>
          <BreakdownTable
            title="Cash flows"
            rows={parsed}
            columns={[
              { key: 'n', header: '#', render: (_r, i) => i + 1 },
              { key: 'date', header: 'Date', render: (r) => r.date },
              {
                key: 'amount',
                header: 'Amount',
                align: 'right',
                render: (r) => (
                  <span className={(r.amountNum ?? 0) < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}>
                    {formatINR(r.amountNum ?? 0)}
                  </span>
                ),
              },
            ]}
          />
        </ResultsPanel>
      )}
    >
      <ValidationBanner errors={errors} />
      <p className="text-sm text-slate-600 dark:text-slate-300">Negative amounts are investments. Positive amounts are inflows or withdrawals.</p>
      {flows.map((flow, index) => (
        <div key={flow.id} className="grid grid-cols-1 items-end gap-3 md:grid-cols-12">
          <div className="md:col-span-5">
            <NumberField label={index === 0 ? 'Date' : ''} kind="date" value={flow.date} onChange={(v) => setFlows((rows) => rows.map((r) => (r.id === flow.id ? { ...r, date: v } : r)))} />
          </div>
          <div className="md:col-span-5">
            <NumberField label={index === 0 ? 'Amount' : ''} kind="number" value={flow.amount} onChange={(v) => setFlows((rows) => rows.map((r) => (r.id === flow.id ? { ...r, amount: v } : r)))} prefix="₹" />
          </div>
          <div className="md:col-span-2 pb-1">
            <button type="button" onClick={() => setFlows((rows) => rows.filter((r) => r.id !== flow.id))} disabled={flows.length <= 2} className="w-full rounded-md bg-red-500 px-3 py-2 text-sm text-white disabled:opacity-40">Remove</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setFlows((rows) => [...rows, { id: Date.now().toString(), date: todayIso(), amount: '' }])} className="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
        Add cash flow
      </button>
    </CalculatorLayout>
  );
}
