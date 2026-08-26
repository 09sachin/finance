export type CalculatorCategory = 'Investments' | 'Withdrawals' | 'Loans & Deposits' | 'Planning';

export interface CalculatorMeta {
  id: string;
  name: string;
  description: string;
  category: CalculatorCategory;
}

export const CALCULATOR_REGISTRY: CalculatorMeta[] = [
  { id: 'sip', name: 'SIP Return', description: 'Future value of one or more SIPs, with optional step-up and a target maturity date.', category: 'Investments' },
  { id: 'lumpsum', name: 'Lumpsum Return', description: 'Grow a one-time investment with monthly compounding, the way mutual funds typically work.', category: 'Investments' },
  { id: 'lumpsum-sip', name: 'Lumpsum + SIP', description: 'Combine a lumpsum and a monthly SIP on the same expected return.', category: 'Investments' },
  { id: 'target-sip', name: 'Target SIP', description: 'Find how long a SIP takes, or how much you need to invest, to hit a goal.', category: 'Investments' },
  { id: 'cagr', name: 'CAGR', description: 'Annualised return between a start value and an end value, compared with a typical FD.', category: 'Investments' },
  { id: 'swp', name: 'SWP', description: 'See how long a corpus lasts with monthly withdrawals and optional step-up.', category: 'Withdrawals' },
  { id: 'lumpsum-sip-swp', name: 'Lumpsum + SIP & SWP', description: 'Accumulate with lumpsum and SIP, then withdraw through an SWP.', category: 'Withdrawals' },
  { id: 'emi', name: 'EMI / Loan', description: 'Monthly EMI, total interest, and an amortisation schedule for a reducing-balance loan.', category: 'Loans & Deposits' },
  { id: 'fd', name: 'Fixed Deposit', description: 'FD maturity with quarterly compounding by default, matching Indian bank practice.', category: 'Loans & Deposits' },
  { id: 'ppf', name: 'PPF', description: 'Public Provident Fund with the ₹1.5 lakh yearly cap and 15-year tenure.', category: 'Loans & Deposits' },
  { id: 'epf', name: 'EPF Corpus', description: 'Employee Provident Fund corpus with the EPS wage ceiling applied to employer contributions.', category: 'Loans & Deposits' },
  { id: 'retirement', name: 'Retirement Planning', description: 'Simple plan: savings, SIP, expenses, inflation, and how long the corpus lasts.', category: 'Planning' },
  { id: 'fire', name: 'FIRE', description: 'Find the earliest age your investments can cover inflated living costs, with SIPs, one-offs, and optional LTCG.', category: 'Planning' },
  { id: 'inflation', name: 'Inflation Adjuster', description: 'Nominal vs real (today’s rupees) future value, and the amount you need to keep purchasing power.', category: 'Planning' },
  { id: 'xirr', name: 'XIRR', description: 'Annualised return for irregular cash flows on actual dates.', category: 'Planning' },
];

export const CALCULATOR_CATEGORIES: CalculatorCategory[] = [
  'Investments',
  'Withdrawals',
  'Loans & Deposits',
  'Planning',
];

export function getCalculator(id: string): CalculatorMeta | undefined {
  return CALCULATOR_REGISTRY.find((c) => c.id === id);
}
