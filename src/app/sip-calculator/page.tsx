'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line } from 'react-chartjs-2';
import { format, addMonths, addDays, addYears, parseISO, isValid, isBefore, differenceInDays } from 'date-fns';
import Navigation from '../components/Navigation';
import FundSearch from '../components/FundSearch';
import axios from 'axios';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import FavoritesFunds from '../components/FavoritesFunds';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocalStorage } from '../hooks/useLocalStorage';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

type InvestmentFrequency = 'daily' | 'weekly' | 'monthly';

interface SIPResult {
  totalInvestment: number;
  initialLumpsum: number;
  estimatedReturns: number;
  totalValue: number;
  annualizedReturn: number;
  absoluteReturn: number;
  xirr: number;
  totalUnits: number;
  endNav: number;
  timeline: {
    date: string;
    investmentValue: number;
    totalValue: number;
    units?: number;
    nav?: number;
  }[];
  investmentHistory: {
    date: Date;
    amount: number;
  }[];
}

interface SelectedFund {
  schemeCode: number;
  schemeName: string;
}

interface FundData {
  date: string;
  nav: number;
}

// Interface for XIRR calculation
interface CashFlow {
  amount: number;
  date: Date;
}

interface FundItem {
  schemeCode: number;
  schemeName: string;
}

// Loading component for Suspense fallback
function SipCalculatorLoading() {
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
const SIPCalculator: React.FC = () => {
  return (
    <Suspense fallback={<SipCalculatorLoading />}>
      <SIPCalculatorContent />
    </Suspense>
  );
};

// Content component that uses searchParams
const SIPCalculatorContent: React.FC = () => {
  const [amount, setAmount] = useState<number>(0);
  const [years, setYears] = useState<number>(5);
  const [expectedReturn, setExpectedReturn] = useState<number>(12);
  const [frequency, setFrequency] = useState<InvestmentFrequency>('monthly');
  const [sipResult, setSipResult] = useState<SIPResult | null>(null);
  const [isCalculating, setIsCalculating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'chart' | 'breakdown'>('chart');
  
  // Added state variables
  const [selectedFund, setSelectedFund] = useState<SelectedFund | null>(null);
  const [initialLumpsum, setInitialLumpsum] = useState<number>(0);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [fundData, setFundData] = useState<FundData[]>([]);
  const [isLoadingFundData, setIsLoadingFundData] = useState<boolean>(false);
  const [fundDataError, setFundDataError] = useState<string | null>(null);
  const [isUseFundReturns, setIsUseFundReturns] = useState<boolean>(false);
  const [investmentMode, setInvestmentMode] = useState<'expected' | 'historical'>('expected');
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);

  // Get search params at the component level
  const searchParams = useSearchParams();
  
  // Get favorites at the component level
  const [favoriteFunds] = useLocalStorage<FundItem[]>('favoriteFunds', []);

  // Handle fund selection
  const handleFundSelect = (schemeCode: number, schemeName: string) => {
    setSelectedFund({ schemeCode, schemeName });
    fetchFundData(schemeCode);
    // Close the dropdown or fund search UI after selection
    const searchElement = document.querySelector('#search') as HTMLInputElement;
    if (searchElement) {
      searchElement.blur();
    }
  };

  // Handle date range selection
  const handleDateRangeChange = (start: string | null, end: string | null) => {
    if (start) {
      setStartDate(start);
    } else {
      setStartDate('');
    }
    
    if (end) {
      setEndDate(end);
    } else {
      setEndDate('');
    }
  };

  // Clear period selection (unused in this case but required for DateRangeSelector)
  const clearPeriodSelection = () => {
    // Nothing to clear in this context
  };

  // Calculate XIRR using Newton-Raphson method
  const calculateXIRR = (cashFlows: CashFlow[]): number => {
    if (cashFlows.length < 2) return 0;
    
    // Sort cash flows by date
    cashFlows.sort((a, b) => a.date.getTime() - b.date.getTime());
    
    const firstDate = cashFlows[0].date;
    
    // Function to calculate NPV with a given rate
    const calculateNPV = (rate: number): number => {
      return cashFlows.reduce((npv, flow) => {
        const daysDiff = differenceInDays(flow.date, firstDate) / 365;
        return npv + flow.amount / Math.pow(1 + rate, daysDiff);
      }, 0);
    };
    
    // Function to calculate the derivative of NPV
    const calculateDerivative = (rate: number): number => {
      return cashFlows.reduce((derivative, flow) => {
        const daysDiff = differenceInDays(flow.date, firstDate) / 365;
        return derivative - (daysDiff * flow.amount) / Math.pow(1 + rate, daysDiff + 1);
      }, 0);
    };
    
    // Newton-Raphson method to find the rate where NPV = 0
    let rate = 0.1; // Initial guess
    let iteration = 0;
    const maxIterations = 100;
    const precision = 0.000001;
    
    while (iteration < maxIterations) {
      const npv = calculateNPV(rate);
      
      if (Math.abs(npv) < precision) {
        break;
      }
      
      const derivative = calculateDerivative(rate);
      
      if (Math.abs(derivative) < precision) {
        break;
      }
      
      const newRate = rate - npv / derivative;
      
      if (Math.abs(newRate - rate) < precision) {
        rate = newRate;
        break;
      }
      
      rate = newRate;
      iteration++;
    }
    
    // Convert to percentage
    return rate * 100;
  };

  // Calculate annualized return
  const calculateAnnualizedReturn = (startAmount: number, endAmount: number, years: number): number => {
    if (years <= 0 || startAmount <= 0) return 0;
    const returnRate = Math.pow(endAmount / startAmount, 1 / years) - 1;
    return returnRate * 100; // Convert to percentage
  };

  // Parse date safely
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
        return new Date();
      }
      
      return date;
    } catch (e) {
      return new Date(); // Fallback to current date
    }
  };

  // Fetch fund data
  const fetchFundData = async (schemeCode: number) => {
    setIsLoadingFundData(true);
    setFundDataError(null);
    
    try {
      const response = await axios.get(`https://api.mfapi.in/mf/${schemeCode}`);
      
      // Convert API data to our format and sort
      const formattedData = response.data.data
        .map((item: { date: string; nav: string }) => ({
          date: item.date,
          nav: parseFloat(item.nav)
        }))
        .sort((a: FundData, b: FundData) => 
          safeParseDate(a.date).getTime() - safeParseDate(b.date).getTime()
        );
      
      setFundData(formattedData);
      setInvestmentMode('historical');
    } catch (err) {
      console.error(`Error fetching fund data:`, err);
      setFundDataError('Failed to fetch fund data. Using expected returns instead.');
      setInvestmentMode('expected');
    } finally {
      setIsLoadingFundData(false);
    }
  };

  // Find nearest NAV for a given date
  const findNearestNAV = (targetDate: Date, data: FundData[]): { nav: number, date: string } => {
    // Convert target date to start of day for comparison
    const targetTime = new Date(
      targetDate.getFullYear(), 
      targetDate.getMonth(), 
      targetDate.getDate()
    ).getTime();
    
    // Sort by how close each date is to the target
    const sorted = [...data].sort((a, b) => {
      const dateA = safeParseDate(a.date).getTime();
      const dateB = safeParseDate(b.date).getTime();
      return Math.abs(dateA - targetTime) - Math.abs(dateB - targetTime);
    });
    
    // Return the closest match
    return { 
      nav: sorted[0].nav,
      date: sorted[0].date 
    };
  };

  // Calculate SIP returns based on inputs
  const calculateSIP = () => {
    setIsCalculating(true);
    setCalculationError(null);
    
    // Small delay to show animation
    setTimeout(() => {
      const timeline: { date: string; investmentValue: number; totalValue: number; units?: number; nav?: number }[] = [];
      const investmentHistory: { date: Date; amount: number }[] = [];
      
      let totalInvestment = 0;
      let totalValue = 0;
      let annualizedReturn = 0;
      let xirr = 0;
      let totalUnits = 0;
      let endNav = 0;
      
      // Get frequency in number of days
      const intervalDays = 
        frequency === 'daily' ? 1 : 
        frequency === 'weekly' ? 7 : 30;
      
      // Number of payments per year
      const paymentsPerYear = 
        frequency === 'daily' ? 365 : 
        frequency === 'weekly' ? 52 : 12;
      
      // Use custom start date or current date
      const startingDate = startDate ? new Date(startDate) : new Date();
      const endingDate = endDate ? new Date(endDate) : new Date();
      
      // Calculate actual years for the investment period
      const actualYears = endDate && startDate ? 
        differenceInDays(new Date(endDate), new Date(startDate)) / 365 : 
        years;
      
      if (investmentMode === 'expected') {
        // Using expected returns (traditional calculation)
        
        // Monthly rate (converting annual rate to appropriate interval)
        const periodicRate = (Math.pow(1 + expectedReturn / 100, 1 / paymentsPerYear) - 1);
        
        // Total number of payments
        const totalPayments = endDate ? 
          Math.floor(differenceInDays(endingDate, startingDate) / intervalDays) :
          paymentsPerYear * years;
        
        // Initialize for SIP calculations
        let currentInvestment = 0;
        totalValue = 0;
        
        // Set up investment history for XIRR calculation
        if (initialLumpsum > 0) {
          currentInvestment = initialLumpsum;
          totalValue = initialLumpsum;
          
          investmentHistory.push({
            date: startingDate,
            amount: -initialLumpsum // Negative for outflow
          });
          
          // Add initial lumpsum point to timeline
          timeline.push({
            date: format(startingDate, 'dd MMM yyyy'),
            investmentValue: Math.round(currentInvestment),
            totalValue: Math.round(currentInvestment)
          });
        }
        
        // Calculate for each payment period
        for (let i = 0; i < totalPayments; i++) {
          // Calculate current date
          let currentDate;
          if (frequency === 'daily') {
            currentDate = addDays(startingDate, i);
          } else if (frequency === 'weekly') {
            currentDate = addDays(startingDate, i * 7);
          } else {
            currentDate = addMonths(startingDate, i);
          }
          
          // Skip the first period if we have a lumpsum and are on the start date
          if (initialLumpsum > 0 && i === 0) {
            continue;
          }
          
          // Skip if SIP amount is 0
          if (amount === 0) {
            continue;
          }
          
          // Add to total investment
          currentInvestment += amount;
          
          // Add to investment history
          investmentHistory.push({
            date: currentDate,
            amount: -amount // Negative for outflow
          });
          
          // Calculate current value with compound interest
          totalValue = (totalValue + amount) * (1 + periodicRate);
          
          // Add to timeline every quarter (or appropriate interval for visualization)
          if (i % Math.max(1, Math.floor(totalPayments / 20)) === 0 || i === totalPayments - 1) {
            timeline.push({
              date: format(currentDate, 'dd MMM yyyy'),
              investmentValue: Math.round(currentInvestment),
              totalValue: Math.round(totalValue)
            });
          }
        }
        
        // Make sure we have at least one point in the timeline
        if (timeline.length === 0 || (amount === 0 && initialLumpsum > 0)) {
          const finalDate = endDate ? new Date(endDate) : addYears(startingDate, years);
          // Only add if we don't already have the final date
          if (!timeline.some(item => item.date === format(finalDate, 'dd MMM yyyy'))) {
            timeline.push({
              date: format(finalDate, 'dd MMM yyyy'),
              investmentValue: Math.round(currentInvestment),
              totalValue: Math.round(totalValue)
            });
          }
        }
        
        // Update total investment to reflect the actual amount invested
        totalInvestment = currentInvestment;
        
        // Add final cash flow for XIRR
        investmentHistory.push({
          date: endDate ? new Date(endDate) : addYears(startingDate, years),
          amount: totalValue // Positive for inflow
        });
        
        // Calculate XIRR
        xirr = calculateXIRR(investmentHistory);
        
        // Calculate annualized return based on the formula (simple calculation for expected mode)
        annualizedReturn = expectedReturn;
        
        // Set placeholder values for units and NAV
        totalUnits = 0;
        endNav = 0;
      } else if (investmentMode === 'historical' && fundData.length > 0) {
        // Using historical fund data - This is where the accurate calculation happens
        
        // Find the start and end indices in the fundData array
        const startIndex = startDate ? 
          fundData.findIndex(item => {
            const itemDate = safeParseDate(item.date);
            return !isBefore(itemDate, safeParseDate(startDate));
          }) : 0;
        
        const endIdx = endDate ? 
          fundData.findIndex(item => {
            const itemDate = safeParseDate(item.date);
            return !isBefore(itemDate, safeParseDate(endDate));
          }) : 
          fundData.length - 1;
          
        const endIndex = endIdx !== -1 ? endIdx : fundData.length - 1;
        
        if (startIndex === -1 || startIndex >= fundData.length - 1) {
          // Fall back to expected returns if we can't find a valid start date
          setCalculationError('The start date is outside the range of available fund data.');
          setIsCalculating(false);
          return;
        }
        
        if (endIndex <= startIndex) {
          // Invalid date range
          setCalculationError('The end date must be after the start date and within available fund data.');
          setIsCalculating(false);
          return;
        }
        
        // Setup investment history for XIRR
        let unitsAccumulated = 0;
        let currentInvestment = 0;
        
        // Find actual NAVs at start date
        const startDateNAV = findNearestNAV(safeParseDate(startDate), fundData);
        
        // Initialize with lumpsum if provided
        if (initialLumpsum > 0) {
          unitsAccumulated = initialLumpsum / startDateNAV.nav;
          currentInvestment = initialLumpsum;
          
          // Add lumpsum to investment history
          investmentHistory.push({
            date: safeParseDate(startDate),
            amount: -initialLumpsum // Negative for outflow
          });
          
          // Add initial point to timeline
          timeline.push({
            date: format(safeParseDate(startDateNAV.date), 'dd MMM yyyy'),
            investmentValue: initialLumpsum,
            totalValue: initialLumpsum,
            units: unitsAccumulated,
            nav: startDateNAV.nav
          });
        }
        
        // Generate all SIP dates from start to end
        const sipDates: Date[] = [];
        let currentSIPDate = safeParseDate(startDate);
        
        while (currentSIPDate <= safeParseDate(endDate)) {
          sipDates.push(new Date(currentSIPDate));
          
          if (frequency === 'daily') {
            currentSIPDate = addDays(currentSIPDate, 1);
          } else if (frequency === 'weekly') {
            currentSIPDate = addDays(currentSIPDate, 7);
          } else { // monthly
            currentSIPDate = addMonths(currentSIPDate, 1);
          }
        }
        
        // Process each SIP date
        for (const sipDate of sipDates) {
          // Find nearest NAV for this SIP date
          const { nav, date } = findNearestNAV(sipDate, fundData);
          
          // Skip initial date if lumpsum was already applied
          if (initialLumpsum > 0 && sipDate.getTime() === safeParseDate(startDate).getTime()) {
            continue;
          }
          
          // Skip if SIP amount is 0
          if (amount === 0) {
            continue;
          }
          
          // Buy units
          const unitsThisInstallment = amount / nav;
          unitsAccumulated += unitsThisInstallment;
          currentInvestment += amount;
          
          // Add to investment history
          investmentHistory.push({
            date: sipDate,
            amount: -amount // Negative for outflow
          });
          
          // Calculate market value
          const marketValue = unitsAccumulated * nav;
          
          // Add to timeline (with fewer points for readability)
          // Include more points for longer periods
          const shouldAddToTimeline = 
            sipDates.length <= 20 || 
            sipDate.getTime() === safeParseDate(startDate).getTime() || 
            sipDate.getTime() === safeParseDate(endDate).getTime() ||
            sipDates.indexOf(sipDate) % Math.max(1, Math.floor(sipDates.length / 20)) === 0;
            
          if (shouldAddToTimeline) {
            timeline.push({
              date: format(safeParseDate(date), 'dd MMM yyyy'),
              investmentValue: Math.round(currentInvestment),
              totalValue: Math.round(marketValue),
              units: unitsAccumulated,
              nav: nav
            });
          }
        }
        
        // Find final NAV at end date
        const endDateNAV = findNearestNAV(safeParseDate(endDate), fundData);
        endNav = endDateNAV.nav;
        
        // Calculate final market value
        const finalMarketValue = unitsAccumulated * endNav;
        totalValue = finalMarketValue;
        
        // IMPORTANT: The correct total investment is just the sum of all investments
        // currentInvestment already includes initialLumpsum, so don't add it again
        totalInvestment = currentInvestment;
        totalUnits = unitsAccumulated;
        
        // Ensure the last point in timeline has the final values
        if (timeline.length > 0) {
          timeline[timeline.length - 1] = {
            date: format(safeParseDate(endDateNAV.date), 'dd MMM yyyy'),
            investmentValue: Math.round(totalInvestment),
            totalValue: Math.round(finalMarketValue),
            units: unitsAccumulated,
            nav: endNav
          };
        }
        
        // Add final cash flow for XIRR
        investmentHistory.push({
          date: safeParseDate(endDate),
          amount: finalMarketValue // Positive for inflow
        });
        
        // Calculate XIRR
        xirr = calculateXIRR(investmentHistory);
        
        // Calculate annualized return
        const investmentPeriodYears = differenceInDays(safeParseDate(endDate), safeParseDate(startDate)) / 365;
        annualizedReturn = calculateAnnualizedReturn(totalInvestment, finalMarketValue, investmentPeriodYears);
      }
      
      setSipResult({
        totalInvestment: Math.round(totalInvestment),
        initialLumpsum: initialLumpsum,
        estimatedReturns: Math.round(totalValue - totalInvestment),
        totalValue: Math.round(totalValue),
        annualizedReturn: parseFloat(annualizedReturn.toFixed(2)),
        absoluteReturn: parseFloat(((totalValue - totalInvestment) / totalInvestment * 100).toFixed(2)),
        xirr: parseFloat(xirr.toFixed(2)),
        totalUnits: parseFloat(totalUnits.toFixed(4)),
        endNav: parseFloat(endNav.toFixed(4)),
        timeline,
        investmentHistory
      });
      
      setIsCalculating(false);
    }, 500);
  };
  
  // Helper function to determine if we should make an investment based on frequency
  const shouldMakeInvestment = (prevDate: Date, currentDate: Date, frequency: InvestmentFrequency): boolean => {
    switch (frequency) {
      case 'daily':
        // Every day
        return true;
      case 'weekly':
        // Check if at least 7 days have passed
        const dayDiff = Math.floor((currentDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
        return dayDiff >= 7;
      case 'monthly':
        // Check if month has changed
        return (
          currentDate.getMonth() !== prevDate.getMonth() ||
          currentDate.getFullYear() !== prevDate.getFullYear()
        );
      default:
        return false;
    }
  };

  // Calculate on first load
  useEffect(() => {
    calculateSIP();
  }, []);

  // Prepare chart data based on timeline
  const prepareChartData = () => {
    if (!sipResult?.timeline.length) {
      return {
        labels: [],
        datasets: []
      };
    }

    // Use the timeline from SIP result
    const datasets = [
      {
        label: 'Investment Amount',
        data: sipResult.timeline.map(item => item.investmentValue),
        backgroundColor: 'rgba(59, 130, 246, 0.2)',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 2,
        fill: true,
        pointRadius: investmentMode === 'historical' ? 2 : 0,
        tension: 0.2
      },
      {
        label: 'Total Value',
        data: sipResult.timeline.map(item => item.totalValue),
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        fill: true,
        pointRadius: investmentMode === 'historical' ? 2 : 0,
        tension: 0.2
      }
    ];
    
    // Add NAV line for historical data
    if (investmentMode === 'historical' && sipResult.timeline.some(item => item.nav)) {
      datasets.push({
        label: 'Fund NAV',
        data: sipResult.timeline.map(item => item.nav || 0),
        backgroundColor: 'rgba(234, 88, 12, 0.2)',
        borderColor: 'rgba(234, 88, 12, 1)',
        borderWidth: 2,
        fill: false,
        pointRadius: 2,
        tension: 0.2,
        yAxisID: 'y1'
      } as any);
    }

    return {
      labels: sipResult.timeline.map(item => item.date),
      datasets
    };
  };

  // Chart data and options
  const chartData = prepareChartData();
  
  // Determine if we need a secondary y-axis based on whether NAV data is shown
  const hasNavDataset = investmentMode === 'historical' && sipResult?.timeline.some(item => item.nav);
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: function(value: any) {
            return `₹${value.toLocaleString()}`;
          }
        }
      },
      x: {
        ticks: {
          maxRotation: investmentMode === 'historical' ? 45 : 0,
          minRotation: investmentMode === 'historical' ? 45 : 0,
          autoSkip: true,
          maxTicksLimit: 12
        }
      },
      ...(hasNavDataset ? {
        y1: {
          position: 'right' as const,
          beginAtZero: false,
          grid: {
            drawOnChartArea: false,
          },
          ticks: {
            callback: function(value: any) {
              return `₹${value.toLocaleString()}`;
            }
          }
        }
      } : {})
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const datasetIndex = context.datasetIndex;
            const dataIndex = context.dataIndex;
            const rawData = context.raw;
            
            // Basic tooltip with formatted value
            let label = `${context.dataset.label}: ₹${rawData.toLocaleString()}`;
            
            // For historical mode, add more detail
            if (investmentMode === 'historical' && sipResult?.timeline[dataIndex]) {
              const pointData = sipResult.timeline[dataIndex];
              // For Investment Amount, show cumulative investment
              if (datasetIndex === 0) {
                label = `Total Invested: ₹${rawData.toLocaleString()}`;
              } 
              // For Total Value, add units and NAV info
              else if (datasetIndex === 1 && pointData.units && pointData.nav) {
                label = `Value: ₹${rawData.toLocaleString()}\nUnits: ${pointData.units.toFixed(3)}\nNAV: ₹${pointData.nav.toFixed(3)}`;
              }
            }
            
            return label;
          },
          title: function(context: any) {
            return context[0].label; // Date
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
    
    if (fundCode && !selectedFund) {
      // Convert to number
      const schemeCode = parseInt(fundCode, 10);
      
      // Find the fund in favorites if available
      const fund = favoriteFunds.find(f => f.schemeCode === schemeCode);
      
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
  }, [selectedFund, favoriteFunds, searchParams, handleFundSelect]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-6 px-4 sm:py-8">
      <div className="container mx-auto">
        <Navigation />
        
        <header className="mb-6 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">SIP Calculator</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            Calculate returns for Systematic Investment Plans with custom parameters
          </p>
        </header>
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left column: Input parameters */}
          <div className="md:col-span-2">
            {/* Fund Selection */}
            <div className="app-card p-4 mb-6" style={{ position: 'relative', zIndex: 1 }}>
              <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4">Select Mutual Fund (Optional)</h2>
              
              <div className="mb-4">
                <div className="flex items-center mb-2">
                  <div 
                    className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${
                      investmentMode === 'historical' ? 'bg-blue-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                    onClick={() => setInvestmentMode(investmentMode === 'historical' ? 'expected' : 'historical')}
                  >
                    <motion.div 
                      className="bg-white w-4 h-4 rounded-full shadow-sm"
                      animate={{ x: investmentMode === 'historical' ? 16 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </div>
                  <label className="ml-2 text-sm font-medium">
                    Use Historical Fund Data
                  </label>
                </div>
                
                <AnimatePresence>
                  {investmentMode === 'historical' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-visible"
                    >
                      {!selectedFund ? (
                        <FundSearch onSelectFund={handleFundSelect} />
                      ) : (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300">Selected Fund</h3>
                            <button
                              className="text-xs text-slate-500 hover:text-red-500 transition-colors flex items-center gap-1"
                              onClick={() => {
                                setSelectedFund(null);
                                setFundData([]);
                                setFundDataError(null);
                              }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Change Fund
                            </button>
                          </div>
                          
                          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                            <div className="font-medium text-blue-700 dark:text-blue-300">
                              {selectedFund.schemeName}
                            </div>
                            <div className="text-xs text-slate-500 mt-1">
                              Scheme Code: {selectedFund.schemeCode}
                            </div>
                            {isLoadingFundData && (
                              <div className="flex items-center text-xs text-slate-500 mt-2 gap-2">
                                <svg className="animate-spin h-3 w-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Loading fund data...
                              </div>
                            )}
                            {fundDataError && (
                              <div className="text-xs text-red-600 mt-2">
                                {fundDataError}
                              </div>
                            )}
                            {!isLoadingFundData && !fundDataError && fundData.length > 0 && (
                              <div className="text-xs text-green-600 mt-2">
                                NAV data loaded: {fundData.length} data points
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Add Favorites section here, but only show when investment mode is historical */}
              {investmentMode === 'historical' && !selectedFund && (
                <div className="mt-4">
                  <h3 className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Or Select from Favorites</h3>
                  <FavoritesFunds onSelectFund={handleFundSelect} />
                </div>
              )}
              
              {/* Date Selection Section */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">
                  SIP Duration
                </label>
                
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      className="app-input"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      max={endDate || format(new Date(), 'yyyy-MM-dd')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">
                      End Date {investmentMode === 'historical' ? '(Required)' : '(Optional)'}
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
                
                <p className="text-xs text-slate-500 mt-1">
                  {investmentMode === 'historical' 
                    ? 'Both dates are required for historical calculation' 
                    : 'End date is optional for expected returns'}
                </p>
                
                {calculationError && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-600 dark:text-red-400">
                    {calculationError}
                  </div>
                )}
              </div>
              
              {/* Frequency Selector */}
              <div className="mb-2">
                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 block mb-2">
                  Investment Frequency
                </label>
                <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  {[
                    { value: 'daily', label: 'Daily' },
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' }
                  ].map((option) => (
                    <button
                      key={option.value}
                      className={`text-sm py-2 px-2 rounded-md transition-all font-medium ${
                        frequency === option.value 
                          ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
                      }`}
                      onClick={() => setFrequency(option.value as InvestmentFrequency)}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="app-card p-4 mb-6">
              <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4">Investment Details</h2>
              
              <div className="space-y-4">
                {/* Initial Lumpsum Amount */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      Initial Lumpsum (₹)
                    </label>
                    <span className="text-sm font-semibold">₹{initialLumpsum.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10000000"
                    step="1000"
                    value={initialLumpsum}
                    onChange={(e) => setInitialLumpsum(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>₹0</span>
                    <span>₹10000000</span>
                  </div>
                </div>
                
                {/* SIP Amount Slider */}
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      SIP Amount (₹)
                    </label>
                    <span className="text-sm font-semibold">₹{amount.toLocaleString()}</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1000000"
                    step="100"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>₹0</span>
                    <span>₹1000000</span>
                  </div>
                </div>
                
                {/* Years Slider - only show for expected mode without end date */}
                {(investmentMode === 'expected' && !endDate) && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        Time Period (Years)
                      </label>
                      <span className="text-sm font-semibold">{years} {years === 1 ? 'year' : 'years'}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      step="1"
                      value={years}
                      onChange={(e) => setYears(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>1 year</span>
                      <span>30 years</span>
                    </div>
                  </div>
                )}
                
                {/* Expected Returns Slider - only shown in expected mode */}
                {investmentMode === 'expected' && (
                  <div>
                    <div className="flex justify-between mb-1">
                      <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        Expected Annual Returns (%)
                      </label>
                      <span className="text-sm font-semibold">{expectedReturn}%</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="30"
                      step="0.5"
                      value={expectedReturn}
                      onChange={(e) => setExpectedReturn(Number(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="flex justify-between text-xs text-slate-500 mt-1">
                      <span>1%</span>
                      <span>30%</span>
                    </div>
                  </div>
                )}
                
                <button
                  className="w-full btn-primary mt-4"
                  onClick={calculateSIP}
                  disabled={isCalculating || (investmentMode === 'historical' && (!startDate || !endDate || !selectedFund))}
                >
                  {isCalculating ? (
                    <div className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Calculating...
                    </div>
                  ) : (
                    'Calculate Returns'
                  )}
                </button>
                
                {investmentMode === 'historical' && (!startDate || !endDate || !selectedFund) && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 text-center mt-2">
                    {!selectedFund ? 'Please select a mutual fund' : 'Please select both start and end dates'}
                  </p>
                )}
              </div>
            </div>
          </div>
          
          {/* Right column: Results */}
          <div className="md:col-span-3">
            <div className="app-card p-4">
              {/* Mobile tabs for chart/breakdown */}
              <div className="flex md:hidden mb-4">
                <div className="w-full grid grid-cols-2 gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                  <button
                    className={`text-sm py-2 px-2 rounded-md transition-all font-medium ${
                      activeTab === 'chart' 
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
                    }`}
                    onClick={() => setActiveTab('chart')}
                  >
                    Chart
                  </button>
                  <button
                    className={`text-sm py-2 px-2 rounded-md transition-all font-medium ${
                      activeTab === 'breakdown' 
                        ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-600 dark:text-blue-400' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50'
                    }`}
                    onClick={() => setActiveTab('breakdown')}
                  >
                    Breakdown
                  </button>
                </div>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200">Growth Projection</h2>
                
                {selectedFund && investmentMode === 'historical' && (
                  <div className="text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-full">
                    Using {selectedFund.schemeName} historical data
                  </div>
                )}
              </div>
              
              {isCalculating ? (
                <div className="h-80 flex items-center justify-center">
                  <div className="animate-pulse flex flex-col items-center">
                    <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
                    <div className="h-40 w-full bg-slate-100 dark:bg-slate-800 rounded"></div>
                  </div>
                </div>
              ) : (
                <div>
                  {sipResult ? (
                    <>
                      {/* Chart - Visible on all screens for 'chart' tab, hidden on mobile for 'breakdown' tab */}
                      <div className={`h-80 ${activeTab === 'breakdown' ? 'hidden md:block' : ''}`}>
                        <Line data={chartData} options={chartOptions} />
                      </div>
                      
                      {/* Investment Summary - Below the chart */}
                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {sipResult.initialLumpsum > 0 && (
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded shadow-sm">
                            <div className="text-sm text-slate-600 dark:text-slate-400">Initial Lumpsum</div>
                            <div className="text-xl font-bold text-slate-900 dark:text-white">₹{sipResult.initialLumpsum.toLocaleString()}</div>
                          </div>
                        )}
                        
                        {sipResult.totalInvestment > sipResult.initialLumpsum && (
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded shadow-sm">
                            <div className="text-sm text-slate-600 dark:text-slate-400">SIP Investments</div>
                            <div className="text-xl font-bold text-slate-900 dark:text-white">₹{(sipResult.totalInvestment - sipResult.initialLumpsum).toLocaleString()}</div>
                          </div>
                        )}
                        
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded shadow-sm">
                          <div className="text-sm text-slate-600 dark:text-slate-400">Total Investment</div>
                          <div className="text-xl font-bold text-slate-900 dark:text-white">₹{sipResult.totalInvestment.toLocaleString()}</div>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded shadow-sm">
                          <div className="text-sm text-slate-600 dark:text-slate-400">Estimated Returns</div>
                          <div className={`text-xl font-bold ${sipResult.estimatedReturns >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {sipResult.estimatedReturns >= 0 ? '+' : ''}₹{sipResult.estimatedReturns.toLocaleString()}
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded shadow-sm">
                          <div className="text-sm text-slate-600 dark:text-slate-400">Absolute Return</div>
                          <div className={`text-xl font-bold ${sipResult.absoluteReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {sipResult.absoluteReturn >= 0 ? '+' : ''}{sipResult.absoluteReturn}%
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded shadow-sm">
                          <div className="text-sm text-slate-600 dark:text-slate-400">Annualized Return</div>
                          <div className={`text-xl font-bold ${sipResult.annualizedReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {sipResult.annualizedReturn >= 0 ? '+' : ''}{sipResult.annualizedReturn}%
                          </div>
                        </div>
                        
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded shadow-sm">
                          <div className="text-sm text-slate-600 dark:text-slate-400">XIRR</div>
                          <div className={`text-xl font-bold ${sipResult.xirr >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {sipResult.xirr >= 0 ? '+' : ''}{sipResult.xirr}%
                          </div>
                        </div>
                        
                        {investmentMode === 'historical' && sipResult.totalUnits > 0 && (
                          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded shadow-sm">
                            <div className="text-sm text-slate-600 dark:text-slate-400">Units Accumulated</div>
                            <div className="text-xl font-bold text-slate-900 dark:text-white">{sipResult.totalUnits.toLocaleString()}</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Last NAV: ₹{sipResult.endNav.toLocaleString()}</div>
                          </div>
                        )}
                        
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded shadow-sm border-l-4 border-blue-500 sm:col-span-2 lg:col-span-3">
                          <div className="text-sm text-blue-700 dark:text-blue-300">Total Value</div>
                          <div className="text-xl font-bold text-blue-700 dark:text-blue-300">₹{sipResult.totalValue.toLocaleString()}</div>
                        </div>
                      </div>
                      
                      {/* Collapsible Investment Breakdown */}
                      <div className="mt-6">
                        <button 
                          onClick={() => setShowBreakdown(!showBreakdown)}
                          className="flex w-full items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded"
                        >
                          <h3 className="text-md font-medium text-slate-700 dark:text-slate-300">
                            Investment Breakdown
                          </h3>
                          <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className={`h-5 w-5 transition-transform ${showBreakdown ? 'rotate-180' : ''}`} 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                        
                        <AnimatePresence>
                          {showBreakdown && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                              className="overflow-visible"
                            >
                              <div className={`mt-3 overflow-x-auto`}>
                                <table className="min-w-full">
                                  <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                      <th className="py-2 px-4 text-left text-sm font-medium text-slate-500 dark:text-slate-400">Date</th>
                                      <th className="py-2 px-4 text-right text-sm font-medium text-slate-500 dark:text-slate-400">Investment</th>
                                      {investmentMode === 'historical' && (
                                        <>
                                          <th className="py-2 px-4 text-right text-sm font-medium text-slate-500 dark:text-slate-400">Units</th>
                                          <th className="py-2 px-4 text-right text-sm font-medium text-slate-500 dark:text-slate-400">NAV</th>
                                        </>
                                      )}
                                      <th className="py-2 px-4 text-right text-sm font-medium text-slate-500 dark:text-slate-400">Value</th>
                                      <th className="py-2 px-4 text-right text-sm font-medium text-slate-500 dark:text-slate-400">Returns</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {sipResult?.timeline.map((item, index) => (
                                      <tr key={index} className="border-b border-slate-100 dark:border-slate-800">
                                        <td className="py-2 px-4 text-sm text-slate-700 dark:text-slate-300">{item.date}</td>
                                        <td className="py-2 px-4 text-right text-sm text-slate-700 dark:text-slate-300">₹{item.investmentValue.toLocaleString()}</td>
                                        {investmentMode === 'historical' && (
                                          <>
                                            <td className="py-2 px-4 text-right text-sm text-slate-700 dark:text-slate-300">{item.units?.toFixed(4) || "-"}</td>
                                            <td className="py-2 px-4 text-right text-sm text-slate-700 dark:text-slate-300">₹{item.nav?.toFixed(4) || "-"}</td>
                                          </>
                                        )}
                                        <td className="py-2 px-4 text-right text-sm text-slate-700 dark:text-slate-300">₹{item.totalValue.toLocaleString()}</td>
                                        <td className={`py-2 px-4 text-right text-sm ${item.totalValue - item.investmentValue >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                          {item.totalValue - item.investmentValue >= 0 ? '+' : ''}₹{(item.totalValue - item.investmentValue).toLocaleString()}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-slate-600 dark:text-slate-300 mb-2">Ready to Calculate</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {investmentMode === 'historical' 
                          ? 'Select a fund, set dates, and click Calculate Returns' 
                          : 'Adjust parameters and click Calculate Returns'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Benefits of SIP section */}
        <div className="mt-8 app-card p-6">
          <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-4">Benefits of SIP Investing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <div className="text-blue-600 dark:text-blue-400 font-medium mb-2">Rupee Cost Averaging</div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Regular investments help average out the purchase cost, reducing the impact of market volatility.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800">
              <div className="text-green-600 dark:text-green-400 font-medium mb-2">Power of Compounding</div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Returns earned on your investment generate their own returns over time, accelerating wealth creation.
              </p>
            </div>
            <div className="p-4 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
              <div className="text-purple-600 dark:text-purple-400 font-medium mb-2">Financial Discipline</div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                Regular SIPs help establish a habit of consistent investing regardless of market conditions.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SIPCalculator; 