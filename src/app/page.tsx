'use client';

import { useState, useCallback } from 'react';
import MutualFundChart from './components/MutualFundChart';
import FundSearch from './components/FundSearch';
import PeriodSelector from './components/PeriodSelector';
import DateRangeSelector from './components/DateRangeSelector';
import Navigation from './components/Navigation';
import FavoritesFunds from './components/FavoritesFunds';

type Period = '1m' | '3m' | '6m' | '1y' | '3y' | '5y' | 'all';

export default function Home() {
  const [selectedSchemeCode, setSelectedSchemeCode] = useState<number | null>(null);
  const [selectedSchemeName, setSelectedSchemeName] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>('1y');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  // Handle fund selection
  const handleFundSelect = useCallback((schemeCode: number, schemeName: string) => {
    setIsLoading(true);
    setSelectedSchemeCode(schemeCode);
    setSelectedSchemeName(schemeName);
    
    // Use shorter loading state for smoother transitions
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  }, []);
  
  // Handle period change
  const handlePeriodChange = useCallback((period: Period) => {
    // Only update the loading state and period, don't remove components
    setIsLoading(true);
    setSelectedPeriod(period);
    
    // Clear custom date range when a period is selected
    setStartDate(null);
    setEndDate(null);
    
    // Shorter loading time for less UI disruption
    setTimeout(() => {
      setIsLoading(false);
    }, 300);
  }, []);
  
  // Handle date range change
  const handleDateRangeChange = useCallback((start: string | null, end: string | null) => {
    if (start && end) {
      setIsLoading(true);
    }
    
    setStartDate(start);
    setEndDate(end);
    
    if (start && end) {
      // Shorter loading time for smoother transitions
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
    }
  }, []);
  
  // Clear period selection (used when switching to custom date range)
  const clearPeriodSelection = useCallback(() => {
    setSelectedPeriod(null);
  }, []);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-6 px-4 sm:py-8">
      <div className="container mx-auto">
        <Navigation />
        
        <header className="mb-6 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Mutual Fund Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Track NAV history and analyze performance with visualizations, CAGR calculations, and custom date ranges
          </p>
        </header>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left sidebar with fund search */}
          <div className="lg:col-span-1 space-y-5">
            <FundSearch onSelectFund={handleFundSelect} />
            
            {/* Add Favorites section */}
            <FavoritesFunds onSelectFund={handleFundSelect} />
            
            {selectedSchemeCode && (
              <div className="space-y-5">
                <div className="app-card p-4">
                  <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4 border-b border-slate-100 dark:border-slate-700 pb-2">Time Period</h3>
                  
                  {/* Date range selector */}
                  <DateRangeSelector 
                    onDateRangeChange={handleDateRangeChange}
                    clearPeriodSelection={clearPeriodSelection}
                    disabled={isLoading}
                  />
                  
                  {/* Period selector */}
                  <div className="mb-1">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Predefined Periods
                    </label>
                    <PeriodSelector 
                      currentPeriod={selectedPeriod} 
                      onPeriodChange={handlePeriodChange}
                      disabled={!!startDate && !!endDate}
                      isLoading={isLoading}
                    />
                  </div>
                </div>
                
                <div className="hidden lg:block app-card p-4 text-sm">
                  <h3 className="text-sm font-medium uppercase text-slate-500 dark:text-slate-400 mb-3">Quick Help</h3>
                  <ul className="space-y-2 text-slate-600 dark:text-slate-300">
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Use <span className="font-medium">predefined periods</span> for quick analysis
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="font-medium">Custom date range</span> for specific time periods
                    </li>
                    <li className="flex items-start">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Hover over chart points to see detailed metrics
                    </li>
                  </ul>
                </div>
              </div>
            )}
          </div>
          
          {/* Main content area with chart */}
          <div className="lg:col-span-2 space-y-6">
            {!selectedSchemeCode ? (
              <div className="app-card p-6 sm:p-8 text-center">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                </div>
                
                <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-200 mb-4">
                  Mutual Fund Performance Analyzer
                </h2>
                <p className="text-slate-600 dark:text-slate-300 mb-8 max-w-lg mx-auto">
                  Search for a mutual fund on the left panel to view its historical performance data, calculated returns, and visual insights.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-left">
                  <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                    <div className="text-blue-600 dark:text-blue-400 font-medium mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Performance Analysis
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Track NAV history and visualize fund performance over custom time periods
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
                    <div className="text-green-600 dark:text-green-400 font-medium mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      CAGR Calculation
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Calculate compound annual growth rate to analyze long-term fund performance
                    </p>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                    <div className="text-purple-600 dark:text-purple-400 font-medium mb-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Custom Date Analysis
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Compare fund returns across specific date ranges that matter to you
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="min-h-[600px]">
                <MutualFundChart 
                  schemeCode={selectedSchemeCode} 
                  schemeName={selectedSchemeName}
                  period={selectedPeriod || '1y'}
                  startDate={startDate}
                  endDate={endDate}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
