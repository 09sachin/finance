import { describe, expect, it } from 'vitest';
import { calculateSipFV, calculateStepUpSipFV, monthsBetween, evaluateSipPlan } from './sip';
import { calculateLumpsumFV, calculateLumpsumSip } from './lumpsum';
import { simulateSwp } from './swp';
import { calculateEmi } from './emi';
import { calculateFd } from './fd';
import { calculatePpf, PPF_ANNUAL_CAP } from './ppf';
import { calculateCagr } from './cagr';
import { calculateInflation, realRate } from './inflation';
import { calculateEpf, EPS_WAGE_CEILING, EPS_RATE } from './epf';
import { projectedGrowthPercent } from './xirr';
import { monthsToTarget, requiredSipAmount } from './targetSip';
import { calculateRetirement } from './retirement';
import { calculateFire, requiredExtraSip } from './fire';

describe('SIP', () => {
  it('matches the standard 10-year 12% annuity-due value', () => {
    expect(calculateSipFV(10_000, 12, 120)).toBeCloseTo(23_23_391, -2);
  });

  it('counts calendar months instead of 30.44-day months', () => {
    expect(monthsBetween(new Date(2020, 0, 31), new Date(2021, 0, 31))).toBe(12);
  });

  it('grows a finished SIP to a later maturity date', () => {
    const result = evaluateSipPlan(
      {
        monthlyAmount: 10_000,
        startDate: new Date(2020, 0, 1),
        endDate: new Date(2025, 0, 1),
        annualPercent: 12,
      },
      new Date(2030, 0, 1)
    );
    expect(result).not.toBeNull();
    expect(result!.months).toBe(60);
    expect(result!.growthMonths).toBe(60);
    expect(result!.futureValue).toBeGreaterThan(result!.invested);
  });

  it('increases step-up SIP contributions after each year', () => {
    const stepped = calculateStepUpSipFV(10_000, 12, 24, 10);
    expect(stepped.totalInvested).toBe(10_000 * 12 + 11_000 * 12);
    expect(stepped.futureValue).toBeGreaterThan(calculateSipFV(10_000, 12, 24));
  });
});

describe('lumpsum', () => {
  it('compounds monthly rather than annually', () => {
    const monthly = calculateLumpsumFV(100_000, 12, 10);
    expect(monthly).toBeGreaterThan(100_000 * Math.pow(1.12, 10));
    expect(monthly).toBeCloseTo(330_038.69, 0);
  });

  it('combines lumpsum and SIP on the same monthly rate', () => {
    const result = calculateLumpsumSip({
      lumpsum: 100_000,
      monthlySip: 10_000,
      annualPercent: 12,
      years: 10,
    });
    expect(result.lumpsumValue).toBeCloseTo(calculateLumpsumFV(100_000, 12, 10), 4);
    expect(result.sipValue).toBeCloseTo(calculateSipFV(10_000, 12, 120), 4);
    expect(result.totalValue).toBeCloseTo(result.lumpsumValue + result.sipValue, 6);
  });
});

describe('SWP', () => {
  it('depletes a corpus on a monthly schedule', () => {
    const result = simulateSwp({
      corpus: 1_000_000,
      monthlyWithdrawal: 20_000,
      annualPercent: 8,
    });
    expect(result.isSustainable).toBe(false);
    expect(result.depletedAtMonth).not.toBeNull();
    expect(result.depletedAtMonth!).toBeGreaterThan(12);
    expect(result.depletedAtMonth!).toBeLessThan(72);
  });

  it('marks a withdrawal at or below monthly interest as sustainable', () => {
    const result = simulateSwp({
      corpus: 1_200_000,
      monthlyWithdrawal: 8_000,
      annualPercent: 8,
    });
    expect(result.isSustainable).toBe(true);
    expect(result.depletedAtMonth).toBeNull();
  });
});

describe('EMI', () => {
  it('keeps principal + interest equal to total payment', () => {
    const result = calculateEmi(1_000_000, 8.5, 240);
    const principal = result.schedule.reduce((s, r) => s + r.principal, 0);
    const interest = result.schedule.reduce((s, r) => s + r.interest, 0);
    expect(principal).toBeCloseTo(1_000_000, 0);
    expect(principal + interest).toBeCloseTo(result.totalPayment, 0);
    expect(result.emi).toBeGreaterThan(8_000);
    expect(result.emi).toBeLessThan(9_000);
  });
});

describe('FD', () => {
  it('credits more with quarterly compounding than simple interest', () => {
    const fd = calculateFd(100_000, 7, 5, 'quarterly');
    expect(fd.maturityValue).toBeGreaterThan(100_000 * (1 + 0.07 * 5));
    expect(fd.maturityValue).toBeCloseTo(141_478, 0);
  });
});

describe('PPF', () => {
  it('caps yearly deposits at 1.5 lakh', () => {
    const result = calculatePpf(200_000, 7.1, 15);
    expect(result.capped).toBe(true);
    expect(result.totalDeposited).toBe(PPF_ANNUAL_CAP * 15);
    expect(result.maturityValue).toBeGreaterThan(result.totalDeposited);
  });
});

describe('CAGR / inflation', () => {
  it('computes CAGR from start and end values', () => {
    expect(calculateCagr(100_000, 200_000, 7) * 100).toBeCloseTo(10.41, 1);
  });

  it('converts nominal returns into real returns', () => {
    expect(realRate(12, 6) * 100).toBeCloseTo(5.66, 1);
    const inf = calculateInflation({
      amount: 100_000,
      nominalPercent: 12,
      inflationPercent: 6,
      years: 10,
    });
    expect(inf.realFutureValue).toBeLessThan(inf.nominalFutureValue);
    expect(inf.purchasingPowerOfNominal).toBeCloseTo(inf.realFutureValue, 4);
  });
});

describe('EPF', () => {
  it('caps EPS at 8.33% of the ₹15,000 wage ceiling', () => {
    const result = calculateEpf({ basicSalary: 50_000, years: 1, annualPercent: 8.25 });
    expect(result.epsMonthly).toBeCloseTo(EPS_WAGE_CEILING * EPS_RATE, 6);
    expect(result.employerEpfMonthly).toBeCloseTo(50_000 * 0.12 - result.epsMonthly, 6);
    expect(result.corpus).toBeGreaterThan(
      result.totalEmployeeContribution + result.totalEmployerEpfContribution
    );
  });
});

describe('XIRR projections', () => {
  it('uses ((1+r)^n − 1) × 100 rather than subtracting 100', () => {
    const growth = projectedGrowthPercent(0.12, 5);
    expect(growth).toBeCloseTo(76.23, 1);
    expect(growth).not.toBeCloseTo(Math.pow(1.12, 5) - 100, 0);
  });
});

describe('target SIP', () => {
  it('inverts the SIP formula for a required monthly amount', () => {
    const target = calculateSipFV(12_000, 12, 120);
    expect(requiredSipAmount({ target, years: 10, annualPercent: 12 }).monthlyAmount).toBeCloseTo(
      12_000,
      0
    );
  });

  it('reports unreachable targets instead of failing silently', () => {
    const result = monthsToTarget({
      target: 10_000_000_000,
      monthlyAmount: 100,
      annualPercent: 1,
      maxMonths: 24,
    });
    expect(result.reachable).toBe(false);
    expect(result.message).toBeTruthy();
  });
});

describe('retirement', () => {
  it('credits a lumpsum in the month it is invested', () => {
    const asOf = new Date(2026, 0, 1);
    const result = calculateRetirement({
      currentAge: 30,
      retirementAge: 60,
      lumpsums: [{ amount: 500_000, date: new Date(2026, 5, 15), annualPercent: 12 }],
      sips: [],
      swpAnnualPercent: 8,
      withdrawals: [],
      goals: [],
      asOf,
      maxAge: 32,
    });
    expect(result.yearlyBreakdown.find((r) => r.year === 2026)?.yearlyInvestment).toBe(500_000);
    expect(result.totalInvestment).toBe(500_000);
    expect(result).not.toHaveProperty('fireAge');
  });
});

describe('FIRE', () => {
  it('finds a FIRE age when savings already cover a modest expense', () => {
    const result = calculateFire({
      currentAge: 40,
      investments: [{ name: 'Equity', amount: 50_000_000, annualPercent: 10 }],
      sips: [],
      monthlyExpenseToday: 20_000,
      expenseInflationPercent: 0,
      oneOffs: [],
      postFireAnnualPercent: 8,
      ltcgEnabled: false,
      ltcgRatePercent: 12.5,
      asOf: new Date(2026, 0, 1),
      maxFireAge: 50,
      sustainToAge: 70,
    });
    expect(result.fireAge).not.toBeNull();
    expect(result.fireAge).toBeLessThanOrEqual(42);
  });

  it('pushes Comfortable FIRE later than Lean when lifestyle spend is higher', () => {
    const base = {
      currentAge: 30,
      investments: [{ name: 'Equity', amount: 2_000_000, annualPercent: 12 }],
      sips: [{ name: 'SIP', monthlyAmount: 40_000, annualPercent: 12, stepUpPercent: 0 }],
      monthlyExpenseToday: 80_000,
      expenseInflationPercent: 6,
      oneOffs: [],
      postFireAnnualPercent: 8,
      ltcgEnabled: false,
      ltcgRatePercent: 12.5,
      asOf: new Date(2026, 0, 1),
      maxFireAge: 70,
      sustainToAge: 90,
    };
    const lean = calculateFire({ ...base, lifestyleUpliftPercent: 0 });
    const comfortable = calculateFire({ ...base, lifestyleUpliftPercent: 20 });
    expect(lean.fireAge).not.toBeNull();
    expect(comfortable.fireAge).not.toBeNull();
    expect(comfortable.fireAge!).toBeGreaterThanOrEqual(lean.fireAge!);
  });

  it('returns zero extra SIP when the plan already hits the target age', () => {
    const sip = requiredExtraSip(
      {
        currentAge: 40,
        investments: [{ name: 'Equity', amount: 50_000_000, annualPercent: 10 }],
        sips: [],
        monthlyExpenseToday: 20_000,
        expenseInflationPercent: 0,
        oneOffs: [],
        postFireAnnualPercent: 8,
        ltcgEnabled: false,
        ltcgRatePercent: 12.5,
        asOf: new Date(2026, 0, 1),
        maxFireAge: 50,
        sustainToAge: 70,
        lifestyleUpliftPercent: 0,
      },
      42
    );
    expect(sip.alreadyOnTrack).toBe(true);
    expect(sip.extraMonthlySip).toBe(0);
  });

  it('reports remaining corpus at user checkpoint ages', () => {
    const result = calculateFire({
      currentAge: 40,
      investments: [{ name: 'Equity', amount: 50_000_000, annualPercent: 10 }],
      sips: [],
      monthlyExpenseToday: 20_000,
      expenseInflationPercent: 0,
      oneOffs: [],
      postFireAnnualPercent: 8,
      ltcgEnabled: false,
      ltcgRatePercent: 12.5,
      asOf: new Date(2026, 0, 1),
      maxFireAge: 50,
      sustainToAge: 85,
      checkpointAges: [50, 70],
    });
    expect(result.checkpointCorpus.map((p) => p.age)).toEqual([50, 70]);
    expect(result.checkpointCorpus[0].corpus).toBeGreaterThan(0);
    expect(result.checkpointCorpus[1].corpus).toBeGreaterThan(0);
  });
});
