// API utilities for Nifty Indices data fetching
// Based on the curl command structure from niftyindices.com

export interface NiftyAPIRequest {
  name: string;
  startDate: string;
  endDate: string;
  indexName: string;
}

export interface NiftyDataPoint {
  RequestNumber: string;
  "Index Name": string;
  INDEX_NAME: string;
  HistoricalDate: string;
  OPEN: string;
  HIGH: string;
  LOW: string;
  CLOSE: string;
}

export interface NiftyAPIResponse {
  d: string; // JSON string containing array of data points
}

/**
 * Format date for Nifty API (DD-MMM-YYYY format)
 */
export const formatDateForNiftyAPI = (dateString: string): string => {
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day}-${month}-${year}`;
};

/**
 * Fetch historical data from Nifty Indices API
 */
export const fetchNiftyHistoricalData = async (
  indexName: string,
  startDate: string,
  endDate: string
): Promise<NiftyDataPoint[]> => {
  const apiUrl = 'https://cors-anywhere.herokuapp.com/https://www.niftyindices.com/Backpage.aspx/getHistoricaldatatabletoString';
  
  const requestBody = {
    cinfo: JSON.stringify({
      name: indexName,
      startDate: formatDateForNiftyAPI(startDate),
      endDate: formatDateForNiftyAPI(endDate),
      indexName: indexName
    })
  };

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json, text/javascript, */*; q=0.01',
        'Accept-Language': 'en-US,en-IN;q=0.9,en;q=0.8,hi-IN;q=0.7,hi;q=0.6',
        'Content-Type': 'application/json; charset=UTF-8',
        'Origin': 'https://www.niftyindices.com',
        'Referer': 'https://www.niftyindices.com/reports/historical-data',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
        'X-Requested-With': 'XMLHttpRequest',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: NiftyAPIResponse = await response.json();
    
    // Parse the nested JSON string
    const historicalData: NiftyDataPoint[] = JSON.parse(data.d);
    
    return historicalData;
  } catch (error) {
    console.error('Error fetching Nifty data:', error);
    throw new Error('Failed to fetch historical data. Using mock data for demonstration.');
  }
};

/**
 * Convert API data format to internal format
 */
export const convertNiftyDataToInternal = (apiData: NiftyDataPoint[]) => {
  return apiData.map(point => ({
    date: formatDateToISO(point.HistoricalDate),
    open: parseFloat(point.OPEN),
    high: parseFloat(point.HIGH),
    low: parseFloat(point.LOW),
    close: parseFloat(point.CLOSE),
    volume: 0 // Volume not provided in this API response
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // Sort by date ascending
};

/**
 * Convert date from "DD MMM YYYY" to ISO format
 */
const formatDateToISO = (dateString: string): string => {
  const monthMap: { [key: string]: string } = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04', 'May': '05', 'Jun': '06',
    'Jul': '07', 'Aug': '08', 'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
  
  // Handle format like "28 Jun 2023"
  const parts = dateString.trim().split(' ');
  if (parts.length !== 3) return dateString;
  
  const day = parts[0].padStart(2, '0');
  const month = monthMap[parts[1]] || '01';
  const year = parts[2];
  
  return `${year}-${month}-${day}`;
};

/**
 * Get available date range for an index
 */
export const getIndexDateRange = (indexName: string): { minDate: string; maxDate: string } => {
  // Default date ranges - in real implementation, this could come from API
  const dateRanges: { [key: string]: { minDate: string; maxDate: string } } = {
    'Nifty 50': { minDate: '1999-11-03', maxDate: new Date().toISOString().split('T')[0] },
    'Nifty Bank': { minDate: '2000-01-01', maxDate: new Date().toISOString().split('T')[0] },
    'Nifty IT': { minDate: '2001-01-01', maxDate: new Date().toISOString().split('T')[0] },
    // Add more as needed
  };
  
  return dateRanges[indexName] || { 
    minDate: '2000-01-01', 
    maxDate: new Date().toISOString().split('T')[0] 
  };
};

/**
 * Generate mock data for demonstration when API fails
 * Using the same structure as real API response
 */
export const generateMockNiftyData = (
  startDate: string, 
  endDate: string, 
  indexName: string = 'Nifty 50'
): NiftyDataPoint[] => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const data: NiftyDataPoint[] = [];
  
  // Base price depending on index
  const basePrices: { [key: string]: number } = {
    'Nifty 50': 18000,
    'Nifty Bank': 42000,
    'Nifty IT': 30000,
    'Nifty Auto': 15000,
    'Nifty Pharma': 13000,
    'Nifty FMCG': 50000,
    'Nifty Energy': 24500,
    'Nifty Metal': 6500,
    'Nifty Realty': 400,
  };
  
  let currentPrice = basePrices[indexName] || 18000;
  let currentDate = new Date(start);
  let requestNumber = Date.now();

  while (currentDate <= end) {
    // Skip weekends
    if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
      const dailyChange = (Math.random() - 0.5) * 0.04; // ±2% daily volatility
      const open = currentPrice;
      const close = currentPrice * (1 + dailyChange);
      const high = Math.max(open, close) * (1 + Math.random() * 0.02);
      const low = Math.min(open, close) * (1 - Math.random() * 0.02);

      // Format date as "DD MMM YYYY"
      const day = currentDate.getDate();
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                     'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = months[currentDate.getMonth()];
      const year = currentDate.getFullYear();
      const formattedDate = `${day} ${month} ${year}`;

      data.push({
        RequestNumber: `His${requestNumber}`,
        "Index Name": "",
        INDEX_NAME: indexName,
        HistoricalDate: formattedDate,
        OPEN: open.toFixed(2),
        HIGH: high.toFixed(2),
        LOW: low.toFixed(2),
        CLOSE: close.toFixed(2)
      });

      currentPrice = close;
      requestNumber++;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return data.reverse(); // API typically returns newest first
}; 