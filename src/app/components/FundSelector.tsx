'use client';

import React, { useState } from 'react';

interface Fund {
  id: string;
  name: string;
  category: string;
}

interface FundSelectorProps {
  onSelectFund: (fundId: string) => void;
}

const FundSelector: React.FC<FundSelectorProps> = ({ onSelectFund }) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for mutual funds
  const mockFunds: Fund[] = [
    { id: 'hdfc-top-100', name: 'HDFC Top 100 Fund', category: 'Large Cap' },
    { id: 'axis-bluechip', name: 'Axis Bluechip Fund', category: 'Large Cap' },
    { id: 'sbi-small-cap', name: 'SBI Small Cap Fund', category: 'Small Cap' },
    { id: 'mirae-emerging', name: 'Mirae Asset Emerging Bluechip Fund', category: 'Large & Mid Cap' },
    { id: 'kotak-emerging', name: 'Kotak Emerging Equity Fund', category: 'Mid Cap' },
    { id: 'icici-value-disc', name: 'ICICI Prudential Value Discovery Fund', category: 'Value' },
    { id: 'franklin-india', name: 'Franklin India Equity Fund', category: 'Multi Cap' },
    { id: 'parag-parikh', name: 'Parag Parikh Long Term Equity Fund', category: 'Multi Cap' },
    { id: 'aditya-birla', name: 'Aditya Birla Sun Life Frontline Equity Fund', category: 'Large Cap' },
    { id: 'dsp-tax-saver', name: 'DSP Tax Saver Fund', category: 'ELSS' },
  ];

  // Filter funds based on search term
  const filteredFunds = mockFunds.filter(fund => 
    fund.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fund.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app-card p-4">
      <div className="mb-4">
        <label htmlFor="search" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          Search Mutual Funds
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            id="search"
            className="app-input pl-10"
            placeholder="Search by fund name or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="mt-4 max-h-80 overflow-y-auto">
        {filteredFunds.length > 0 ? (
          <ul className="divide-y divide-slate-100 dark:divide-slate-700 -mx-4">
            {filteredFunds.map((fund) => (
              <li 
                key={fund.id}
                className="py-3 px-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer transition-colors"
                onClick={() => onSelectFund(fund.id)}
              >
                <div className="font-medium text-blue-600 dark:text-blue-400 mb-1">{fund.name}</div>
                <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                    {fund.category}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="py-8 px-3 text-center text-slate-500 dark:text-slate-400">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mx-auto mb-2 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            No funds found matching <span className="font-medium">&quot;{searchTerm}&quot;</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FundSelector; 