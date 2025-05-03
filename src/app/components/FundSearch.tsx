'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface Fund {
  schemeCode: number;
  schemeName: string;
  isinGrowth: string | null;
  isinDivReinvestment: string | null;
}

interface FundSearchProps {
  onSelectFund: (schemeCode: number, schemeName: string) => void;
}

const FundSearch: React.FC<FundSearchProps> = ({ onSelectFund }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [funds, setFunds] = useState<Fund[]>([]);
  const [filteredFunds, setFilteredFunds] = useState<Fund[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);


  // Fetch all funds on component mount (or we could implement pagination)
  useEffect(() => {
    const fetchFunds = async () => {
      setInitialLoading(true);
      try {
        const response = await axios.get('https://api.mfapi.in/mf');
        setFunds(response.data);
        setError(null);
      } catch (err) {
        setError('Failed to fetch mutual funds list');
        console.error(err);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchFunds();
  }, []);

  // Filter funds based on search term automatically when 3+ characters are typed
  useEffect(() => {
    if (searchTerm.length < 3) {
      setFilteredFunds([]);
      return;
    }

    setLoading(true);
    
    // Small delay to prevent excessive filtering while typing fast
    const debounceTimer = setTimeout(() => {
      const searchTermLower = searchTerm.toLowerCase();
      const filtered = funds
        .filter(fund => fund.schemeName.toLowerCase().includes(searchTermLower))
        .slice(0, 20); // Limit results to 20 funds
      
      setFilteredFunds(filtered);
      setLoading(false);
    }, 300);
    
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, funds]);

  // Generate loading skeletons for search results
  const renderSkeletons = () => {
    return Array(5).fill(0).map((_, index) => (
      <li key={`skeleton-${index}`} className="py-3 px-4 animate-pulse">
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
      </li>
    ));
  };

  return (
    <div className="app-card p-4">
      <div className="mb-4">
        <label htmlFor="search" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Search Mutual Funds
        </label>
        <div className="relative flex">
          <input
            type="text"
            id="search"
            className="app-input pl-4 pr-12 flex-grow"
            placeholder="Search by fund name (at least 3 characters)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            aria-autocomplete="none"
          />
          <div className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-slate-400">
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
          </div>
        </div>
        {searchTerm.length > 0 && searchTerm.length < 3 && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Type at least 3 characters to see suggestions</p>
        )}
      </div>
      
      {initialLoading ? (
        <div className="mt-4 rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700">
          <div className="animate-pulse p-8 flex flex-col items-center">
            <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-3/5 mb-4"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-4/5 mb-2"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-3/5"></div>
          </div>
        </div>
      ) : (
        <div className={`mt-4 max-h-96 overflow-y-auto rounded-lg overflow-hidden border border-slate-100 dark:border-slate-700 ${!searchTerm || (!loading && filteredFunds.length === 0 && searchTerm.length >= 3) ? '' : 'shadow-md'}`}>
          {searchTerm.length >= 3 && loading && (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {renderSkeletons()}
            </ul>
          )}
          
          {error && (
            <div className="py-4 px-3 text-center rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
          )}
          
          {!loading && filteredFunds.length === 0 && searchTerm.length >= 3 && (
            <div className="py-8 px-3 text-center text-slate-500 dark:text-slate-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              No funds found matching <span className="font-medium">&quot;{searchTerm}&quot;</span>
            </div>
          )}
          
          {!loading && filteredFunds.length > 0 && (
            <ul className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredFunds.map((fund) => (
                <li 
                  key={fund.schemeCode}
                  className="py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors relative group"
                  onClick={() => onSelectFund(fund.schemeCode, fund.schemeName)}
                >
                  <div className="flex items-start">
                    <div className="flex-grow pr-8">
                      <div className="font-medium text-blue-600 dark:text-blue-400 mb-1 line-clamp-2">{fund.schemeName}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-slate-400 dark:text-slate-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        <span className="truncate">Scheme Code: {fund.schemeCode}</span>
                      </div>
                    </div>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          
          {!searchTerm && !initialLoading && !error && (
            <div className="py-6 px-4 text-center text-slate-600 dark:text-slate-300">
              <div className="mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-blue-500 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <p className="mb-2 font-medium">Start typing to search mutual funds</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">Search by fund name, AMC, or category</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FundSearch; 