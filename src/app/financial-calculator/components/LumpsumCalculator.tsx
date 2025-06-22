import { useState } from 'react';

export default function LumpsumCalculator() {
  const [investment, setInvestment] = useState('100000');
  const [annualRate, setAnnualRate] = useState('12');
  const [years, setYears] = useState('10');
  const [result, setResult] = useState<null | { totalInvestment: number; estimatedReturns: number; totalValue: number }>(null);

  const calculate = () => {
    const P = parseFloat(investment);
    const r = parseFloat(annualRate) / 100;
    const t = parseFloat(years);
    if (P <= 0 || r <= 0 || t <= 0 || isNaN(P) || isNaN(r) || isNaN(t)) {
      setResult(null);
      return;
    }
    const fv = P * Math.pow(1 + r, t);
    setResult({
      totalInvestment: P,
      estimatedReturns: fv - P,
      totalValue: fv,
    });
  };

  const fmt = (val: number) => val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Total Investment (₹)</label>
          <input value={investment} onChange={e => setInvestment(e.target.value)} type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Expected Annual Return (%)</label>
          <input value={annualRate} onChange={e => setAnnualRate(e.target.value)} type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Investment Period (Years)</label>
          <input value={years} onChange={e => setYears(e.target.value)} type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>
      <button onClick={calculate} className="px-6 py-2 bg-blue-600 text-white rounded">Calculate</button>
      {result && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Investment Summary
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Total Investment</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-100">{fmt(result.totalInvestment)}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Estimated Returns</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{fmt(result.estimatedReturns)}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Maturity Value</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{fmt(result.totalValue)}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 