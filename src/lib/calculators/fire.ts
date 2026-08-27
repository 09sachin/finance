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
  preserveCorpusAtFire?: boolean;
  extraSipStepUpPercent?: number;
  asOf?: Date;
  lifestyleUpliftPercent?: number;
  checkpointAges?: number[];
}

export type FireKind = 'lean' | 'comfortable' | 'fat';

export const DEFAULT_FIRE_UPLIFTS: Record<FireKind, number> = {
  lean: 0,
  comfortable: 20,
  fat: 50,
};

export function expenseWithLifestyle(monthlyExpenseToday: number, lifestyleUpliftPercent: number): number {
  return monthlyExpenseToday * (1 + lifestyleUpliftPercent / 100);
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
  checkpointCorpus: { age: number; corpus: number | null }[];
}

export function corpusAtCheckpointAges(
  yearlyBreakdown: FireYearRow[],
  checkpointAges: number[],
  currentAge: number,
  depletionAge: number | null
): { age: number; corpus: number | null }[] {
  const unique = [...new Set(checkpointAges.filter((a) => Number.isFinite(a) && a > 0))].sort((a, b) => a - b);
  return unique.map((target) => {
    if (target < Math.floor(currentAge)) return { age: target, corpus: null };
    if (depletionAge !== null && depletionAge < target) return { age: target, corpus: 0 };
    const row = yearlyBreakdown.filter((r) => r.age <= target).at(-1);
    if (!row) return { age: target, corpus: null };
    return { age: target, corpus: Math.max(0, row.remainingCorpus) };
  });
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
  const checkpointAges = input.checkpointAges ?? [];
  const horizonAge = Math.max(sustainToAge, fireAge, ...checkpointAges);
  const months = Math.round((horizonAge - input.currentAge) * 12);
  const preRate = blendedPreFireRate(input);
  const postRate = input.postFireAnnualPercent / 100;
  const inflation = input.expenseInflationPercent;
  const baseExpense = expenseWithLifestyle(input.monthlyExpenseToday, input.lifestyleUpliftPercent ?? 0);
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
  let remainingAtSustain: number | null = null;

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
      expense = inflateAmount(baseExpense, inflation, yearsElapsed);
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

    if (remainingAtSustain === null && age >= sustainToAge) {
      remainingAtSustain = corpus;
    }

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
  const leftover = remainingAtSustain ?? last?.remainingCorpus ?? 0;
  const fireCorpus = capturedFire ? corpusAtFire : corpus;
  const lasted = leftover > 0 && (depletionAge === null || depletionAge >= sustainToAge);
  const preserved = leftover + 1 >= fireCorpus;
  const sustained = input.preserveCorpusAtFire ? lasted && preserved : lasted;
  let invested = input.investments.reduce((s, i) => s + Math.max(0, i.amount), 0);
  const chartSeries = yearlyBreakdown.map((row) => {
    invested += row.invested;
    return { year: row.year, age: row.age, corpus: row.remainingCorpus, invested };
  });

  return {
    sustained,
    corpusAtFire: fireCorpus,
    monthlyExpenseAtFire: inflateAmount(baseExpense, inflation, Math.max(0, fireAge - input.currentAge)),
    totalInvestment,
    totalLtcgTax,
    depletionAge,
    yearlyBreakdown,
    chartSeries,
  };
}

function attachCheckpoints(
  input: FireInput,
  path: {
    yearlyBreakdown: FireYearRow[];
    depletionAge: number | null;
    corpusAtFire: number;
    monthlyExpenseAtFire: number;
    totalInvestment: number;
    totalLtcgTax: number;
    chartSeries: FireResult['chartSeries'];
  },
  fireAge: number | null,
  yearsToFire: number | null
): FireResult {
  const checkpointAges = input.checkpointAges?.length ? input.checkpointAges : [60, 80];
  return {
    fireAge,
    yearsToFire,
    corpusAtFire: path.corpusAtFire,
    monthlyExpenseAtFire: path.monthlyExpenseAtFire,
    totalInvestment: path.totalInvestment,
    totalLtcgTax: path.totalLtcgTax,
    depletionAge: path.depletionAge,
    yearlyBreakdown: path.yearlyBreakdown,
    chartSeries: path.chartSeries,
    checkpointCorpus: corpusAtCheckpointAges(
      path.yearlyBreakdown,
      checkpointAges,
      input.currentAge,
      path.depletionAge
    ),
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
      return attachCheckpoints(input, path, fireAge, fireAge - input.currentAge);
    }
  }

  return attachCheckpoints(input, last, null, null);
}

export interface FireScenarioResult extends FireResult {
  kind: FireKind;
  lifestyleUpliftPercent: number;
  monthlyExpenseToday: number;
}

export function calculateFireScenarios(
  input: Omit<FireInput, 'lifestyleUpliftPercent'>,
  uplifts: Record<FireKind, number>
): Record<FireKind, FireScenarioResult> {
  const kinds: FireKind[] = ['lean', 'comfortable', 'fat'];
  const out = {} as Record<FireKind, FireScenarioResult>;
  for (const kind of kinds) {
    const lifestyleUpliftPercent = uplifts[kind];
    const result = calculateFire({ ...input, lifestyleUpliftPercent });
    out[kind] = {
      ...result,
      kind,
      lifestyleUpliftPercent,
      monthlyExpenseToday: expenseWithLifestyle(input.monthlyExpenseToday, lifestyleUpliftPercent),
    };
  }
  return out;
}

export interface ExtraSipResult {
  extraMonthlySip: number;
  reachable: boolean;
  alreadyOnTrack: boolean;
  extraSipAnnualPercent: number;
  extraSipStepUpPercent: number;
}

function extraSipRatePercent(input: FireInput): number {
  const sipParts = input.sips.filter((s) => s.monthlyAmount > 0);
  if (sipParts.length > 0) {
    const total = sipParts.reduce((s, sipp) => s + sipp.monthlyAmount, 0);
    return sipParts.reduce((s, sipp) => s + sipp.monthlyAmount * sipp.annualPercent, 0) / total;
  }
  return blendedPreFireRate(input) * 100;
}

export function requiredExtraSip(input: FireInput, fireAge: number): ExtraSipResult {
  const targetAge = Math.max(Math.floor(input.currentAge), fireAge);
  const extraRate = extraSipRatePercent(input);
  const sustainToAge = input.sustainToAge ?? 90;
  const maxFireAge = Math.max(input.maxFireAge ?? 70, targetAge);
  const extraSipStepUpPercent = input.extraSipStepUpPercent ?? 0;

  const tryExtra = (extra: number) => {
    const sips =
      extra > 0
        ? [
            ...input.sips,
            {
              name: 'Extra SIP',
              monthlyAmount: extra,
              annualPercent: extraRate,
              stepUpPercent: extraSipStepUpPercent,
            },
          ]
        : input.sips;
    return simulatePath({ ...input, sips, maxFireAge }, targetAge, sustainToAge).sustained;
  };

  if (tryExtra(0)) {
    return {
      extraMonthlySip: 0,
      reachable: true,
      alreadyOnTrack: true,
      extraSipAnnualPercent: extraRate,
      extraSipStepUpPercent,
    };
  }

  let hi = 50_000;
  while (hi < 5_000_000 && !tryExtra(hi)) hi *= 2;
  if (!tryExtra(hi)) {
    return {
      extraMonthlySip: 0,
      reachable: false,
      alreadyOnTrack: false,
      extraSipAnnualPercent: extraRate,
      extraSipStepUpPercent,
    };
  }

  let lo = 0;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (tryExtra(mid)) hi = mid;
    else lo = mid;
  }

  return {
    extraMonthlySip: Math.ceil(hi),
    reachable: true,
    alreadyOnTrack: false,
    extraSipAnnualPercent: extraRate,
    extraSipStepUpPercent,
  };
}

export function calculateFireSipPlan(
  input: Omit<FireInput, 'lifestyleUpliftPercent'>,
  uplifts: Record<FireKind, number>,
  targetAges: Record<FireKind, number>
): Record<FireKind, ExtraSipResult & { targetAge: number; monthlyExpenseToday: number; checkpointCorpus: { age: number; corpus: number | null }[] }> {
  const kinds: FireKind[] = ['lean', 'comfortable', 'fat'];
  const out = {} as Record<
    FireKind,
    ExtraSipResult & { targetAge: number; monthlyExpenseToday: number; checkpointCorpus: { age: number; corpus: number | null }[] }
  >;
  const checkpointAges = input.checkpointAges?.length ? input.checkpointAges : [60, 80];
  const sustainToAge = input.sustainToAge ?? 90;
  for (const kind of kinds) {
    const lifestyleUpliftPercent = uplifts[kind];
    const withLifestyle = { ...input, lifestyleUpliftPercent };
    const sip = requiredExtraSip(withLifestyle, targetAges[kind]);
    const targetAge = Math.max(Math.floor(input.currentAge), targetAges[kind]);
    const extraRate = extraSipRatePercent(withLifestyle);
    const sips =
      sip.reachable && sip.extraMonthlySip > 0
        ? [
            ...input.sips,
            {
              name: 'Extra SIP',
              monthlyAmount: sip.extraMonthlySip,
              annualPercent: extraRate,
              stepUpPercent: sip.extraSipStepUpPercent,
            },
          ]
        : input.sips;
    const path = simulatePath({ ...withLifestyle, sips, maxFireAge: Math.max(input.maxFireAge ?? 70, targetAge) }, targetAge, sustainToAge);
    out[kind] = {
      ...sip,
      targetAge,
      monthlyExpenseToday: expenseWithLifestyle(input.monthlyExpenseToday, lifestyleUpliftPercent),
      checkpointCorpus: corpusAtCheckpointAges(path.yearlyBreakdown, checkpointAges, input.currentAge, path.depletionAge),
    };
  }
  return out;
}
