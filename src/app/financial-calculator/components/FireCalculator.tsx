'use client';

import { useState } from 'react';
import {
  addYearsIso,
  calculateFire,
  formatINR,
  parseNumber,
  todayIso,
} from '@/lib/calculators';
import CalculatorLayout, { ResultsPanel, TaxSettings, ValidationBanner } from './shared/CalculatorLayout';
import NumberField from './shared/NumberField';
import ResultCard, { ResultGrid } from './shared/ResultCard';
import BreakdownTable from './shared/BreakdownTable';
import CorpusChart from './shared/CorpusChart';
import HowItWorks, { CollapsibleSection } from './shared/HowItWorks';
import { useAutoCalculate } from './shared/useAutoCalculate';

export default function FireCalculator() {
  const today = todayIso();
  const [currentAge, setCurrentAge] = useState('30');
  const [monthlyExpense, setMonthlyExpense] = useState('80000');
  const [inflation, setInflation] = useState('6');
  const [postFireReturn, setPostFireReturn] = useState('8');
  const [ltcgEnabled, setLtcgEnabled] = useState(true);
  const [ltcgRate, setLtcgRate] = useState('12.5');
  const [investments, setInvestments] = useState([
    { id: '1', name: 'Equity funds', amount: '1000000', annualRate: '12' },
    { id: '2', name: 'Debt funds', amount: '500000', annualRate: '7' },
  ]);
  const [sips, setSips] = useState([
    { id: '1', name: 'Equity SIP', monthlyAmount: '25000', annualRate: '12', stepUp: '10' },
  ]);
  const [oneOffs, setOneOffs] = useState<{ id: string; description: string; amount: string; date: string }[]>([]);

  const age = parseNumber(currentAge);
  const expense = parseNumber(monthlyExpense);
  const inf = parseNumber(inflation);
  const post = parseNumber(postFireReturn);
  const taxRate = parseNumber(ltcgRate);
  const errors: string[] = [];
  if (age === null || age < 18 || age > 70) errors.push('Current age should be between 18 and 70');
  if (expense === null || expense <= 0) errors.push('Monthly expense must be greater than 0');
  if (inf === null || inf < 0) errors.push('Expense inflation cannot be negative');
  if (post === null || post <= 0) errors.push('Return after FIRE must be greater than 0');
  if (ltcgEnabled && (taxRate === null || taxRate < 0)) errors.push('LTCG tax rate cannot be negative');

  const result = useAutoCalculate(() => {
    if (errors.length || age === null || expense === null || inf === null || post === null) return null;
    return calculateFire({
      currentAge: age,
      investments: investments.map((i) => ({
        name: i.name,
        amount: parseNumber(i.amount) ?? 0,
        annualPercent: parseNumber(i.annualRate) ?? 0,
      })),
      sips: sips.map((s) => ({
        name: s.name,
        monthlyAmount: parseNumber(s.monthlyAmount) ?? 0,
        annualPercent: parseNumber(s.annualRate) ?? 0,
        stepUpPercent: parseNumber(s.stepUp) ?? 0,
      })),
      monthlyExpenseToday: expense,
      expenseInflationPercent: inf,
      oneOffs: oneOffs.map((o) => ({
        amountToday: parseNumber(o.amount) ?? 0,
        date: new Date(`${o.date}T00:00:00`),
        description: o.description,
      })),
      postFireAnnualPercent: post,
      ltcgEnabled,
      ltcgRatePercent: taxRate ?? 12.5,
      asOf: new Date(),
    });
  }, [currentAge, monthlyExpense, inflation, postFireReturn, ltcgEnabled, ltcgRate, investments, sips, oneOffs]);

  return (
    <CalculatorLayout
      howItWorks={(
        <HowItWorks>
          <p>FIRE age is the earliest age where your corpus can cover inflated living costs through age 90. SIPs and step-ups run only until that age. After FIRE, the whole corpus grows at the post-FIRE return you enter.</p>
          <p>Monthly expenses and one-off costs are entered in today’s rupees and increased by your inflation rate. If LTCG is on, withdrawals are taxed at your rate after the yearly ₹1.25 lakh exemption.</p>
        </HowItWorks>
      )}
      results={result && (
        <ResultsPanel title="FIRE result" accent="green">
          <ResultGrid>
            <ResultCard
              label="FIRE age"
              value={result.fireAge === null ? 'Not by age 70' : `${result.fireAge}`}
              tone={result.fireAge === null ? 'orange' : 'green'}
              hint={result.yearsToFire === null ? 'Raise SIPs, returns, or lower expenses' : `${result.yearsToFire} year${result.yearsToFire === 1 ? '' : 's'} from now`}
            />
            <ResultCard label="Corpus at FIRE" value={formatINR(result.corpusAtFire)} tone="blue" />
            <ResultCard label="Monthly spend at FIRE" value={formatINR(result.monthlyExpenseAtFire)} hint="Today’s expenses grown at your inflation rate" />
            <ResultCard label="Total invested" value={formatINR(result.totalInvestment)} />
            {ltcgEnabled && <ResultCard label="Estimated LTCG" value={formatINR(result.totalLtcgTax)} tone="orange" />}
          </ResultGrid>
          <CorpusChart
            data={result.chartSeries}
            lines={[
              { key: 'corpus', label: 'Corpus', color: '#16a34a' },
              { key: 'invested', label: 'Invested', color: '#64748b', dashed: true },
            ]}
          />
          <BreakdownTable
            title="Year-by-year"
            rows={result.yearlyBreakdown}
            columns={[
              { key: 'year', header: 'Year', render: (row) => row.year },
              { key: 'age', header: 'Age', render: (row) => row.age },
              { key: 'start', header: 'Starting', align: 'right', render: (row) => formatINR(row.startingCorpus) },
              { key: 'inv', header: 'Invested', align: 'right', render: (row) => formatINR(row.invested) },
              { key: 'g', header: 'Growth', align: 'right', className: 'text-green-600 dark:text-green-400', render: (row) => formatINR(row.growth) },
              { key: 'e', header: 'Spend', align: 'right', render: (row) => formatINR(row.expenses) },
              { key: 'o', header: 'One-off', align: 'right', render: (row) => formatINR(row.oneOffs) },
              ...(ltcgEnabled
                ? [{ key: 't', header: 'LTCG', align: 'right' as const, className: 'text-orange-600 dark:text-orange-400', render: (row: (typeof result.yearlyBreakdown)[0]) => formatINR(row.ltcgTax) }]
                : []),
              { key: 'end', header: 'Remaining', align: 'right', className: 'text-blue-600 dark:text-blue-400', render: (row) => formatINR(row.remainingCorpus) },
            ]}
          />
        </ResultsPanel>
      )}
    >
      <ValidationBanner errors={errors} />
      <CollapsibleSection title="You">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <NumberField label="Current age" kind="number" value={currentAge} onChange={setCurrentAge} />
          <NumberField label="Monthly expenses today" kind="currency" value={monthlyExpense} onChange={setMonthlyExpense} />
          <NumberField label="Expense inflation" kind="percent" value={inflation} onChange={setInflation} hint="Yearly increase in living costs" />
          <NumberField label="Return after FIRE" kind="percent" value={postFireReturn} onChange={setPostFireReturn} hint="Used once you stop working" />
        </div>
        <TaxSettings enabled={ltcgEnabled} rate={ltcgRate} onEnabled={setLtcgEnabled} onRate={setLtcgRate} />
      </CollapsibleSection>
      <CollapsibleSection
        title="Current investments"
        actions={<button type="button" onClick={() => setInvestments((rows) => [...rows, { id: Date.now().toString(), name: 'New bucket', amount: '100000', annualRate: '10' }])} className="text-sm text-green-700">+ Add</button>}
      >
        {investments.map((row) => (
          <div key={row.id} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <NumberField label="Type" kind="text" value={row.name} onChange={(v) => setInvestments((rows) => rows.map((r) => (r.id === row.id ? { ...r, name: v } : r)))} />
            <NumberField label="Amount today" kind="currency" value={row.amount} onChange={(v) => setInvestments((rows) => rows.map((r) => (r.id === row.id ? { ...r, amount: v } : r)))} />
            <NumberField label="Expected return" kind="percent" value={row.annualRate} onChange={(v) => setInvestments((rows) => rows.map((r) => (r.id === row.id ? { ...r, annualRate: v } : r)))} />
            {investments.length > 1 && (
              <div className="flex items-end">
                <button type="button" onClick={() => setInvestments((rows) => rows.filter((r) => r.id !== row.id))} className="text-sm text-red-600">Remove</button>
              </div>
            )}
          </div>
        ))}
      </CollapsibleSection>
      <CollapsibleSection
        title="Monthly investments"
        actions={<button type="button" onClick={() => setSips((rows) => [...rows, { id: Date.now().toString(), name: 'SIP', monthlyAmount: '10000', annualRate: '12', stepUp: '0' }])} className="text-sm text-green-700">+ Add</button>}
      >
        <p className="text-xs text-slate-500">These run until FIRE age. Step-up is the yearly increase in the SIP amount.</p>
        {sips.map((row) => (
          <div key={row.id} className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <NumberField label="Name" kind="text" value={row.name} onChange={(v) => setSips((rows) => rows.map((r) => (r.id === row.id ? { ...r, name: v } : r)))} />
            <NumberField label="Monthly amount" kind="currency" value={row.monthlyAmount} onChange={(v) => setSips((rows) => rows.map((r) => (r.id === row.id ? { ...r, monthlyAmount: v } : r)))} />
            <NumberField label="Expected return" kind="percent" value={row.annualRate} onChange={(v) => setSips((rows) => rows.map((r) => (r.id === row.id ? { ...r, annualRate: v } : r)))} />
            <NumberField label="Yearly step-up" kind="percent" value={row.stepUp} onChange={(v) => setSips((rows) => rows.map((r) => (r.id === row.id ? { ...r, stepUp: v } : r)))} />
            {sips.length > 1 && (
              <div className="flex items-end">
                <button type="button" onClick={() => setSips((rows) => rows.filter((r) => r.id !== row.id))} className="text-sm text-red-600">Remove</button>
              </div>
            )}
          </div>
        ))}
      </CollapsibleSection>
      <CollapsibleSection
        title="One-off future expenses"
        defaultOpen={false}
        actions={<button type="button" onClick={() => setOneOffs((rows) => [...rows, { id: Date.now().toString(), description: 'Home / car / wedding', amount: '500000', date: addYearsIso(today, 5) }])} className="text-sm text-green-700">+ Add</button>}
      >
        {oneOffs.length === 0 && <p className="text-sm text-slate-500">None. Add a house, car, or other planned cost in today’s rupees.</p>}
        {oneOffs.map((row) => (
          <div key={row.id} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <NumberField label="Note" kind="text" value={row.description} onChange={(v) => setOneOffs((rows) => rows.map((r) => (r.id === row.id ? { ...r, description: v } : r)))} />
            <NumberField label="Amount today" kind="currency" value={row.amount} onChange={(v) => setOneOffs((rows) => rows.map((r) => (r.id === row.id ? { ...r, amount: v } : r)))} />
            <NumberField label="Date" kind="date" value={row.date} onChange={(v) => setOneOffs((rows) => rows.map((r) => (r.id === row.id ? { ...r, date: v } : r)))} />
            <div className="flex items-end">
              <button type="button" onClick={() => setOneOffs((rows) => rows.filter((r) => r.id !== row.id))} className="text-sm text-red-600">Remove</button>
            </div>
          </div>
        ))}
      </CollapsibleSection>
    </CalculatorLayout>
  );
}
