import { useState } from 'react';

export default function SWPCalculator() {
  const [corpus, setCorpus] = useState('1000000');
  const [withdrawal, setWithdrawal] = useState('10000');
  const [annualRate, setAnnualRate] = useState('8');
  const [stepUpEnabled, setStepUpEnabled] = useState(false);
  const [stepUpRate, setStepUpRate] = useState('5');
  const [result, setResult] = useState<null | {
    duration: string;
    isIndefinite: boolean;
    yearlyBreakdown: Array<{
      year: number;
      startingCorpus: number;
      totalWithdrawals: number;
      interestEarned: number;
      endingCorpus: number;
      monthlyWithdrawal: number;
    }>;
  }>(null);

  const calculate = () => {
    const C = parseFloat(corpus);
    const W = parseFloat(withdrawal);
    const r = parseFloat(annualRate) / 100 / 12; // monthly rate
    const annualR = parseFloat(annualRate) / 100; // annual rate
    const stepUp = stepUpEnabled ? parseFloat(stepUpRate) / 100 : 0;
    
    if (C <= 0 || W <= 0 || r <= 0 || isNaN(C) || isNaN(W) || isNaN(r)) {
      setResult(null);
      return;
    }

    let currentCorpus = C;
    let currentWithdrawal = W;
    const yearlyBreakdown = [];
    const maxYears = 50; // limit to prevent infinite loops

    for (let year = 1; year <= maxYears; year++) {
      const startingCorpus = currentCorpus;
      const annualWithdrawals = currentWithdrawal * 12;
      const interestEarned = currentCorpus * annualR;
      
      // Calculate ending corpus after interest and withdrawals
      const endingCorpus = currentCorpus + interestEarned - annualWithdrawals;
      
      yearlyBreakdown.push({
        year,
        startingCorpus,
        totalWithdrawals: annualWithdrawals,
        interestEarned,
        endingCorpus: Math.max(0, endingCorpus),
        monthlyWithdrawal: currentWithdrawal
      });

      currentCorpus = endingCorpus;

      // If corpus is depleted, break
      if (currentCorpus <= 0) {
        break;
      }

      // Increase withdrawal for next year if step-up is enabled
      if (stepUpEnabled && stepUp > 0) {
        currentWithdrawal = currentWithdrawal * (1 + stepUp);
      }
    }

    // Check if withdrawal is sustainable
    const isIndefinite = !stepUpEnabled && W <= C * r;
    
    let duration: string;
    if (isIndefinite) {
      duration = 'Corpus likely to last indefinitely (withdrawal ≤ monthly interest)';
    } else {
      const lastYear = yearlyBreakdown[yearlyBreakdown.length - 1];
      if (lastYear && lastYear.endingCorpus > 0) {
        duration = `Corpus projected to last more than ${yearlyBreakdown.length} years`;
      } else {
        duration = `Corpus will last approximately ${yearlyBreakdown.length} years`;
      }
    }

    setResult({
      duration,
      isIndefinite,
      yearlyBreakdown: yearlyBreakdown.slice(0, 25) // Show max 25 years
    });
  };

  const fmt = (val: number) => val.toLocaleString('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Current Corpus (₹)</label>
          <input value={corpus} onChange={e => setCorpus(e.target.value)} type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Monthly Withdrawal (₹)</label>
          <input value={withdrawal} onChange={e => setWithdrawal(e.target.value)} type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expected Annual Return (%)</label>
          <input value={annualRate} onChange={e => setAnnualRate(e.target.value)} type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>
      
      {/* Step-up SWP Options */}
      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={stepUpEnabled}
              onChange={e => setStepUpEnabled(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Enable Step-up SWP
            </span>
          </label>
          {stepUpEnabled && (
            <div className="w-32">
              <input
                type="number"
                value={stepUpRate}
                onChange={e => setStepUpRate(e.target.value)}
                placeholder="% per year"
                className="w-full px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-800 dark:text-slate-100"
              />
            </div>
          )}
        </div>
        {stepUpEnabled && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Withdrawal amount will increase by {stepUpRate || 0}% each year
          </p>
        )}
      </div>
      
      <button onClick={calculate} className="px-6 py-2 bg-blue-600 text-white rounded">Calculate</button>
      
      {result && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-xl border border-orange-200 dark:border-orange-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            SWP Analysis
          </h3>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
            <div className="text-center">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Withdrawal Duration</div>
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-4">{result.duration}</div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Based on your corpus of {parseFloat(corpus).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })} 
                and monthly withdrawal of {parseFloat(withdrawal).toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 })}
              </div>
            </div>
          </div>

          {/* Year-by-Year Breakdown */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200">
                Year-by-Year Corpus Breakdown {result.isIndefinite && '(25 Years Projection)'}
              </h4>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-700 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Year</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Starting Corpus</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Monthly Withdrawal</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Interest Earned</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Withdrawals</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Ending Corpus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                  {result.yearlyBreakdown.map((item) => (
                    <tr key={item.year} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200">{item.year}</td>
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{fmt(item.startingCorpus)}</td>
                      <td className="px-4 py-3 text-sm text-orange-600 dark:text-orange-400">{fmt(item.monthlyWithdrawal)}</td>
                      <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">{fmt(item.interestEarned)}</td>
                      <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400">{fmt(item.totalWithdrawals)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">{fmt(item.endingCorpus)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 