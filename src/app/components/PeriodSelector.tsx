'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';

type Period = '1m' | '3m' | '6m' | '1y' | '3y' | '5y' | 'all';

interface PeriodSelectorProps {
  currentPeriod: Period | null;
  onPeriodChange: (period: Period) => void;
  disabled: boolean;
  isLoading?: boolean;
}

const PeriodSelector: React.FC<PeriodSelectorProps> = ({ 
  currentPeriod, 
  onPeriodChange,
  disabled,
  isLoading = false
}) => {
  const [hoverPeriod, setHoverPeriod] = useState<Period | null>(null);
  
  const periods: { value: Period; label: string }[] = [
    { value: '1m', label: '1M' },
    { value: '3m', label: '3M' },
    { value: '6m', label: '6M' },
    { value: '1y', label: '1Y' },
    { value: '3y', label: '3Y' },
    { value: '5y', label: '5Y' },
    { value: 'all', label: 'MAX' },
  ];

  const handlePeriodChange = (period: Period) => {
    if (disabled || isLoading) return;
    onPeriodChange(period);
  };

  return (
    <div className="w-full mb-6">
      <div className="segmented-control relative overflow-hidden h-10 rounded-lg bg-slate-100 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600/50 transition-all">
        {periods.map((period) => {
          const isActive = currentPeriod === period.value;
          const isHovered = hoverPeriod === period.value;
          
          return (
            <button
              key={period.value}
              className={`
                segmented-control-item select-none 
                ${isActive ? 'active text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'} 
                ${(disabled || isLoading) ? 'opacity-60 cursor-not-allowed' : 'hover:text-slate-900 dark:hover:text-white'}
                transition-colors duration-200
              `}
              onClick={() => handlePeriodChange(period.value)}
              onMouseEnter={() => setHoverPeriod(period.value)}
              onMouseLeave={() => setHoverPeriod(null)}
              onFocus={() => setHoverPeriod(period.value)}
              onBlur={() => setHoverPeriod(null)}
              disabled={disabled || isLoading}
              aria-pressed={isActive}
            >
              {period.label}
              
              {/* Active indicator */}
              {isActive && (
                <motion.div 
                  className="absolute inset-0 bg-white dark:bg-slate-600 rounded-md -z-10 shadow-sm"
                  layoutId="periodHighlighter"
                  transition={{ 
                    type: "spring", 
                    bounce: 0.1, // Reduced bounce for less UI movement
                    duration: 0.35,
                    stiffness: 150,
                    damping: 18
                  }}
                />
              )}
              
              {/* Hover indicator */}
              {isHovered && !isActive && !disabled && !isLoading && (
                <motion.div 
                  className="absolute inset-0 bg-slate-200 dark:bg-slate-600/40 rounded-md -z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {disabled && (
        <div className="text-xs text-slate-500 mt-2 flex items-center">
          <svg className="w-3 h-3 mr-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>Custom date range is active</span>
        </div>
      )}
      
      {isLoading && !disabled && (
        <div className="text-xs text-slate-500 mt-2 flex items-center">
          <svg className="w-3 h-3 mr-1 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Updating chart data...</span>
        </div>
      )}
    </div>
  );
};

export default PeriodSelector; 