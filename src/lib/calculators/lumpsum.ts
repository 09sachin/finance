import { monthlyRateFromAnnual } from './format';
import { calculateSipFV, calculateStepUpSipFV, sipGrowthSeries, type YearPoint } from './sip';

/**
 * Mutual-fund style lumpsum: monthly compounding.
 * FV = P × (1 + r/12)^(years × 12)
 */
export function calculateLumpsumFV(
  principal: number,
  annualPercent: number,
  years: number
): number {
  if (principal <= 0 || years <= 0) return 0;
  const months = Math.round(years * 12);
  const r = monthlyRateFromAnnual(annualPercent);
  return principal * Math.pow(1 + r, months);
}

export interface YearlyLumpsumRow {
  year: number;
  startingValue: number;
  interest: number;
  endingValue: number;
}

export interface LumpsumResult {
  futureValue: number;
  totalInvestment: number;
  estimatedReturns: number;
  yearlyBreakdown: YearlyLumpsumRow[];
}

export function calculateLumpsum(
  principal: number,
  annualPercent: number,
  years: number
): LumpsumResult {
  const months = Math.round(years * 12);
  const r = monthlyRateFromAnnual(annualPercent);
  const futureValue = principal * Math.pow(1 + r, months);
  const yearlyBreakdown: YearlyLumpsumRow[] = [];
  const wholeYears = Math.floor(months / 12);

  for (let year = 1; year <= wholeYears; year++) {
    const startingValue = principal * Math.pow(1 + r, (year - 1) * 12);
    const endingValue = principal * Math.pow(1 + r, year * 12);
    yearlyBreakdown.push({
      year,
      startingValue,
      interest: endingValue - startingValue,
      endingValue,
    });
  }

  return {
    futureValue,
    totalInvestment: principal,
    estimatedReturns: futureValue - principal,
    yearlyBreakdown,
  };
}

export interface LumpsumSipResult {
  lumpsumValue: number;
  sipValue: number;
  totalValue: number;
  lumpsumInvestment: number;
  sipInvestment: number;
  totalInvestment: number;
  totalReturns: number;
  series: YearPoint[];
}

export function calculateLumpsumSip(input: {
  lumpsum: number;
  monthlySip: number;
  annualPercent: number;
  years: number;
  stepUpPercent?: number;
}): LumpsumSipResult {
  const { lumpsum, monthlySip, annualPercent, years } = input;
  const stepUp = input.stepUpPercent && input.stepUpPercent > 0 ? input.stepUpPercent : 0;
  const months = Math.round(years * 12);
  const lumpsumValue = calculateLumpsumFV(lumpsum, annualPercent, years);

  let sipValue = 0;
  let sipInvestment = 0;
  if (stepUp > 0 && monthlySip > 0) {
    const stepped = calculateStepUpSipFV(monthlySip, annualPercent, months, stepUp);
    sipValue = stepped.futureValue;
    sipInvestment = stepped.totalInvested;
  } else if (monthlySip > 0) {
    sipValue = calculateSipFV(monthlySip, annualPercent, months);
    sipInvestment = monthlySip * months;
  }

  const sipSeries = monthlySip > 0 ? sipGrowthSeries(monthlySip, annualPercent, years, stepUp) : [];
  const r = monthlyRateFromAnnual(annualPercent);
  const series: YearPoint[] = [];
  const wholeYears = Math.floor(months / 12);
  for (let year = 1; year <= wholeYears; year++) {
    const lump = lumpsum * Math.pow(1 + r, year * 12);
    const sipPoint = sipSeries[year - 1];
    series.push({
      year,
      invested: lumpsum + (sipPoint?.invested ?? 0),
      value: lump + (sipPoint?.value ?? 0),
    });
  }

  const totalValue = lumpsumValue + sipValue;
  const totalInvestment = lumpsum + sipInvestment;
  return {
    lumpsumValue,
    sipValue,
    totalValue,
    lumpsumInvestment: lumpsum,
    sipInvestment,
    totalInvestment,
    totalReturns: totalValue - totalInvestment,
    series,
  };
}
