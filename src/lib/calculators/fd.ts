export type FdFrequency = 'monthly' | 'quarterly' | 'yearly';

const PERIODS: Record<FdFrequency, number> = {
  monthly: 12,
  quarterly: 4,
  yearly: 1,
};

export interface FdYearRow {
  year: number;
  startingValue: number;
  interest: number;
  endingValue: number;
}

export interface FdResult {
  maturityValue: number;
  interestEarned: number;
  yearlyBreakdown: FdYearRow[];
  periodsPerYear: number;
}

/**
 * Indian bank FD: A = P × (1 + R/n)^(n×t). Default compounding is quarterly.
 */
export function calculateFd(
  principal: number,
  annualPercent: number,
  years: number,
  frequency: FdFrequency = 'quarterly'
): FdResult {
  const n = PERIODS[frequency];
  const r = annualPercent / 100;
  const maturityValue = principal * Math.pow(1 + r / n, n * years);
  const yearlyBreakdown: FdYearRow[] = [];
  const wholeYears = Math.floor(years);

  for (let year = 1; year <= wholeYears; year++) {
    const startingValue = principal * Math.pow(1 + r / n, n * (year - 1));
    const endingValue = principal * Math.pow(1 + r / n, n * year);
    yearlyBreakdown.push({
      year,
      startingValue,
      interest: endingValue - startingValue,
      endingValue,
    });
  }

  if (years > wholeYears) {
    const startingValue = principal * Math.pow(1 + r / n, n * wholeYears);
    yearlyBreakdown.push({
      year: years,
      startingValue,
      interest: maturityValue - startingValue,
      endingValue: maturityValue,
    });
  }

  return {
    maturityValue,
    interestEarned: maturityValue - principal,
    yearlyBreakdown,
    periodsPerYear: n,
  };
}
