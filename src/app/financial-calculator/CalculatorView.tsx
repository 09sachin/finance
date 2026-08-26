'use client';

import SIPCalculator from './components/SIPCalculator';
import LumpsumCalculator from './components/LumpsumCalculator';
import LumpsumSIPCalculator from './components/LumpsumSIPCalculator';
import SWPCalculator from './components/SWPCalculator';
import LumpsumSipSwpCalculator from './components/LumpsumSipSwpCalculator';
import XIRRCalculator from './components/XIRRCalculator';
import RetirementPlanningCalculator from './components/RetirementPlanningCalculator';
import FireCalculator from './components/FireCalculator';
import TargetSIPCalculator from './components/TargetSIPCalculator';
import EMICalculator from './components/EMICalculator';
import FDCalculator from './components/FDCalculator';
import PPFCalculator from './components/PPFCalculator';
import CAGRCalculator from './components/CAGRCalculator';
import InflationCalculator from './components/InflationCalculator';
import EPFCalculator from './components/EPFCalculator';

export default function CalculatorView({ calcId }: { calcId: string }) {
  switch (calcId) {
    case 'sip':
      return <SIPCalculator />;
    case 'lumpsum':
      return <LumpsumCalculator />;
    case 'lumpsum-sip':
      return <LumpsumSIPCalculator />;
    case 'swp':
      return <SWPCalculator />;
    case 'lumpsum-sip-swp':
      return <LumpsumSipSwpCalculator />;
    case 'xirr':
      return <XIRRCalculator />;
    case 'retirement':
      return <RetirementPlanningCalculator />;
    case 'fire':
      return <FireCalculator />;
    case 'target-sip':
      return <TargetSIPCalculator />;
    case 'emi':
      return <EMICalculator />;
    case 'fd':
      return <FDCalculator />;
    case 'ppf':
      return <PPFCalculator />;
    case 'cagr':
      return <CAGRCalculator />;
    case 'inflation':
      return <InflationCalculator />;
    case 'epf':
      return <EPFCalculator />;
    default:
      return null;
  }
}
