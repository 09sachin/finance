'use client';

import React, { useState, useEffect } from 'react';

interface FundDetailsProps {
  fundId: string;
}

interface FundInfo {
  name: string;
  category: string;
  aum: string; // Assets Under Management
  expenseRatio: string;
  nav: number;
  navDate: string;
  returns: {
    oneYear: string;
    threeYear: string;
    fiveYear: string;
    inception: string;
  };
  riskLevel: 'Low' | 'Moderate' | 'High';
}

const FundDetails: React.FC<FundDetailsProps> = ({ fundId }) => {
  const [fundInfo, setFundInfo] = useState<FundInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFundDetails = async () => {
      setLoading(true);
      try {
        // In a real app, you would fetch this data from an API
        // For demo purposes, we'll use mock data based on the fundId
        setTimeout(() => {
          const mockFundInfo = getMockFundInfo(fundId);
          setFundInfo(mockFundInfo);
          setLoading(false);
        }, 500); // Simulate API delay
      } catch (err) {
        console.error(err);
        setError('Failed to fetch fund details');
        setLoading(false);
      }
    };

    fetchFundDetails();
  }, [fundId]);

  const getMockFundInfo = (id: string): FundInfo => {
    // Return different mock data based on fund ID
    const fundData: Record<string, FundInfo> = {
      'hdfc-top-100': {
        name: 'HDFC Top 100 Fund',
        category: 'Large Cap',
        aum: '₹ 22,345 Cr',
        expenseRatio: '1.65%',
        nav: 628.45,
        navDate: '2023-09-10',
        returns: {
          oneYear: '12.5%',
          threeYear: '15.2%',
          fiveYear: '9.8%',
          inception: '14.5%',
        },
        riskLevel: 'Moderate',
      },
      'axis-bluechip': {
        name: 'Axis Bluechip Fund',
        category: 'Large Cap',
        aum: '₹ 30,123 Cr',
        expenseRatio: '1.75%',
        nav: 42.68,
        navDate: '2023-09-10',
        returns: {
          oneYear: '14.2%',
          threeYear: '16.8%',
          fiveYear: '11.5%',
          inception: '13.9%',
        },
        riskLevel: 'Moderate',
      },
      'sbi-small-cap': {
        name: 'SBI Small Cap Fund',
        category: 'Small Cap',
        aum: '₹ 12,789 Cr',
        expenseRatio: '2.05%',
        nav: 95.32,
        navDate: '2023-09-10',
        returns: {
          oneYear: '18.7%',
          threeYear: '22.3%',
          fiveYear: '16.8%',
          inception: '19.2%',
        },
        riskLevel: 'High',
      },
      // Default data for any other fund ID
      'default': {
        name: 'Sample Mutual Fund',
        category: 'Diversified',
        aum: '₹ 15,000 Cr',
        expenseRatio: '1.85%',
        nav: 50.00,
        navDate: '2023-09-10',
        returns: {
          oneYear: '10.0%',
          threeYear: '12.0%',
          fiveYear: '8.0%',
          inception: '10.0%',
        },
        riskLevel: 'Moderate',
      }
    };

    return fundData[id] || fundData['default'];
  };

  if (loading) return <div className="animate-pulse h-48 bg-gray-100 rounded-lg"></div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!fundInfo) return null;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-bold text-gray-800">{fundInfo.name}</h2>
      <div className="my-4 flex flex-col space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Category:</span>
          <span className="font-medium">{fundInfo.category}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Latest NAV:</span>
          <span className="font-medium">₹ {fundInfo.nav.toFixed(2)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">NAV Date:</span>
          <span className="font-medium">{fundInfo.navDate}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">AUM:</span>
          <span className="font-medium">{fundInfo.aum}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Expense Ratio:</span>
          <span className="font-medium">{fundInfo.expenseRatio}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Risk Level:</span>
          <span className={`font-medium ${
            fundInfo.riskLevel === 'High' ? 'text-red-600' : 
            fundInfo.riskLevel === 'Moderate' ? 'text-yellow-600' : 
            'text-green-600'
          }`}>
            {fundInfo.riskLevel}
          </span>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold border-b pb-2 mb-4">Returns</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">1 Year</div>
            <div className="text-lg font-bold text-green-600">{fundInfo.returns.oneYear}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">3 Years</div>
            <div className="text-lg font-bold text-green-600">{fundInfo.returns.threeYear}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">5 Years</div>
            <div className="text-lg font-bold text-green-600">{fundInfo.returns.fiveYear}</div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <div className="text-sm text-gray-600">Since Inception</div>
            <div className="text-lg font-bold text-green-600">{fundInfo.returns.inception}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FundDetails; 