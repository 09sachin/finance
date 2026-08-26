import { addMonths, startOfMonth } from 'date-fns';
import { applyLtcg, inflateAmount, LTCG_EXEMPTION } from './retirement';

export interface FireInvestment {
  name: string;
  amount: number;
  annualPercent: number;
}

export interface FireSip {
  name: string;
  monthlyAmount: number;
  annualPercent: number;
  stepUpPercent: number;
}

export interface FireOneOff {
  amountToday: number;
  date: Date;
  description: string;
}

export interface FireInput {
  currentAge: number;
  investments: FireInvestment[];
  sips: FireSip[];
  monthlyExpenseToday: number;
  expenseInflationPercent: number;
  oneOffs: FireOneOff[];
  postFireAnnualPercent: number;
  ltcgEnabled: boolean;
  ltcgRatePercent: number;
  ltcgExemption?: number;
  maxFireAge?: number;
  sustainToAge?: number;
  asOf?: Date;
}

export interface FireYearRow {
  year: number;
  age: number;
  startingCorpus: number;
  invested: number;
  growth: number;
  expenses: number;
  oneOffs: number;
  ltcgTax: number;
  remainingCorpus: number;
}

export interface FireResult {
  fireAge: number | null;
  yearsToFire: number | null;
  corpusAtFire: number;
  monthlyExpenseAtFire: number;
  totalInvestment: number;
  totalLtcgTax: number;
  depletionAge: number | null;
  yearlyBreakdown: FireYearRow[];
  chartSeries: { year: number; age: number; corpus: number; invested: number }[];
}

function inMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function blendedPreFireRate(input: FireInput): number {
  const parts = [
    ...input.investments.map((i) => ({ amount: i.amount, rate: i.annualPercent / 100 })),
    ...input.sips.map((s) => ({ amount: s.monthlyAmount * 12, rate: s.annualPercent / 100 })),
  ].filter((p) => p.amount > 0);
  const total = parts.reduce((s, p) => s + p.amount, 0);
  if (total === 0) return 0.1;
  return parts.reduce((s, p) => s + p.amount * p.rate, 0) / total;
}

function simulatePath(input: FireInput, fireAge: number, sustainToAge: number): {
  sustained: boolean;
  corpusAtFire: number;
  monthlyExpenseAtFire: number;
  totalInvestment: number;
  totalLtcgTax: number;
  depletionAge: number | null;
  yearlyBreakdown: FireYearRow[];
  chartSeries: { year: number; age: number; corpus: number; invested: number }[];
} {
  const asOf = startOfMonth(input.asOf ?? new Date());
  const months = Math.round((sustainToAge - input.currentAge) * 12);
  const preRate = blendedPreFireRate(input);
  const postRate = input.postFireAnnualPercent / 100;
  const inflation = input.expenseInflationPercent;
  const exemption = input.ltcgExemption ?? LTCG_EXEMPTION;

  let corpus = input.investments.reduce((s, i) => s + Math.max(0, i.amount), 0);
  let costBasis = corpus;
  let fyGains = 0;
  let fyYear = asOf.getFullYear();
  let totalInvestment = corpus;
  let totalLtcgTax = 0;
  let corpusAtFire = 0;
  let capturedFire = false;
  let depletionAge: number | null = null;

  const yearlyBreakdown: FireYearRow[] = [];
  let yearStart = corpus;
  let yearInvested = 0;
  let yearGrowth = 0;
  let yearExpense = 0;
  let yearOneOff = 0;
  let yearTax = 0;
  let yearAge = Math.floor(input.currentAge);

  for (let m = 0; m < months; m++) {
    const date = addMonths(asOf, m);
    const age = input.currentAge + m / 12;
    const yearsElapsed = m / 12;

    if (date.getFullYear() !== fyYear) {
      yearlyBreakdown.push({
        year: fyYear,
        age: yearAge,
        startingCorpus: yearStart,
        invested: yearInvested,
        growth: yearGrowth,
        expenses: yearExpense,
        oneOffs: yearOneOff,
        ltcgTax: yearTax,
        remainingCorpus: corpus,
      });
      fyGains = 0;
      fyYear = date.getFullYear();
      yearStart = corpus;
      yearInvested = 0;
      yearGrowth = 0;
      yearExpense = 0;
      yearOneOff = 0;
      yearTax = 0;
      yearAge = Math.floor(age);
    }

    let investedThisMonth = 0;
    if (age < fireAge) {
      for (const sip of input.sips) {
        if (sip.monthlyAmount <= 0) continue;
        const stepYears = Math.floor(Math.max(0, m) / 12);
        const contrib = sip.monthlyAmount * Math.pow(1 + sip.stepUpPercent / 100, stepYears);
        corpus += contrib;
        costBasis += contrib;
        investedThisMonth += contrib;
      }
    }
    totalInvestment += investedThisMonth;
    yearInvested += investedThisMonth;

    const rate = age < fireAge ? preRate : postRate;
    const growth = corpus * (rate / 12);
    corpus += growth;
    yearGrowth += growth;

    if (!capturedFire && age >= fireAge - 1 / 24) {
      corpusAtFire = corpus;
      capturedFire = true;
    }

    let expense = 0;
    if (age >= fireAge) {
      expense = inflateAmount(input.monthlyExpenseToday, inflation, yearsElapsed);
    }
    let oneOff = 0;
    for (const item of input.oneOffs) {
      if (item.amountToday > 0 && inMonth(item.date, date)) {
        const yearsToEvent = Math.max(0, (item.date.getTime() - asOf.getTime()) / (365.25 * 24 * 3600 * 1000));
        oneOff += inflateAmount(item.amountToday, inflation, yearsToEvent);
      }
    }

    const taxed = applyLtcg({
      enabled: input.ltcgEnabled,
      ratePercent: input.ltcgRatePercent,
      exemption,
      withdrawal: expense + oneOff,
      corpus,
      costBasis,
      fyGains,
    });
    corpus = taxed.corpus;
    costBasis = taxed.costBasis;
    fyGains = taxed.fyGains;
    totalLtcgTax += taxed.tax;
    yearExpense += expense;
    yearOneOff += oneOff;
    yearTax += taxed.tax;

    if (corpus <= 0 && age >= fireAge) {
      depletionAge = Math.floor(age);
      yearlyBreakdown.push({
        year: fyYear,
        age: yearAge,
        startingCorpus: yearStart,
        invested: yearInvested,
        growth: yearGrowth,
        expenses: yearExpense,
        oneOffs: yearOneOff,
        ltcgTax: yearTax,
        remainingCorpus: 0,
      });
      break;
    }
  }

  if (depletionAge === null && yearlyBreakdown[yearlyBreakdown.length - 1]?.year !== fyYear) {
    yearlyBreakdown.push({
      year: fyYear,
      age: yearAge,
      startingCorpus: yearStart,
      invested: yearInvested,
      growth: yearGrowth,
      expenses: yearExpense,
      oneOffs: yearOneOff,
      ltcgTax: yearTax,
      remainingCorpus: corpus,
    });
  }

  const last = yearlyBreakdown[yearlyBreakdown.length - 1];
  const sustained = depletionAge === null && (last?.remainingCorpus ?? 0) > 0;
  let invested = input.investments.reduce((s, i) => s + Math.max(0, i.amount), 0);
  const chartSeries = yearlyBreakdown.map((row) => {
    invested += row.invested;
    return { year: row.year, age: row.age, corpus: row.remainingCorpus, invested };
  });

  return {
    sustained,
    corpusAtFire: capturedFire ? corpusAtFire : corpus,
    monthlyExpenseAtFire: inflateAmount(input.monthlyExpenseToday, inflation, Math.max(0, fireAge - input.currentAge)),
    totalInvestment,
    totalLtcgTax,
    depletionAge,
    yearlyBreakdown,
    chartSeries,
  };
}

export function calculateFire(input: FireInput): FireResult {
  const maxFireAge = input.maxFireAge ?? 70;
  const sustainToAge = input.sustainToAge ?? 90;
  const start = Math.floor(input.currentAge);

  let last = simulatePath(input, maxFireAge, sustainToAge);
  for (let fireAge = start; fireAge <= maxFireAge; fireAge++) {
    const path = simulatePath(input, fireAge, sustainToAge);
    last = path;
    if (path.sustained) {
      return {
        fireAge,
        yearsToFire: fireAge - input.currentAge,
        corpusAtFire: path.corpusAtFire,
        monthlyExpenseAtFire: path.monthlyExpenseAtFire,
        totalInvestment: path.totalInvestment,
        totalLtcgTax: path.totalLtcgTax,
        depletionAge: path.depletionAge,
        yearlyBreakdown: path.yearlyBreakdown,
        chartSeries: path.chartSeries,
      };
    }
  }

  return {
    fireAge: null,
    yearsToFire: null,
    corpusAtFire: last.corpusAtFire,
    monthlyExpenseAtFire: last.monthlyExpenseAtFire,
    totalInvestment: last.totalInvestment,
    totalLtcgTax: last.totalLtcgTax,
    depletionAge: last.depletionAge,
    yearlyBreakdown: last.yearlyBreakdown,
    chartSeries: last.chartSeries,
  };
}
