import { addMonths } from 'date-fns';
import { calculateLumpsumFV } from './lumpsum';
import { calculateSipFV, calculateStepUpSipFV } from './sip';
import { monthlyRateFromAnnual } from './format';

export interface TargetLumpsum {
  amount: number;
  date: Date;
}

export interface TargetSipResult {
  reachable: boolean;
  monthlyAmount: number;
  months: number;
  years: number;
  sipInvested: number;
  lumpsumInvested: number;
  lumpsumFutureValue: number;
  totalInvestment: number;
  totalReturns: number;
  targetAmount: number;
  message?: string;
}

function lumpsumFvAt(lumpsums: TargetLumpsum[], targetDate: Date, annualPercent: number): {
  totalFV: number;
  totalInvestment: number;
} {
  let totalFV = 0;
  let totalInvestment = 0;
  for (const entry of lumpsums) {
    if (entry.amount <= 0 || entry.date > targetDate) continue;
    const years = (targetDate.getTime() - entry.date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (years < 0) continue;
    totalFV += calculateLumpsumFV(entry.amount, annualPercent, years);
    totalInvestment += entry.amount;
  }
  return { totalFV, totalInvestment };
}

export function requiredSipAmount(input: {
  target: number;
  years: number;
  annualPercent: number;
  lumpsums?: TargetLumpsum[];
  asOf?: Date;
  stepUpPercent?: number;
}): TargetSipResult {
  const asOf = input.asOf ?? new Date();
  const months = Math.round(input.years * 12);
  const targetDate = addMonths(asOf, months);
  const lumps = lumpsumFvAt(input.lumpsums ?? [], targetDate, input.annualPercent);
  const adjusted = input.target - lumps.totalFV;

  if (adjusted <= 0) {
    return {
      reachable: true,
      monthlyAmount: 0,
      months,
      years: input.years,
      sipInvested: 0,
      lumpsumInvested: lumps.totalInvestment,
      lumpsumFutureValue: lumps.totalFV,
      totalInvestment: lumps.totalInvestment,
      totalReturns: input.target - lumps.totalInvestment,
      targetAmount: input.target,
      message: 'Lumpsum investments alone are enough to reach this target.',
    };
  }

  const stepUp = input.stepUpPercent && input.stepUpPercent > 0 ? input.stepUpPercent : 0;
  let monthly: number;
  let sipInvested: number;

  if (stepUp > 0) {
    let lo = 0;
    let hi = adjusted;
    for (let i = 0; i < 48; i++) {
      const mid = (lo + hi) / 2;
      const fv = calculateStepUpSipFV(mid, input.annualPercent, months, stepUp).futureValue;
      if (fv >= adjusted) hi = mid;
      else lo = mid;
    }
    monthly = hi;
    sipInvested = calculateStepUpSipFV(monthly, input.annualPercent, months, stepUp).totalInvested;
  } else {
    const r = monthlyRateFromAnnual(input.annualPercent);
    if (r === 0) {
      monthly = adjusted / months;
    } else {
      const denom = ((Math.pow(1 + r, months) - 1) / r) * (1 + r);
      monthly = adjusted / denom;
    }
    sipInvested = monthly * months;
  }

  const totalInvestment = sipInvested + lumps.totalInvestment;
  return {
    reachable: true,
    monthlyAmount: monthly,
    months,
    years: input.years,
    sipInvested,
    lumpsumInvested: lumps.totalInvestment,
    lumpsumFutureValue: lumps.totalFV,
    totalInvestment,
    totalReturns: input.target - totalInvestment,
    targetAmount: input.target,
  };
}

export function monthsToTarget(input: {
  target: number;
  monthlyAmount: number;
  annualPercent: number;
  lumpsums?: TargetLumpsum[];
  asOf?: Date;
  stepUpPercent?: number;
  maxMonths?: number;
}): TargetSipResult {
  const asOf = input.asOf ?? new Date();
  const maxMonths = input.maxMonths ?? 50 * 12;
  const stepUp = input.stepUpPercent && input.stepUpPercent > 0 ? input.stepUpPercent : 0;
  const r = monthlyRateFromAnnual(input.annualPercent);

  if (stepUp === 0 && (!input.lumpsums || input.lumpsums.length === 0)) {
    if (r === 0) {
      const months = Math.ceil(input.target / input.monthlyAmount);
      return finishTimeResult(input, months, asOf, 0, months <= maxMonths);
    }
    const inner = 1 + (input.target * r) / (input.monthlyAmount * (1 + r));
    if (inner <= 1) {
      return finishTimeResult(input, 1, asOf, 0, true);
    }
    const months = Math.ceil(Math.log(inner) / Math.log(1 + r));
    return finishTimeResult(input, months, asOf, 0, months > 0 && months <= maxMonths);
  }

  for (let months = 1; months <= maxMonths; months++) {
    const targetDate = addMonths(asOf, months);
    const lumps = lumpsumFvAt(input.lumpsums ?? [], targetDate, input.annualPercent);
    const need = input.target - lumps.totalFV;
    if (need <= 0) return finishTimeResult(input, months, asOf, lumps.totalFV, true, lumps.totalInvestment);
    const sipFV =
      stepUp > 0
        ? calculateStepUpSipFV(input.monthlyAmount, input.annualPercent, months, stepUp).futureValue
        : calculateSipFV(input.monthlyAmount, input.annualPercent, months);
    if (sipFV >= need) return finishTimeResult(input, months, asOf, lumps.totalFV, true, lumps.totalInvestment);
  }

  return finishTimeResult(input, maxMonths, asOf, 0, false);
}

function finishTimeResult(
  input: {
    target: number;
    monthlyAmount: number;
    annualPercent: number;
    lumpsums?: TargetLumpsum[];
    asOf?: Date;
    stepUpPercent?: number;
  },
  months: number,
  asOf: Date,
  lumpsumFv: number,
  reachable: boolean,
  lumpsumInvested = 0
): TargetSipResult {
  const stepUp = input.stepUpPercent && input.stepUpPercent > 0 ? input.stepUpPercent : 0;
  const sipInvested =
    stepUp > 0
      ? calculateStepUpSipFV(input.monthlyAmount, input.annualPercent, months, stepUp).totalInvested
      : input.monthlyAmount * months;
  const lumps =
    lumpsumInvested > 0 || lumpsumFv > 0
      ? { totalFV: lumpsumFv, totalInvestment: lumpsumInvested }
      : lumpsumFvAt(input.lumpsums ?? [], addMonths(asOf, months), input.annualPercent);

  if (!reachable) {
    return {
      reachable: false,
      monthlyAmount: input.monthlyAmount,
      months,
      years: months / 12,
      sipInvested,
      lumpsumInvested: lumps.totalInvestment,
      lumpsumFutureValue: lumps.totalFV,
      totalInvestment: sipInvested + lumps.totalInvestment,
      totalReturns: 0,
      targetAmount: input.target,
      message: `This SIP does not reach the target within ${Math.floor(months / 12)} years. Increase the SIP amount, add a lumpsum, or raise the expected return.`,
    };
  }

  const totalInvestment = sipInvested + lumps.totalInvestment;
  return {
    reachable: true,
    monthlyAmount: input.monthlyAmount,
    months,
    years: Math.round((months / 12) * 100) / 100,
    sipInvested,
    lumpsumInvested: lumps.totalInvestment,
    lumpsumFutureValue: lumps.totalFV,
    totalInvestment,
    totalReturns: input.target - totalInvestment,
    targetAmount: input.target,
  };
}
