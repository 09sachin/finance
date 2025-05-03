'use client';

import React, { useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { motion } from 'framer-motion';

interface FundItem {
  schemeCode: number;
  schemeName: string;
}

interface FavoritesFundsProps {
  onSelectFund: (schemeCode: number, schemeName: string) => void;
}

const FavoritesFunds: React.FC<FavoritesFundsProps> = ({ onSelectFund }) => {
  const [favoriteFunds, setFavoriteFunds] = useLocalStorage<FundItem[]>('favoriteFunds', []);
  const [isOpen, setIsOpen] = useState<boolean>(true);

  // Remove fund from favorites
  const removeFavorite = (event: React.MouseEvent, schemeCode: number) => {
    event.stopPropagation();
    setFavoriteFunds(favoriteFunds.filter((fund) => fund.schemeCode !== schemeCode));
  };

  return (
    <div className="app-card">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <h2 className="text-lg font-medium flex items-center">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 mr-2 text-yellow-500" 
              fill="currentColor" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
              />
            </svg>
            Favorite Funds {favoriteFunds.length > 0 && `(${favoriteFunds.length})`}
          </h2>
        </div>
        <span className="text-sm text-slate-500 hidden sm:inline-block">
          {isOpen ? 'Click to collapse' : 'Click to expand'}
        </span>
      </div>
      
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-4">
          {favoriteFunds.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
              {favoriteFunds.map((fund) => (
                <div 
                  key={fund.schemeCode}
                  className="bg-white dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors cursor-pointer flex justify-between items-center"
                  onClick={() => onSelectFund(fund.schemeCode, fund.schemeName)}
                >
                  <div>
                    <div className="font-medium text-slate-800 dark:text-slate-200 mb-1">{fund.schemeName}</div>
                    <div className="text-xs text-slate-500">Code: {fund.schemeCode}</div>
                  </div>
                  <button
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    onClick={(e) => removeFavorite(e, fund.schemeCode)}
                    title="Remove from favorites"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" 
                />
              </svg>
              <h3 className="text-lg font-medium mb-2">No Favorite Funds</h3>
              <p className="text-slate-500 max-w-xs mx-auto">
                Add funds to your favorites by clicking the star icon when searching for funds.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default FavoritesFunds; 