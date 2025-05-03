'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import { parseISO, isValid } from 'date-fns';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend,
  Filler,
  ChartData
} from 'chart.js';

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

interface FundData {
  schemeCode: number;
  schemeName: string;
  color: string;
  data: {
    date: string;
    nav: number;
  }[];
  isLoading: boolean;
  error: string | null;
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

interface FundComparisonProps {
  selectedFunds: {
    schemeCode: number;
    schemeName: string;
  }[];
  period: '1m' | '3m' | '6m' | '1y' | '3y' | '5y' | 'all';
  startDate: string | null;
  endDate: string | null;
  onRemoveFund: (schemeCode: number) => void;
}

const CHART_COLORS = [
  'rgba(59, 130, 246, 1)', // Blue
  'rgba(16, 185, 129, 1)',  // Green
  'rgba(249, 115, 22, 1)',  // Orange
];

const FundComparison: React.FC<FundComparisonProps> = ({ 
  selectedFunds,
  period,
  startDate,
  endDate,
  onRemoveFund
}) => {
  const [fundsData, setFundsData] = useState<FundData[]>([]);
  const [normalizedView, setNormalizedView] = useState<boolean>(true);
  
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
  
  // Filter data based on selected period
  const filterDataByPeriod = (data: { date: string; nav: string }[], selectedPeriod: string) => {
    const today = new Date();
    const periodStartDate = new Date();
    
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
  
  // Fetch data for each fund
  useEffect(() => {
    const fetchFundData = async () => {
      // Initialize with loading state for all funds
      const initialFundsData = selectedFunds.map((fund, index) => ({
        schemeCode: fund.schemeCode,
        schemeName: fund.schemeName,
        color: CHART_COLORS[index % CHART_COLORS.length],
        data: [],
        isLoading: true,
        error: null
      }));
      
      setFundsData(initialFundsData);
      
      // Fetch data for each fund
      const updatedFundsData = await Promise.all(
        selectedFunds.map(async (fund, index) => {
          try {
            const response = await axios.get<ApiResponse>(`https://api.mfapi.in/mf/${fund.schemeCode}`);
            
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
            
            return {
              schemeCode: fund.schemeCode,
              schemeName: fund.schemeName,
              color: CHART_COLORS[index % CHART_COLORS.length],
              data: formattedData,
              isLoading: false,
              error: null
            };
          } catch (err) {
            console.error(`Error fetching data for fund ${fund.schemeCode}:`, err);
            return {
              schemeCode: fund.schemeCode,
              schemeName: fund.schemeName,
              color: CHART_COLORS[index % CHART_COLORS.length],
              data: [],
              isLoading: false,
              error: 'Failed to fetch fund data'
            };
          }
        })
      );
      
      setFundsData(updatedFundsData);
    };
    
    if (selectedFunds.length > 0) {
      fetchFundData();
    } else {
      setFundsData([]);
    }
  }, [selectedFunds, period, startDate, endDate, filterDataByPeriod, filterDataByDateRange]);
  
  // Normalize data for comparison (if enabled)
  const getNormalizedChartData = (): ChartData<'line'> | null => {
    if (fundsData.length === 0) return null;
    
    // Find the common date range
    const allDates = new Set<string>();
    
    fundsData.forEach(fund => {
      fund.data.forEach(item => {
        allDates.add(item.date);
      });
    });
    
    const sortedDates = Array.from(allDates).sort((a, b) => 
      safeParseDate(a).getTime() - safeParseDate(b).getTime()
    );
    
    // Prepare datasets
    const datasets = fundsData.map(fund => {
      // For normalized view, convert to percentage change from first value
      if (normalizedView && fund.data.length > 0) {
        const firstNav = fund.data[0].nav;
        const normalizedData = fund.data.map(item => ({
          date: item.date,
          nav: ((item.nav / firstNav) - 1) * 100 // Convert to percentage
        }));
        
        return {
          label: fund.schemeName,
          data: normalizedData.map(item => item.nav),
          borderColor: fund.color,
          backgroundColor: fund.color.replace('1)', '0.1)'),
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 1,
          pointHoverRadius: 5
        };
      } else {
        // For absolute view, use actual NAV values
        return {
          label: fund.schemeName,
          data: fund.data.map(item => item.nav),
          borderColor: fund.color,
          backgroundColor: fund.color.replace('1)', '0.1)'),
          borderWidth: 2,
          tension: 0.4,
          pointRadius: 1,
          pointHoverRadius: 5
        };
      }
    });
    
    // Find dates that are common to at least one fund
    return {
      labels: sortedDates,
      datasets: datasets
    };
  };
  
  const chartData = getNormalizedChartData();
  
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: normalizedView,
        ticks: {
          callback: function(value: any) {
            return normalizedView ? `${value.toFixed(2)}%` : `₹${value}`;
          }
        }
      }
    },
    plugins: {
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            const fundName = context.dataset.label;
            return normalizedView 
              ? `${fundName}: ${value.toFixed(2)}%` 
              : `${fundName}: ₹${value}`;
          }
        }
      },
      legend: {
        position: 'top' as const,
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    }
  };
  
  return (
    <div className="app-card p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
        <h2 className="text-lg font-medium text-slate-700 dark:text-slate-200 mb-2 sm:mb-0">Fund Comparison</h2>
        
        <div className="flex items-center justify-center sm:justify-end gap-3 w-full sm:w-auto">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="normalizedView"
              checked={normalizedView}
              onChange={() => setNormalizedView(!normalizedView)}
              className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <label htmlFor="normalizedView" className="ml-2 text-sm text-slate-600 dark:text-slate-300">
              Normalized View
            </label>
          </div>
        </div>
      </div>
      
      {/* Loading state */}
      {fundsData.some(fund => fund.isLoading) ? (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-6 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-4"></div>
            <div className="h-40 w-full max-w-2xl bg-slate-100 dark:bg-slate-800 rounded"></div>
          </div>
        </div>
      ) : (
        <>
          {fundsData.length > 0 ? (
            <>
              {/* Chart */}
              <div className="min-h-[400px]">
                {chartData && (
                  <Line data={chartData} options={chartOptions} />
                )}
              </div>
              
              {/* Legend/color guide */}
              <div className="mt-4 mb-4">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Funds</h3>
                <div className="flex flex-wrap gap-3">
                  {fundsData.map(fund => (
                    <div 
                      key={fund.schemeCode}
                      className="flex items-center gap-2 py-1 px-3 bg-slate-50 dark:bg-slate-800 rounded-full"
                    >
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: fund.color }}
                      ></div>
                      <span className="text-sm text-slate-700 dark:text-slate-300 truncate max-w-[120px] sm:max-w-[200px]">{fund.schemeName}</span>
                      <button
                        onClick={() => onRemoveFund(fund.schemeCode)}
                        className="text-slate-400 hover:text-red-500 transition-colors"
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
              
              {/* Metrics comparison */}
              <div className="mt-8">
                <h3 className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Performance Metrics</h3>
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700">
                        <th className="py-3 px-4 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Fund</th>
                        <th className="py-3 px-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Start NAV</th>
                        <th className="py-3 px-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">End NAV</th>
                        <th className="py-3 px-4 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Returns (%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fundsData.map(fund => {
                        const startNav = fund.data.length > 0 ? fund.data[0].nav : 0;
                        const endNav = fund.data.length > 0 ? fund.data[fund.data.length - 1].nav : 0;
                        const returns = startNav > 0 ? ((endNav - startNav) / startNav) * 100 : 0;
                        const isPositive = returns >= 0;
                        
                        return (
                          <tr key={fund.schemeCode} className="border-b border-slate-100 dark:border-slate-800">
                            <td className="py-3 px-4 text-sm">
                              <div className="flex items-center">
                                <div 
                                  className="w-3 h-3 rounded-full mr-2" 
                                  style={{ backgroundColor: fund.color }}
                                ></div>
                                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[100px] sm:max-w-full">{fund.schemeName}</span>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-sm text-right text-slate-700 dark:text-slate-300">₹{startNav.toFixed(2)}</td>
                            <td className="py-3 px-4 text-sm text-right text-slate-700 dark:text-slate-300">₹{endNav.toFixed(2)}</td>
                            <td className={`py-3 px-4 text-sm text-right font-medium ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                              {isPositive ? '+' : ''}{returns.toFixed(2)}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center">
              <p className="text-slate-500 dark:text-slate-400">No data available for the selected funds.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FundComparison; 