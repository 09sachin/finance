export interface CagrResult {
  cagr: number;
  absoluteGain: number;
  totalReturnPercent: number;
  fdEquivalentValue: number;
  beatsFd: boolean;
}

export function calculateCagr(
  startValue: number,
  endValue: number,
  years: number
): number {
  if (startValue <= 0 || years <= 0 || endValue < 0) return 0;
  return Math.pow(endValue / startValue, 1 / years) - 1;
}

export function analyzeCagr(
  startValue: number,
  endValue: number,
  years: number,
  fdAnnualPercent = 7
): CagrResult {
  const cagr = calculateCagr(startValue, endValue, years);
  const fdEquivalentValue = startValue * Math.pow(1 + fdAnnualPercent / 100, years);
  return {
    cagr,
    absoluteGain: endValue - startValue,
    totalReturnPercent: startValue > 0 ? ((endValue - startValue) / startValue) * 100 : 0,
    fdEquivalentValue,
    beatsFd: endValue > fdEquivalentValue,
  };
}
