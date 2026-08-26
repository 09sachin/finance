'use client';

import { useState } from 'react';
import { formatINR, parseNumber, simulateSwp } from '@/lib/calculators';
import CalculatorLayout, { ResultsPanel, StepUpToggle, ValidationBanner } from './shared/CalculatorLayout';
import NumberField from './shared/NumberField';
import ResultCard, { ResultGrid } from './shared/ResultCard';
import BreakdownTable from './shared/BreakdownTable';
import CorpusChart from './shared/CorpusChart';
import HowItWorks from './shared/HowItWorks';
import { useAutoCalculate } from './shared/useAutoCalculate';

export default function SWPCalculator() {
  const [corpus, setCorpus] = useState('1000000');
  const [withdrawal, setWithdrawal] = useState('10000');
  const [annualRate, setAnnualRate] = useState('8');
  const [stepUpEnabled, setStepUpEnabled] = useState(false);
  const [stepUpRate, setStepUpRate] = useState('5');

  const C = parseNumber(corpus);
  const W = parseNumber(withdrawal);
  const r = parseNumber(annualRate);
  const errors: string[] = [];
  if (C === null || C <= 0) errors.push('Corpus must be greater than 0');
  if (W === null || W <= 0) errors.push('Monthly withdrawal must be greater than 0');
  if (r === null || r <= 0) errors.push('Expected return must be greater than 0');

  const result = useAutoCalculate(() => {
    if (errors.length || C === null || W === null || r === null) return null;
    return simulateSwp({
      corpus: C,
      monthlyWithdrawal: W,
      annualPercent: r,
      stepUpPercent: stepUpEnabled ? parseNumber(stepUpRate) ?? 0 : 0,
    });
  }, [corpus, withdrawal, annualRate, stepUpEnabled, stepUpRate]);

  return (
    <CalculatorLayout
      howItWorks={(
        <HowItWorks>
          <p>Each month the corpus earns interest first, then the withdrawal is taken. That matches how most mutual-fund SWPs work.</p>
          <p>If the withdrawal is no higher than that month’s interest and there is no step-up, the corpus can last indefinitely. Step-up withdrawals grow every 12 months, so they will usually exhaust the corpus eventually.</p>
        </HowItWorks>
      )}
      results={result && (
        <ResultsPanel title="SWP analysis" accent="orange">
          <ResultGrid>
            <ResultCard label="How long it lasts" value={result.durationLabel} tone="orange" />
            <ResultCard label="Corpus at the end of the table" value={formatINR(result.finalCorpus)} tone="blue" />
          </ResultGrid>
          <CorpusChart
            data={result.chartSeries}
            lines={[{ key: 'corpus', label: 'Corpus', color: '#ea580c' }]}
          />
          <BreakdownTable
            title={result.isSustainable ? '50-year projection (corpus is not depleting)' : 'Year-by-year corpus'}
            rows={result.yearlyBreakdown}
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
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <NumberField label="Current corpus" kind="currency" value={corpus} onChange={setCorpus} />
        <NumberField label="Monthly withdrawal" kind="currency" value={withdrawal} onChange={setWithdrawal} />
        <NumberField label="Expected return" kind="percent" value={annualRate} onChange={setAnnualRate} />
      </div>
      <StepUpToggle
        enabled={stepUpEnabled}
        rate={stepUpRate}
        onEnabled={setStepUpEnabled}
        onRate={setStepUpRate}
        label="Enable step-up SWP"
        hint={`Withdrawal increases by ${stepUpRate || 0}% each year.`}
      />
    </CalculatorLayout>
  );
}
