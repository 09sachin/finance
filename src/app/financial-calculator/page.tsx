'use client';

import { useState } from 'react';
import Navigation from '../components/Navigation';
import SIPCalculator from './components/SIPCalculator';
import LumpsumCalculator from './components/LumpsumCalculator';
import LumpsumSIPCalculator from './components/LumpsumSIPCalculator';
import SWPCalculator from './components/SWPCalculator';
import LumpsumSipSwpCalculator from './components/LumpsumSipSwpCalculator';
import XIRRCalculator from './components/XIRRCalculator';
import RetirementPlanningCalculator from './components/RetirementPlanningCalculator';
import TargetSIPCalculator from './components/TargetSIPCalculator';

type CalculatorType = 'sip' | 'lumpsum' | 'lumpsum_sip' | 'swp' | 'lumpsum_sip_swp' | 'xirr' | 'retirement_planning' | 'target_sip';

const calculators: { id: CalculatorType; name: string; description: string }[] = [
  { id: 'sip', name: 'SIP Return', description: 'Calculate the future value of your Systematic Investment Plan.' },
  { id: 'lumpsum', name: 'Lumpsum Return', description: 'Calculate the future value of a lumpsum investment.' },
  { id: 'lumpsum_sip', name: 'Lumpsum + SIP', description: 'Calculate returns on a combination of lumpsum and SIP investments.' },
  { id: 'swp', name: 'SWP', description: 'Plan your Systematic Withdrawal Plan from your investments.' },
  { id: 'lumpsum_sip_swp', name: 'Lumpsum + SIP & SWP', description: 'Complex scenario planning with initial investments and subsequent withdrawals.' },
  { id: 'xirr', name: 'XIRR Calculator', description: 'Calculate the internal rate of return for a series of cash flows.' },
  { id: 'retirement_planning', name: 'Retirement Planning', description: 'Comprehensive retirement planning with FIRE age calculation and goal tracking.' },
  { id: 'target_sip', name: 'Target SIP', description: 'Calculate time or SIP amount needed to reach your financial target.' },
];

export default function FinancialCalculatorPage() {
  const [activeCalculator, setActiveCalculator] = useState<CalculatorType>('sip');

  const renderCalculator = () => {
    switch (activeCalculator) {
      case 'sip':
        return <SIPCalculator />;
      case 'lumpsum':
        return <LumpsumCalculator />;
      case 'lumpsum_sip':
        return <LumpsumSIPCalculator />;
      case 'swp':
        return <SWPCalculator />;
      case 'lumpsum_sip_swp':
        return <LumpsumSipSwpCalculator />;
      case 'xirr':
        return <XIRRCalculator />;
      case 'retirement_planning':
        return <RetirementPlanningCalculator />;
      case 'target_sip':
        return <TargetSIPCalculator />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 py-6 px-4 sm:py-8">
      <div className="container mx-auto">
        <Navigation />
        
        <header className="mb-6 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Financial Calculators</h1>
          <p className="text-slate-600 dark:text-slate-300 mt-1">
            A suite of tools to help you plan your financial future.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-1">
            <div className="app-card p-4">
              <h3 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">Calculators</h3>
              <div className="space-y-1">
                {calculators.map((calc) => (
                  <button
                    key={calc.id}
                    onClick={() => setActiveCalculator(calc.id)}
                    className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium ${
                      activeCalculator === calc.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {calc.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="app-card p-6">
              {renderCalculator()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 