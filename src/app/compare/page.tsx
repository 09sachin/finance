'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import FundSearch from '../components/FundSearch';
import PeriodSelector from '../components/PeriodSelector';
import DateRangeSelector from '../components/DateRangeSelector';
import FundComparison from '../components/FundComparison';
import Navigation from '../components/Navigation';

type Period = '1m' | '3m' | '6m' | '1y' | '3y' | '5y' | 'all';

interface SelectedFund {
  schemeCode: number;
  schemeName: string;
}

export default function ComparePage() {
  const [selectedFunds, setSelectedFunds] = useState<SelectedFund[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<Period | null>('1y');
  const [startDate, setStartDate] = useState<string | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState<boolean>(true);
  
  // Maximum number of funds to compare
  const MAX_FUNDS = 3;
  
  // Handle fund selection
  const handleFundSelect = (schemeCode: number, schemeName: string) => {
    // Check if fund is already selected
    if (selectedFunds.some(fund => fund.schemeCode === schemeCode)) {
      return;
    }
    
    // Check if we've reached the maximum number of funds
    if (selectedFunds.length >= MAX_FUNDS) {
      // We could show a notification here that max funds reached
      return;
    }
    
    // Add the fund to selected funds
    setSelectedFunds(prevFunds => [
      ...prevFunds,
      { schemeCode, schemeName }
    ]);
  };
  
  // Handle removing a fund from comparison
  const handleRemoveFund = (schemeCode: number) => {
    setSelectedFunds(prevFunds => 
      prevFunds.filter(fund => fund.schemeCode !== schemeCode)
    );
  };
  
  // Handle period change
  const handlePeriodChange = (period: Period) => {
    setSelectedPeriod(period);
    // Clear custom date range when a period is selected
    setStartDate(null);
    setEndDate(null);
  };
  
  // Handle date range change
  const handleDateRangeChange = (start: string | null, end: string | null) => {
    setStartDate(start);
    setEndDate(end);
  };
  
  // Clear period selection (used when switching to custom date range)
  const clearPeriodSelection = () => {
    setSelectedPeriod(null);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-6 px-4 sm:py-8">
      <div className="container mx-auto">
        <Navigation />
        
        <header className="mb-6 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Fund Comparison</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Compare performance metrics of multiple mutual funds side by side
          </p>
        </header>
        
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {/* Search area */}
          <div className="app-card">
            <div 
              className="p-4 flex items-center justify-between cursor-pointer"
              onClick={() => setSearchOpen(!searchOpen)}
            >
              <div className="flex items-center gap-2">
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`h-5 w-5 transition-transform ${searchOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
                <h2 className="text-lg font-medium">
                  Add Funds to Compare {selectedFunds.length > 0 ? `(${selectedFunds.length}/${MAX_FUNDS})` : ''}
                </h2>
              </div>
              <span className="text-sm text-slate-500 hidden sm:inline-block">
                {searchOpen ? 'Click to collapse' : 'Click to expand'}
              </span>
            </div>
            
            <AnimatePresence>
              {searchOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4">
                    <FundSearch onSelectFund={handleFundSelect} />
                    
                    {selectedFunds.length > 0 && (
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-2">
                          {selectedFunds.map(fund => (
                            <div 
                              key={fund.schemeCode}
                              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-full px-3 py-1.5"
                            >
                              <span className="text-sm truncate max-w-[150px] sm:max-w-[250px]">{fund.schemeName}</span>
                              <button
                                className="text-slate-400 hover:text-red-500 transition-colors flex-shrink-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveFund(fund.schemeCode);
                                }}
                                aria-label="Remove fund"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Time period selection */}
          {selectedFunds.length > 0 && (
            <div className="app-card p-4">
              <h2 className="text-lg font-medium mb-4">Time Period Selection</h2>
              
              {/* Date range selector */}
              <DateRangeSelector 
                onDateRangeChange={handleDateRangeChange}
                clearPeriodSelection={clearPeriodSelection}
              />
              
              {/* Period selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Predefined Periods
                </label>
                <PeriodSelector 
                  currentPeriod={selectedPeriod} 
                  onPeriodChange={handlePeriodChange}
                  disabled={!!startDate && !!endDate}
                />
              </div>
            </div>
          )}
          
          {/* Comparison chart and metrics */}
          {selectedFunds.length > 0 && (
            <FundComparison 
              selectedFunds={selectedFunds}
              period={selectedPeriod || '1y'}
              startDate={startDate}
              endDate={endDate}
              onRemoveFund={handleRemoveFund}
            />
          )}
          
          {/* Empty state */}
          {selectedFunds.length === 0 && (
            <div className="text-center py-8 sm:py-12 app-card">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 sm:h-16 w-12 sm:w-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <h3 className="text-xl font-medium mb-2">No Funds Selected</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto px-4">
                Search for and select up to {MAX_FUNDS} mutual funds above to compare their historical performance.
              </p>
              <button 
                className="btn-primary"
                onClick={() => setSearchOpen(true)}
              >
                Add Funds to Compare
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 