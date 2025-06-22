import { useState } from 'react';

export default function LumpsumSIPCalculator() {
  const [lumpsum, setLumpsum] = useState('500000');
  const [monthlySip, setMonthlySip] = useState('10000');
  const [years, setYears] = useState('15');
  const [annualRate, setAnnualRate] = useState('12');
  const [stepUpEnabled, setStepUpEnabled] = useState(false);
  const [stepUpRate, setStepUpRate] = useState('10');
  const [result, setResult] = useState<null | {
    lumpsumValue: number;
    sipValue: number;
    totalValue: number;
    totalInvestment: number;
    totalReturns: number;
  }>(null);

  const calculate = () => {
    const L = parseFloat(lumpsum);
    const P = parseFloat(monthlySip);
    const r = parseFloat(annualRate) / 100;
    const t = parseFloat(years);
    const stepUp = stepUpEnabled ? parseFloat(stepUpRate) / 100 : 0;
    
    if (L < 0 || P < 0 || r <= 0 || t <= 0 || isNaN(L) || isNaN(P) || isNaN(r) || isNaN(t)) {
      setResult(null);
      return;
    }

    // Lumpsum future value
    const lumpsumFV = L * Math.pow(1 + r, t);
    
    // SIP calculation
    let sipFV = 0;
    let totalSipInvestment = 0;
    
    if (stepUpEnabled && stepUp > 0) {
      // Step-up SIP calculation
      let currentSip = P;
      const monthlyRate = r / 12;
      const totalMonths = t * 12;
      
      for (let month = 1; month <= totalMonths; month++) {
        const remainingMonths = totalMonths - month + 1;
        sipFV += currentSip * Math.pow(1 + monthlyRate, remainingMonths);
        totalSipInvestment += currentSip;
        
        // Increase SIP amount annually
        if (month % 12 === 0 && month < totalMonths) {
          currentSip = currentSip * (1 + stepUp);
        }
      }
    } else {
      // Regular SIP calculation
      const monthlyRate = r / 12;
      const nMonths = t * 12;
      sipFV = P * ((Math.pow(1 + monthlyRate, nMonths) - 1) / monthlyRate) * (1 + monthlyRate);
      totalSipInvestment = P * nMonths;
    }

    const totalFV = lumpsumFV + sipFV;
    const totalInvestment = L + totalSipInvestment;

    setResult({
      lumpsumValue: lumpsumFV,
      sipValue: sipFV,
      totalValue: totalFV,
      totalInvestment,
      totalReturns: totalFV - totalInvestment
    });
  };

  const fmt = (val: number) => val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Lumpsum (₹)</label>
          <input value={lumpsum} onChange={e => setLumpsum(e.target.value)} type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Monthly SIP (₹)</label>
          <input value={monthlySip} onChange={e => setMonthlySip(e.target.value)} type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Expected Annual Return (%)</label>
          <input value={annualRate} onChange={e => setAnnualRate(e.target.value)} type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Investment Period (Years)</label>
          <input value={years} onChange={e => setYears(e.target.value)} type="number" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
        </div>
      </div>
      
      {/* Step-up SIP Options */}
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
              Enable Step-up SIP
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
            SIP amount will increase by {stepUpRate || 0}% each year
          </p>
        )}
      </div>
      
      <button onClick={calculate} className="px-6 py-2 bg-blue-600 text-white rounded">Calculate</button>
      {result && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Investment Results
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Total Investment</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{fmt(result.totalInvestment)}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Lumpsum Value</div>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{fmt(result.lumpsumValue)}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">SIP Value</div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">{fmt(result.sipValue)}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Total Value</div>
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{fmt(result.totalValue)}</div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Total Returns</div>
              <div className="text-3xl font-bold text-green-600 dark:text-green-400">{fmt(result.totalReturns)}</div>
              {stepUpEnabled && (
                <div className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  With {stepUpRate}% annual step-up in SIP
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 