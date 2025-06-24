import { useState } from 'react';

interface SIPEntry {
  id: string;
  amount: string;
  startDate: string;
  endDate: string;
  annualRate: string;
  stepUpEnabled: boolean;
  stepUpRate: string;
}

export default function SIPCalculator() {
  const [maturityDate, setMaturityDate] = useState(() => {
    const date = new Date();
    date.setFullYear(date.getFullYear() + 10);
    return date.toISOString().split('T')[0];
  });
  
  const [sipEntries, setSipEntries] = useState<SIPEntry[]>([{
    id: '1',
    amount: '10000',
    startDate: new Date().toISOString().split('T')[0],
    endDate: (() => {
      const date = new Date();
      date.setFullYear(date.getFullYear() + 5);
      return date.toISOString().split('T')[0];
    })(),
    annualRate: '12',
    stepUpEnabled: false,
    stepUpRate: '0'
  }]);

  const [result, setResult] = useState<null | {
    totalInvestment: number;
    estimatedReturns: number;
    totalValue: number;
    breakdown: Array<{
      sipId: string;
      amount: number;
      months: number;
      investment: number;
      futureValue: number;
      returns: number;
      stepUpEnabled: boolean;
      stepUpRate: number;
    }>;
  }>(null);

  // Validation function
  const validateSIPEntry = (entry: SIPEntry) => {
    const errors: string[] = [];
    const amount = parseFloat(entry.amount);
    const rate = parseFloat(entry.annualRate);
    const startDate = new Date(entry.startDate);
    const endDate = new Date(entry.endDate);
    const maturity = new Date(maturityDate);

    if (isNaN(amount) || amount <= 0) {
      errors.push('Amount must be greater than 0');
    }
    if (isNaN(rate) || rate <= 0) {
      errors.push('Annual return rate must be greater than 0');
    }
    if (startDate >= endDate) {
      errors.push('End date must be after start date');
    }
    if (endDate > maturity) {
      errors.push('End date must be on or before maturity date');
    }
    if (startDate > maturity) {
      errors.push('Start date must be on or before maturity date');
    }

    return errors;
  };

  // Check if entry has validation errors
  const hasValidationErrors = (entry: SIPEntry) => {
    return validateSIPEntry(entry).length > 0;
  };

  // Check if any entry has errors
  const hasAnyValidationErrors = () => {
    return sipEntries.some(entry => hasValidationErrors(entry));
  };

  // Get validation errors for display
  const getValidationErrors = (entry: SIPEntry) => {
    return validateSIPEntry(entry);
  };

  const addSIPEntry = () => {
    const newEntry: SIPEntry = {
      id: Date.now().toString(),
      amount: '5000',
      startDate: new Date().toISOString().split('T')[0],
      endDate: (() => {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 3);
        return date.toISOString().split('T')[0];
      })(),
      annualRate: '12',
      stepUpEnabled: false,
      stepUpRate: '0'
    };
    setSipEntries([...sipEntries, newEntry]);
  };

  const removeSIPEntry = (id: string) => {
    if (sipEntries.length > 1) {
      setSipEntries(sipEntries.filter(entry => entry.id !== id));
    }
  };

  const updateSIPEntry = (id: string, field: keyof SIPEntry, value: string) => {
    setSipEntries(sipEntries.map(entry => 
      entry.id === id 
        ? { ...entry, [field]: field === 'stepUpEnabled' ? value === 'true' : value }
        : entry
    ));
  };

  // Update maturity date and adjust SIP end dates if needed
  const updateMaturityDate = (newMaturityDate: string) => {
    setMaturityDate(newMaturityDate);
    
    // Adjust SIP end dates if they exceed the new maturity date
    const updatedEntries = sipEntries.map(entry => {
      const endDate = new Date(entry.endDate);
      const maturity = new Date(newMaturityDate);
      
      if (endDate > maturity) {
        return { ...entry, endDate: newMaturityDate };
      }
      return entry;
    });
    
    setSipEntries(updatedEntries);
  };

  const calculateSIP = () => {
    // Don't calculate if there are validation errors
    if (hasAnyValidationErrors()) {
      return;
    }

    const maturity = new Date(maturityDate);
    let totalInvestment = 0;
    let totalFutureValue = 0;
    const breakdown: any[] = [];

    for (const entry of sipEntries) {
      const amount = parseFloat(entry.amount);
      const rate = parseFloat(entry.annualRate) / 100 / 12;
      const stepUpRate = entry.stepUpEnabled ? parseFloat(entry.stepUpRate) / 100 : 0;
      const startDate = new Date(entry.startDate);
      const endDate = new Date(entry.endDate);

      if (isNaN(amount) || isNaN(rate) || amount <= 0 || rate <= 0) continue;
      if (startDate >= endDate || endDate > maturity) continue;

      // Calculate months between start and end date
      const sipMonths = Math.max(0, Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
      
      // Calculate months from end date to maturity for growth
      const growthMonths = Math.max(0, Math.floor((maturity.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));

      if (sipMonths <= 0) continue;

      let sipFV = 0;
      let investment = 0;

      if (entry.stepUpEnabled && stepUpRate > 0) {
        // Step-up SIP calculation
        let currentAmount = amount;
        let monthsInCurrentYear = 0;
        
        for (let month = 1; month <= sipMonths; month++) {
          monthsInCurrentYear++;
          
          // Calculate future value for this month's investment
          const remainingMonths = sipMonths - month + 1;
          sipFV += currentAmount * Math.pow(1 + rate, remainingMonths);
          investment += currentAmount;
          
          // Increase amount at year end
          if (monthsInCurrentYear === 12) {
            currentAmount = currentAmount * (1 + stepUpRate);
            monthsInCurrentYear = 0;
          }
        }
      } else {
        // Regular SIP calculation
        sipFV = amount * ((Math.pow(1 + rate, sipMonths) - 1) / rate) * (1 + rate);
        investment = amount * sipMonths;
      }
      
      // Growth from end date to maturity
      const finalFV = sipFV * Math.pow(1 + rate, growthMonths);
      const returns = finalFV - investment;

      breakdown.push({
        sipId: entry.id,
        amount,
        months: sipMonths,
        investment,
        futureValue: finalFV,
        returns,
        stepUpEnabled: entry.stepUpEnabled,
        stepUpRate: stepUpRate * 100
      });

      totalInvestment += investment;
      totalFutureValue += finalFV;
    }

    setResult({
      totalInvestment,
      estimatedReturns: totalFutureValue - totalInvestment,
      totalValue: totalFutureValue,
      breakdown
    });
  };

  const fmt = (val: number) => val.toLocaleString('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  });

  return (
    <div className="space-y-8">
      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">Advanced SIP Calculator</h3>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Plan multiple SIP investments with different amounts, time periods, and expected returns. 
          Set your target maturity date and see detailed breakdowns.
        </p>
      </div>

      {/* Maturity Date */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-lg">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Target Maturity Date
        </label>
        <input 
          type="date" 
          value={maturityDate} 
          onChange={e => updateMaturityDate(e.target.value)}
          className="w-full md:w-auto px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
        />
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          All SIP end dates must be on or before this date
        </p>
      </div>

      {/* Validation Summary */}
      {hasAnyValidationErrors() && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-red-600 mr-2 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-sm font-semibold text-red-800 dark:text-red-300 mb-1">Validation Errors</h4>
              <p className="text-sm text-red-700 dark:text-red-300">
                Please fix the validation errors below before calculating returns.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SIP Entries */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">SIP Investments</h3>
          <button 
            onClick={addSIPEntry}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow-sm transition-colors"
          >
            + Add SIP
          </button>
        </div>

        {sipEntries.map((entry, index) => {
          const validationErrors = getValidationErrors(entry);
          const hasErrors = validationErrors.length > 0;

          return (
            <div key={entry.id} className={`bg-white dark:bg-slate-800 p-6 rounded-lg border shadow-sm ${
              hasErrors 
                ? 'border-red-300 dark:border-red-600 bg-red-50/30 dark:bg-red-900/10' 
                : 'border-slate-200 dark:border-slate-700'
            }`}>
              <div className="flex justify-between items-center mb-4">
                <h4 className="text-md font-medium text-slate-800 dark:text-slate-200">
                  SIP #{index + 1}
                  {hasErrors && (
                    <span className="ml-2 inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-full">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Errors
                    </span>
                  )}
                </h4>
                {sipEntries.length > 1 && (
                  <button 
                    onClick={() => removeSIPEntry(entry.id)}
                    className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
                  >
                    Remove
                  </button>
                )}
              </div>

              {/* Validation Errors Display */}
              {hasErrors && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                    {validationErrors.map((error, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="w-1 h-1 bg-red-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Amount (₹)
                </label>
                <input 
                  type="number" 
                  value={entry.amount}
                  onChange={e => updateSIPEntry(entry.id, 'amount', e.target.value)}
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    hasErrors ? 'border-red-300 dark:border-red-600' : 'border-slate-300 dark:border-slate-600'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Start Date
                </label>
                <input 
                  type="date" 
                  value={entry.startDate}
                  onChange={e => updateSIPEntry(entry.id, 'startDate', e.target.value)}
                  max={maturityDate}
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    hasErrors ? 'border-red-300 dark:border-red-600' : 'border-slate-300 dark:border-slate-600'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  End Date
                </label>
                <input 
                  type="date" 
                  value={entry.endDate}
                  onChange={e => updateSIPEntry(entry.id, 'endDate', e.target.value)}
                  max={maturityDate}
                  min={entry.startDate}
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    hasErrors ? 'border-red-300 dark:border-red-600' : 'border-slate-300 dark:border-slate-600'
                  }`}
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Must be on or before {new Date(maturityDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Expected Return (% p.a.)
                </label>
                <input 
                  type="number" 
                  value={entry.annualRate}
                  onChange={e => updateSIPEntry(entry.id, 'annualRate', e.target.value)}
                  className={`w-full px-3 py-2 bg-white dark:bg-slate-800 border rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                    hasErrors ? 'border-red-300 dark:border-red-600' : 'border-slate-300 dark:border-slate-600'
                  }`}
                />
              </div>
            </div>
            
            {/* Step-up SIP Options */}
            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
              <div className="flex items-center justify-between mb-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={entry.stepUpEnabled}
                    onChange={e => updateSIPEntry(entry.id, 'stepUpEnabled', e.target.checked.toString())}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                    Enable Step-up SIP
                  </span>
                </label>
                {entry.stepUpEnabled && (
                  <div className="w-32">
                    <input
                      type="number"
                      value={entry.stepUpRate}
                      onChange={e => updateSIPEntry(entry.id, 'stepUpRate', e.target.value)}
                      placeholder="% per year"
                      className="w-full px-2 py-1 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded text-slate-800 dark:text-slate-100"
                    />
                  </div>
                )}
              </div>
              {entry.stepUpEnabled && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  SIP amount will increase by {entry.stepUpRate || 0}% each year
                </p>
              )}
            </div>
          </div>
        )})}
      </div>

      <div className="flex justify-center">
        <button 
          onClick={calculateSIP}
          disabled={hasAnyValidationErrors()}
          className={`px-8 py-3 font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            hasAnyValidationErrors()
              ? 'bg-slate-400 text-slate-600 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          Calculate SIP Returns
        </button>
      </div>

      {result && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-6 rounded-xl border border-green-200 dark:border-green-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Investment Summary
          </h3>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
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

          {/* Detailed Breakdown */}
          {result.breakdown.length > 1 && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200">SIP-wise Breakdown</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">SIP</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Duration</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Investment</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Returns</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Maturity Value</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Step-up</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-600">
                    {result.breakdown.map((item, index) => (
                      <tr key={item.sipId} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                        <td className="px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-200">#{index + 1}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{fmt(item.amount)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{item.months}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{fmt(item.investment)}</td>
                        <td className="px-4 py-3 text-sm text-green-600 dark:text-green-400 font-medium">{fmt(item.returns)}</td>
                        <td className="px-4 py-3 text-sm text-blue-600 dark:text-blue-400 font-medium">{fmt(item.futureValue)}</td>
                        <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">{item.stepUpEnabled ? 'Yes' : 'No'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 