import { useState } from 'react';

type CalculationType = 'time_to_target' | 'amount_to_target';

interface CalculationResult {
  targetAmount: number;
  monthlyAmount: number;
  timeInMonths: number;
  timeInYears: number;
  totalInvestment: number;
  totalReturns: number;
  annualRate: number;
}

export default function TargetSIPCalculator() {
  const [calculationType, setCalculationType] = useState<CalculationType>('time_to_target');
  const [targetAmount, setTargetAmount] = useState('1000000');
  const [monthlyAmount, setMonthlyAmount] = useState('10000');
  const [timeInYears, setTimeInYears] = useState('10');
  const [annualRate, setAnnualRate] = useState('12');
  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculateTimeToTarget = () => {
    const target = parseFloat(targetAmount);
    const monthlyAmt = parseFloat(monthlyAmount);
    const rate = parseFloat(annualRate) / 100 / 12; // Monthly rate

    if (isNaN(target) || isNaN(monthlyAmt) || isNaN(rate) || target <= 0 || monthlyAmt <= 0 || rate <= 0) {
      return null;
    }

    // Using SIP formula: FV = P * [((1 + r)^n - 1) / r] * (1 + r)
    // Solving for n: n = ln(1 + (FV * r) / (P * (1 + r))) / ln(1 + r)
    const monthlyRate = rate;
    const monthlyPayment = monthlyAmt;
    
    if (monthlyRate === 0) {
      // Simple case without interest
      return Math.ceil(target / monthlyPayment);
    }

    const numerator = Math.log(1 + (target * monthlyRate) / (monthlyPayment * (1 + monthlyRate)));
    const denominator = Math.log(1 + monthlyRate);
    
    const months = numerator / denominator;
    
    return Math.ceil(months);
  };

  const calculateAmountToTarget = () => {
    const target = parseFloat(targetAmount);
    const years = parseFloat(timeInYears);
    const rate = parseFloat(annualRate) / 100 / 12; // Monthly rate
    const months = years * 12;

    if (isNaN(target) || isNaN(years) || isNaN(rate) || target <= 0 || years <= 0 || rate < 0) {
      return null;
    }

    if (rate === 0) {
      // Simple case without interest
      return target / months;
    }

    // Using SIP formula: FV = P * [((1 + r)^n - 1) / r] * (1 + r)
    // Solving for P: P = FV / ([((1 + r)^n - 1) / r] * (1 + r))
    const denominator = ((Math.pow(1 + rate, months) - 1) / rate) * (1 + rate);
    
    return target / denominator;
  };

  const handleCalculate = () => {
    if (calculationType === 'time_to_target') {
      const months = calculateTimeToTarget();
      if (months !== null) {
        const investment = parseFloat(monthlyAmount) * months;
        const returns = parseFloat(targetAmount) - investment;
        
        setResult({
          targetAmount: parseFloat(targetAmount),
          monthlyAmount: parseFloat(monthlyAmount),
          timeInMonths: months,
          timeInYears: Math.round((months / 12) * 100) / 100,
          totalInvestment: investment,
          totalReturns: returns,
          annualRate: parseFloat(annualRate)
        });
      }
    } else {
      const requiredAmount = calculateAmountToTarget();
      if (requiredAmount !== null) {
        const months = parseFloat(timeInYears) * 12;
        const investment = requiredAmount * months;
        const returns = parseFloat(targetAmount) - investment;
        
        setResult({
          targetAmount: parseFloat(targetAmount),
          monthlyAmount: requiredAmount,
          timeInMonths: months,
          timeInYears: parseFloat(timeInYears),
          totalInvestment: investment,
          totalReturns: returns,
          annualRate: parseFloat(annualRate)
        });
      }
    }
  };

  const fmt = (val: number) => val.toLocaleString('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  });

  return (
    <div className="space-y-8">
      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
        <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-3">Target-Based SIP Calculator</h3>
        <p className="text-sm text-purple-700 dark:text-purple-300">
          Calculate either the time needed to reach your financial target or the SIP amount required to achieve your goal in a specific timeframe.
        </p>
      </div>

      {/* Calculation Type Selection */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          What would you like to calculate?
        </label>
        <div className="space-y-2">
          <label className="flex items-center">
            <input
              type="radio"
              name="calculationType"
              value="time_to_target"
              checked={calculationType === 'time_to_target'}
              onChange={(e) => setCalculationType(e.target.value as CalculationType)}
              className="text-purple-600 focus:ring-purple-500"
            />
            <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">
              Time needed to reach target (with fixed SIP amount)
            </span>
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              name="calculationType"
              value="amount_to_target"
              checked={calculationType === 'amount_to_target'}
              onChange={(e) => setCalculationType(e.target.value as CalculationType)}
              className="text-purple-600 focus:ring-purple-500"
            />
            <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">
              SIP amount needed to reach target (in fixed timeframe)
            </span>
          </label>
        </div>
      </div>

      {/* Input Fields */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
        <h4 className="text-md font-medium text-slate-800 dark:text-slate-200 mb-4">
          {calculationType === 'time_to_target' ? 'Calculate Time to Target' : 'Calculate Required SIP Amount'}
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Target Amount (₹)
            </label>
            <input 
              type="number" 
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., 1000000"
            />
          </div>
          
          {calculationType === 'time_to_target' ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Monthly SIP Amount (₹)
              </label>
              <input 
                type="number" 
                value={monthlyAmount}
                onChange={(e) => setMonthlyAmount(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., 10000"
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Time Period (Years)
              </label>
              <input 
                type="number" 
                value={timeInYears}
                onChange={(e) => setTimeInYears(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                placeholder="e.g., 10"
              />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Expected Return (% p.a.)
            </label>
            <input 
              type="number" 
              value={annualRate}
              onChange={(e) => setAnnualRate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
              placeholder="e.g., 12"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button 
          onClick={handleCalculate} 
          className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        >
          {calculationType === 'time_to_target' ? 'Calculate Time Required' : 'Calculate SIP Amount'}
        </button>
      </div>

      {result && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-purple-200 dark:border-purple-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Calculation Results
          </h3>
          
          {/* Results Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Target Amount</div>
              <div className="text-xl font-bold text-purple-600 dark:text-purple-400">{fmt(result.targetAmount)}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Monthly SIP</div>
              <div className="text-xl font-bold text-slate-800 dark:text-slate-100">{fmt(result.monthlyAmount)}</div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Time Required</div>
              <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {result.timeInYears} {result.timeInYears === 1 ? 'year' : 'years'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                ({result.timeInMonths} months)
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Expected Returns</div>
              <div className="text-xl font-bold text-green-600 dark:text-green-400">{fmt(result.totalReturns)}</div>
            </div>
          </div>

          {/* Summary Information */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-600 dark:text-slate-400">Total Investment:</span>
                <div className="font-semibold text-slate-800 dark:text-slate-100">{fmt(result.totalInvestment)}</div>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Total Returns:</span>
                <div className="font-semibold text-green-600 dark:text-green-400">{fmt(result.totalReturns)}</div>
              </div>
              <div>
                <span className="text-slate-600 dark:text-slate-400">Annual Return Rate:</span>
                <div className="font-semibold text-slate-800 dark:text-slate-100">{result.annualRate}%</div>
              </div>
            </div>
          </div>

          {/* Key Insights */}
          <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
            <h5 className="font-medium text-slate-800 dark:text-slate-200 mb-2">Key Insights:</h5>
            <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
              {calculationType === 'time_to_target' ? (
                <>
                  <li>• You need to invest {fmt(result.monthlyAmount)} monthly for {result.timeInYears} years to reach your target</li>
                  <li>• Your total investment will be {fmt(result.totalInvestment)}</li>
                  <li>• Expected returns: {fmt(result.totalReturns)} ({((result.totalReturns / result.totalInvestment) * 100).toFixed(1)}% total return)</li>
                </>
              ) : (
                <>
                  <li>• You need to invest {fmt(result.monthlyAmount)} monthly to reach your target in {result.timeInYears} years</li>
                  <li>• Your total investment will be {fmt(result.totalInvestment)}</li>
                  <li>• Expected returns: {fmt(result.totalReturns)} ({((result.totalReturns / result.totalInvestment) * 100).toFixed(1)}% total return)</li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 