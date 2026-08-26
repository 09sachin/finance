'use client';

import { useState } from 'react';
import { calculateEmi, formatINR, parseNumber } from '@/lib/calculators';
import CalculatorLayout, { ResultsPanel, ValidationBanner } from './shared/CalculatorLayout';
import NumberField from './shared/NumberField';
import ResultCard, { ResultGrid } from './shared/ResultCard';
import BreakdownTable from './shared/BreakdownTable';
import CorpusChart from './shared/CorpusChart';
import HowItWorks from './shared/HowItWorks';
import { useAutoCalculate } from './shared/useAutoCalculate';

export default function EMICalculator() {
  const [principal, setPrincipal] = useState('1000000');
  const [annualRate, setAnnualRate] = useState('8.5');
  const [years, setYears] = useState('20');

  const P = parseNumber(principal);
  const r = parseNumber(annualRate);
  const t = parseNumber(years);
  const errors: string[] = [];
  if (P === null || P <= 0) errors.push('Loan amount must be greater than 0');
  if (r === null || r <= 0) errors.push('Interest rate must be greater than 0');
  if (t === null || t <= 0) errors.push('Tenure must be greater than 0');

  const result = useAutoCalculate(() => {
    if (errors.length || P === null || r === null || t === null) return null;
    return calculateEmi(P, r, Math.round(t * 12));
  }, [principal, annualRate, years]);

  return (
    <CalculatorLayout
      howItWorks={(
        <HowItWorks>
          <p>EMI uses a reducing-balance loan: interest is charged on the outstanding principal each month. Extra principal paid later months is smaller at the start and larger toward the end.</p>
        </HowItWorks>
      )}
      results={result && (
        <ResultsPanel title="Loan summary" accent="blue">
          <ResultGrid>
            <ResultCard label="Monthly EMI" value={formatINR(result.emi)} tone="blue" />
            <ResultCard label="Total interest" value={formatINR(result.totalInterest)} tone="orange" />
            <ResultCard label="Total payment" value={formatINR(result.totalPayment)} />
          </ResultGrid>
          <CorpusChart
            data={result.yearlyBreakdown}
            lines={[
              { key: 'remaining', label: 'Remaining principal', color: '#2563eb' },
              { key: 'interestPaid', label: 'Interest that year', color: '#ea580c' },
            ]}
          />
          <BreakdownTable
            title="Year-by-year"
            rows={result.yearlyBreakdown}
            columns={[
              { key: 'year', header: 'Year', render: (row) => row.year },
              { key: 'prin', header: 'Principal paid', align: 'right', render: (row) => formatINR(row.principalPaid) },
              { key: 'int', header: 'Interest paid', align: 'right', className: 'text-orange-600 dark:text-orange-400', render: (row) => formatINR(row.interestPaid) },
              { key: 'rem', header: 'Remaining', align: 'right', render: (row) => formatINR(row.remaining) },
            ]}
          />
          <BreakdownTable
            title="Monthly schedule"
            rows={result.schedule}
            columns={[
              { key: 'm', header: 'Month', render: (row) => row.month },
              { key: 'emi', header: 'EMI', align: 'right', render: (row) => formatINR(row.emi) },
              { key: 'p', header: 'Principal', align: 'right', render: (row) => formatINR(row.principal) },
              { key: 'i', header: 'Interest', align: 'right', className: 'text-orange-600 dark:text-orange-400', render: (row) => formatINR(row.interest) },
              { key: 'r', header: 'Remaining', align: 'right', render: (row) => formatINR(row.remaining) },
            ]}
          />
        </ResultsPanel>
      )}
    >
      <ValidationBanner errors={errors} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <NumberField label="Loan amount" kind="currency" value={principal} onChange={setPrincipal} />
        <NumberField label="Interest rate" kind="percent" value={annualRate} onChange={setAnnualRate} />
        <NumberField label="Tenure" kind="years" value={years} onChange={setYears} />
      </div>
    </CalculatorLayout>
  );
}
