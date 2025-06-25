'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { format, differenceInMonths, parseISO, isValid, addMonths } from 'date-fns';
import { Line } from 'react-chartjs-2';
import Navigation from '../components/Navigation';
import FundSearch from '../components/FundSearch';
import FavoritesFunds from '../components/FavoritesFunds';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { useSearchParams } from 'next/navigation';
import { useLocalStorage } from '../hooks/useLocalStorage';
import SliderWithInput from '../components/SliderWithInput';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SelectedFund {
  schemeCode: number;
  schemeName: string;
}

interface FundData {
  date: string;
  nav: number;
}

interface ApiResponse {
  meta: {
    fund_house: string;
    scheme_type: string;
    scheme_category: string;
    scheme_code: number;
    scheme_name: string;
  };
  data: {
    date: string;
    nav: string;
  }[];
}

interface SIPResult {
  schemeCode: number;
  schemeName: string;
  totalInvestment: number;
  estimatedReturns: number;
  totalValue: number;
  absoluteReturn: number;
  xirr: number;
  finalUnits: number;
  endNav: number;
  color: string;
  timeline: {
    date: string;
    value: number;
  }[];
}

// Loading component for Suspense fallback
function SipCompareLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-6 px-4 sm:py-8">
      <div className="container mx-auto">
        <Navigation />
        <div className="flex justify-center items-center h-64">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-48 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
            <div className="h-4 w-64 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component wrapper that doesn't use searchParams
export default function SipComparePage() {
  return (
    <Suspense fallback={<SipCompareLoading />}>
      <SipCompareContent />
    </Suspense>
  );
}

// Content component that uses searchParams
function SipCompareContent() {
  const [selectedFunds, setSelectedFunds] = useState<SelectedFund[]>([]);
  const [amount, setAmount] = useState<number>(5000);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [initialLumpsum, setInitialLumpsum] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [searchOpen, setSearchOpen] = useState<boolean>(true);
  const [results, setResults] = useState<SIPResult[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  
  // Get search params at the component level
  const searchParams = useSearchParams();
  
  // Get favorites at the component level
  const [favoriteFunds] = useLocalStorage<{schemeCode: number, schemeName: string}[]>('favoriteFunds', []);
  
  // Colors for different funds in the charts
  const colors = [
    'rgba(59, 130, 246, 1)', // Blue
    'rgba(16, 185, 129, 1)', // Green
    'rgba(239, 68, 68, 1)',  // Red
    'rgba(168, 85, 247, 1)', // Purple
    'rgba(234, 88, 12, 1)'   // Orange
  ];
  
  // Maximum number of funds to compare
  const MAX_FUNDS = 15;
  
  // Safely parse a date string to handle different formats
  const safeParseDate = (dateString: string): Date => {
    try {
      // Try to parse ISO format
      let date = parseISO(dateString);
      
      // Check if valid
      if (!isValid(date)) {
        // Try to parse DD-MM-YYYY format
        const parts = dateString.split('-');
        if (parts.length === 3) {
          // Handle DD-MM-YYYY format
          date = new Date(
            parseInt(parts[2]), // year
            parseInt(parts[1]) - 1, // month (0-based)
            parseInt(parts[0]) // day
          );
        }
      }
      
      // If still invalid, use current date as fallback
      if (!isValid(date)) {
        console.error(`Invalid date: ${dateString}, using current date as fallback`);
        return new Date();
      }
      
      return date;
    } catch (e) {
      console.error("Date parsing error:", e);
      return new Date(); // Fallback to current date
    }
  };
  
  // Handle fund selection
  const handleFundSelect = (schemeCode: number, schemeName: string) => {
    // Check if fund is already selected
    if (selectedFunds.some(fund => fund.schemeCode === schemeCode)) {
      // Fund is already in the list, don't add it again
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
    
    // Hide results when adding a new fund
    setShowResults(false);
  };
  
  // Handle removing a fund from comparison
  const handleRemoveFund = (schemeCode: number) => {
    setSelectedFunds(prevFunds => 
      prevFunds.filter(fund => fund.schemeCode !== schemeCode)
    );
    
    // Hide results when removing a fund
    setShowResults(false);
  };
  
  // Fetch fund data from API
  const fetchFundData = async (schemeCode: number): Promise<FundData[]> => {
    try {
      const response = await axios.get<ApiResponse>(`https://api.mfapi.in/mf/${schemeCode}`);
      
      // Sort data by date (oldest first)
      const sortedData = [...response.data.data].sort((a, b) => 
        safeParseDate(a.date).getTime() - safeParseDate(b.date).getTime()
      );
      
      // Apply date range filter
      const startDateObj = startDate ? safeParseDate(startDate) : null;
      const endDateObj = endDate ? safeParseDate(endDate) : new Date();
      
      // Filter data within the date range
      const filteredData = sortedData.filter(item => {
        const itemDate = safeParseDate(item.date);
        if (startDateObj && itemDate < startDateObj) return false;
        if (endDateObj && itemDate > endDateObj) return false;
        return true;
      });
      
      // Convert API data to our format
      return filteredData.map(item => ({
        date: item.date,
        nav: parseFloat(item.nav)
      }));
    } catch (error) {
      console.error(`Error fetching data for fund ${schemeCode}:`, error);
      return [];
    }
  };
  
  // Calculate SIP investment value based on real data
  const calculateSIPValue = (
    fundData: FundData[], 
    sipAmount: number,
    initialInvestment: number
  ): { timeline: { date: string; value: number }[], totalValue: number, finalUnits: number, endNav: number } => {
    if (!fundData.length) {
      return { timeline: [], totalValue: 0, finalUnits: 0, endNav: 0 };
    }
    
    // Sort data chronologically to ensure correct order
    const sortedData = [...fundData].sort((a, b) => 
      safeParseDate(a.date).getTime() - safeParseDate(b.date).getTime()
    );
    
    let totalUnits = 0;
    let timeline: { date: string; value: number }[] = [];
    
    // Function to find the nearest NAV date
    const findNearestNAV = (targetDate: Date): { nav: number, date: string } => {
      // Convert target date to start of day for comparison
      const targetTime = new Date(
        targetDate.getFullYear(), 
        targetDate.getMonth(), 
        targetDate.getDate()
      ).getTime();
      
      // First, try to find exact match
      const exactMatch = sortedData.find(item => {
        const itemTime = new Date(
          safeParseDate(item.date).getFullYear(),
          safeParseDate(item.date).getMonth(),
          safeParseDate(item.date).getDate()
        ).getTime();
        return itemTime === targetTime;
      });
      
      if (exactMatch) {
        return { nav: exactMatch.nav, date: exactMatch.date };
      }
      
      // If exact match not found, find the next available date (after target date)
      const futureDate = sortedData.find(item => {
        const itemTime = new Date(
          safeParseDate(item.date).getFullYear(),
          safeParseDate(item.date).getMonth(),
          safeParseDate(item.date).getDate()
        ).getTime();
        return itemTime > targetTime;
      });
      
      if (futureDate) {
        return { nav: futureDate.nav, date: futureDate.date };
      }
      
      // If no future date available, find the closest previous date
      const pastDates = sortedData.filter(item => {
        const itemTime = new Date(
          safeParseDate(item.date).getFullYear(),
          safeParseDate(item.date).getMonth(),
          safeParseDate(item.date).getDate()
        ).getTime();
        return itemTime < targetTime;
      });
      
      if (pastDates.length > 0) {
        // Return the most recent past date
        const mostRecentPast = pastDates[pastDates.length - 1];
        return { nav: mostRecentPast.nav, date: mostRecentPast.date };
      }
      
      // Fallback to first available date if no other option
      return { 
        nav: sortedData[0].nav,
        date: sortedData[0].date 
      };
    };
    
    // Process initial lumpsum if available
    if (initialInvestment > 0 && sortedData.length > 0) {
      const startDateNAV = findNearestNAV(safeParseDate(sortedData[0].date));
      totalUnits = initialInvestment / startDateNAV.nav;
      
      timeline.push({
        date: format(safeParseDate(startDateNAV.date), 'MMM yyyy'),
        value: Math.round(initialInvestment)
      });
    }
    
    // Generate SIP dates (monthly dates)
    const sipDates: Date[] = [];
    if (sortedData.length > 0) {
      const firstDate = safeParseDate(sortedData[0].date);
      const lastDate = safeParseDate(sortedData[sortedData.length - 1].date);
      
      // Start with the first month (after initial investment)
      let currentDate = firstDate;
      if (initialInvestment > 0) {
        // If there was an initial investment, start SIP from next month
        currentDate = addMonths(currentDate, 1);
      }
      
      while (currentDate <= lastDate) {
        sipDates.push(new Date(currentDate));
        
        // Move to next month - same day of month
        currentDate = addMonths(currentDate, 1);
      }
    }
    
    // Process each SIP date
    sipDates.forEach((sipDate) => {
      // Find nearest NAV for this SIP date
      const { nav, date } = findNearestNAV(sipDate);
      
      // Buy units
      const newUnits = sipAmount / nav;
      totalUnits += newUnits;
      
      // Calculate value on this date
      const value = totalUnits * nav;
      
      timeline.push({
        date: format(safeParseDate(date), 'MMM yyyy'),
        value: Math.round(value)
      });
    });
    
    // Calculate final value
    const endNav = sortedData[sortedData.length - 1].nav;
    const totalValue = totalUnits * endNav;
    
    return {
      timeline,
      totalValue,
      finalUnits: totalUnits,
      endNav
    };
  };
  
  // Calculate XIRR (more accurate approximation)
  const calculateApproxXIRR = (
    initialInvestment: number,
    monthlyInvestment: number,
    finalValue: number,
    months: number
  ): number => {
    if (months <= 0 || (initialInvestment === 0 && monthlyInvestment === 0) || finalValue <= 0) {
      return 0;
    }
    
    // Total investment
    const totalInvestment = initialInvestment + (monthlyInvestment * months);
    
    if (totalInvestment === 0) {
      return 0;
    }

    // More accurate XIRR calculation using Newton-Raphson method
    // Start with an initial guess
    let guess = 0.1; // 10%
    const maxIterations = 100;
    const tolerance = 0.0000001;
    
    // Function to calculate NPV (Net Present Value)
    const calculateNPV = (rate: number): number => {
      // Present value of the final amount
      const pvFinal = finalValue / Math.pow(1 + rate, months/12);
      
      // For monthly SIP, we need to calculate present value of each payment
      let pvSIP = 0;
      
      // For each month, calculate the present value of the SIP payment
      for (let i = 1; i <= months; i++) {
        pvSIP += monthlyInvestment / Math.pow(1 + rate, i/12);
      }
      
      // Present value of initial investment is just the investment itself
      return pvFinal - pvSIP - initialInvestment;
    };
    
    // Function to calculate the derivative of NPV with respect to rate
    const calculateNPVDerivative = (rate: number): number => {
      const h = 0.000001; // Small increment for numerical differentiation
      return (calculateNPV(rate + h) - calculateNPV(rate)) / h;
    };
    
    // Newton-Raphson Method
    for (let i = 0; i < maxIterations; i++) {
      const npv = calculateNPV(guess);
      
      // If we're close enough to zero, we've found our rate
      if (Math.abs(npv) < tolerance) {
        break;
      }
      
      const derivative = calculateNPVDerivative(guess);
      
      // Avoid division by zero
      if (Math.abs(derivative) < tolerance) {
        break;
      }
      
      // Newton's formula: x_new = x_old - f(x_old) / f'(x_old)
      const newGuess = guess - npv / derivative;
      
      // Check if the improvement is small enough
      if (Math.abs(newGuess - guess) < tolerance) {
        guess = newGuess;
        break;
      }
      
      guess = newGuess;
      
      // Guard against divergence
      if (guess <= -1) {
        return -100; // Return extreme negative XIRR
      }
      
      if (guess > 100) {
        return 100; // Return extreme positive XIRR
      }
    }
    
    // Convert to percentage
    return guess * 100;
  };
  
  // Handle calculating SIP comparison
  const calculateSipComparison = async () => {
    if (selectedFunds.length === 0 || !startDate || !endDate) {
      return;
    }
    
    setIsCalculating(true);
    setShowResults(false);
    
    // Calculate number of months between start and end date
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);
    const totalMonths = differenceInMonths(endDateObj, startDateObj);
    
    try {
      // Fetch data for all selected funds
      const fundsData = await Promise.all(
        selectedFunds.map(fund => fetchFundData(fund.schemeCode))
      );
      
      // Calculate results for each fund
      const calculationResults = selectedFunds.map((fund, index) => {
        const fundData = fundsData[index];
        
        if (!fundData || fundData.length === 0) {
          // Handle missing data case
          return {
            schemeCode: fund.schemeCode,
            schemeName: fund.schemeName,
            totalInvestment: 0,
            estimatedReturns: 0,
            totalValue: 0,
            absoluteReturn: 0,
            xirr: 0,
            finalUnits: 0,
            endNav: 0,
            color: colors[index % colors.length],
            timeline: []
          };
        }
        
        // Calculate SIP value using real data
        const { timeline, totalValue, finalUnits, endNav } = calculateSIPValue(
          fundData, 
          amount,
          initialLumpsum
        );
        
        // Calculate total invested amount based on actual SIP dates
        // Initial investment + (monthly SIP amount * number of SIPs)
        const totalInvestment = initialLumpsum + (amount * (timeline.length - (initialLumpsum > 0 ? 1 : 0)));
        
        // Calculate returns
        const estimatedReturns = totalValue - totalInvestment;
        const absoluteReturn = totalInvestment > 0 
          ? ((totalValue - totalInvestment) / totalInvestment) * 100 
          : 0;
        
        // Calculate XIRR - using the more accurate formula that accounts for periodic investments
        const xirr = calculateApproxXIRR(initialLumpsum, amount, totalValue, totalMonths);
        
        return {
          schemeCode: fund.schemeCode,
          schemeName: fund.schemeName,
          totalInvestment,
          estimatedReturns: Math.round(estimatedReturns),
          totalValue: Math.round(totalValue),
          absoluteReturn: parseFloat(absoluteReturn.toFixed(2)),
          xirr: parseFloat(xirr.toFixed(2)),
          finalUnits,
          endNav,
          color: colors[index % colors.length],
          timeline
        };
      });
      
      setResults(calculationResults);
      setShowResults(true);
    } catch (error) {
      console.error("Error calculating SIP comparison:", error);
    } finally {
      setIsCalculating(false);
    }
  };
  
  // Prepare chart data
  const prepareChartData = () => {
    if (!results.length) return { labels: [], datasets: [] };
    
    // Get all unique dates from all fund timelines
    const allDates = new Set<string>();
    results.forEach(result => {
      result.timeline.forEach(point => {
        allDates.add(point.date);
      });
    });
    
    // Sort dates chronologically
    const sortedDates = Array.from(allDates).sort((a, b) => {
      const dateA = new Date(a);
      const dateB = new Date(b);
      return dateA.getTime() - dateB.getTime();
    });
    
    // Create datasets for each fund
    const datasets = results.map(result => {
      // For normalization, we'll calculate the cumulative investment at each point
      const investmentTimeline: number[] = [];
      let monthsElapsed = 0;
      
      // Calculate the investment amount at each time point
      for (let i = 0; i < sortedDates.length; i++) {
        // For the first point, it's just the initial lumpsum (if any)
        if (i === 0) {
          investmentTimeline.push(initialLumpsum > 0 ? initialLumpsum : amount);
          monthsElapsed = 1;
        } else {
          // For subsequent points, add the monthly SIP amount
          const prevInvestment: number = investmentTimeline[i-1];
          investmentTimeline.push(prevInvestment + amount);
          monthsElapsed++;
        }
      }
      
      return {
        label: result.schemeName,
        data: sortedDates.map((date, index) => {
          const point = result.timeline.find(p => p.date === date);
          // Calculate the normalized value - percentage growth over investment
          if (point) {
            const value = point.value;
            const investment = investmentTimeline[index];
            if (investment <= 0) return 0;
            
            // Calculate percentage gain/loss (return %)
            return parseFloat(((value - investment) / investment * 100).toFixed(2));
          }
          return null;
        }),
        borderColor: result.color,
        backgroundColor: result.color.replace('1)', '0.1)'),
        borderWidth: 2,
        tension: 0.3,
        pointRadius: 2,
        pointHoverRadius: 5
      };
    });
    
    return {
      labels: sortedDates,
      datasets
    };
  };
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      y: {
        title: {
          display: true,
          text: 'Return (%)'
        },
        ticks: {
          callback: function(value: any) {
            return `${value}%`;
          }
        }
      },
      x: {
        title: {
          display: true,
          text: 'Date'
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const label = context.dataset.label || '';
            const value = context.raw || 0;
            return `${label}: ${value >= 0 ? '+' : ''}${value}%`;
          }
        }
      },
      legend: {
        position: 'top' as const,
      }
    }
  };
  
  // Inside the component, update the useEffect
  useEffect(() => {
    // Check if there's a fund parameter in the URL
    const fundCode = searchParams.get('fund');
    
    if (fundCode && selectedFunds.length === 0) {
      // Convert to number
      const schemeCode = parseInt(fundCode, 10);
      
      // Find the fund in favorites if available
      const fund = favoriteFunds.find((f) => f.schemeCode === schemeCode);
      
      if (fund) {
        // Automatically select the fund
        handleFundSelect(fund.schemeCode, fund.schemeName);
      } else {
        // If not in favorites, fetch the fund info
        axios.get(`https://api.mfapi.in/mf/${schemeCode}`)
          .then(response => {
            if (response.data && response.data.meta) {
              handleFundSelect(
                response.data.meta.scheme_code,
                response.data.meta.scheme_name
              );
            }
          })
          .catch(err => console.error('Error fetching fund details:', err));
      }
    }
  }, [selectedFunds.length, handleFundSelect, searchParams, favoriteFunds]);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-6 px-4 sm:py-8">
      <div className="container mx-auto">
        <Navigation />
        
        <header className="mb-6 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">SIP Comparison</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Compare SIP performance across multiple mutual funds
          </p>
        </header>
        
        <div className="grid grid-cols-1 gap-4 sm:gap-6">
          {/* Search area */}
          <div className="app-card relative z-10" style={{ position: 'relative', zIndex: 10 }}>
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
                  className="overflow-visible"
                >
                  <div className="px-4 pb-4">
                    <FundSearch onSelectFund={handleFundSelect} />
                    
                    {selectedFunds.length > 0 && (
                      <div className="mt-4">
                        <div className="flex flex-wrap gap-2">
                          {selectedFunds.map((fund, i) => (
                            <div 
                              key={`${fund.schemeCode}-${i}`}
                              className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 rounded-full px-3 py-1.5"
                              style={{ borderLeft: `4px solid ${colors[i % colors.length]}` }}
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
          
          {/* Favorites section */}
          <FavoritesFunds onSelectFund={handleFundSelect} />
          
          {/* SIP Parameters */}
          {selectedFunds.length > 0 && (
            <div className="app-card p-4">
              <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4">SIP Parameters</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* SIP Amount */}
                <SliderWithInput
                  label="Monthly SIP Amount"
                  value={amount}
                  onChange={setAmount}
                  min={500}
                  max={1000000}
                  step={500}
                  prefix="₹"
                />
                
                {/* Initial Lumpsum */}
                <SliderWithInput
                  label="Initial Lumpsum"
                  value={initialLumpsum}
                  onChange={setInitialLumpsum}
                  min={0}
                  max={10000000}
                  step={10000}
                  prefix="₹"
                />
                
                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    className="app-input"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    max={endDate}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    className="app-input"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    max={format(new Date(), 'yyyy-MM-dd')}
                  />
                </div>
              </div>
              
              <button
                className="w-full btn-primary mt-6"
                onClick={calculateSipComparison}
                disabled={isCalculating || !startDate || !endDate || selectedFunds.length === 0}
              >
                {isCalculating ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Calculating Comparison...
                  </div>
                ) : (
                  'Calculate SIP Comparison'
                )}
              </button>
              
              {(!startDate || !endDate) && (
                <p className="text-xs text-orange-600 dark:text-orange-400 text-center mt-2">
                  Please select both start and end dates
                </p>
              )}
            </div>
          )}
          
          {/* Comparison Results */}
          {showResults && results.length > 0 && (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className="app-card p-4"
              >
                <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4">SIP Comparison Results</h2>
                
                {/* Results Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded shadow-sm">
                    <div className="text-sm text-slate-600 dark:text-slate-400">Investment Duration</div>
                    <div className="text-base font-bold text-slate-900 dark:text-white">
                      {startDate && endDate ? `${format(new Date(startDate), 'dd MMM yyyy')} - ${format(new Date(endDate), 'dd MMM yyyy')}` : 'Not specified'}
                    </div>
                  </div>
                  
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded shadow-sm">
                    <div className="text-sm text-slate-600 dark:text-slate-400">Monthly SIP Amount</div>
                    <div className="text-base font-bold text-slate-900 dark:text-white">₹{amount.toLocaleString()}</div>
                  </div>
                  
                  {initialLumpsum > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded shadow-sm">
                      <div className="text-sm text-slate-600 dark:text-slate-400">Initial Lumpsum</div>
                      <div className="text-base font-bold text-slate-900 dark:text-white">₹{initialLumpsum.toLocaleString()}</div>
                    </div>
                  )}
                </div>
                
                {/* Chart Section */}
                <div className="mb-6">
                  <h3 className="text-md font-medium text-slate-700 dark:text-slate-300 mb-3">Growth Comparison</h3>
                  <div className="h-80">
                    <Line data={prepareChartData()} options={chartOptions} />
                  </div>
                </div>
                
                {/* Results Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="py-2 px-4 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Fund</th>
                        <th className="py-2 px-4 text-right text-sm font-medium text-slate-500 dark:text-slate-400">Total Investment</th>
                        <th className="py-2 px-4 text-right text-sm font-medium text-slate-500 dark:text-slate-400">Final Value</th>
                        <th className="py-2 px-4 text-right text-sm font-medium text-slate-500 dark:text-slate-400">Absolute Return</th>
                        <th className="py-2 px-4 text-right text-sm font-medium text-slate-500 dark:text-slate-400">XIRR</th>
                        <th className="py-2 px-4 text-right text-sm font-medium text-slate-500 dark:text-slate-400">Units</th>
                        <th className="py-2 px-4 text-right text-sm font-medium text-slate-500 dark:text-slate-400">NAV</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((result, index) => (
                        <tr key={result.schemeCode} className="border-b border-slate-100 dark:border-slate-800">
                          <td className="py-2 px-4 text-sm text-slate-700 dark:text-slate-300">
                            <div className="flex items-center">
                              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: result.color }}></div>
                              <span className="font-medium">{result.schemeName}</span>
                            </div>
                          </td>
                          <td className="py-2 px-4 text-right text-sm text-slate-700 dark:text-slate-300">₹{result.totalInvestment.toLocaleString()}</td>
                          <td className="py-2 px-4 text-right text-sm text-slate-700 dark:text-slate-300">₹{result.totalValue.toLocaleString()}</td>
                          <td className="py-2 px-4 text-right text-sm font-medium" style={{ color: result.absoluteReturn >= 0 ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)' }}>
                            {result.absoluteReturn >= 0 ? '+' : ''}{result.absoluteReturn.toFixed(2)}%
                          </td>
                          <td className="py-2 px-4 text-right text-sm font-medium" style={{ color: result.xirr >= 0 ? 'rgb(16, 185, 129)' : 'rgb(239, 68, 68)' }}>
                            {result.xirr >= 0 ? '+' : ''}{result.xirr.toFixed(2)}%
                          </td>
                          <td className="py-2 px-4 text-right text-sm text-slate-700 dark:text-slate-300">{result.finalUnits.toFixed(2)}</td>
                          <td className="py-2 px-4 text-right text-sm text-slate-700 dark:text-slate-300">₹{result.endNav.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {/* Best Performer */}
                {results.length > 1 && (
                  <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-lg">
                    <h3 className="text-md font-medium text-green-700 dark:text-green-400 mb-2">Best Performer</h3>
                    <p className="text-slate-700 dark:text-slate-300">
                      <span className="font-medium">{results.sort((a, b) => b.xirr - a.xirr)[0].schemeName}</span> has the highest XIRR of {results.sort((a, b) => b.xirr - a.xirr)[0].xirr.toFixed(2)}% among the compared funds.
                    </p>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          )}
          
          {/* Empty state */}
          {selectedFunds.length === 0 && (
            <div className="text-center py-8 sm:py-12 app-card">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 sm:h-16 w-12 sm:w-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
              <h3 className="text-xl font-medium mb-2">No Funds Selected</h3>
              <p className="text-slate-500 mb-6 max-w-md mx-auto px-4">
                Search for and select up to {MAX_FUNDS} mutual funds above to compare their SIP performance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 