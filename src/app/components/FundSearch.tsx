'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useLocalStorage } from '../hooks/useLocalStorage';

interface FundItem {
  schemeCode: number;
  schemeName: string;
}

interface FundSearchProps {
  onSelectFund: (schemeCode: number, schemeName: string) => void;
  showFavoriteOption?: boolean;
}

const FundSearch: React.FC<FundSearchProps> = ({ onSelectFund, showFavoriteOption = true }) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchResults, setSearchResults] = useState<FundItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [error, setError] = useState<string | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);
  const [favoriteFunds, setFavoriteFunds] = useLocalStorage<FundItem[]>('favoriteFunds', []);

  // Search funds
  const searchFunds = async (query: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await axios.get<FundItem[]>(
        `https://api.mfapi.in/mf/search?q=${encodeURIComponent(query)}`
      );
      
      if (response.data && Array.isArray(response.data)) {
        // API returns an array directly, so we need to adapt our code
        const sortedResults = [...response.data].sort((a, b) => 
          a.schemeName.localeCompare(b.schemeName)
        );
        setSearchResults(sortedResults);
        
        if (sortedResults.length === 0) {
          setError('No funds found. Try a different search term.');
        }
      } else {
        setSearchResults([]);
        setError('No funds found. Try a different search term.');
      }
    } catch (error) {
      console.error('Error searching funds:', error);
      setSearchResults([]);
      setError('Error searching for funds. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search input
  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchTerm(query);
    setSelectedIndex(-1);
    
    // Clear previous timeout
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    // Only search if there's a valid query
    if (query.trim().length >= 3) {
      searchTimeout.current = setTimeout(() => {
        searchFunds(query);
      }, 500); // Debounce search to avoid too many requests
    } else {
      setSearchResults([]);
    }
  };

  // Handle selection
  const handleSelectFund = (schemeCode: number, schemeName: string) => {
    onSelectFund(schemeCode, schemeName);
    setSearchTerm('');
    setSearchResults([]);
  };

  // Toggle favorite
  const toggleFavorite = (fund: FundItem, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the parent click event
    
    const isFavorite = favoriteFunds.some((f: FundItem) => f.schemeCode === fund.schemeCode);
    
    if (isFavorite) {
      // Remove from favorites
      setFavoriteFunds(favoriteFunds.filter((f: FundItem) => f.schemeCode !== fund.schemeCode));
    } else {
      // Add to favorites
      setFavoriteFunds([...favoriteFunds, fund]);
    }
  };

  // Check if a fund is in favorites
  const isFavorite = (schemeCode: number) => {
    return favoriteFunds.some((f: FundItem) => f.schemeCode === schemeCode);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < searchResults.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : 0);
        break;
      case 'Enter':
        if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
          const selectedFund = searchResults[selectedIndex];
          handleSelectFund(selectedFund.schemeCode, selectedFund.schemeName);
        }
        break;
      case 'Escape':
        setSearchResults([]);
        break;
      default:
        break;
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center relative rounded-lg border border-slate-300 dark:border-slate-600 overflow-hidden">
        <input
          type="text"
          placeholder="Search for mutual funds..."
          className="w-full px-4 py-2 focus:outline-none bg-white dark:bg-slate-800"
          value={searchTerm}
          onChange={handleSearchInput}
          onKeyDown={handleKeyDown}
          id="search"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isLoading ? (
            <svg className="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : (
            <svg className="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          )}
        </div>
      </div>
      
      {/* Error message */}
      {error && (
        <div className="text-red-500 text-sm mt-1">
          {error}
        </div>
      )}
      
      {/* Results dropdown */}
      {searchResults.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {searchResults.map((fund, index) => (
            <div
              key={fund.schemeCode}
              className={`p-3 flex justify-between items-center cursor-pointer transition-colors ${
                index === selectedIndex 
                  ? 'bg-blue-50 dark:bg-blue-900/20' 
                  : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
              }`}
              onClick={() => handleSelectFund(fund.schemeCode, fund.schemeName)}
            >
              <div className="flex-grow pr-2">
                <div className="text-sm font-medium">{fund.schemeName}</div>
                <div className="text-xs text-slate-500">Code: {fund.schemeCode}</div>
              </div>
              {showFavoriteOption && (
                <button
                  className="text-slate-400 hover:text-yellow-500 transition-colors"
                  onClick={(e) => toggleFavorite(fund, e)}
                  title={isFavorite(fund.schemeCode) ? "Remove from favorites" : "Add to favorites"}
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5" 
                    fill={isFavorite(fund.schemeCode) ? "currentColor" : "none"} 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    color={isFavorite(fund.schemeCode) ? "#FBBF24" : "currentColor"}
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
                    />
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FundSearch; 