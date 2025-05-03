'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { parseISO, isValid } from 'date-fns';
import EnhancedFundChart from './EnhancedFundChart';
import FundMetrics from './FundMetrics';

interface MutualFundData {
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

interface MutualFundChartProps {
  schemeCode: number | null;
  schemeName: string;
  period: '1m' | '3m' | '6m' | '1y' | '3y' | '5y' | 'all';
  startDate: string | null;
  endDate: string | null;
}

const MutualFundChart: React.FC<MutualFundChartProps> = ({ 
  schemeCode, 
  schemeName, 
  period, 
  startDate, 
  endDate 
}) => {
  const [chartData, setChartData] = useState<MutualFundData[]>([]);
  const [metaData, setMetaData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [transitioning, setTransitioning] = useState<boolean>(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState<boolean>(false);

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

  useEffect(() => {
    // Don't fetch if no scheme code is selected
    if (!schemeCode) {
      setLoading(false);
      return;
    }

    // First set transitioning to true for smooth UI updates
    setTransitioning(true);
    
    // Short timeout to allow transition animation to begin
    setTimeout(async () => {
      // Only show loading state on first load
      if (!hasLoadedOnce) {
        setLoading(true);
      }
      
      try {
        const response = await axios.get<ApiResponse>(`https://api.mfapi.in/mf/${schemeCode}`);
        
        // Store metadata
        setMetaData(response.data.meta);
        
        // Sort data by date (oldest first)
        const sortedData = [...response.data.data].sort((a, b) => 
          safeParseDate(a.date).getTime() - safeParseDate(b.date).getTime()
        );
        
        // Apply filters
        let filteredData;
        
        // Custom date range has priority over period selection
        if (startDate && endDate) {
          filteredData = filterDataByDateRange(sortedData, startDate, endDate);
        } else {
          filteredData = filterDataByPeriod(sortedData, period);
        }
        
        // Convert API data to our format
        const formattedData = filteredData.map(item => ({
          date: item.date,
          nav: parseFloat(item.nav)
        }));
        
        setChartData(formattedData);
        setError(null);
        setHasLoadedOnce(true);
      } catch (err) {
        setError('Failed to fetch mutual fund data');
        console.error(err);
        setChartData([]);
      } finally {
        // Add a small delay to make loading smoother
        setTimeout(() => {
          setLoading(false);
          setTransitioning(false);
        }, 300);
      }
    }, 100);
  }, [schemeCode, period, startDate, endDate]);

  // Filter data based on selected period
  const filterDataByPeriod = (data: { date: string; nav: string }[], selectedPeriod: string) => {
    const today = new Date();
    let periodStartDate = new Date();
    
    switch (selectedPeriod) {
      case '1m':
        periodStartDate.setMonth(today.getMonth() - 1);
        break;
      case '3m':
        periodStartDate.setMonth(today.getMonth() - 3);
        break;
      case '6m':
        periodStartDate.setMonth(today.getMonth() - 6);
        break;
      case '1y':
        periodStartDate.setFullYear(today.getFullYear() - 1);
        break;
      case '3y':
        periodStartDate.setFullYear(today.getFullYear() - 3);
        break;
      case '5y':
        periodStartDate.setFullYear(today.getFullYear() - 5);
        break;
      case 'all':
      default:
        // Return all data for 'all'
        return data;
    }
    
    return data.filter(item => {
      const itemDate = safeParseDate(item.date);
      return itemDate >= periodStartDate;
    });
  };

  // Filter data by custom date range
  const filterDataByDateRange = (data: { date: string; nav: string }[], start: string, end: string) => {
    const startDateObj = safeParseDate(start);
    const endDateObj = safeParseDate(end);
    
    // Add one day to end date to include the end date in the range
    endDateObj.setDate(endDateObj.getDate() + 1);
    
    return data.filter(item => {
      const itemDate = safeParseDate(item.date);
      return itemDate >= startDateObj && itemDate <= endDateObj;
    });
  };

  // Generate chart skeleton
  const renderChartSkeleton = () => (
    <div className="app-card p-4 animate-pulse">
      <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/2 mb-4"></div>
      <div className="h-80 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center">
        <div className="w-full px-6">
          <div className="h-[1px] w-full bg-slate-200 dark:bg-slate-700 my-4"></div>
          <div className="h-[1px] w-full bg-slate-200 dark:bg-slate-700 my-4"></div>
          <div className="h-[1px] w-full bg-slate-200 dark:bg-slate-700 my-4"></div>
          <div className="h-[1px] w-full bg-slate-200 dark:bg-slate-700 my-4"></div>
          <div className="flex justify-between mt-8">
            <div className="h-4 w-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 w-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 w-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 w-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
            <div className="h-4 w-10 bg-slate-200 dark:bg-slate-700 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );

  // Generate metrics skeleton
  const renderMetricsSkeleton = () => (
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

  return (
    <div className="space-y-6">
      {/* Chart with fixed height container to prevent layout shifts */}
      <div className="min-h-[400px] relative">
        {transitioning ? (
          renderChartSkeleton()
        ) : (
          <EnhancedFundChart 
            data={chartData} 
            isLoading={loading} 
            schemeName={schemeName} 
          />
        )}
      </div>
      
      {/* Always render metrics container even if no data yet */}
      <div className="min-h-[500px] relative">
        {transitioning ? (
          renderMetricsSkeleton()
        ) : (
          <>
            {hasLoadedOnce && (
              <FundMetrics
                data={chartData}
                schemeCode={schemeCode!}
                schemeName={schemeName}
                startDate={startDate}
                endDate={endDate}
                metaData={metaData}
                isLoading={loading}
              />
            )}
            
            {/* Error state */}
            {error && (
              <div className="app-card p-4 rounded-lg text-red-600 dark:text-red-400 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-red-500 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            
            {/* Empty state */}
            {!loading && !error && !hasLoadedOnce && (
              <div className="app-card p-6 text-slate-500 dark:text-slate-400 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Select a time period to view data
              </div>
            )}
            
            {/* No data state */}
            {!loading && !error && hasLoadedOnce && chartData.length === 0 && (
              <div className="app-card p-6 text-slate-500 dark:text-slate-400 text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-2 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                No data available for the selected period
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MutualFundChart; 