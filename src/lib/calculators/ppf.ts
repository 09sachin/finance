export const PPF_ANNUAL_CAP = 150_000;
export const PPF_DEFAULT_RATE = 7.1;
export const PPF_MIN_YEARS = 15;

export interface PpfYearRow {
  year: number;
  openingBalance: number;
  deposit: number;
  interest: number;
  closingBalance: number;
}

export interface PpfResult {
  maturityValue: number;
  totalDeposited: number;
  totalInterest: number;
  yearlyBreakdown: PpfYearRow[];
  capped: boolean;
}

/**
 * PPF: annual contribution (capped at ₹1.5 lakh) assumed at the start of the
 * financial year so the full year earns interest on opening + deposit.
 * Tenure is 15 years, extendable in 5-year blocks.
 */
export function calculatePpf(
  annualContribution: number,
  annualPercent: number,
  years: number
): PpfResult {
  const tenure = Math.max(PPF_MIN_YEARS, Math.round(years));
  const deposit = Math.min(Math.max(0, annualContribution), PPF_ANNUAL_CAP);
  const capped = annualContribution > PPF_ANNUAL_CAP;
  const r = annualPercent / 100;

  let balance = 0;
  let totalDeposited = 0;
  const yearlyBreakdown: PpfYearRow[] = [];

  for (let year = 1; year <= tenure; year++) {
    const opening = balance;
    balance += deposit;
    totalDeposited += deposit;
    const interest = balance * r;
    balance += interest;
    yearlyBreakdown.push({
      year,
      openingBalance: opening,
      deposit,
      interest,
      closingBalance: balance,
    });
  }

  return {
    maturityValue: balance,
    totalDeposited,
    totalInterest: balance - totalDeposited,
    yearlyBreakdown,
    capped,
  };
}
