'use client';

import { useState } from 'react';
import { calculateInflation, formatINR, formatPercent, parseNumber } from '@/lib/calculators';
import CalculatorLayout, { ResultsPanel, ValidationBanner } from './shared/CalculatorLayout';
import NumberField from './shared/NumberField';
import ResultCard, { ResultGrid } from './shared/ResultCard';
import BreakdownTable from './shared/BreakdownTable';
import CorpusChart from './shared/CorpusChart';
import { useAutoCalculate } from './shared/useAutoCalculate';

export default function InflationCalculator() {
  const [amount, setAmount] = useState('100000');
  const [nominal, setNominal] = useState('12');
  const [inflation, setInflation] = useState('6');
  const [years, setYears] = useState('10');

  const A = parseNumber(amount);
  const n = parseNumber(nominal);
  const inf = parseNumber(inflation);
  const t = parseNumber(years);
  const errors: string[] = [];
  if (A === null || A <= 0) errors.push('Amount must be greater than 0');
  if (n === null) errors.push('Nominal return must be a number');
  if (inf === null) errors.push('Inflation must be a number');
  if (t === null || t <= 0) errors.push('Years must be greater than 0');

  const result = useAutoCalculate(() => {
    if (errors.length || A === null || n === null || inf === null || t === null) return null;
    return calculateInflation({ amount: A, nominalPercent: n, inflationPercent: inf, years: t });
  }, [amount, nominal, inflation, years]);

  return (
    <CalculatorLayout
      results={result && (
        <ResultsPanel title="Inflation-adjusted result" accent="purple">
          <ResultGrid>
            <ResultCard label="Real return" value={formatPercent(result.realRate * 100)} tone="purple" />
            <ResultCard label="Nominal future value" value={formatINR(result.nominalFutureValue)} tone="blue" />
            <ResultCard label="In today’s rupees" value={formatINR(result.realFutureValue)} tone="green" />
            <ResultCard label="Amount needed to keep today’s buying power" value={formatINR(result.inflationAdjustedTarget)} />
          </ResultGrid>
          <CorpusChart
            data={result.yearly}
            lines={[
              { key: 'nominal', label: 'Nominal value', color: '#2563eb' },
              { key: 'real', label: 'Today’s rupees', color: '#16a34a' },
              { key: 'target', label: 'Inflation-adjusted need', color: '#7c3aed', dashed: true },
            ]}
          />
          <BreakdownTable
            title="Year-by-year"
            rows={result.yearly}
            columns={[
              { key: 'year', header: 'Year', render: (row) => row.year },
              { key: 'nom', header: 'Nominal', align: 'right', render: (row) => formatINR(row.nominal) },
              { key: 'real', header: 'Today’s rupees', align: 'right', className: 'text-green-600 dark:text-green-400', render: (row) => formatINR(row.real) },
              { key: 'target', header: 'Inflation-adjusted need', align: 'right', render: (row) => formatINR(row.target) },
            ]}
          />
        </ResultsPanel>
      )}
    >
      <ValidationBanner errors={errors} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <NumberField label="Amount today" kind="currency" value={amount} onChange={setAmount} />
        <NumberField label="Nominal return" kind="percent" value={nominal} onChange={setNominal} />
        <NumberField label="Inflation" kind="percent" value={inflation} onChange={setInflation} />
        <NumberField label="Years" kind="years" value={years} onChange={setYears} />
      </div>
    </CalculatorLayout>
  );
}
