import { monthlyRateFromAnnual } from './format';

export interface SwpYearRow {
  year: number;
  startingCorpus: number;
  monthlyWithdrawal: number;
  totalWithdrawals: number;
  interestEarned: number;
  endingCorpus: number;
}

export interface SwpResult {
  isSustainable: boolean;
  depletedAtMonth: number | null;
  durationLabel: string;
  yearlyBreakdown: SwpYearRow[];
  chartSeries: { year: number; corpus: number }[];
  finalCorpus: number;
}

const DEFAULT_MAX_MONTHS = 50 * 12;

/**
 * Month-by-month SWP: interest is applied first, then the withdrawal.
 * Step-up increases the withdrawal after every 12 withdrawals.
 */
export function simulateSwp(input: {
  corpus: number;
  monthlyWithdrawal: number;
  annualPercent: number;
  stepUpPercent?: number;
  maxMonths?: number;
}): SwpResult {
  const { corpus, monthlyWithdrawal, annualPercent } = input;
  const stepUp = input.stepUpPercent && input.stepUpPercent > 0 ? input.stepUpPercent / 100 : 0;
  const maxMonths = input.maxMonths ?? DEFAULT_MAX_MONTHS;
  const r = monthlyRateFromAnnual(annualPercent);

  const yearlyBreakdown: SwpYearRow[] = [];
  const chartSeries: { year: number; corpus: number }[] = [];

  let current = corpus;
  let withdrawal = monthlyWithdrawal;
  let yearStart = corpus;
  let yearInterest = 0;
  let yearWithdrawals = 0;
  let yearStartWithdrawal = withdrawal;
  let depletedAtMonth: number | null = null;

  for (let month = 1; month <= maxMonths; month++) {
    const interest = current * r;
    yearInterest += interest;
    current += interest;
    const taken = Math.min(withdrawal, Math.max(0, current));
    current -= taken;
    yearWithdrawals += taken;

    if (current <= 1e-6) {
      current = 0;
      depletedAtMonth = month;
    }

    if (month % 12 === 0) {
      const year = month / 12;
      yearlyBreakdown.push({
        year,
        startingCorpus: yearStart,
        monthlyWithdrawal: yearStartWithdrawal,
        totalWithdrawals: yearWithdrawals,
        interestEarned: yearInterest,
        endingCorpus: current,
      });
      chartSeries.push({ year, corpus: current });
      yearStart = current;
      yearInterest = 0;
      yearWithdrawals = 0;
      if (stepUp > 0) withdrawal *= 1 + stepUp;
      yearStartWithdrawal = withdrawal;
    }

    if (depletedAtMonth !== null) {
      if (month % 12 !== 0) {
        const year = Math.ceil(month / 12);
        yearlyBreakdown.push({
          year,
          startingCorpus: yearStart,
          monthlyWithdrawal: yearStartWithdrawal,
          totalWithdrawals: yearWithdrawals,
          interestEarned: yearInterest,
          endingCorpus: 0,
        });
        chartSeries.push({ year, corpus: 0 });
      }
      break;
    }
  }

  const monthlyInterestOnStart = corpus * r;
  const isSustainable =
    depletedAtMonth === null && stepUp === 0 && monthlyWithdrawal <= monthlyInterestOnStart + 1e-6;

  let durationLabel: string;
  if (isSustainable) {
    durationLabel = 'Corpus is projected to last indefinitely (withdrawal ≤ monthly interest)';
  } else if (depletedAtMonth === null) {
    durationLabel = `Corpus is projected to last more than ${Math.floor(maxMonths / 12)} years`;
  } else {
    const years = Math.floor((depletedAtMonth - 1) / 12);
    const months = (depletedAtMonth - 1) % 12;
    if (years === 0) {
      durationLabel = `Corpus lasts about ${depletedAtMonth} month${depletedAtMonth === 1 ? '' : 's'}`;
    } else if (months === 0) {
      durationLabel = `Corpus lasts about ${years} year${years === 1 ? '' : 's'}`;
    } else {
      durationLabel = `Corpus lasts about ${years} year${years === 1 ? '' : 's'} and ${months} month${months === 1 ? '' : 's'}`;
    }
  }

  return {
    isSustainable,
    depletedAtMonth,
    durationLabel,
    yearlyBreakdown,
    chartSeries,
    finalCorpus: current,
  };
}
