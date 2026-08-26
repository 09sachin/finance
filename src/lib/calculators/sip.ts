import { differenceInCalendarMonths } from 'date-fns';
import { monthlyRateFromAnnual } from './format';

export function monthsBetween(start: Date, end: Date): number {
  return Math.max(0, differenceInCalendarMonths(end, start));
}

/**
 * SIP future value using monthly compounding and annuity-due
 * (contribution at the start of each month), matching typical Indian MF SIP calculators.
 * FV = P × [((1+r)^n − 1) / r] × (1+r)
 */
export function calculateSipFV(
  monthlyAmount: number,
  annualPercent: number,
  months: number
): number {
  if (months <= 0 || monthlyAmount <= 0) return 0;
  const r = monthlyRateFromAnnual(annualPercent);
  if (r === 0) return monthlyAmount * months;
  return monthlyAmount * ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
}

/**
 * Step-up SIP: amount increases by `stepUpPercent` after every 12 contributions.
 */
export function calculateStepUpSipFV(
  monthlyAmount: number,
  annualPercent: number,
  months: number,
  stepUpPercent: number
): { futureValue: number; totalInvested: number } {
  if (months <= 0 || monthlyAmount <= 0) return { futureValue: 0, totalInvested: 0 };
  const r = monthlyRateFromAnnual(annualPercent);
  const stepUp = stepUpPercent / 100;
  let currentAmount = monthlyAmount;
  let sipFV = 0;
  let invested = 0;
  let monthsInYear = 0;

  for (let month = 1; month <= months; month++) {
    monthsInYear += 1;
    sipFV += currentAmount * Math.pow(1 + r, months - month + 1);
    invested += currentAmount;
    if (monthsInYear === 12 && month < months) {
      currentAmount *= 1 + stepUp;
      monthsInYear = 0;
    }
  }

  return { futureValue: sipFV, totalInvested: invested };
}

export function growToMaturity(value: number, annualPercent: number, months: number): number {
  if (months <= 0) return value;
  const r = monthlyRateFromAnnual(annualPercent);
  return value * Math.pow(1 + r, months);
}

export interface SipPlan {
  monthlyAmount: number;
  startDate: Date;
  endDate: Date;
  annualPercent: number;
  stepUpPercent?: number;
}

export interface SipPlanResult {
  months: number;
  growthMonths: number;
  invested: number;
  futureValue: number;
  returns: number;
}

export function evaluateSipPlan(plan: SipPlan, maturity: Date): SipPlanResult | null {
  const sipMonths = monthsBetween(plan.startDate, plan.endDate);
  const growthMonths = monthsBetween(plan.endDate, maturity);
  if (sipMonths <= 0 || plan.monthlyAmount <= 0 || plan.annualPercent <= 0) return null;

  const stepUp = plan.stepUpPercent && plan.stepUpPercent > 0 ? plan.stepUpPercent : 0;
  let invested: number;
  let sipFV: number;

  if (stepUp > 0) {
    const stepped = calculateStepUpSipFV(plan.monthlyAmount, plan.annualPercent, sipMonths, stepUp);
    invested = stepped.totalInvested;
    sipFV = stepped.futureValue;
  } else {
    sipFV = calculateSipFV(plan.monthlyAmount, plan.annualPercent, sipMonths);
    invested = plan.monthlyAmount * sipMonths;
  }

  const futureValue = growToMaturity(sipFV, plan.annualPercent, growthMonths);
  return {
    months: sipMonths,
    growthMonths,
    invested,
    futureValue,
    returns: futureValue - invested,
  };
}

export interface YearPoint {
  year: number;
  invested: number;
  value: number;
}

export function sipGrowthSeries(
  monthlyAmount: number,
  annualPercent: number,
  years: number,
  stepUpPercent = 0
): YearPoint[] {
  const months = Math.round(years * 12);
  const r = monthlyRateFromAnnual(annualPercent);
  const stepUp = stepUpPercent / 100;
  let currentAmount = monthlyAmount;
  let value = 0;
  let invested = 0;
  const series: YearPoint[] = [];

  for (let month = 1; month <= months; month++) {
    value = value * (1 + r) + currentAmount;
    invested += currentAmount;
    if (month % 12 === 0) {
      series.push({ year: month / 12, invested, value });
      if (stepUp > 0 && month < months) currentAmount *= 1 + stepUp;
    }
  }

  return series;
}
