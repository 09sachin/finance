'use client';

import { useState } from 'react';
import { calculateLumpsumSip, formatINR, parseNumber } from '@/lib/calculators';
import CalculatorLayout, { ResultsPanel, StepUpToggle, ValidationBanner } from './shared/CalculatorLayout';
import NumberField from './shared/NumberField';
import ResultCard, { ResultGrid } from './shared/ResultCard';
import { CorpusAreaChart } from './shared/CorpusChart';
import { useAutoCalculate } from './shared/useAutoCalculate';

export default function LumpsumSIPCalculator() {
  const [lumpsum, setLumpsum] = useState('500000');
  const [monthlySip, setMonthlySip] = useState('10000');
  const [annualRate, setAnnualRate] = useState('12');
  const [years, setYears] = useState('15');
  const [stepUpEnabled, setStepUpEnabled] = useState(false);
  const [stepUpRate, setStepUpRate] = useState('10');

  const L = parseNumber(lumpsum) ?? 0;
  const P = parseNumber(monthlySip) ?? 0;
  const r = parseNumber(annualRate);
  const t = parseNumber(years);
  const errors: string[] = [];
  if (L < 0 || P < 0) errors.push('Investment amounts cannot be negative');
  if (L === 0 && P === 0) errors.push('Enter a lumpsum, a SIP, or both');
  if (r === null || r <= 0) errors.push('Expected return must be greater than 0');
  if (t === null || t <= 0) errors.push('Tenure must be greater than 0');

  const result = useAutoCalculate(() => {
    if (errors.length || r === null || t === null) return null;
    return calculateLumpsumSip({
      lumpsum: L,
      monthlySip: P,
      annualPercent: r,
      years: t,
      stepUpPercent: stepUpEnabled ? parseNumber(stepUpRate) ?? 0 : 0,
    });
  }, [lumpsum, monthlySip, annualRate, years, stepUpEnabled, stepUpRate]);

  return (
    <CalculatorLayout
      results={result && (
        <ResultsPanel title="Combined result">
          <ResultGrid>
            <ResultCard label="Total invested" value={formatINR(result.totalInvestment)} />
            <ResultCard label="Lumpsum value" value={formatINR(result.lumpsumValue)} tone="blue" />
            <ResultCard label="SIP value" value={formatINR(result.sipValue)} tone="green" />
            <ResultCard label="Total value" value={formatINR(result.totalValue)} tone="purple" />
            <ResultCard label="Total returns" value={formatINR(result.totalReturns)} tone="green" />
          </ResultGrid>
          <CorpusAreaChart data={result.series} investedKey="invested" valueKey="value" />
        </ResultsPanel>
      )}
    >
      <ValidationBanner errors={errors} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <NumberField label="Lumpsum" kind="currency" value={lumpsum} onChange={setLumpsum} />
        <NumberField label="Monthly SIP" kind="currency" value={monthlySip} onChange={setMonthlySip} />
        <NumberField label="Expected return" kind="percent" value={annualRate} onChange={setAnnualRate} />
        <NumberField label="Tenure" kind="years" value={years} onChange={setYears} />
      </div>
      <StepUpToggle
        enabled={stepUpEnabled}
        rate={stepUpRate}
        onEnabled={setStepUpEnabled}
        onRate={setStepUpRate}
        hint={`SIP amount increases by ${stepUpRate || 0}% each year. Lumpsum and SIP both compound monthly.`}
      />
    </CalculatorLayout>
  );
}
