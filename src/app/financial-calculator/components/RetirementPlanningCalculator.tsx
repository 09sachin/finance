'use client';

import { useState } from 'react';
import { addYearsIso, calculateRetirement, formatINR, parseNumber, todayIso } from '@/lib/calculators';
import CalculatorLayout, { ResultsPanel, TaxSettings, ValidationBanner } from './shared/CalculatorLayout';
import NumberField from './shared/NumberField';
import ResultCard, { ResultGrid } from './shared/ResultCard';
import BreakdownTable from './shared/BreakdownTable';
import CorpusChart from './shared/CorpusChart';
import HowItWorks, { CollapsibleSection } from './shared/HowItWorks';
import { useAutoCalculate } from './shared/useAutoCalculate';

export default function RetirementPlanningCalculator() {
  const today = todayIso();
  const [currentAge, setCurrentAge] = useState('30');
  const [retirementAge, setRetirementAge] = useState('60');
  const [corpus, setCorpus] = useState('500000');
  const [preReturn, setPreReturn] = useState('12');
  const [monthlySip, setMonthlySip] = useState('25000');
  const [sipStepUp, setSipStepUp] = useState('0');
  const [swpRate, setSwpRate] = useState('8');
  const [monthlyExpense, setMonthlyExpense] = useState('50000');
  const [inflation, setInflation] = useState('6');
  const [ltcgEnabled, setLtcgEnabled] = useState(true);
  const [ltcgRate, setLtcgRate] = useState('12.5');
  const [oneOffs, setOneOffs] = useState<{ id: string; amount: string; date: string; description: string }[]>([]);

  const age = parseNumber(currentAge);
  const retire = parseNumber(retirementAge);
  const savings = parseNumber(corpus) ?? 0;
  const growth = parseNumber(preReturn);
  const sip = parseNumber(monthlySip) ?? 0;
  const stepUp = parseNumber(sipStepUp) ?? 0;
  const swp = parseNumber(swpRate);
  const expense = parseNumber(monthlyExpense);
  const inf = parseNumber(inflation) ?? 0;
  const taxRate = parseNumber(ltcgRate);
  const errors: string[] = [];
  if (age === null || age < 18 || age > 80) errors.push('Current age should be between 18 and 80');
  if (retire === null || (age !== null && retire <= age)) errors.push('Retirement age must be after current age');
  if (growth === null || growth <= 0) errors.push('Return before retirement must be greater than 0');
  if (swp === null || swp <= 0) errors.push('Return after retirement must be greater than 0');
  if (expense === null || expense <= 0) errors.push('Monthly expense must be greater than 0');
  if (inf < 0) errors.push('Inflation cannot be negative');
  if (ltcgEnabled && (taxRate === null || taxRate < 0)) errors.push('LTCG tax rate cannot be negative');

  const result = useAutoCalculate(() => {
    if (errors.length || age === null || retire === null || growth === null || swp === null || expense === null) return null;
    const sipEnd = addYearsIso(today, retire - age);
    return calculateRetirement({
      currentAge: age,
      retirementAge: retire,
      lumpsums: [{ amount: savings, date: new Date(`${today}T00:00:00`), annualPercent: growth }],
      sips: sip > 0
        ? [{ monthlyAmount: sip, startDate: new Date(`${today}T00:00:00`), endDate: new Date(`${sipEnd}T00:00:00`), annualPercent: growth, stepUpPercent: stepUp }]
        : [],
      swpAnnualPercent: swp,
      withdrawals: oneOffs.map((w) => ({
        amount: parseNumber(w.amount) ?? 0,
        date: new Date(`${w.date}T00:00:00`),
        description: w.description,
      })),
      goals: [{
        id: 'living',
        description: 'Monthly living expenses',
        monthlyAmount: expense,
        startAge: retire,
        durationYears: 'lifetime',
      }],
      asOf: new Date(),
      maxAge: 100,
      inflationPercent: inf,
      ltcgEnabled,
      ltcgRatePercent: taxRate ?? 12.5,
    });
  }, [currentAge, retirementAge, corpus, preReturn, monthlySip, sipStepUp, swpRate, monthlyExpense, inflation, ltcgEnabled, ltcgRate, oneOffs]);

  return (
    <CalculatorLayout
      howItWorks={(
        <HowItWorks>
          <p>Enter today’s savings, a monthly SIP until retirement, and living costs in today’s rupees. Inflation is applied to expenses and one-off costs. After retirement the corpus grows at the post-retirement return.</p>
          <p>Turn on LTCG to tax withdrawals at your rate after the yearly ₹1.25 lakh exemption. FIRE age is a separate calculator under Planning.</p>
        </HowItWorks>
      )}
      results={result && (
        <ResultsPanel title="Retirement plan" accent="purple">
          <ResultGrid>
            <ResultCard label="Corpus at retirement" value={formatINR(result.corpusAtRetirement)} tone="purple" />
            <ResultCard label="Total invested" value={formatINR(result.totalInvestment)} />
            <ResultCard label="Monthly needs then" value={formatINR(result.monthlyNeedsAtRetirement)} hint="Today’s expenses grown to retirement" />
            <ResultCard label="Passive income at SWP rate" value={formatINR(result.monthlyPassiveIncome)} tone="green" />
          </ResultGrid>
          <ResultGrid>
            <ResultCard
              label="Lasts until"
              value={result.depletionAge ? `Age ${result.depletionAge}` : 'Beyond age 100'}
              tone={result.sustainableTo80 ? 'green' : 'red'}
            />
            <ResultCard label="Sustainable to 80" value={result.sustainableTo80 ? 'Yes' : 'No'} tone={result.sustainableTo80 ? 'green' : 'red'} />
            {ltcgEnabled && <ResultCard label="Estimated LTCG" value={formatINR(result.totalLtcgTax)} tone="orange" />}
          </ResultGrid>
          <CorpusChart
            data={result.chartSeries}
            lines={[
              { key: 'corpus', label: 'Corpus', color: '#7c3aed' },
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
              { key: 'inv', header: 'Invested', align: 'right', render: (row) => formatINR(row.yearlyInvestment) },
              { key: 'g', header: 'Growth', align: 'right', className: 'text-green-600 dark:text-green-400', render: (row) => formatINR(row.yearlyGrowth) },
              { key: 'w', header: 'Monthly needs', align: 'right', render: (row) => formatINR(row.monthlyWithdrawals) },
              ...(ltcgEnabled
                ? [{ key: 'tax', header: 'LTCG', align: 'right' as const, className: 'text-orange-600 dark:text-orange-400', render: (row: (typeof result.yearlyBreakdown)[0]) => formatINR(row.ltcgTax) }]
                : []),
              { key: 'end', header: 'Remaining', align: 'right', className: 'text-blue-600 dark:text-blue-400', render: (row) => formatINR(row.remainingCorpus) },
            ]}
          />
        </ResultsPanel>
      )}
    >
      <ValidationBanner errors={errors} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <NumberField label="Current age" kind="number" value={currentAge} onChange={setCurrentAge} />
        <NumberField label="Retirement age" kind="number" value={retirementAge} onChange={setRetirementAge} />
        <NumberField label="Return before retirement" kind="percent" value={preReturn} onChange={setPreReturn} />
        <NumberField label="Return after retirement" kind="percent" value={swpRate} onChange={setSwpRate} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <NumberField label="Savings today" kind="currency" value={corpus} onChange={setCorpus} />
        <NumberField label="Monthly SIP" kind="currency" value={monthlySip} onChange={setMonthlySip} />
        <NumberField label="SIP yearly step-up" kind="percent" value={sipStepUp} onChange={setSipStepUp} hint="0 means a flat SIP" />
        <NumberField label="Monthly expenses today" kind="currency" value={monthlyExpense} onChange={setMonthlyExpense} />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <NumberField label="Expense inflation" kind="percent" value={inflation} onChange={setInflation} />
      </div>
      <TaxSettings enabled={ltcgEnabled} rate={ltcgRate} onEnabled={setLtcgEnabled} onRate={setLtcgRate} />
      <CollapsibleSection
        title="One-off expenses"
        defaultOpen={false}
        actions={<button type="button" onClick={() => setOneOffs((rows) => [...rows, { id: Date.now().toString(), amount: '500000', date: addYearsIso(today, 5), description: 'Home / car' }])} className="text-sm text-green-700">+ Add</button>}
      >
        {oneOffs.length === 0 && <p className="text-sm text-slate-500">Optional. Amounts are in today’s rupees and inflated to the date you pick.</p>}
        {oneOffs.map((w) => (
          <div key={w.id} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <NumberField label="Amount today" kind="currency" value={w.amount} onChange={(v) => setOneOffs((rows) => rows.map((r) => (r.id === w.id ? { ...r, amount: v } : r)))} />
            <NumberField label="Date" kind="date" value={w.date} onChange={(v) => setOneOffs((rows) => rows.map((r) => (r.id === w.id ? { ...r, date: v } : r)))} />
            <NumberField label="Note" kind="text" value={w.description} onChange={(v) => setOneOffs((rows) => rows.map((r) => (r.id === w.id ? { ...r, description: v } : r)))} />
            <div className="flex items-end">
              <button type="button" onClick={() => setOneOffs((rows) => rows.filter((r) => r.id !== w.id))} className="text-sm text-red-600">Remove</button>
            </div>
          </div>
        ))}
      </CollapsibleSection>
    </CalculatorLayout>
  );
}
