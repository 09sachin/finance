'use client';

import { useState } from 'react';
import { analyzeCagr, formatINR, formatPercent, parseNumber } from '@/lib/calculators';
import CalculatorLayout, { ResultsPanel, ValidationBanner } from './shared/CalculatorLayout';
import NumberField from './shared/NumberField';
import ResultCard, { ResultGrid } from './shared/ResultCard';
import { useAutoCalculate } from './shared/useAutoCalculate';

export default function CAGRCalculator() {
  const [startValue, setStartValue] = useState('100000');
  const [endValue, setEndValue] = useState('200000');
  const [years, setYears] = useState('7');
  const [fdRate, setFdRate] = useState('7');

  const S = parseNumber(startValue);
  const E = parseNumber(endValue);
  const t = parseNumber(years);
  const fd = parseNumber(fdRate) ?? 7;
  const errors: string[] = [];
  if (S === null || S <= 0) errors.push('Start value must be greater than 0');
  if (E === null || E < 0) errors.push('End value cannot be negative');
  if (t === null || t <= 0) errors.push('Years must be greater than 0');

  const result = useAutoCalculate(() => {
    if (errors.length || S === null || E === null || t === null) return null;
    return analyzeCagr(S, E, t, fd);
  }, [startValue, endValue, years, fdRate]);

  return (
    <CalculatorLayout
      results={result && (
        <ResultsPanel title="CAGR result" accent="blue">
          <ResultGrid>
            <ResultCard label="CAGR" value={formatPercent(result.cagr * 100)} tone="blue" />
            <ResultCard label="Absolute gain" value={formatINR(result.absoluteGain)} tone="green" />
            <ResultCard label="Total return" value={formatPercent(result.totalReturnPercent)} />
            <ResultCard
              label={`FD equivalent at ${fd}%`}
              value={formatINR(result.fdEquivalentValue)}
              hint={result.beatsFd ? 'This investment beat that FD' : 'An FD at this rate would have done better'}
            />
          </ResultGrid>
        </ResultsPanel>
      )}
    >
      <ValidationBanner errors={errors} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <NumberField label="Start value" kind="currency" value={startValue} onChange={setStartValue} />
        <NumberField label="End value" kind="currency" value={endValue} onChange={setEndValue} />
        <NumberField label="Years" kind="years" value={years} onChange={setYears} />
        <NumberField label="FD comparison rate" kind="percent" value={fdRate} onChange={setFdRate} />
      </div>
    </CalculatorLayout>
  );
}
