import { addMonths, differenceInCalendarMonths, startOfMonth } from 'date-fns';

export const LTCG_RATE = 0.125;
export const LTCG_EXEMPTION = 125_000;

export interface RetirementLumpsum {
  amount: number;
  date: Date;
  annualPercent: number;
}

export interface RetirementSip {
  monthlyAmount: number;
  startDate: Date;
  endDate: Date;
  annualPercent: number;
  stepUpPercent?: number;
}

export interface RetirementWithdrawal {
  amount: number;
  date: Date;
  description: string;
}

export interface RetirementGoal {
  id: string;
  description: string;
  monthlyAmount: number;
  startAge: number;
  durationYears: number | 'lifetime';
}

export interface RetirementInput {
  currentAge: number;
  retirementAge: number;
  lumpsums: RetirementLumpsum[];
  sips: RetirementSip[];
  swpAnnualPercent: number;
  withdrawals: RetirementWithdrawal[];
  goals: RetirementGoal[];
  asOf?: Date;
  maxAge?: number;
  inflationPercent?: number;
  ltcgEnabled?: boolean;
  ltcgRatePercent?: number;
  ltcgExemption?: number;
}

export interface RetirementYearRow {
  year: number;
  age: number;
  startingCorpus: number;
  yearlyInvestment: number;
  yearlyGrowth: number;
  monthlyWithdrawals: number;
  oneTimeWithdrawals: number;
  ltcgTax: number;
  remainingCorpus: number;
}

export interface GoalAnalysis {
  id: string;
  description: string;
  monthlyAmount: number;
  startAge: number;
  endAge: number | 'Lifetime';
  isAffordable: boolean;
  status: string;
}

export interface RetirementResult {
  corpusAtRetirement: number;
  totalInvestment: number;
  totalLtcgTax: number;
  monthlyNeedsAtRetirement: number;
  monthlyPassiveIncome: number;
  yearlyBreakdown: RetirementYearRow[];
  chartSeries: { year: number; age: number; corpus: number; invested: number }[];
  goalAnalysis: GoalAnalysis[];
  depletionAge: number | null;
  sustainableTo80: boolean;
  sustainableForLifetime: boolean;
}

export function inflateAmount(amount: number, inflationPercent: number, years: number): number {
  if (years <= 0 || inflationPercent === 0) return amount;
  return amount * Math.pow(1 + inflationPercent / 100, years);
}

export function applyLtcg(params: {
  enabled: boolean;
  ratePercent: number;
  exemption: number;
  withdrawal: number;
  corpus: number;
  costBasis: number;
  fyGains: number;
}): { tax: number; fyGains: number; costBasis: number; corpus: number } {
  const { enabled, ratePercent, exemption, withdrawal, corpus, costBasis, fyGains } = params;
  if (withdrawal <= 0 || corpus <= 0) {
    return { tax: 0, fyGains, costBasis, corpus: Math.max(0, corpus - withdrawal) };
  }
  const taken = Math.min(withdrawal, corpus);
  if (!enabled) {
    const gainRatio = corpus > 0 ? Math.max(0, corpus - costBasis) / corpus : 0;
    const principalTaken = taken * (1 - gainRatio);
    return {
      tax: 0,
      fyGains,
      costBasis: Math.max(0, costBasis - principalTaken),
      corpus: Math.max(0, corpus - taken),
    };
  }
  const totalGains = Math.max(0, corpus - costBasis);
  const gainRatio = corpus > 0 ? totalGains / corpus : 0;
  const realized = taken * gainRatio;
  const remainingExemption = Math.max(0, exemption - fyGains);
  const taxable = Math.max(0, realized - remainingExemption);
  const tax = taxable * (ratePercent / 100);
  const principalTaken = taken * (1 - gainRatio);
  return {
    tax,
    fyGains: fyGains + realized,
    costBasis: Math.max(0, costBasis - principalTaken),
    corpus: Math.max(0, corpus - taken - tax),
  };
}

function inMonth(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function goalActive(goal: RetirementGoal, age: number): boolean {
  if (age + 1e-9 < goal.startAge) return false;
  if (goal.durationYears === 'lifetime') return true;
  return age < goal.startAge + goal.durationYears;
}

function weightedPreRetirementRate(input: RetirementInput): number {
  const parts = [
    ...input.lumpsums.map((l) => ({ amount: l.amount, rate: l.annualPercent / 100 })),
    ...input.sips.map((s) => ({ amount: s.monthlyAmount * 12, rate: s.annualPercent / 100 })),
  ].filter((p) => p.amount > 0);
  const total = parts.reduce((s, p) => s + p.amount, 0);
  if (total === 0) return 0.12;
  return parts.reduce((s, p) => s + p.amount * p.rate, 0) / total;
}

interface MonthSnap {
  date: Date;
  age: number;
  startingCorpus: number;
  investment: number;
  growth: number;
  monthlyWithdrawal: number;
  oneTimeWithdrawal: number;
  ltcgTax: number;
  endingCorpus: number;
  costBasis: number;
}

function simulateMonths(input: RetirementInput): MonthSnap[] {
  const asOf = startOfMonth(input.asOf ?? new Date());
  const maxAge = input.maxAge ?? 100;
  const startAge = input.currentAge;
  const months = Math.round((maxAge - startAge) * 12);
  const preRate = weightedPreRetirementRate(input);
  const swpRate = input.swpAnnualPercent / 100;
  const inflation = input.inflationPercent ?? 0;
  const ltcgEnabled = input.ltcgEnabled ?? true;
  const ltcgRate = input.ltcgRatePercent ?? LTCG_RATE * 100;
  const exemption = input.ltcgExemption ?? LTCG_EXEMPTION;

  let corpus = 0;
  let costBasis = 0;
  let fyGains = 0;
  let fyYear = asOf.getFullYear();
  const snaps: MonthSnap[] = [];

  for (let m = 0; m < months; m++) {
    const date = addMonths(asOf, m);
    const age = startAge + m / 12;
    const startingCorpus = corpus;

    if (date.getFullYear() !== fyYear) {
      fyGains = 0;
      fyYear = date.getFullYear();
    }

    let investment = 0;
    for (const lump of input.lumpsums) {
      if (lump.amount > 0 && inMonth(lump.date, date)) {
        corpus += lump.amount;
        costBasis += lump.amount;
        investment += lump.amount;
      }
    }
    for (const sip of input.sips) {
      if (sip.monthlyAmount <= 0) continue;
      if (date >= sip.startDate && date < sip.endDate) {
        const monthsActive = Math.max(0, differenceInCalendarMonths(date, sip.startDate));
        const stepYears = Math.floor(monthsActive / 12);
        const contrib = sip.monthlyAmount * Math.pow(1 + (sip.stepUpPercent ?? 0) / 100, stepYears);
        corpus += contrib;
        costBasis += contrib;
        investment += contrib;
      }
    }

    const annualRate = age < input.retirementAge ? preRate : swpRate;
    const growth = corpus * (annualRate / 12);
    corpus += growth;

    const yearsElapsed = Math.max(0, age - input.currentAge);
    let monthlyWithdrawal = 0;
    for (const goal of input.goals) {
      if (goal.monthlyAmount > 0 && goalActive(goal, age)) {
        monthlyWithdrawal += inflateAmount(goal.monthlyAmount, inflation, yearsElapsed);
      }
    }
    let oneTime = 0;
    for (const w of input.withdrawals) {
      if (w.amount > 0 && inMonth(w.date, date)) {
        const yearsToEvent = Math.max(0, (date.getTime() - asOf.getTime()) / (365.25 * 24 * 3600 * 1000));
        oneTime += inflateAmount(w.amount, inflation, yearsToEvent);
      }
    }

    const requested = monthlyWithdrawal + oneTime;
    const taxed = applyLtcg({
      enabled: ltcgEnabled,
      ratePercent: ltcgRate,
      exemption,
      withdrawal: requested,
      corpus,
      costBasis,
      fyGains,
    });
    corpus = taxed.corpus;
    costBasis = taxed.costBasis;
    fyGains = taxed.fyGains;

    snaps.push({
      date,
      age,
      startingCorpus,
      investment,
      growth,
      monthlyWithdrawal,
      oneTimeWithdrawal: oneTime,
      ltcgTax: taxed.tax,
      endingCorpus: corpus,
      costBasis,
    });

    if (corpus <= 0 && age >= input.retirementAge) break;
  }

  return snaps;
}

function rollupYears(snaps: MonthSnap[]): RetirementYearRow[] {
  const byYear = new Map<number, MonthSnap[]>();
  for (const snap of snaps) {
    const year = snap.date.getFullYear();
    const list = byYear.get(year) ?? [];
    list.push(snap);
    byYear.set(year, list);
  }

  const rows: RetirementYearRow[] = [];
  for (const [year, list] of [...byYear.entries()].sort((a, b) => a[0] - b[0])) {
    const first = list[0];
    const last = list[list.length - 1];
    rows.push({
      year,
      age: Math.floor(first.age),
      startingCorpus: first.startingCorpus,
      yearlyInvestment: list.reduce((s, x) => s + x.investment, 0),
      yearlyGrowth: list.reduce((s, x) => s + x.growth, 0),
      monthlyWithdrawals: list.reduce((s, x) => s + x.monthlyWithdrawal, 0) / Math.max(1, list.length),
      oneTimeWithdrawals: list.reduce((s, x) => s + x.oneTimeWithdrawal, 0),
      ltcgTax: list.reduce((s, x) => s + x.ltcgTax, 0),
      remainingCorpus: last.endingCorpus,
    });
  }
  return rows;
}

function pathSustainable(snaps: MonthSnap[], untilAge: number): boolean {
  return snaps.filter((s) => s.age <= untilAge + 0.05).every((s) => s.endingCorpus > 0);
}

export function calculateRetirement(input: RetirementInput): RetirementResult {
  const snaps = simulateMonths(input);
  const yearlyBreakdown = rollupYears(snaps);
  const retirementSnap =
    snaps.find((s) => s.age >= input.retirementAge - 1 / 24) ?? snaps[snaps.length - 1];
  const corpusAtRetirement = retirementSnap?.startingCorpus ?? 0;
  const yearsToRetire = Math.max(0, input.retirementAge - input.currentAge);
  const monthlyNeedsAtRetirement = input.goals.reduce((sum, goal) => {
    if (!goalActive(goal, input.retirementAge)) return sum;
    return sum + inflateAmount(goal.monthlyAmount, input.inflationPercent ?? 0, yearsToRetire);
  }, 0);

  const depletionSnap = snaps.find((s) => s.age >= input.retirementAge && s.endingCorpus <= 0);
  const depletionAge = depletionSnap ? Math.floor(depletionSnap.age) : null;
  const minSustainAge = Math.max(80, input.retirementAge + 20);
  const sustainableTo80 = pathSustainable(snaps, minSustainAge);
  const hasLifetime = input.goals.some((g) => g.durationYears === 'lifetime');
  const sustainableForLifetime = hasLifetime ? pathSustainable(snaps, 90) : true;

  const totalInvestment = snaps.reduce((s, x) => s + x.investment, 0);
  const totalLtcgTax = snaps.reduce((s, x) => s + x.ltcgTax, 0);

  const goalAnalysis: GoalAnalysis[] = input.goals.map((goal) => {
    const endAge: number | 'Lifetime' =
      goal.durationYears === 'lifetime' ? 'Lifetime' : goal.startAge + goal.durationYears;
    const active = snaps.filter((s) => goalActive(goal, s.age));
    const isAffordable =
      active.length > 0 &&
      active.every((s) => s.endingCorpus > 0) &&
      (goal.durationYears !== 'lifetime' || !depletionAge || depletionAge > 90);
    let status = 'Sustainable';
    if (!isAffordable) {
      status =
        depletionAge && (endAge === 'Lifetime' || depletionAge < endAge)
          ? `Corpus depletes at age ${depletionAge}`
          : 'Insufficient corpus';
    }
    return {
      id: goal.id,
      description: goal.description,
      monthlyAmount: inflateAmount(goal.monthlyAmount, input.inflationPercent ?? 0, yearsToRetire),
      startAge: goal.startAge,
      endAge,
      isAffordable,
      status,
    };
  });

  let invested = 0;
  const chartSeries = yearlyBreakdown.map((row) => {
    invested += row.yearlyInvestment;
    return { year: row.year, age: row.age, corpus: row.remainingCorpus, invested };
  });

  return {
    corpusAtRetirement,
    totalInvestment,
    totalLtcgTax,
    monthlyNeedsAtRetirement,
    monthlyPassiveIncome: (corpusAtRetirement * (input.swpAnnualPercent / 100)) / 12,
    yearlyBreakdown,
    chartSeries,
    goalAnalysis,
    depletionAge,
    sustainableTo80,
    sustainableForLifetime,
  };
}
