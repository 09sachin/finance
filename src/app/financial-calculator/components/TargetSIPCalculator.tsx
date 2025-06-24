import { useState } from 'react';

type CalculationType = 'time_to_target' | 'amount_to_target';

interface LumpsumEntry {
  id: string;
  amount: string;
  investmentDate: string;
}

interface CalculationResult {
  targetAmount: number;
  monthlyAmount: number;
  timeInMonths: number;
  timeInYears: number;
  totalInvestment: number;
  totalReturns: number;
  annualRate: number;
  lumpsumContribution: number;
  lumpsumFutureValue: number;
  adjustedSIPTarget: number;
}

export default function TargetSIPCalculator() {
  const [calculationType, setCalculationType] = useState<CalculationType>('time_to_target');
  const [targetAmount, setTargetAmount] = useState('1000000');
  const [monthlyAmount, setMonthlyAmount] = useState('10000');
  const [timeInYears, setTimeInYears] = useState('10');
  const [annualRate, setAnnualRate] = useState('12');
  const [includeLumpsum, setIncludeLumpsum] = useState(false);
  const [lumpsumEntries, setLumpsumEntries] = useState<LumpsumEntry[]>([{
    id: '1',
    amount: '100000',
    investmentDate: new Date().toISOString().split('T')[0]
  }]);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const addLumpsumEntry = () => {
    const newEntry: LumpsumEntry = {
      id: Date.now().toString(),
      amount: '50000',
      investmentDate: new Date().toISOString().split('T')[0]
    };
    setLumpsumEntries([...lumpsumEntries, newEntry]);
  };

  const removeLumpsumEntry = (id: string) => {
    if (lumpsumEntries.length > 1) {
      setLumpsumEntries(lumpsumEntries.filter(entry => entry.id !== id));
    }
  };

  const updateLumpsumEntry = (id: string, field: keyof LumpsumEntry, value: string) => {
    setLumpsumEntries(lumpsumEntries.map(entry => 
      entry.id === id ? { ...entry, [field]: value } : entry
    ));
  };

  const calculateLumpsumFutureValue = (targetDate: Date) => {
    if (!includeLumpsum) return { totalFV: 0, totalInvestment: 0 };

    const rate = parseFloat(annualRate) / 100;
    let totalFV = 0;
    let totalInvestment = 0;

    for (const entry of lumpsumEntries) {
      const amount = parseFloat(entry.amount);
      const investDate = new Date(entry.investmentDate);
      
      if (isNaN(amount) || amount <= 0) continue;
      if (investDate > targetDate) continue;

      const yearsToTarget = (targetDate.getTime() - investDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (yearsToTarget < 0) continue;

      const futureValue = amount * Math.pow(1 + rate, yearsToTarget);
      totalFV += futureValue;
      totalInvestment += amount;
    }

    return { totalFV, totalInvestment };
  };

  const calculateTimeToTarget = () => {
    const target = parseFloat(targetAmount);
    const monthlyAmt = parseFloat(monthlyAmount);
    const rate = parseFloat(annualRate) / 100 / 12; // Monthly rate

    if (isNaN(target) || isNaN(monthlyAmt) || isNaN(rate) || target <= 0 || monthlyAmt <= 0 || rate <= 0) {
      return null;
    }

    // Calculate lumpsum future values for different time periods to find optimal time
    let months = 1;
    let found = false;
    const maxMonths = 50 * 12; // Maximum 50 years

    while (months <= maxMonths && !found) {
      const targetDate = new Date();
      targetDate.setMonth(targetDate.getMonth() + months);
      
      const lumpsumData = calculateLumpsumFutureValue(targetDate);
      const adjustedTarget = target - lumpsumData.totalFV;
      
      if (adjustedTarget <= 0) {
        // Lumpsum alone is enough
        found = true;
        break;
      }

      // Calculate SIP future value for this period
      const sipFV = monthlyAmt * ((Math.pow(1 + rate, months) - 1) / rate) * (1 + rate);
      
      if (sipFV >= adjustedTarget) {
        found = true;
        break;
      }
      
      months++;
    }

    return found ? months : null;
  };

  const calculateAmountToTarget = () => {
    const target = parseFloat(targetAmount);
    const years = parseFloat(timeInYears);
    const rate = parseFloat(annualRate) / 100 / 12; // Monthly rate
    const months = years * 12;

    if (isNaN(target) || isNaN(years) || isNaN(rate) || target <= 0 || years <= 0 || rate < 0) {
      return null;
    }

    // Calculate lumpsum contribution
    const targetDate = new Date();
    targetDate.setFullYear(targetDate.getFullYear() + years);
    const lumpsumData = calculateLumpsumFutureValue(targetDate);
    
    const adjustedTarget = target - lumpsumData.totalFV;
    
    if (adjustedTarget <= 0) {
      // Lumpsum alone is enough
      return 0;
    }

    if (rate === 0) {
      // Simple case without interest
      return adjustedTarget / months;
    }

    // Using SIP formula: FV = P * [((1 + r)^n - 1) / r] * (1 + r)
    // Solving for P: P = FV / ([((1 + r)^n - 1) / r] * (1 + r))
    const denominator = ((Math.pow(1 + rate, months) - 1) / rate) * (1 + rate);
    
    return adjustedTarget / denominator;
  };

  const handleCalculate = () => {
    if (calculationType === 'time_to_target') {
      const months = calculateTimeToTarget();
      if (months !== null) {
        const targetDate = new Date();
        targetDate.setMonth(targetDate.getMonth() + months);
        const lumpsumData = calculateLumpsumFutureValue(targetDate);
        
        const sipInvestment = parseFloat(monthlyAmount) * months;
        const totalInvestment = sipInvestment + lumpsumData.totalInvestment;
        const returns = parseFloat(targetAmount) - totalInvestment;
        
        setResult({
          targetAmount: parseFloat(targetAmount),
          monthlyAmount: parseFloat(monthlyAmount),
          timeInMonths: months,
          timeInYears: Math.round((months / 12) * 100) / 100,
          totalInvestment: totalInvestment,
          totalReturns: returns,
          annualRate: parseFloat(annualRate),
          lumpsumContribution: lumpsumData.totalInvestment,
          lumpsumFutureValue: lumpsumData.totalFV,
          adjustedSIPTarget: parseFloat(targetAmount) - lumpsumData.totalFV
        });
      }
    } else {
      const requiredAmount = calculateAmountToTarget();
      if (requiredAmount !== null) {
        const years = parseFloat(timeInYears);
        const targetDate = new Date();
        targetDate.setFullYear(targetDate.getFullYear() + years);
        const lumpsumData = calculateLumpsumFutureValue(targetDate);
        
        const months = years * 12;
        const sipInvestment = requiredAmount * months;
        const totalInvestment = sipInvestment + lumpsumData.totalInvestment;
        const returns = parseFloat(targetAmount) - totalInvestment;
        
        setResult({
          targetAmount: parseFloat(targetAmount),
          monthlyAmount: requiredAmount,
          timeInMonths: months,
          timeInYears: years,
          totalInvestment: totalInvestment,
          totalReturns: returns,
          annualRate: parseFloat(annualRate),
          lumpsumContribution: lumpsumData.totalInvestment,
          lumpsumFutureValue: lumpsumData.totalFV,
          adjustedSIPTarget: parseFloat(targetAmount) - lumpsumData.totalFV
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
          Optionally include lumpsum investments to see their impact on your targets.
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

      {/* Lumpsum Investment Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-slate-800 dark:text-slate-200">
            Lumpsum Investments (Optional)
          </h4>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={includeLumpsum}
              onChange={(e) => setIncludeLumpsum(e.target.checked)}
              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
            />
            <span className="ml-2 text-sm text-slate-700 dark:text-slate-300">
              Include lumpsum investments
            </span>
          </label>
        </div>

        {includeLumpsum && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Add one-time lumpsum investments that will contribute towards your target.
            </p>
            
            {lumpsumEntries.map((entry, index) => (
              <div key={entry.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Lumpsum Amount (₹)
                  </label>
                  <input 
                    type="number" 
                    value={entry.amount}
                    onChange={(e) => updateLumpsumEntry(entry.id, 'amount', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    placeholder="e.g., 100000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Investment Date
                  </label>
                  <input 
                    type="date" 
                    value={entry.investmentDate}
                    onChange={(e) => updateLumpsumEntry(entry.id, 'investmentDate', e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                  />
                </div>
                <div className="flex items-end">
                  {lumpsumEntries.length > 1 && (
                    <button 
                      onClick={() => removeLumpsumEntry(entry.id)}
                      className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
            
            <button 
              onClick={addLumpsumEntry}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow-sm transition-colors"
            >
              + Add Another Lumpsum
            </button>
          </div>
        )}
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

          {/* Lumpsum Impact (if included) */}
          {includeLumpsum && result.lumpsumContribution > 0 && (
            <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                Lumpsum Investment Impact
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Total Lumpsum Investment:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{fmt(result.lumpsumContribution)}</div>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Lumpsum Future Value:</span>
                  <div className="font-semibold text-green-600 dark:text-green-400">{fmt(result.lumpsumFutureValue)}</div>
                </div>
                <div>
                  <span className="text-blue-700 dark:text-blue-300">Adjusted SIP Target:</span>
                  <div className="font-semibold text-slate-800 dark:text-slate-100">{fmt(result.adjustedSIPTarget)}</div>
                </div>
              </div>
            </div>
          )}

          {/* Summary Information */}
          <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-3">Investment Breakdown</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-600 dark:text-slate-400">Total Investment:</span>
                <div className="font-semibold text-slate-800 dark:text-slate-100">{fmt(result.totalInvestment)}</div>
                {includeLumpsum && result.lumpsumContribution > 0 && (
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    (SIP: {fmt(result.totalInvestment - result.lumpsumContribution)} + Lumpsum: {fmt(result.lumpsumContribution)})
                  </div>
                )}
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
                  <li>• You need to invest {fmt(result.monthlyAmount)} monthly{includeLumpsum && result.lumpsumContribution > 0 ? ` plus ${fmt(result.lumpsumContribution)} in lumpsum` : ''} for {result.timeInYears} years to reach your target</li>
                  <li>• Your total investment will be {fmt(result.totalInvestment)}</li>
                  <li>• Expected returns: {fmt(result.totalReturns)} ({((result.totalReturns / result.totalInvestment) * 100).toFixed(1)}% total return)</li>
                  {includeLumpsum && result.lumpsumContribution > 0 && (
                    <li>• Lumpsum investments will grow to {fmt(result.lumpsumFutureValue)}, reducing your SIP target to {fmt(result.adjustedSIPTarget)}</li>
                  )}
                </>
              ) : (
                <>
                  <li>• You need to invest {fmt(result.monthlyAmount)} monthly{includeLumpsum && result.lumpsumContribution > 0 ? ` plus ${fmt(result.lumpsumContribution)} in lumpsum` : ''} to reach your target in {result.timeInYears} years</li>
                  <li>• Your total investment will be {fmt(result.totalInvestment)}</li>
                  <li>• Expected returns: {fmt(result.totalReturns)} ({((result.totalReturns / result.totalInvestment) * 100).toFixed(1)}% total return)</li>
                  {includeLumpsum && result.lumpsumContribution > 0 && (
                    <li>• Lumpsum investments will grow to {fmt(result.lumpsumFutureValue)}, reducing your required SIP amount significantly</li>
                  )}
                </>
              )}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
} 