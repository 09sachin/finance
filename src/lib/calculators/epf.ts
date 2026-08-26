export const EPS_WAGE_CEILING = 15_000;
export const EPS_RATE = 0.0833;
export const DEFAULT_EPF_EMPLOYEE_RATE = 12;
export const DEFAULT_EPF_EMPLOYER_RATE = 12;

export interface EpfYearRow {
  year: number;
  openingBalance: number;
  employeeContribution: number;
  employerEpfContribution: number;
  epsContribution: number;
  interest: number;
  closingBalance: number;
}

export interface EpfResult {
  monthlyWage: number;
  employeeMonthly: number;
  employerEpfMonthly: number;
  epsMonthly: number;
  totalEmployeeContribution: number;
  totalEmployerEpfContribution: number;
  totalEpsContribution: number;
  totalInterest: number;
  corpus: number;
  yearlyBreakdown: EpfYearRow[];
}

/**
 * EPF corpus uses monthly running balance. Employer 12% is split into
 * EPS (8.33% of wage, capped at ₹15,000) and the remainder to EPF.
 * EPS is tracked separately and is not part of the withdrawable EPF corpus.
 */
export function calculateEpf(input: {
  basicSalary: number;
  da?: number;
  years: number;
  annualPercent: number;
  employeePercent?: number;
  employerPercent?: number;
}): EpfResult {
  const da = input.da ?? 0;
  const monthlyWage = input.basicSalary + da;
  const employeeRate = (input.employeePercent ?? DEFAULT_EPF_EMPLOYEE_RATE) / 100;
  const employerRate = (input.employerPercent ?? DEFAULT_EPF_EMPLOYER_RATE) / 100;
  const months = Math.round(input.years * 12);
  const monthlyInterestRate = input.annualPercent / 100 / 12;

  const employeeMonthly = monthlyWage * employeeRate;
  const epsMonthly = Math.min(monthlyWage, EPS_WAGE_CEILING) * EPS_RATE;
  const employerTotalMonthly = monthlyWage * employerRate;
  const employerEpfMonthly = Math.max(0, employerTotalMonthly - epsMonthly);

  let corpus = 0;
  let yearEmployee = 0;
  let yearEmployerEpf = 0;
  let yearEps = 0;
  let yearInterest = 0;
  let yearOpening = 0;
  let totalEmployee = 0;
  let totalEmployerEpf = 0;
  let totalEps = 0;
  const yearlyBreakdown: EpfYearRow[] = [];

  for (let month = 1; month <= months; month++) {
    corpus += employeeMonthly + employerEpfMonthly;
    totalEmployee += employeeMonthly;
    totalEmployerEpf += employerEpfMonthly;
    totalEps += epsMonthly;
    yearEmployee += employeeMonthly;
    yearEmployerEpf += employerEpfMonthly;
    yearEps += epsMonthly;

    const interest = corpus * monthlyInterestRate;
    yearInterest += interest;
    corpus += interest;

    if (month % 12 === 0 || month === months) {
      yearlyBreakdown.push({
        year: Math.ceil(month / 12),
        openingBalance: yearOpening,
        employeeContribution: yearEmployee,
        employerEpfContribution: yearEmployerEpf,
        epsContribution: yearEps,
        interest: yearInterest,
        closingBalance: corpus,
      });
      yearOpening = corpus;
      yearEmployee = 0;
      yearEmployerEpf = 0;
      yearEps = 0;
      yearInterest = 0;
    }
  }

  return {
    monthlyWage,
    employeeMonthly,
    employerEpfMonthly,
    epsMonthly,
    totalEmployeeContribution: totalEmployee,
    totalEmployerEpfContribution: totalEmployerEpf,
    totalEpsContribution: totalEps,
    totalInterest: corpus - totalEmployee - totalEmployerEpf,
    corpus,
    yearlyBreakdown,
  };
}
