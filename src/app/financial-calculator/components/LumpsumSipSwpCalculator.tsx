'use client';

import { useState } from 'react';
import { calculateLumpsumSip, formatINR, parseNumber, simulateSwp } from '@/lib/calculators';
import CalculatorLayout, { ResultsPanel, StepUpToggle, ValidationBanner } from './shared/CalculatorLayout';
import NumberField from './shared/NumberField';
import ResultCard, { ResultGrid } from './shared/ResultCard';
import BreakdownTable from './shared/BreakdownTable';
import CorpusChart, { CorpusAreaChart } from './shared/CorpusChart';
import { useAutoCalculate } from './shared/useAutoCalculate';

export default function LumpsumSipSwpCalculator() {
  const [lumpsum, setLumpsum] = useState('500000');
  const [monthlySip, setMonthlySip] = useState('10000');
  const [accumYears, setAccumYears] = useState('15');
  const [growthRate, setGrowthRate] = useState('12');
  const [sipStepUpEnabled, setSipStepUpEnabled] = useState(false);
  const [sipStepUpRate, setSipStepUpRate] = useState('10');
  const [monthlySwp, setMonthlySwp] = useState('30000');
  const [swpRate, setSwpRate] = useState('8');
  const [swpStepUpEnabled, setSwpStepUpEnabled] = useState(false);
  const [swpStepUpRate, setSwpStepUpRate] = useState('5');

  const L = parseNumber(lumpsum) ?? 0;
  const P = parseNumber(monthlySip) ?? 0;
  const g = parseNumber(growthRate);
  const t = parseNumber(accumYears);
  const w = parseNumber(monthlySwp);
  const swp = parseNumber(swpRate);
  const errors: string[] = [];
  if (L < 0 || P < 0) errors.push('Accumulation amounts cannot be negative');
  if (g === null || g <= 0) errors.push('Growth rate must be greater than 0');
  if (t === null || t <= 0) errors.push('Accumulation years must be greater than 0');
  if (w === null || w <= 0) errors.push('Monthly SWP must be greater than 0');
  if (swp === null || swp <= 0) errors.push('SWP return must be greater than 0');

  const result = useAutoCalculate(() => {
    if (errors.length || g === null || t === null || w === null || swp === null) return null;
    const acc = calculateLumpsumSip({
      lumpsum: L,
      monthlySip: P,
      annualPercent: g,
      years: t,
      stepUpPercent: sipStepUpEnabled ? parseNumber(sipStepUpRate) ?? 0 : 0,
    });
    const swpResult = simulateSwp({
      corpus: acc.totalValue,
      monthlyWithdrawal: w,
      annualPercent: swp,
      stepUpPercent: swpStepUpEnabled ? parseNumber(swpStepUpRate) ?? 0 : 0,
    });
    return { acc, swpResult };
  }, [lumpsum, monthlySip, accumYears, growthRate, sipStepUpEnabled, sipStepUpRate, monthlySwp, swpRate, swpStepUpEnabled, swpStepUpRate]);

  return (
    <CalculatorLayout
      results={result && (
        <ResultsPanel title="Lifecycle result" accent="purple">
          <ResultGrid>
            <ResultCard label="Corpus after accumulation" value={formatINR(result.acc.totalValue)} tone="purple" />
            <ResultCard label="Amount invested" value={formatINR(result.acc.totalInvestment)} />
            <ResultCard label="SWP duration" value={result.swpResult.durationLabel} tone="orange" />
          </ResultGrid>
          <h4 className="font-medium text-slate-800 dark:text-slate-200">Accumulation</h4>
          <CorpusAreaChart data={result.acc.series} investedKey="invested" valueKey="value" />
          <h4 className="font-medium text-slate-800 dark:text-slate-200">Withdrawal</h4>
          <CorpusChart data={result.swpResult.chartSeries} lines={[{ key: 'corpus', label: 'Corpus', color: '#7c3aed' }]} />
          <BreakdownTable
            title="SWP year-by-year"
            rows={result.swpResult.yearlyBreakdown}
            columns={[
              { key: 'year', header: 'Year', render: (row) => row.year },
              { key: 'start', header: 'Starting corpus', align: 'right', render: (row) => formatINR(row.startingCorpus) },
              { key: 'wd', header: 'Monthly withdrawal', align: 'right', className: 'text-orange-600 dark:text-orange-400', render: (row) => formatINR(row.monthlyWithdrawal) },
              { key: 'int', header: 'Interest', align: 'right', className: 'text-green-600 dark:text-green-400', render: (row) => formatINR(row.interestEarned) },
              { key: 'total', header: 'Withdrawn', align: 'right', className: 'text-red-600 dark:text-red-400', render: (row) => formatINR(row.totalWithdrawals) },
              { key: 'end', header: 'Ending corpus', align: 'right', className: 'text-blue-600 dark:text-blue-400', render: (row) => formatINR(row.endingCorpus) },
            ]}
          />
        </ResultsPanel>
      )}
    >
      <ValidationBanner errors={errors} />
      <h3 className="font-semibold text-slate-800 dark:text-slate-200">Accumulation</h3>
      <p className="text-xs text-slate-500">Expected return during the saving years. Use a lower rate later if you plan to move to safer funds.</p>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <NumberField label="Initial lumpsum" kind="currency" value={lumpsum} onChange={setLumpsum} />
        <NumberField label="Monthly SIP" kind="currency" value={monthlySip} onChange={setMonthlySip} />
        <NumberField label="Years" kind="years" value={accumYears} onChange={setAccumYears} />
        <NumberField label="Growth rate" kind="percent" value={growthRate} onChange={setGrowthRate} />
      </div>
      <StepUpToggle enabled={sipStepUpEnabled} rate={sipStepUpRate} onEnabled={setSipStepUpEnabled} onRate={setSipStepUpRate} hint={`SIP increases by ${sipStepUpRate || 0}% each year.`} />
      <h3 className="font-semibold text-slate-800 dark:text-slate-200">Withdrawal</h3>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <NumberField label="Monthly SWP" kind="currency" value={monthlySwp} onChange={setMonthlySwp} />
        <NumberField label="SWP return" kind="percent" value={swpRate} onChange={setSwpRate} />
      </div>
      <StepUpToggle enabled={swpStepUpEnabled} rate={swpStepUpRate} onEnabled={setSwpStepUpEnabled} onRate={setSwpStepUpRate} label="Enable step-up SWP" hint={`Withdrawal increases by ${swpStepUpRate || 0}% each year.`} />
    </CalculatorLayout>
  );
}
