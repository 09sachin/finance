'use client';

import React from 'react';
import { format, parseISO, isValid } from 'date-fns';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

interface FundDataPoint {
  date: string;
  nav: number;
}

interface EnhancedFundChartProps {
  data: FundDataPoint[];
  isLoading: boolean;
  schemeName: string;
}

const EnhancedFundChart: React.FC<EnhancedFundChartProps> = ({ 
  data, 
  isLoading, 
  schemeName 
}) => {
  // Enhanced skeleton loading 
  if (isLoading) {
    return (
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
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-80 app-card flex items-center justify-center">
        <div className="text-slate-500">No data available for the selected period</div>
      </div>
    );
  }

  // Safely format a date string to avoid invalid date errors
  const safeFormatDate = (dateString: string, formatStr: string): string => {
    try {
      // Handle different date formats
      let date;
      
      // Try to parse ISO format
      date = parseISO(dateString);
      
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
      
      // If still invalid, return original
      if (!isValid(date)) {
        return dateString;
      }
      
      return format(date, formatStr);
    } catch (e) {
      console.error("Date formatting error:", e);
      return dateString;
    }
  };

  // Get initial NAV for calculating changes
  const initialNav = data.length > 0 ? data[0].nav : 0;

  // Format data for the chart
  const chartData = data.map(item => {
    const absoluteChange = item.nav - initialNav;
    const percentChange = (absoluteChange / initialNav) * 100;
    
    return {
      date: item.date,
      nav: item.nav,
      formattedDate: safeFormatDate(item.date, 'dd MMM yyyy'),
      absoluteChange,
      percentChange
    };
  });

  // Calculate min and max values for better visualization
  const navValues = data.map(item => item.nav);
  const minNav = Math.min(...navValues);
  const maxNav = Math.max(...navValues);
  // Add 2% padding to min and max values
  const yAxisDomain = [
    minNav - (minNav * 0.02),
    maxNav + (maxNav * 0.02)
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      
      // Determine color for change values
      const changeColorClass = dataPoint.absoluteChange >= 0 
        ? "text-green-600 dark:text-green-400" 
        : "text-red-600 dark:text-red-400";
      
      // Format sign for display
      const changeSign = dataPoint.absoluteChange >= 0 ? '+' : '';
      
      return (
        <div className="app-card p-3 shadow-md border-slate-100 dark:border-slate-700 min-w-[180px]">
          <p className="font-medium text-slate-800 dark:text-slate-200 mb-1.5">{dataPoint.formattedDate}</p>
          <p className="text-sm flex items-center justify-between mb-1">
            <span className="text-slate-500 dark:text-slate-400">NAV:</span>
            <span className="font-medium text-blue-600 dark:text-blue-400">₹{dataPoint.nav.toFixed(2)}</span>
          </p>
          
          <div className="pt-1.5 mt-1.5 border-t border-slate-100 dark:border-slate-700">
            <p className="text-sm flex items-center justify-between mb-1">
              <span className="text-slate-500 dark:text-slate-400">Change:</span>
              <span className={`font-medium ${changeColorClass}`}>
                {changeSign}₹{dataPoint.absoluteChange.toFixed(2)}
              </span>
            </p>
            <p className="text-sm flex items-center justify-between">
              <span className="text-slate-500 dark:text-slate-400">Return:</span>
              <span className={`font-medium ${changeColorClass}`}>
                {changeSign}{dataPoint.percentChange.toFixed(2)}%
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom date formatter for X-axis
  const formatXAxisDate = (dateStr: string) => {
    try {
      const date = parseISO(dateStr);
      if (isValid(date)) {
        return format(date, 'MMM yyyy');
      }
      
      // Try to parse DD-MM-YYYY format
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        const date = new Date(
          parseInt(parts[2]), // year
          parseInt(parts[1]) - 1, // month
          parseInt(parts[0]) // day
        );
        if (isValid(date)) {
          return format(date, 'MMM yyyy');
        }
      }
      
      return dateStr;
    } catch (e) {
      console.log(e);
      return dateStr;
    }
  };

  return (
    <div className="app-card p-4">
      <h3 className="text-lg font-medium mb-4 text-slate-700 dark:text-slate-200">{schemeName} - NAV History</h3>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorNav" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={formatXAxisDate}
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis 
              domain={yAxisDomain}
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickFormatter={(value) => `₹${value.toFixed(1)}`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area 
              type="monotone" 
              dataKey="nav" 
              name="NAV Value"
              stroke="#3b82f6" 
              fillOpacity={1} 
              fill="url(#colorNav)" 
              activeDot={{ r: 6 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EnhancedFundChart; 