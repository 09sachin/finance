'use client';

import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useRouter } from 'next/navigation';
import Navigation from '../components/Navigation';
import FundSearch from '../components/FundSearch';

interface FundItem {
  schemeCode: number;
  schemeName: string;
}

const FavoritesPage: React.FC = () => {
  const [favoriteFunds, setFavoriteFunds] = useLocalStorage<FundItem[]>('favoriteFunds', []);
  const router = useRouter();
  
  // Handle removing a fund from favorites
  const removeFavorite = (schemeCode: number) => {
    setFavoriteFunds(favoriteFunds.filter(fund => fund.schemeCode !== schemeCode));
  };
  
  // Navigate to SIP calculator with selected fund
  const goToSipCalculator = (schemeCode: number, schemeName: string) => {
    router.push(`/sip-calculator?fund=${schemeCode}`);
  };
  
  // Navigate to SIP comparison with selected fund
  const goToSipComparison = (schemeCode: number, schemeName: string) => {
    router.push(`/sip-compare?fund=${schemeCode}`);
  };
  
  // Handle adding a new fund to favorites
  const addToFavorites = (schemeCode: number, schemeName: string) => {
    // Check if fund is already in favorites
    if (!favoriteFunds.some(fund => fund.schemeCode === schemeCode)) {
      setFavoriteFunds([...favoriteFunds, { schemeCode, schemeName }]);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-6 px-4 sm:py-8">
      <div className="container mx-auto">
        <Navigation />
        
        <header className="mb-6 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Favorite Funds</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Manage your favorite mutual funds for quick access
          </p>
        </header>
        
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {/* Left column: Add new favorites */}
          <div className="sm:col-span-1">
            <div className="app-card p-4">
              <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4">Add New Favorite</h2>
              <FundSearch onSelectFund={addToFavorites} />
            </div>
          </div>
          
          {/* Right column: Favorite funds list */}
          <div className="sm:col-span-3">
            <div className="app-card p-4">
              <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4">
                Your Favorite Funds ({favoriteFunds.length})
              </h2>
              
              {favoriteFunds.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {favoriteFunds.map(fund => (
                    <div 
                      key={fund.schemeCode}
                      className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between flex-wrap gap-2">
                        <div>
                          <h3 className="font-medium text-slate-800 dark:text-slate-200">{fund.schemeName}</h3>
                          <p className="text-sm text-slate-500 mt-1">Scheme Code: {fund.schemeCode}</p>
                        </div>
                        <div className="flex items-center">
                          <button
                            onClick={() => removeFavorite(fund.schemeCode)}
                            className="text-slate-400 hover:text-red-500 transition-colors p-2"
                            title="Remove from favorites"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => goToSipCalculator(fund.schemeCode, fund.schemeName)}
                          className="flex-1 px-3 py-2 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/20 dark:hover:bg-blue-800/40 text-blue-700 dark:text-blue-400 rounded-md transition-colors text-sm font-medium"
                        >
                          SIP Calculator
                        </button>
                        <button
                          onClick={() => goToSipComparison(fund.schemeCode, fund.schemeName)}
                          className="flex-1 px-3 py-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/20 dark:hover:bg-green-800/40 text-green-700 dark:text-green-400 rounded-md transition-colors text-sm font-medium"
                        >
                          Compare SIP
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
                    />
                  </svg>
                  <h3 className="text-xl font-medium mb-2">No Favorite Funds</h3>
                  <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                    Search for mutual funds on the left and add them to your favorites for quick access in the future.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FavoritesPage; 