import { useState } from 'react';
import xirr from 'xirr';

interface Flow { date: string; amount: string; }

export default function XIRRCalculator() {
  const [flows, setFlows] = useState<Flow[]>([{ date: new Date().toISOString().slice(0,10), amount: '-10000' }, { date: new Date().toISOString().slice(0,10), amount: '12000' }]);
  const [rate, setRate] = useState<number | null>(null);
  const [error, setError] = useState('');

  const updateFlow = (idx: number, key: keyof Flow, value: string) => {
    const nf = [...flows];
    nf[idx][key] = value;
    setFlows(nf);
  };
  const addFlow = () => setFlows([...flows, { date: new Date().toISOString().slice(0,10), amount: '' }]);
  const removeFlow = (idx: number) => setFlows(flows.filter((_, i) => i !== idx));

  const calculate = () => {
    setError('');
    try {
      const tx = flows.map(f => ({ amount: parseFloat(f.amount), when: new Date(f.date) }));
      const res = xirr(tx);
      setRate(res);
    } catch (e: any) {
      setError(e.message);
      setRate(null);
    }
  };

  const valid = flows.length >= 2 && flows.some(f => parseFloat(f.amount) > 0) && flows.some(f => parseFloat(f.amount) < 0);

  return (
    <div className="max-w-4xl mx-auto p-1 ">
      {/* Header */}
      

      {/* Cash Flows Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 px-6 py-4 border-b border-slate-200 dark:border-slate-600">
          <h3 className="text-xl font-semibold text-slate-800 dark:text-slate-200 flex items-center">
            <svg className="w-6 h-6 mr-3 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            Cash Flows
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Enter your investment and return dates with amounts
          </p>
        </div>
        
        <div className="p-6 space-y-4">
          {flows.map((f, idx) => (
            <div key={idx} className="group">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center p-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 hover:shadow-md transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-500">
                <div className="md:col-span-1 flex items-center justify-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-semibold">
                    {idx + 1}
                  </div>
                </div>
                
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Date</label>
                  <input 
                    type="date" 
                    value={f.date} 
                    onChange={e => updateFlow(idx,'date',e.target.value)} 
                    className="w-full px-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md" 
                  />
                </div>
                
                <div className="md:col-span-5">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-slate-500 dark:text-slate-400 font-medium">₹</span>
                    <input 
                      type="number" 
                      value={f.amount} 
                      onChange={e => updateFlow(idx,'amount',e.target.value)} 
                      placeholder="Enter amount (negative for investments)" 
                      className="w-full pl-8 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 shadow-sm hover:shadow-md" 
                    />
                  </div>
                </div>
                
                <div className="md:col-span-2 flex justify-center">
                  <button 
                    onClick={() => removeFlow(idx)} 
                    className="p-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105 group-hover:opacity-100 opacity-70"
                    title="Remove this cash flow"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
          
          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button 
              onClick={addFlow} 
              className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Cash Flow
            </button>
            
            <button 
              onClick={calculate} 
              disabled={!valid} 
              className="flex items-center justify-center px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              Calculate XIRR
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="animate-fadeIn bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl border border-red-200 dark:border-red-800 shadow-lg">
          <div className="flex items-start">
            <svg className="w-6 h-6 mr-3 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="text-lg font-semibold text-red-800 dark:text-red-300 mb-1">Calculation Error</h4>
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Results Display */}
      {rate !== null && (
        <div className="animate-slideUp bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-900/20 dark:via-teal-900/20 dark:to-cyan-900/20 p-8 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
              XIRR Calculation Complete
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Your annualized return rate based on the cash flows
            </p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-8 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <div className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-3">
                Annualized Return Rate
              </div>
              <div className="text-6xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
                {(rate * 100).toFixed(2)}%
              </div>
              <div className="flex items-center justify-center text-slate-500 dark:text-slate-400 space-x-4">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {flows.length} cash flows
                </div>
                <div className="w-1 h-1 bg-slate-400 rounded-full"></div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {rate > 0 ? 'Positive Return' : 'Negative Return'}
                </div>
              </div>
            </div>
          </div>
          
          {/* Performance Indicator */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {rate > 0.15 ? '🚀' : rate > 0.08 ? '📈' : rate > 0 ? '📊' : '📉'}
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                {rate > 0.15 ? 'Excellent' : rate > 0.08 ? 'Good' : rate > 0 ? 'Fair' : 'Poor'}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {((1 + rate) ** 5 - 1 * 100).toFixed(0)}%
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                5-Year Growth
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 text-center">
              <div className="text-lg font-bold text-slate-800 dark:text-slate-200">
                {((1 + rate) ** 10 - 1 * 100).toFixed(0)}%
              </div>
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1">
                10-Year Growth
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 