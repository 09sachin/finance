export interface InflationResult {
  realRate: number;
  nominalFutureValue: number;
  realFutureValue: number;
  inflationAdjustedTarget: number;
  purchasingPowerOfNominal: number;
  yearly: { year: number; nominal: number; real: number; target: number }[];
}

export function realRate(nominalPercent: number, inflationPercent: number): number {
  return (1 + nominalPercent / 100) / (1 + inflationPercent / 100) - 1;
}

export function calculateInflation(input: {
  amount: number;
  nominalPercent: number;
  inflationPercent: number;
  years: number;
}): InflationResult {
  const { amount, nominalPercent, inflationPercent, years } = input;
  const rr = realRate(nominalPercent, inflationPercent);
  const nominalFutureValue = amount * Math.pow(1 + nominalPercent / 100, years);
  const realFutureValue = amount * Math.pow(1 + rr, years);
  const inflationAdjustedTarget = amount * Math.pow(1 + inflationPercent / 100, years);
  const purchasingPowerOfNominal = nominalFutureValue / Math.pow(1 + inflationPercent / 100, years);

  const yearly = [];
  for (let year = 1; year <= Math.round(years); year++) {
    yearly.push({
      year,
      nominal: amount * Math.pow(1 + nominalPercent / 100, year),
      real: amount * Math.pow(1 + rr, year),
      target: amount * Math.pow(1 + inflationPercent / 100, year),
    });
  }

  return {
    realRate: rr,
    nominalFutureValue,
    realFutureValue,
    inflationAdjustedTarget,
    purchasingPowerOfNominal,
    yearly,
  };
}
