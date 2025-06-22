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
    <div className="space-y-4">
      {flows.map((f, idx) => (
        <div key={idx} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
          <input type="date" value={f.date} onChange={e => updateFlow(idx,'date',e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          <input type="number" value={f.amount} onChange={e => updateFlow(idx,'amount',e.target.value)} placeholder="Amount (negative for invest)" className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-blue-500 focus:border-blue-500" />
          <button onClick={() => removeFlow(idx)} className="p-2 bg-red-500 text-white rounded">Remove</button>
        </div>
      ))}
      <button onClick={addFlow} className="px-4 py-2 bg-green-600 text-white rounded">Add Flow</button>
      <button onClick={calculate} disabled={!valid} className="px-6 py-2 bg-blue-600 text-white rounded disabled:bg-slate-400 ml-4">Calculate</button>
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      )}
      
      {rate !== null && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 rounded-xl border border-emerald-200 dark:border-emerald-800">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center">
            <svg className="w-6 h-6 mr-2 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            XIRR Result
          </h3>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="text-center">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Annualized Return Rate</div>
              <div className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                {(rate * 100).toFixed(2)}%
              </div>
              <div className="text-sm text-slate-500 dark:text-slate-400">
                Based on {flows.length} cash flow entries
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 