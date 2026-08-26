export interface AmortizationRow {
  month: number;
  emi: number;
  principal: number;
  interest: number;
  remaining: number;
}

export interface EmiYearRow {
  year: number;
  principalPaid: number;
  interestPaid: number;
  remaining: number;
}

export interface EmiResult {
  emi: number;
  totalPayment: number;
  totalInterest: number;
  schedule: AmortizationRow[];
  yearlyBreakdown: EmiYearRow[];
}

/**
 * Reducing-balance EMI: EMI = P × r × (1+r)^n / ((1+r)^n − 1)
 */
export function calculateEmi(principal: number, annualPercent: number, months: number): EmiResult {
  const r = annualPercent / 100 / 12;
  let emi: number;
  if (r === 0) {
    emi = principal / months;
  } else {
    const pow = Math.pow(1 + r, months);
    emi = (principal * r * pow) / (pow - 1);
  }

  const schedule: AmortizationRow[] = [];
  const yearlyBreakdown: EmiYearRow[] = [];
  let remaining = principal;
  let yearPrincipal = 0;
  let yearInterest = 0;

  for (let month = 1; month <= months; month++) {
    const interest = remaining * r;
    let principalPaid = emi - interest;
    if (month === months) {
      principalPaid = remaining;
    }
    remaining = Math.max(0, remaining - principalPaid);
    const payment = principalPaid + interest;
    schedule.push({
      month,
      emi: payment,
      principal: principalPaid,
      interest,
      remaining,
    });
    yearPrincipal += principalPaid;
    yearInterest += interest;
    if (month % 12 === 0 || month === months) {
      yearlyBreakdown.push({
        year: Math.ceil(month / 12),
        principalPaid: yearPrincipal,
        interestPaid: yearInterest,
        remaining,
      });
      yearPrincipal = 0;
      yearInterest = 0;
    }
  }

  const totalPayment = schedule.reduce((s, row) => s + row.emi, 0);
  const totalInterest = totalPayment - principal;

  return { emi, totalPayment, totalInterest, schedule, yearlyBreakdown };
}
