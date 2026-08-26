'use client';

import { useState } from 'react';
import { calculateEpf, DEFAULT_EPF_EMPLOYEE_RATE, EPS_WAGE_CEILING, formatINR, parseNumber } from '@/lib/calculators';
import CalculatorLayout, { ResultsPanel, ValidationBanner } from './shared/CalculatorLayout';
import NumberField from './shared/NumberField';
import ResultCard, { ResultGrid } from './shared/ResultCard';
import BreakdownTable from './shared/BreakdownTable';
import { CorpusAreaChart } from './shared/CorpusChart';
import HowItWorks from './shared/HowItWorks';
import { useAutoCalculate } from './shared/useAutoCalculate';

export default function EPFCalculator() {
  const [basic, setBasic] = useState('50000');
  const [da, setDa] = useState('0');
  const [years, setYears] = useState('20');
  const [annualRate, setAnnualRate] = useState('8.25');

  const B = parseNumber(basic);
  const D = parseNumber(da) ?? 0;
  const t = parseNumber(years);
  const r = parseNumber(annualRate);
  const errors: string[] = [];
  if (B === null || B <= 0) errors.push('Basic salary must be greater than 0');
  if (t === null || t <= 0) errors.push('Years must be greater than 0');
  if (r === null || r <= 0) errors.push('Interest rate must be greater than 0');

  const result = useAutoCalculate(() => {
    if (errors.length || B === null || t === null || r === null) return null;
    const calc = calculateEpf({ basicSalary: B, da: D, years: t, annualPercent: r });
    return {
      ...calc,
      series: calc.yearlyBreakdown.map((row) => ({ year: row.year, invested: row.openingBalance + row.employeeContribution + row.employerEpfContribution, value: row.closingBalance })),
    };
  }, [basic, da, years, annualRate]);

  return (
    <CalculatorLayout
      howItWorks={(
        <HowItWorks>
          <p>Employee contribution is {DEFAULT_EPF_EMPLOYEE_RATE}% of basic + DA. Employer also contributes 12%, but 8.33% of wage up to {formatINR(EPS_WAGE_CEILING)} goes to EPS (pension), not the EPF corpus.</p>
          <p>Interest here is applied monthly on the running EPF balance. EPS contributions are tracked separately and are not part of the withdrawable corpus.</p>
        </HowItWorks>
      )}
      results={result && (
        <ResultsPanel title="EPF corpus">
          <ResultGrid>
            <ResultCard label="Employee monthly" value={formatINR(result.employeeMonthly)} />
            <ResultCard label="Employer EPF monthly" value={formatINR(result.employerEpfMonthly)} tone="blue" />
            <ResultCard label="EPS monthly (not in corpus)" value={formatINR(result.epsMonthly)} tone="orange" />
            <ResultCard label="EPF corpus" value={formatINR(result.corpus)} tone="green" />
          </ResultGrid>
          <ResultGrid>
            <ResultCard label="Employee total" value={formatINR(result.totalEmployeeContribution)} />
            <ResultCard label="Employer EPF total" value={formatINR(result.totalEmployerEpfContribution)} />
            <ResultCard label="Interest" value={formatINR(result.totalInterest)} tone="green" />
          </ResultGrid>
          <CorpusAreaChart data={result.series} investedKey="invested" valueKey="value" />
          <BreakdownTable
            title="Year-by-year"
            rows={result.yearlyBreakdown}
            columns={[
              { key: 'year', header: 'Year', render: (row) => row.year },
              { key: 'open', header: 'Opening', align: 'right', render: (row) => formatINR(row.openingBalance) },
              { key: 'emp', header: 'Employee', align: 'right', render: (row) => formatINR(row.employeeContribution) },
              { key: 'er', header: 'Employer EPF', align: 'right', render: (row) => formatINR(row.employerEpfContribution) },
              { key: 'eps', header: 'EPS', align: 'right', render: (row) => formatINR(row.epsContribution) },
              { key: 'int', header: 'Interest', align: 'right', className: 'text-green-600 dark:text-green-400', render: (row) => formatINR(row.interest) },
              { key: 'close', header: 'Closing', align: 'right', className: 'text-blue-600 dark:text-blue-400', render: (row) => formatINR(row.closingBalance) },
            ]}
          />
        </ResultsPanel>
      )}
    >
      <ValidationBanner errors={errors} />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <NumberField label="Basic salary (monthly)" kind="currency" value={basic} onChange={setBasic} />
        <NumberField label="DA (monthly)" kind="currency" value={da} onChange={setDa} />
        <NumberField label="Years" kind="years" value={years} onChange={setYears} />
        <NumberField label="EPF interest rate" kind="percent" value={annualRate} onChange={setAnnualRate} />
      </div>
    </CalculatorLayout>
  );
}
