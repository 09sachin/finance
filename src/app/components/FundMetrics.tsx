'use client';

import React from 'react';
import { format, parseISO, differenceInDays, differenceInMonths, differenceInYears, isValid } from 'date-fns';

interface FundDataPoint {
  date: string;
  nav: number;
}

interface FundMetricsProps {
  data: FundDataPoint[];
  schemeName: string;
  schemeCode: number;
  startDate: string | null;
  endDate: string | null;
  metaData?: any;
  isLoading: boolean;
}

const FundMetrics: React.FC<FundMetricsProps> = ({
  data,
  schemeName,
  schemeCode,
  metaData,
  isLoading
}) => {
  if (isLoading) {
    return (
      <div className="app-card p-4 animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-6"></div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
          <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
          </div>
          <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
          </div>
          <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-lg p-3">
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-2/3"></div>
          </div>
        </div>
        
        <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length < 2) {
    return (
      <div className="app-card p-6 text-center">
        <p className="text-slate-500">Insufficient data to calculate metrics.</p>
      </div>
    );
  }

  // Safely parse a date string to avoid invalid date errors
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

  // Safely format a date for display
  const safeFormatDate = (dateString: string, formatStr: string): string => {
    try {
      const date = safeParseDate(dateString);
      return format(date, formatStr);
    } catch (e) {
      console.error("Date formatting error:", e);
      return dateString;
    }
  };

  // Sort data chronologically
  const sortedData = [...data].sort((a, b) => safeParseDate(a.date).getTime() - safeParseDate(b.date).getTime());
  
  // Get first and last data points
  const firstPoint = sortedData[0];
  const lastPoint = sortedData[sortedData.length - 1];
  
  // Calculate time differences
  const startDateObj = safeParseDate(firstPoint.date);
  const endDateObj = safeParseDate(lastPoint.date);
  
  // Ensure we have valid dates before calculating differences
  let daysCount = 0;
  let monthsCount = 0;
  let yearsCount = 0;
  
  if (isValid(startDateObj) && isValid(endDateObj)) {
    daysCount = differenceInDays(endDateObj, startDateObj);
    monthsCount = differenceInMonths(endDateObj, startDateObj);
    yearsCount = differenceInYears(endDateObj, startDateObj);
  }
  
  // Calculate returns
  const absoluteReturn = ((lastPoint.nav - firstPoint.nav) / firstPoint.nav) * 100;
  
  // Calculate CAGR (only if period is >= 1 year)
  let cagr = null;
  if (yearsCount > 0) {
    const years = daysCount / 365.25; // More accurate year calculation
    cagr = (Math.pow((lastPoint.nav / firstPoint.nav), (1 / years)) - 1) * 100;
  }
  
  // Calculate annualized return (for periods < 1 year)
  let annualizedReturn = null;
  if (yearsCount < 1 && daysCount > 0) {
    annualizedReturn = (Math.pow((lastPoint.nav / firstPoint.nav), (365.25 / daysCount)) - 1) * 100;
  }
  
  // Calculate standard deviation (volatility) of daily returns
  let volatility = null;
  if (sortedData.length > 2) {
    // Calculate daily returns
    const dailyReturns = [];
    for (let i = 1; i < sortedData.length; i++) {
      const dailyReturn = (sortedData[i].nav - sortedData[i-1].nav) / sortedData[i-1].nav;
      dailyReturns.push(dailyReturn);
    }
    
    // Calculate standard deviation
    const mean = dailyReturns.reduce((sum, value) => sum + value, 0) / dailyReturns.length;
    const squaredDiffs = dailyReturns.map(value => Math.pow(value - mean, 2));
    const variance = squaredDiffs.reduce((sum, value) => sum + value, 0) / squaredDiffs.length;
    volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility
  }
  
  // Calculate max drawdown (maximum loss from a peak)
  let maxDrawdown = 0;
  if (sortedData.length > 2) {
    let peakNav = sortedData[0].nav;
    
    for (let i = 1; i < sortedData.length; i++) {
      const currentNav = sortedData[i].nav;
      peakNav = Math.max(peakNav, currentNav);
      
      const drawdown = (peakNav - currentNav) / peakNav;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    maxDrawdown = maxDrawdown * 100;
  }

  // Format period for display
  let periodText = '';
  if (yearsCount > 0) {
    periodText = `${yearsCount} year${yearsCount > 1 ? 's' : ''}`;
    if (monthsCount % 12 > 0) {
      periodText += ` ${monthsCount % 12} month${monthsCount % 12 > 1 ? 's' : ''}`;
    }
  } else if (monthsCount > 0) {
    periodText = `${monthsCount} month${monthsCount > 1 ? 's' : ''}`;
  } else {
    periodText = `${daysCount} day${daysCount > 1 ? 's' : ''}`;
  }

  return (
    <div className="app-card p-6">
      <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-1">{schemeName}</h2>
      {metaData && (
        <div className="text-sm text-slate-500 dark:text-slate-400 mb-4">
          {metaData.fund_house} | {metaData.scheme_category} | Scheme Code: {schemeCode}
        </div>
      )}
      
      <div className="mb-6">
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">Performance metrics for period:</div>
        <div className="text-base font-medium">
          {safeFormatDate(firstPoint.date, 'dd MMM yyyy')} - {safeFormatDate(lastPoint.date, 'dd MMM yyyy')} ({periodText})
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded shadow-sm">
          <div className="text-sm text-slate-600 dark:text-slate-400">Starting NAV</div>
          <div className="text-lg font-bold text-slate-800 dark:text-white">₹{firstPoint.nav.toFixed(2)}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{safeFormatDate(firstPoint.date, 'dd MMM yyyy')}</div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded shadow-sm">
          <div className="text-sm text-slate-600 dark:text-slate-400">Current NAV</div>
          <div className="text-lg font-bold text-slate-800 dark:text-white">₹{lastPoint.nav.toFixed(2)}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">{safeFormatDate(lastPoint.date, 'dd MMM yyyy')}</div>
        </div>
        
        <div className={`bg-slate-50 dark:bg-slate-800/50 p-3 rounded shadow-sm ${absoluteReturn >= 0 ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
          <div className="text-sm text-slate-600 dark:text-slate-400">Total Return</div>
          <div className={`text-lg font-bold ${absoluteReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {absoluteReturn >= 0 ? '+' : ''}{absoluteReturn.toFixed(2)}%
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">For selected period</div>
        </div>
        
        {cagr !== null && (
          <div className={`bg-slate-50 dark:bg-slate-800/50 p-3 rounded shadow-sm ${cagr >= 0 ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
            <div className="text-sm text-slate-600 dark:text-slate-400">CAGR</div>
            <div className={`text-lg font-bold ${cagr >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {cagr >= 0 ? '+' : ''}{cagr.toFixed(2)}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Compound Annual Growth Rate</div>
          </div>
        )}
        
        {annualizedReturn !== null && (
          <div className={`bg-slate-50 dark:bg-slate-800/50 p-3 rounded shadow-sm ${annualizedReturn >= 0 ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}`}>
            <div className="text-sm text-slate-600 dark:text-slate-400">Annualized Return</div>
            <div className={`text-lg font-bold ${annualizedReturn >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {annualizedReturn >= 0 ? '+' : ''}{annualizedReturn.toFixed(2)}%
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Yearly equivalent return</div>
          </div>
        )}
        
        {volatility !== null && (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded shadow-sm">
            <div className="text-sm text-slate-600 dark:text-slate-400">Volatility</div>
            <div className="text-lg font-bold text-slate-800 dark:text-white">{volatility.toFixed(2)}%</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Annualized standard deviation</div>
          </div>
        )}
        
        {maxDrawdown > 0 && (
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded shadow-sm">
            <div className="text-sm text-slate-600 dark:text-slate-400">Max Drawdown</div>
            <div className="text-lg font-bold text-red-600 dark:text-red-400">-{maxDrawdown.toFixed(2)}%</div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Maximum drop from peak</div>
          </div>
        )}
      </div>
      
      {/* Yearly Performance */}
      {yearsCount > 0 && (
        <div>
          <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-3">Yearly Performance</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="text-left text-sm font-medium text-slate-500 dark:text-slate-400 pb-2">Year</th>
                  <th className="text-right text-sm font-medium text-slate-500 dark:text-slate-400 pb-2">Starting NAV</th>
                  <th className="text-right text-sm font-medium text-slate-500 dark:text-slate-400 pb-2">Ending NAV</th>
                  <th className="text-right text-sm font-medium text-slate-500 dark:text-slate-400 pb-2">Return</th>
                </tr>
              </thead>
              <tbody>
                {getYearlyData(sortedData).map(yearData => (
                  <tr key={yearData.year} className="border-t border-slate-100 dark:border-slate-800">
                    <td className="py-2 text-slate-800 dark:text-slate-200">{yearData.year}</td>
                    <td className="py-2 text-right text-slate-800 dark:text-slate-200">₹{yearData.startNav.toFixed(2)}</td>
                    <td className="py-2 text-right text-slate-800 dark:text-slate-200">₹{yearData.endNav.toFixed(2)}</td>
                    <td className={`py-2 text-right font-medium ${yearData.return >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                      {yearData.return >= 0 ? '+' : ''}{yearData.return.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper function to calculate yearly performance
function getYearlyData(sortedData: FundDataPoint[]) {
  if (sortedData.length < 2) return [];
  
  const yearlyData: {
    year: number | string;
    startNav: number;
    endNav: number;
    return: number;
  }[] = [];
  
  // Group data points by year
  const dataByYear = new Map<string, FundDataPoint[]>();
  
  sortedData.forEach(point => {
    try {
      // Parse the date safely
      const dateParts = point.date.split('-');
      let year: string;
      
      // Handle DD-MM-YYYY format
      if (dateParts.length === 3 && dateParts[2] && dateParts[2].length === 4) {
        year = dateParts[2]; // Year is in position 2 for DD-MM-YYYY
      } 
      // Handle YYYY-MM-DD format
      else if (dateParts.length === 3 && dateParts[0] && dateParts[0].length === 4) {
        year = dateParts[0]; // Year is in position 0 for YYYY-MM-DD
      }
      // Fallback to current year if format is unrecognized
      else {
        year = new Date().getFullYear().toString();
        console.warn(`Invalid date format: ${point.date}, using current year`);
      }
      
      if (!dataByYear.has(year)) {
        dataByYear.set(year, []);
      }
      
      dataByYear.get(year)?.push(point);
    } catch (e) {
      console.error('Error parsing date:', e);
    }
  });
  
  // Calculate yearly returns
  dataByYear.forEach((points, year) => {
    if (points.length > 0) {
      // Sort points within the year (should already be sorted but just to be safe)
      points.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return dateA.getTime() - dateB.getTime();
      });
      
      const startNav = points[0].nav;
      const endNav = points[points.length - 1].nav;
      const returnPercentage = ((endNav - startNav) / startNav) * 100;
      
      yearlyData.push({
        year,
        startNav,
        endNav,
        return: returnPercentage
      });
    }
  });
  
  // Sort by year (descending) - convert to number for sorting, but keep as string for display
  return yearlyData.sort((a, b) => Number(b.year) - Number(a.year));
}

export default FundMetrics; 