import { useState } from 'react';

export default function LumpsumSipSwpCalculator() {
  const [lumpsum, setLumpsum] = useState('500000');
  const [monthlySip, setMonthlySip] = useState('10000');
  const [accumYears, setAccumYears] = useState('15');
  const [growthRate, setGrowthRate] = useState('12');
  const [sipStepUpEnabled, setSipStepUpEnabled] = useState(false);
  const [sipStepUpRate, setSipStepUpRate] = useState('10');

  const [monthlySwp, setMonthlySwp] = useState('30000');
  const [swpRate, setSwpRate] = useState('8');
  const [swpStepUpEnabled, setSwpStepUpEnabled] = useState(false);
  const [swpStepUpRate, setSwpStepUpRate] = useState('5');
  
  const [result, setResult] = useState<null | {
    corpus: number;
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

  const fmtCurr = (val: number) => val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  const calculate = () => {
    const L = parseFloat(lumpsum);
    const P = parseFloat(monthlySip);
    const g = parseFloat(growthRate) / 100;
    const tYears = parseFloat(accumYears);
    const sipStepUp = sipStepUpEnabled ? parseFloat(sipStepUpRate) / 100 : 0;
    
    // Calculate corpus after accumulation phase
    const corpLump = L * Math.pow(1 + g, tYears);
    
    let corpSip = 0;
    if (sipStepUpEnabled && sipStepUp > 0) {
      // Step-up SIP calculation
      let currentSip = P;
      const monthlyRate = g / 12;
      const totalMonths = tYears * 12;
      
      for (let month = 1; month <= totalMonths; month++) {
        const remainingMonths = totalMonths - month + 1;
        corpSip += currentSip * Math.pow(1 + monthlyRate, remainingMonths);
        
        // Increase SIP amount annually
        if (month % 12 === 0 && month < totalMonths) {
          currentSip = currentSip * (1 + sipStepUp);
        }
      }
    } else {
      // Regular SIP calculation
      const iMonthly = g / 12;
      const nMonths = tYears * 12;
      corpSip = P * ((Math.pow(1 + iMonthly, nMonths) - 1) / iMonthly) * (1 + iMonthly);
    }
    
    const corpus = corpLump + corpSip;

    // SWP Phase
    const w = parseFloat(monthlySwp);
    const rSwp = parseFloat(swpRate) / 100;
    const swpStepUp = swpStepUpEnabled ? parseFloat(swpStepUpRate) / 100 : 0;
    
    let currentCorpus = corpus;
    let currentWithdrawal = w;
    const yearlyBreakdown = [];
    const maxYears = 50;

    for (let year = 1; year <= maxYears; year++) {
      const startingCorpus = currentCorpus;
      const annualWithdrawals = currentWithdrawal * 12;
      const interestEarned = currentCorpus * rSwp;
      
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

      if (currentCorpus <= 0) {
        break;
      }

      // Increase withdrawal for next year if step-up is enabled
      if (swpStepUpEnabled && swpStepUp > 0) {
        currentWithdrawal = currentWithdrawal * (1 + swpStepUp);
      }
    }

    const monthlySwpRate = rSwp / 12;
    const isIndefinite = !swpStepUpEnabled && w <= corpus * monthlySwpRate;

    let duration: string;
    if (isIndefinite) {
      duration = 'Your withdrawal rate is sustainable indefinitely.';
    } else {
      const lastYear = yearlyBreakdown[yearlyBreakdown.length - 1];
      if (lastYear && lastYear.endingCorpus > 0) {
        duration = `Corpus projected to last more than ${yearlyBreakdown.length} years.`;
      } else {
        duration = `Corpus will last approximately ${yearlyBreakdown.length} years.`;
      }
    }

    setResult({
      corpus,
      duration,
      isIndefinite,
      yearlyBreakdown: yearlyBreakdown.slice(0, 25)
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="font-semibold text-lg">Accumulation Inputs</h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Initial Lumpsum (₹)</label>
          <input value={lumpsum} onChange={e => setLumpsum(e.target.value)} type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Monthly SIP (₹)</label>
          <input value={monthlySip} onChange={e => setMonthlySip(e.target.value)} type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Investment Period (Years)</label>
          <input value={accumYears} onChange={e => setAccumYears(e.target.value)} type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Growth Rate (% p.a.)</label>
          <input value={growthRate} onChange={e => setGrowthRate(e.target.value)} type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>
      
      {/* Step-up SIP Options */}
      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={sipStepUpEnabled}
              onChange={e => setSipStepUpEnabled(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Enable Step-up SIP
            </span>
          </label>
          {sipStepUpEnabled && (
            <div className="w-32">
              <input
                type="number"
                value={sipStepUpRate}
                onChange={e => setSipStepUpRate(e.target.value)}
                placeholder="% per year"
                className="w-full px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-800 dark:text-slate-100"
              />
            </div>
          )}
        </div>
        {sipStepUpEnabled && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            SIP amount will increase by {sipStepUpRate || 0}% each year
          </p>
        )}
      </div>
      
      <h3 className="font-semibold text-lg">Withdrawal Inputs</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Monthly Withdrawal (₹)</label>
          <input value={monthlySwp} onChange={e => setMonthlySwp(e.target.value)} type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">SWP Return Rate (% p.a.)</label>
          <input value={swpRate} onChange={e => setSwpRate(e.target.value)} type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>
      
      {/* Step-up SWP Options */}
      <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={swpStepUpEnabled}
              onChange={e => setSwpStepUpEnabled(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              Enable Step-up SWP
            </span>
          </label>
          {swpStepUpEnabled && (
            <div className="w-32">
              <input
                type="number"
                value={swpStepUpRate}
                onChange={e => setSwpStepUpRate(e.target.value)}
                placeholder="% per year"
                className="w-full px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-800 dark:text-slate-100"
              />
            </div>
          )}
        </div>
        {swpStepUpEnabled && (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Withdrawal amount will increase by {swpStepUpRate || 0}% each year
          </p>
        )}
      </div>
      
      <button onClick={calculate} className="px-6 py-2 bg-blue-600 text-white rounded">Calculate</button>
      
      {result && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Lifecycle Analysis
          </h3>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
            <div className="text-center">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Corpus After Accumulation</div>
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-4">{fmtCurr(result.corpus)}</div>
              <div className="text-lg text-slate-700 dark:text-slate-300">{result.duration}</div>
              {(sipStepUpEnabled || swpStepUpEnabled) && (
                <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {sipStepUpEnabled && `SIP step-up: ${sipStepUpRate}% annually`}
                  {sipStepUpEnabled && swpStepUpEnabled && ' • '}
                  {swpStepUpEnabled && `SWP step-up: ${swpStepUpRate}% annually`}
                </div>
              )}
            </div>
          </div>

          {/* Year-by-Year SWP Breakdown */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200">
                SWP Phase - Year-by-Year Breakdown {result.isIndefinite && '(25 Years Projection)'}
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
                      <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{fmtCurr(item.startingCorpus)}</td>
                      <td className="px-4 py-3 text-sm text-orange-600 dark:text-orange-400">{fmtCurr(item.monthlyWithdrawal)}</td>
                      <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400">{fmtCurr(item.interestEarned)}</td>
                      <td className="px-4 py-3 text-sm text-red-600 dark:text-red-400">{fmtCurr(item.totalWithdrawals)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-blue-600 dark:text-blue-400">{fmtCurr(item.endingCorpus)}</td>
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