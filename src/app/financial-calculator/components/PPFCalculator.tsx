'use client';

import { useState } from 'react';
import { calculatePpf, formatINR, parseNumber, PPF_ANNUAL_CAP, PPF_DEFAULT_RATE, PPF_MIN_YEARS } from '@/lib/calculators';
import CalculatorLayout, { ResultsPanel, ValidationBanner } from './shared/CalculatorLayout';
import NumberField from './shared/NumberField';
import ResultCard, { ResultGrid } from './shared/ResultCard';
import BreakdownTable from './shared/BreakdownTable';
import { CorpusAreaChart } from './shared/CorpusChart';
import HowItWorks from './shared/HowItWorks';
import { useAutoCalculate } from './shared/useAutoCalculate';

export default function PPFCalculator() {
  const [contribution, setContribution] = useState(String(PPF_ANNUAL_CAP));
  const [annualRate, setAnnualRate] = useState(String(PPF_DEFAULT_RATE));
  const [years, setYears] = useState(String(PPF_MIN_YEARS));

  const C = parseNumber(contribution);
  const r = parseNumber(annualRate);
  const t = parseNumber(years);
  const errors: string[] = [];
  if (C === null || C <= 0) errors.push('Yearly contribution must be greater than 0');
  if (r === null || r <= 0) errors.push('Interest rate must be greater than 0');
  if (t === null || t < PPF_MIN_YEARS) errors.push(`Tenure must be at least ${PPF_MIN_YEARS} years`);

  const result = useAutoCalculate(() => {
    if (errors.length || C === null || r === null || t === null) return null;
    const calc = calculatePpf(C, r, t);
    return {
      ...calc,
      series: calc.yearlyBreakdown.map((row) => ({ year: row.year, invested: row.openingBalance + row.deposit, value: row.closingBalance })),
    };
  }, [contribution, annualRate, years]);

  return (
    <CalculatorLayout
      howItWorks={(
        <HowItWorks>
          <p>PPF interest is credited yearly. This calculator assumes you invest at the start of each financial year, so the full year earns interest — the usual best-case PPF timing.</p>
          <p>The yearly cap is {formatINR(PPF_ANNUAL_CAP)}. Amounts above that are ignored. The lock-in is 15 years; 20 and 25 year options are 5-year extensions.</p>
        </HowItWorks>
      )}
      results={result && (
        <ResultsPanel title="PPF maturity">
          {result.capped && <p className="text-sm text-orange-700 dark:text-orange-300">Contribution was capped at {formatINR(PPF_ANNUAL_CAP)} a year.</p>}
          <ResultGrid>
            <ResultCard label="Total deposited" value={formatINR(result.totalDeposited)} />
            <ResultCard label="Interest earned" value={formatINR(result.totalInterest)} tone="green" />
            <ResultCard label="Maturity value" value={formatINR(result.maturityValue)} tone="blue" />
          </ResultGrid>
          <CorpusAreaChart data={result.series} investedKey="invested" valueKey="value" />
          <BreakdownTable
            title="Year-by-year"
            rows={result.yearlyBreakdown}
            columns={[
              { key: 'year', header: 'Year', render: (row) => row.year },
              { key: 'open', header: 'Opening', align: 'right', render: (row) => formatINR(row.openingBalance) },
              { key: 'dep', header: 'Deposit', align: 'right', render: (row) => formatINR(row.deposit) },
              { key: 'int', header: 'Interest', align: 'right', className: 'text-green-600 dark:text-green-400', render: (row) => formatINR(row.interest) },
              { key: 'close', header: 'Closing', align: 'right', className: 'text-blue-600 dark:text-blue-400', render: (row) => formatINR(row.closingBalance) },
            ]}
          />
        </ResultsPanel>
      )}
    >
      <ValidationBanner errors={errors} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <NumberField label="Yearly contribution" kind="currency" value={contribution} onChange={setContribution} hint={`Capped at ${formatINR(PPF_ANNUAL_CAP)}`} />
        <NumberField label="Interest rate" kind="percent" value={annualRate} onChange={setAnnualRate} />
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">Tenure</span>
          <select value={years} onChange={(e) => setYears(e.target.value)} className="app-input">
            <option value="15">15 years</option>
            <option value="20">20 years</option>
            <option value="25">25 years</option>
          </select>
        </label>
      </div>
    </CalculatorLayout>
  );
}
