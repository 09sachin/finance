'use client';

import { useState } from 'react';
import Navigation from '../components/Navigation';
import { 
  fetchNiftyHistoricalData, 
  convertNiftyDataToInternal, 
  generateMockNiftyData,
  getIndexDateRange 
} from './api-utils';

interface NiftyIndex {
  Trading_Index_Name: string;
  Index_long_name: string;
}

interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

interface ReturnMetrics {
  totalReturn: number;
  annualizedReturn: number;
  startValue: number;
  endValue: number;
  days: number;
  volatility: number;
  maxDrawdown: number;
  sharpeRatio: number;
}

const NIFTY_INDICES: NiftyIndex[] = [
  { Trading_Index_Name: "Nifty 50", Index_long_name: "Nifty 50" },
  { Trading_Index_Name: "Nifty 100", Index_long_name: "Nifty 100" },
  { Trading_Index_Name: "Nifty 200", Index_long_name: "Nifty 200" },
  { Trading_Index_Name: "Nifty 500", Index_long_name: "Nifty 500" },
  { Trading_Index_Name: "Nifty Bank", Index_long_name: "Nifty Bank" },
  { Trading_Index_Name: "Nifty IT", Index_long_name: "Nifty IT" },
  { Trading_Index_Name: "Nifty Auto", Index_long_name: "Nifty Auto" },
  { Trading_Index_Name: "Nifty Pharma", Index_long_name: "Nifty Pharma" },
  { Trading_Index_Name: "Nifty FMCG", Index_long_name: "Nifty FMCG" },
  { Trading_Index_Name: "Nifty Energy", Index_long_name: "Nifty Energy" },
  { Trading_Index_Name: "Nifty Metal", Index_long_name: "Nifty Metal" },
  { Trading_Index_Name: "Nifty Realty", Index_long_name: "Nifty Realty" },
  { Trading_Index_Name: "Nifty Media", Index_long_name: "Nifty Media" },
  { Trading_Index_Name: "Nifty Next 50", Index_long_name: "Nifty Next 50" },
  { Trading_Index_Name: "NIFTY MIDCAP 100", Index_long_name: "NIFTY Midcap 100" },
  { Trading_Index_Name: "NIFTY SMLCAP 100", Index_long_name: "Nifty Smallcap 100" },
  { Trading_Index_Name: "Nifty Fin Service", Index_long_name: "Nifty Financial Services" },
  { Trading_Index_Name: "Nifty Pvt Bank", Index_long_name: "Nifty Private Bank" },
  { Trading_Index_Name: "Nifty PSU Bank", Index_long_name: "Nifty PSU Bank" },
  { Trading_Index_Name: "Nifty Infra", Index_long_name: "Nifty Infrastructure" }
];

export default function NiftyTrackerPage() {
  const [selectedIndex, setSelectedIndex] = useState<string>('Nifty 50');
  const [startDate, setStartDate] = useState<string>('2023-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState<boolean>(false);
  const [historicalData, setHistoricalData] = useState<HistoricalData[]>([]);
  const [returnMetrics, setReturnMetrics] = useState<ReturnMetrics | null>(null);
  const [error, setError] = useState<string>('');
  const [usingMockData, setUsingMockData] = useState<boolean>(false);
  const [rawApiData, setRawApiData] = useState<any[]>([]);

  const fetchNiftyData = async () => {
    setLoading(true);
    setError('');
    setUsingMockData(false);
    setRawApiData([]);
    
    try {
      let apiData;
      
      try {
        // Try to fetch real data first
        apiData = await fetchNiftyHistoricalData(selectedIndex, startDate, endDate);
        console.log('Real API Data:', apiData.slice(0, 3)); // Log first 3 records for debugging
      } catch (apiError) {
        // Fallback to mock data
        console.warn('API failed, using mock data:', apiError);
        setUsingMockData(true);
        apiData = generateMockNiftyData(startDate, endDate, selectedIndex);
        console.log('Mock API Data:', apiData.slice(0, 3)); // Log first 3 records for debugging
      }
      
      // Store raw API data for display
      setRawApiData(apiData.slice(0, 5)); // Store first 5 records for display
      
      // Calculate metrics from the converted data
      const convertedData = convertNiftyDataToInternal(apiData);
      setHistoricalData(convertedData);
      const metrics = calculateReturnMetrics(convertedData);
      setReturnMetrics(metrics);

    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const calculateReturnMetrics = (data: HistoricalData[]): ReturnMetrics => {
    if (data.length < 2) {
      return {
        totalReturn: 0,
        annualizedReturn: 0,
        startValue: 0,
        endValue: 0,
        days: 0,
        volatility: 0,
        maxDrawdown: 0,
        sharpeRatio: 0
      };
    }

    const startValue = data[0].close;
    const endValue = data[data.length - 1].close;
    const days = data.length;
    const years = days / 365.25;

    // Calculate returns
    const totalReturn = ((endValue - startValue) / startValue) * 100;
    const annualizedReturn = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;

    // Calculate daily returns for volatility
    const dailyReturns = [];
    for (let i = 1; i < data.length; i++) {
      const dailyReturn = (data[i].close - data[i-1].close) / data[i-1].close;
      dailyReturns.push(dailyReturn);
    }

    // Volatility (annualized)
    const avgDailyReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((acc, ret) => acc + Math.pow(ret - avgDailyReturn, 2), 0) / dailyReturns.length;
    const volatility = Math.sqrt(variance * 252) * 100; // Annualized volatility

    // Max Drawdown
    let peak = startValue;
    let maxDrawdown = 0;
    for (const point of data) {
      if (point.close > peak) {
        peak = point.close;
      }
      const drawdown = ((peak - point.close) / peak) * 100;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    // Sharpe Ratio (assuming 6% risk-free rate)
    const riskFreeRate = 6;
    const sharpeRatio = volatility > 0 ? (annualizedReturn - riskFreeRate) / volatility : 0;

    return {
      totalReturn,
      annualizedReturn,
      startValue,
      endValue,
      days,
      volatility,
      maxDrawdown,
      sharpeRatio
    };
  };

  const fmt = (val: number, decimals: number = 2) => {
    return val.toLocaleString('en-IN', { 
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals 
    });
  };

  const getReturnColor = (value: number) => {
    return value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-6 px-4 sm:py-8">
      <div className="container mx-auto">
        <Navigation />
        
        <header className="mb-6 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Nifty Index Return Tracker</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Track historical performance and returns of Nifty indices using real API data structure
          </p>
        </header>

        {/* API Status Warning */}
        {usingMockData && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <p className="text-yellow-700 dark:text-yellow-300">
                <strong>Demo Mode:</strong> Using simulated data matching real API structure. CORS restrictions prevent direct browser API calls.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Input Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Index Selection */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">Select Index</h3>
              <select
                value={selectedIndex}
                onChange={(e) => setSelectedIndex(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {NIFTY_INDICES.map((index) => (
                  <option key={index.Trading_Index_Name} value={index.Trading_Index_Name}>
                    {index.Index_long_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Selection */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">Date Range</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Quick Date Presets */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">Quick Presets</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: '1Y', months: 12 },
                  { label: '2Y', months: 24 },
                  { label: '3Y', months: 36 },
                  { label: '5Y', months: 60 }
                ].map((preset) => (
                  <button
                    key={preset.label}
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setMonth(start.getMonth() - preset.months);
                      setStartDate(start.toISOString().split('T')[0]);
                      setEndDate(end.toISOString().split('T')[0]);
                    }}
                    className="px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Fetch Button */}
            <button
              onClick={fetchNiftyData}
              disabled={loading}
              className={`w-full px-6 py-3 font-semibold rounded-lg shadow-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                loading
                  ? 'bg-slate-400 text-slate-600 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {loading ? 'Fetching Data...' : 'Get Returns'}
            </button>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-200 dark:border-red-800">
                <div className="flex items-center">
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-red-700 dark:text-red-300">{error}</p>
                </div>
              </div>
            )}

            {/* Raw API Data Sample */}
            {rawApiData.length > 0 && (
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
                <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Sample API Response Data ({usingMockData ? 'Mock' : 'Real'} Structure)
                </h4>
                <div className="bg-white dark:bg-slate-800 p-3 rounded text-xs font-mono overflow-x-auto">
                  <pre className="text-slate-600 dark:text-slate-300">
{JSON.stringify(rawApiData[0], null, 2)}
                  </pre>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  Showing 1 of {rawApiData.length} records. Real API returns data in format: INDEX_NAME, HistoricalDate, OPEN, HIGH, LOW, CLOSE
                </p>
              </div>
            )}

            {returnMetrics && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Total Return</div>
                    <div className={`text-2xl font-bold ${getReturnColor(returnMetrics.totalReturn)}`}>
                      {returnMetrics.totalReturn >= 0 ? '+' : ''}{fmt(returnMetrics.totalReturn)}%
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">CAGR</div>
                    <div className={`text-2xl font-bold ${getReturnColor(returnMetrics.annualizedReturn)}`}>
                      {returnMetrics.annualizedReturn >= 0 ? '+' : ''}{fmt(returnMetrics.annualizedReturn)}%
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Volatility</div>
                    <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                      {fmt(returnMetrics.volatility)}%
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 p-4 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Max Drawdown</div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      -{fmt(returnMetrics.maxDrawdown)}%
                    </div>
                  </div>
                </div>

                {/* Detailed Metrics */}
                <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center">
                    <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Performance Analysis: {selectedIndex}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Index:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{selectedIndex}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Period:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{returnMetrics.days} days</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Start Value:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{fmt(returnMetrics.startValue)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">End Value:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{fmt(returnMetrics.endValue)}</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Absolute Change:</span>
                        <span className={`font-semibold ${getReturnColor(returnMetrics.endValue - returnMetrics.startValue)}`}>
                          {returnMetrics.endValue - returnMetrics.startValue >= 0 ? '+' : ''}{fmt(returnMetrics.endValue - returnMetrics.startValue)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Sharpe Ratio:</span>
                        <span className="font-semibold text-slate-800 dark:text-slate-100">{fmt(returnMetrics.sharpeRatio, 3)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">Risk-Adjusted Return:</span>
                        <span className={`font-semibold ${getReturnColor(returnMetrics.volatility > 0 ? returnMetrics.annualizedReturn / returnMetrics.volatility : 0)}`}>
                          {fmt(returnMetrics.volatility > 0 ? returnMetrics.annualizedReturn / returnMetrics.volatility : 0, 3)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Investment Insights */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-blue-200 dark:border-blue-800">
                  <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-3">Investment Insights</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <p className="text-blue-700 dark:text-blue-300">
                        <strong>Performance:</strong> {returnMetrics.totalReturn >= 15 ? 'Excellent' : returnMetrics.totalReturn >= 8 ? 'Good' : returnMetrics.totalReturn >= 0 ? 'Positive' : 'Negative'}
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        <strong>Risk Level:</strong> {returnMetrics.volatility <= 15 ? 'Low' : returnMetrics.volatility <= 25 ? 'Moderate' : 'High'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-blue-700 dark:text-blue-300">
                        <strong>₹1L Investment:</strong> Would be worth ₹{fmt((100000 * (1 + returnMetrics.totalReturn / 100)), 0)}
                      </p>
                      <p className="text-blue-700 dark:text-blue-300">
                        <strong>Risk-Reward:</strong> {returnMetrics.sharpeRatio > 1 ? 'Attractive' : returnMetrics.sharpeRatio > 0.5 ? 'Moderate' : 'Poor'}
                      </p>
                    </div>
                  </div>
                </div>
              </>
            )}

            {!returnMetrics && !loading && !error && (
              <div className="bg-white dark:bg-slate-800 p-8 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  Nifty Index Return Analysis
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                  Select an index and date range to analyze historical performance using real Nifty API data structure.
                </p>
                
                {/* API Structure Demo */}
                <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg text-left">
                  <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Expected API Response Format:</h5>
                  <pre className="text-xs text-slate-600 dark:text-slate-400 font-mono overflow-x-auto">
{`{
  "d": "[
    {
      "RequestNumber": "His63886358703233832400",
      "Index Name": "",
      "INDEX_NAME": "Nifty Energy",
      "HistoricalDate": "28 Jun 2023",
      "OPEN": "24373.75",
      "HIGH": "24600.65",
      "LOW": "24216.35",
      "CLOSE": "24554.45"
    }
  ]"
}`}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 