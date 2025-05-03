'use client';

import React, { useState } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

interface DateRangeSelectorProps {
  onDateRangeChange: (startDate: string | null, endDate: string | null) => void;
  clearPeriodSelection: () => void;
  disabled?: boolean;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({ 
  onDateRangeChange,
  clearPeriodSelection,
  disabled = false
}) => {
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [isCustomRange, setIsCustomRange] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Set max date to today for the date pickers
  const today = new Date();
  const formattedToday = format(today, 'yyyy-MM-dd');
  
  // Set a reasonable min date (e.g., 20 years ago) to prevent very old dates
  const minDate = new Date(today);
  minDate.setFullYear(today.getFullYear() - 20);
  const formattedMinDate = format(minDate, 'yyyy-MM-dd');

  // Handle custom date range toggle
  const handleToggleCustomRange = () => {
    if (disabled) return;
    
    const newIsCustomRange = !isCustomRange;
    setIsCustomRange(newIsCustomRange);
    
    if (!newIsCustomRange) {
      // Clear the date range
      setStartDate('');
      setEndDate('');
      setError(null);
      onDateRangeChange(null, null);
    } else {
      // When enabling custom range, clear the period buttons selection
      clearPeriodSelection();
    }
  };

  // Validate date selection
  const validateDateRange = (start: string, end: string): boolean => {
    if (!start || !end) return false;
    
    const startDateObj = new Date(start);
    const endDateObj = new Date(end);
    
    // Check if dates are valid
    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      setError('Invalid date format');
      return false;
    }
    
    // Check if start date is before end date
    if (startDateObj > endDateObj) {
      setError('Start date must be before end date');
      return false;
    }
    
    // Check if end date is not in the future
    if (endDateObj > today) {
      setError('End date cannot be in the future');
      return false;
    }
    
    // Clear any existing error
    setError(null);
    return true;
  };

  // Handle apply button click
  const handleApply = () => {
    if (disabled) return;
    
    if (validateDateRange(startDate, endDate)) {
      setIsSubmitting(true);
      
      // Apply with a small delay to show the animation
      setTimeout(() => {
        onDateRangeChange(startDate, endDate);
        setIsSubmitting(false);
      }, 300);
    }
  };

  return (
    <motion.div 
      className="mb-6 app-card p-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div 
            className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${
              isCustomRange ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={handleToggleCustomRange}
          >
            <motion.div 
              className="bg-white w-4 h-4 rounded-full shadow-sm"
              animate={{ x: isCustomRange ? 16 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </div>
          <label htmlFor="customRange" className={`text-sm font-medium ${disabled ? 'opacity-50' : ''}`}>
            Custom Date Range
          </label>
        </div>
        
        <AnimatePresence>
          {isCustomRange && startDate && endDate && (
            <motion.button
              className={`btn-primary btn-sm flex items-center gap-1 ${isSubmitting || disabled ? 'opacity-70' : ''}`}
              disabled={isSubmitting || disabled}
              onClick={handleApply}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Updating</span>
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  <span>Apply</span>
                </>
              )}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      
      <AnimatePresence>
        {isCustomRange && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="grid grid-cols-2 gap-3 mb-2">
              <div>
                <label htmlFor="startDate" className="block text-xs font-medium text-slate-500 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  min={formattedMinDate}
                  max={endDate || formattedToday}
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    // Clear error when user is making changes
                    if (error) setError(null);
                  }}
                  className="app-input"
                  disabled={disabled}
                />
              </div>
              
              <div>
                <label htmlFor="endDate" className="block text-xs font-medium text-slate-500 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  min={startDate || formattedMinDate}
                  max={formattedToday}
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    // Clear error when user is making changes
                    if (error) setError(null);
                  }}
                  className="app-input"
                  disabled={disabled}
                />
              </div>
            </div>
            
            <AnimatePresence>
              {error && (
                <motion.div 
                  className="text-sm text-red-600 mt-1 flex items-center gap-1"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="text-xs text-slate-500 mt-2 flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Select dates and click Apply to calculate returns
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default DateRangeSelector; 