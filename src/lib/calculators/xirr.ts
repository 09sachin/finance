import xirr from 'xirr';

export interface CashFlow {
  amount: number;
  date: Date;
}

export interface XirrResult {
  rate: number;
  invested: number;
  returned: number;
  netCash: number;
  growth5y: number;
  growth10y: number;
}

export function projectedGrowthPercent(annualRate: number, years: number): number {
  return (Math.pow(1 + annualRate, years) - 1) * 100;
}

export function calculateXirr(flows: CashFlow[]): XirrResult {
  const valid = flows.filter((f) => Number.isFinite(f.amount) && !Number.isNaN(f.date.getTime()));
  const hasPos = valid.some((f) => f.amount > 0);
  const hasNeg = valid.some((f) => f.amount < 0);
  if (valid.length < 2 || !hasPos || !hasNeg) {
    throw new Error('Enter at least one investment (negative amount) and one inflow (positive amount) on different dates.');
  }

  const rate = xirr(valid.map((f) => ({ amount: f.amount, when: f.date })));
  const invested = valid.filter((f) => f.amount < 0).reduce((s, f) => s + Math.abs(f.amount), 0);
  const returned = valid.filter((f) => f.amount > 0).reduce((s, f) => s + f.amount, 0);

  return {
    rate,
    invested,
    returned,
    netCash: returned - invested,
    growth5y: projectedGrowthPercent(rate, 5),
    growth10y: projectedGrowthPercent(rate, 10),
  };
}

export function xirrPerformanceLabel(rate: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
  if (rate > 0.15) return 'Excellent';
  if (rate > 0.08) return 'Good';
  if (rate > 0) return 'Fair';
  return 'Poor';
}
