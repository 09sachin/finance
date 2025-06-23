import { useState } from 'react';

interface LumpsumInvestment {
  id: string;
  amount: string;
  investmentDate: string;
  annualRate: string;
}

interface SIPInvestment {
  id: string;
  monthlyAmount: string;
  startDate: string;
  endDate: string;
  annualRate: string;
}

interface OneTimeWithdrawal {
  id: string;
  amount: string;
  date: string;
  description: string;
}

interface RetirementGoal {
  id: string;
  description: string;
  monthlyAmount: string;
  startAge: string;
  duration: string; // in years or 'lifetime'
}

export default function RetirementPlanningCalculator() {
  // Personal Info
  const [currentAge, setCurrentAge] = useState('25');
  const [retirementAge, setRetirementAge] = useState('40');
  
  // Lumpsum Investments
  const [lumpsumInvestments, setLumpsumInvestments] = useState<LumpsumInvestment[]>([{
    id: '1',
    amount: '2500000',
    investmentDate: new Date().toISOString().split('T')[0],
    annualRate: '12'
  }]);

  // SIP Investments
  const [sipInvestments, setSipInvestments] = useState<SIPInvestment[]>([{
    id: '1',
    monthlyAmount: '125000',
    startDate: new Date().toISOString().split('T')[0],
    endDate: (() => {
      const date = new Date();
      date.setFullYear(date.getFullYear() + 15);
      return date.toISOString().split('T')[0];
    })(),
    annualRate: '12'
  }]);

  // SWP Settings
  const [swpAnnualRate, setSwpAnnualRate] = useState('8');

  // One-time Withdrawals
  const [oneTimeWithdrawals, setOneTimeWithdrawals] = useState<OneTimeWithdrawal[]>([]);

  // Retirement Goals
  const [retirementGoals, setRetirementGoals] = useState<RetirementGoal[]>([
    {
      id: '1',
      description: 'Monthly Living Expenses',
      monthlyAmount: '125000',
      startAge: '40',
      duration: 'lifetime'
    }
  ]);

  const [result, setResult] = useState<null | {
    totalCorpusAtRetirement: number;
    totalCorpusBeforeTax: number;
    totalInvestment: number;
    totalLTCGTax: number;
    fireAge: number;
    isFIREAchievable: boolean;
    totalMonthlyNeeds: number;
    monthlyPassiveIncome: number;
    corpusBreakdown: Array<{
      year: number;
      age: number;
      startingCorpus: number;
      corpus: number;
      yearlyInvestment: number;
      yearlyGrowth: number;
      monthlyWithdrawals: number;
      oneTimeWithdrawals: number;
      ltcgTax: number;
      remainingCorpus: number;
    }>;
    goalAnalysis: Array<{
      goalId: string;
      description: string;
      monthlyAmount: number;
      isAffordable: boolean;
      startAge: number;
      endAge: number | 'Lifetime';
      sustainabilityStatus: string;
    }>;
    corpusDepletionAge: number | null;
    sustainabilityAnalysis: {
      isSustainableToAge80: boolean;
      isSustainableForLifetime: boolean;
      minSustainabilityAge: number;
      corpusDepletionAge: number | null;
    };
  }>(null);

  // Add/Remove functions
  const addLumpsumInvestment = () => {
    const newInvestment: LumpsumInvestment = {
      id: Date.now().toString(),
      amount: '1000000',
      investmentDate: new Date().toISOString().split('T')[0],
      annualRate: '12'
    };
    setLumpsumInvestments([...lumpsumInvestments, newInvestment]);
  };

  const removeLumpsumInvestment = (id: string) => {
    if (lumpsumInvestments.length > 1) {
      setLumpsumInvestments(lumpsumInvestments.filter(inv => inv.id !== id));
    }
  };

  const addSIPInvestment = () => {
    const newSIP: SIPInvestment = {
      id: Date.now().toString(),
      monthlyAmount: '100000',
      startDate: new Date().toISOString().split('T')[0],
      endDate: (() => {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 20);
        return date.toISOString().split('T')[0];
      })(),
      annualRate: '12'
    };
    setSipInvestments([...sipInvestments, newSIP]);
  };

  const removeSIPInvestment = (id: string) => {
    if (sipInvestments.length > 1) {
      setSipInvestments(sipInvestments.filter(sip => sip.id !== id));
    }
  };

  const addOneTimeWithdrawal = () => {
    const newWithdrawal: OneTimeWithdrawal = {
      id: Date.now().toString(),
      amount: '1500000',
      date: (() => {
        const date = new Date();
        date.setFullYear(date.getFullYear() + 3);
        return date.toISOString().split('T')[0];
      })(),
      description: 'Car Purchase'
    };
    setOneTimeWithdrawals([...oneTimeWithdrawals, newWithdrawal]);
  };

  const removeOneTimeWithdrawal = (id: string) => {
    setOneTimeWithdrawals(oneTimeWithdrawals.filter(withdrawal => withdrawal.id !== id));
  };

  const addRetirementGoal = () => {
    const newGoal: RetirementGoal = {
      id: Date.now().toString(),
      description: 'Travel Fund',
      monthlyAmount: '25000',
      startAge: retirementAge,
      duration: '10'
    };
    setRetirementGoals([...retirementGoals, newGoal]);
  };

  const removeRetirementGoal = (id: string) => {
    if (retirementGoals.length > 1) {
      setRetirementGoals(retirementGoals.filter(goal => goal.id !== id));
    }
  };

  const calculateRetirementPlan = () => {
    const currentAgeNum = parseInt(currentAge);
    const retirementAgeNum = parseInt(retirementAge);
    const swpRate = parseFloat(swpAnnualRate) / 100;

    // LTCG Tax Settings (India)
    const ltcgTaxRate = 0.125; // 12.5%
    const ltcgExemptionLimit = 125000; // Rs. 1.25 lakh per year

    // Generate detailed year-by-year breakdown which is the source of truth
    const corpusBreakdown: Array<{
      year: number;
      age: number;
      startingCorpus: number;
      corpus: number;
      yearlyInvestment: number;
      yearlyGrowth: number;
      monthlyWithdrawals: number;
      oneTimeWithdrawals: number;
      ltcgTax: number;
      remainingCorpus: number;
    }> = [];
    let currentCorpus = 0;
    let totalInvestedCapital = 0;
    const startYear = new Date().getFullYear();
    const maxYears = 100 - currentAgeNum; // Project until age 100

    for (let year = 0; year <= maxYears; year++) {
      const age = currentAgeNum + year;
      const projectionYear = startYear + year;

      const startingCorpus = currentCorpus;

      // 1. Investments for the year
      const yearlyLumpsum = lumpsumInvestments
        .filter(inv => new Date(inv.investmentDate).getFullYear() === projectionYear)
        .reduce((sum, inv) => sum + parseFloat(inv.amount), 0);
      
      const yearlySIP = sipInvestments
        .filter(sip => {
          const sipStart = new Date(sip.startDate).getFullYear();
          const sipEnd = new Date(sip.endDate).getFullYear();
          return projectionYear >= sipStart && projectionYear < sipEnd;
        })
        .reduce((sum, sip) => sum + parseFloat(sip.monthlyAmount) * 12, 0);
      
      const totalYearlyInvestment = yearlyLumpsum + yearlySIP;
      
      const corpusAfterInvestment = startingCorpus + totalYearlyInvestment;
      const investedCapitalAfterInvestment = totalInvestedCapital + totalYearlyInvestment;

      // 2. Growth for the year
      const preRetirementRate = (() => {
        const allInvestments = [
          ...lumpsumInvestments.map(inv => ({ amount: parseFloat(inv.amount), rate: parseFloat(inv.annualRate) / 100 })),
          ...sipInvestments.map(sip => ({ amount: parseFloat(sip.monthlyAmount) * 12, rate: parseFloat(sip.annualRate) / 100 })),
        ];
        const totalValue = allInvestments.reduce((sum, inv) => sum + inv.amount, 0);
        if (totalValue === 0) return 0.12; // Default rate
        
        const weightedRate = allInvestments.reduce((sum, inv) => sum + inv.amount * inv.rate, 0) / totalValue;
        return weightedRate;
      })();
      
      const growthRate = age < retirementAgeNum ? preRetirementRate : swpRate;
      const yearlyGrowth = corpusAfterInvestment * growthRate;
      const corpusAfterGrowth = corpusAfterInvestment + yearlyGrowth;
      
      // 3. Withdrawals for the year
      const oneTimeWithdrawalAmount = oneTimeWithdrawals
        .filter(w => new Date(w.date).getFullYear() === projectionYear)
        .reduce((sum, w) => sum + parseFloat(w.amount), 0);

      const monthlyNeeds = retirementGoals.reduce((sum, goal) => {
        const startAge = parseInt(goal.startAge);
        const duration = goal.duration === 'lifetime' ? 999 : parseInt(goal.duration);
        if (age >= startAge && age < startAge + duration) {
          const amount = parseFloat(goal.monthlyAmount);
          return sum + (isNaN(amount) ? 0 : amount);
        }
        return sum;
      }, 0);

      const totalYearlyWithdrawals = (monthlyNeeds * 12) + oneTimeWithdrawalAmount;

      // 4. Tax Calculation on Withdrawals
      let ltcgTaxForYear = 0;
      let corpusAfterWithdrawalsAndTax = corpusAfterGrowth;
      let capitalAfterWithdrawals = investedCapitalAfterInvestment;

      if (totalYearlyWithdrawals > 0 && corpusAfterGrowth > 0) {
        const withdrawalAmount = Math.min(totalYearlyWithdrawals, corpusAfterGrowth);
        
        const totalGains = Math.max(0, corpusAfterGrowth - investedCapitalAfterInvestment);
        const gainsProportion = corpusAfterGrowth > 0 ? totalGains / corpusAfterGrowth : 0;

        const realizedGains = withdrawalAmount * gainsProportion;
        const principalWithdrawn = withdrawalAmount * (1 - gainsProportion);

        ltcgTaxForYear = Math.max(0, realizedGains - ltcgExemptionLimit) * ltcgTaxRate;
        
        corpusAfterWithdrawalsAndTax = corpusAfterGrowth - withdrawalAmount - ltcgTaxForYear;
        capitalAfterWithdrawals = investedCapitalAfterInvestment - principalWithdrawn;
      } else {
        corpusAfterWithdrawalsAndTax = corpusAfterGrowth - totalYearlyWithdrawals;
      }

      currentCorpus = Math.max(0, corpusAfterWithdrawalsAndTax);
      totalInvestedCapital = Math.max(0, capitalAfterWithdrawals);

      corpusBreakdown.push({
        year: projectionYear,
        age,
        startingCorpus: startingCorpus,
        corpus: currentCorpus,
        yearlyInvestment: totalYearlyInvestment,
        yearlyGrowth: yearlyGrowth,
        monthlyWithdrawals: monthlyNeeds,
        oneTimeWithdrawals: oneTimeWithdrawalAmount,
        ltcgTax: ltcgTaxForYear,
        remainingCorpus: currentCorpus,
      });

      // Stop if corpus is depleted post-retirement
      if (currentCorpus <= 0 && age >= retirementAgeNum) {
        // Add one more year to show corpus exhaustion
        if(corpusBreakdown[corpusBreakdown.length-1]?.remainingCorpus === 0) break;
      }
    }

    // Derive all summary results from the detailed breakdown for consistency
    const corpusAtRetirement = corpusBreakdown.find(b => b.age === retirementAgeNum)?.startingCorpus ?? 0;
    
    const totalMonthlyNeedsAtRetirement = retirementGoals.reduce((sum, goal) => {
      const startAge = parseInt(goal.startAge);
      if (retirementAgeNum >= startAge) {
          const amount = parseFloat(goal.monthlyAmount);
          return sum + (isNaN(amount) ? 0 : amount);
      }
      return sum;
    }, 0);

    // FIRE Sustainability Check - corpus must sustain until at least age 80 or lifetime
    const minSustainabilityAge = Math.max(80, retirementAgeNum + 20); // At least 20 years post-retirement or age 80
    const sustainabilityBreakdown = corpusBreakdown.filter(b => b.age >= retirementAgeNum && b.age <= minSustainabilityAge);
    const corpusDepletionAge = corpusBreakdown.find(b => b.age >= retirementAgeNum && b.remainingCorpus <= 0)?.age;
    
    // Check if corpus sustains for required duration
    const isSustainableToAge80 = !corpusDepletionAge || corpusDepletionAge > minSustainabilityAge;
    
    // Check if corpus sustains for lifetime goals
    const hasLifetimeGoals = retirementGoals.some(g => g.duration === 'lifetime');
    const isSustainableForLifetime = hasLifetimeGoals ? 
      (!corpusDepletionAge || corpusDepletionAge > 90) : true; // Assume 90+ is "lifetime"
    
    const isFIREAchievable = isSustainableToAge80 && isSustainableForLifetime;
    
    const monthlyPassiveIncome = corpusAtRetirement * (swpRate / 12);

    // Calculate actual FIRE age - age when corpus can sustain expenses indefinitely
    let fireAge = 100; // Default to "not achievable"
    
    if (isFIREAchievable) {
      fireAge = retirementAgeNum;
    } else {
      // Find the earliest age where sustainability is achieved
      for (let testAge = currentAgeNum; testAge <= 100; testAge++) {
        const testCorpus = corpusBreakdown.find(b => b.age === testAge)?.startingCorpus ?? 0;
        
        // Simulate withdrawals from this age to check sustainability
        let simulatedCorpus = testCorpus;
        let isSustainable = true;
        
        for (let futureAge = testAge; futureAge <= minSustainabilityAge && isSustainable; futureAge++) {
          const futureMonthlyNeeds = retirementGoals.reduce((sum, goal) => {
            const startAge = parseInt(goal.startAge);
            const duration = goal.duration === 'lifetime' ? 999 : parseInt(goal.duration);
            if (futureAge >= Math.max(startAge, testAge) && futureAge < startAge + duration) {
              const amount = parseFloat(goal.monthlyAmount);
              return sum + (isNaN(amount) ? 0 : amount);
            }
            return sum;
          }, 0);
          
          const annualWithdrawal = futureMonthlyNeeds * 12;
          const growth = simulatedCorpus * swpRate;
          simulatedCorpus = simulatedCorpus + growth - annualWithdrawal;
          
          if (simulatedCorpus <= 0) {
            isSustainable = false;
          }
        }
        
        if (isSustainable) {
          fireAge = testAge;
          break;
        }
      }
    }
    
    const totalInvestment = corpusBreakdown.reduce((sum, b) => sum + b.yearlyInvestment, 0);
    const totalLTCGTax = corpusBreakdown.reduce((sum, b) => sum + b.ltcgTax, 0);

    // Enhanced Goal Analysis - check actual sustainability for each goal
    const goalAnalysis = retirementGoals.map(goal => {
      const monthlyAmount = parseFloat(goal.monthlyAmount);
      const startAge = parseInt(goal.startAge);
      const duration = goal.duration === 'lifetime' ? 999 : parseInt(goal.duration);
      const endAge: number | 'Lifetime' = duration === 999 ? 'Lifetime' : startAge + duration;
      
      // Find when this goal becomes active and check if corpus can sustain it
      const goalActiveBreakdown = corpusBreakdown.filter(b => 
        b.age >= startAge && (duration === 999 || b.age < startAge + duration)
      );
      
      // Check if corpus remains positive throughout the goal duration
      const isAffordable = goalActiveBreakdown.length > 0 && 
        goalActiveBreakdown.every(b => b.remainingCorpus > 0) &&
        (duration !== 999 || !corpusDepletionAge || corpusDepletionAge > 90);
      
      return {
        goalId: goal.id,
        description: goal.description,
        monthlyAmount: isNaN(monthlyAmount) ? 0 : monthlyAmount,
        isAffordable: isAffordable,
        startAge: startAge,
        endAge: endAge,
        sustainabilityStatus: isAffordable ? 'Sustainable' : 
          (corpusDepletionAge && corpusDepletionAge < (typeof endAge === 'number' ? endAge : 90)) ? 
          `Corpus depletes at age ${corpusDepletionAge}` : 'Insufficient corpus'
      }
    });

    setResult({
      totalCorpusAtRetirement: corpusAtRetirement,
      totalCorpusBeforeTax: corpusAtRetirement, // In this model, tax is on withdrawal, not upfront
      totalInvestment,
      totalLTCGTax,
      fireAge,
      isFIREAchievable,
      totalMonthlyNeeds: totalMonthlyNeedsAtRetirement,
      monthlyPassiveIncome,
      corpusBreakdown,
      goalAnalysis,
      corpusDepletionAge: corpusDepletionAge || null,
      sustainabilityAnalysis: {
        isSustainableToAge80,
        isSustainableForLifetime,
        minSustainabilityAge,
        corpusDepletionAge: corpusDepletionAge || null
      }
    });
  };

  const fmt = (val: number) => val.toLocaleString('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  });

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 rounded-lg border border-purple-200 dark:border-purple-800">
        <h3 className="text-xl font-semibold text-purple-800 dark:text-purple-200 mb-3 flex items-center">
          <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          Comprehensive Retirement Planning
        </h3>
        <p className="text-sm text-purple-700 dark:text-purple-300">
          Plan your complete financial journey from investments to retirement goals. Calculate your FIRE age and ensure your corpus can support your desired lifestyle.
        </p>
      </div>

      {/* Personal Information */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-lg">
        <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200 mb-4">Personal Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Current Age</label>
            <input 
              type="number" 
              value={currentAge} 
              onChange={e => setCurrentAge(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Planned Retirement Age</label>
            <input 
              type="number" 
              value={retirementAge} 
              onChange={e => {
                const newRetirementAge = e.target.value;
                setRetirementAge(newRetirementAge);
                
                // Auto-adjust retirement goals start ages if they're below new retirement age
                setRetirementGoals(retirementGoals.map(goal => ({
                  ...goal,
                  startAge: parseInt(goal.startAge) < parseInt(newRetirementAge) 
                    ? newRetirementAge 
                    : goal.startAge
                })));
              }}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
            />
          </div>
        </div>
      </div>

      {/* Lumpsum Investments */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200">Lumpsum Investments</h4>
          <button 
            onClick={addLumpsumInvestment}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow-sm transition-colors text-sm"
          >
            + Add Lumpsum
          </button>
        </div>
        
        {lumpsumInvestments.map((investment, index) => (
          <div key={investment.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h5 className="font-medium text-slate-700 dark:text-slate-300">Lumpsum Investment #{index + 1}</h5>
              {lumpsumInvestments.length > 1 && (
                <button 
                  onClick={() => removeLumpsumInvestment(investment.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Investment Amount (₹)</label>
                <input 
                  type="number" 
                  value={investment.amount}
                  onChange={e => setLumpsumInvestments(lumpsumInvestments.map(inv => 
                    inv.id === investment.id ? { ...inv, amount: e.target.value } : inv
                  ))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Investment Date</label>
                <input 
                  type="date" 
                  value={investment.investmentDate}
                  onChange={e => setLumpsumInvestments(lumpsumInvestments.map(inv => 
                    inv.id === investment.id ? { ...inv, investmentDate: e.target.value } : inv
                  ))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Expected Return (% p.a.)</label>
                <input 
                  type="number" 
                  value={investment.annualRate}
                  onChange={e => setLumpsumInvestments(lumpsumInvestments.map(inv => 
                    inv.id === investment.id ? { ...inv, annualRate: e.target.value } : inv
                  ))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SIP Investments */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200">SIP Investments</h4>
          <button 
            onClick={addSIPInvestment}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md shadow-sm transition-colors text-sm"
          >
            + Add SIP
          </button>
        </div>
        
        {sipInvestments.map((sip, index) => (
          <div key={sip.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h5 className="font-medium text-slate-700 dark:text-slate-300">SIP Investment #{index + 1}</h5>
              {sipInvestments.length > 1 && (
                <button 
                  onClick={() => removeSIPInvestment(sip.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Monthly Amount (₹)</label>
                <input 
                  type="number" 
                  value={sip.monthlyAmount}
                  onChange={e => setSipInvestments(sipInvestments.map(s => 
                    s.id === sip.id ? { ...s, monthlyAmount: e.target.value } : s
                  ))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={sip.startDate}
                  onChange={e => setSipInvestments(sipInvestments.map(s => 
                    s.id === sip.id ? { ...s, startDate: e.target.value } : s
                  ))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">End Date</label>
                <input 
                  type="date" 
                  value={sip.endDate}
                  onChange={e => setSipInvestments(sipInvestments.map(s => 
                    s.id === sip.id ? { ...s, endDate: e.target.value } : s
                  ))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Expected Return (% p.a.)</label>
                <input 
                  type="number" 
                  value={sip.annualRate}
                  onChange={e => setSipInvestments(sipInvestments.map(s => 
                    s.id === sip.id ? { ...s, annualRate: e.target.value } : s
                  ))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* SWP Settings */}
      <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg border border-orange-200 dark:border-orange-800">
        <h4 className="text-lg font-medium text-orange-800 dark:text-orange-200 mb-4 flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
          Systematic Withdrawal Plan (SWP) Settings
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">SWP Start Age</label>
            <input 
              type="number" 
              value={retirementAge} 
              disabled
              className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 border border-orange-300 dark:border-orange-600 rounded-md text-slate-500 dark:text-slate-400 focus:outline-none" 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">Expected Return During SWP (% p.a.)</label>
            <input 
              type="number" 
              value={swpAnnualRate} 
              onChange={e => setSwpAnnualRate(e.target.value)}
              className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-orange-300 dark:border-orange-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-orange-500 focus:border-orange-500" 
            />
          </div>
        </div>
      </div>

      {/* One-time Withdrawals */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200">One-time Withdrawals</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Large expenses that can be made at any time (before or after retirement)
            </p>
          </div>
          <button 
            onClick={addOneTimeWithdrawal}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md shadow-sm transition-colors text-sm"
          >
            + Add Withdrawal
          </button>
        </div>
        
        {oneTimeWithdrawals.length === 0 ? (
          <div className="text-center py-6 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600">
            No one-time withdrawals planned. Add withdrawals for major expenses like car purchase, home down payment, etc.
          </div>
        ) : (
          oneTimeWithdrawals.map((withdrawal, index) => (
            <div key={withdrawal.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <div className="flex justify-between items-center mb-4">
                <h5 className="font-medium text-slate-700 dark:text-slate-300">Withdrawal #{index + 1}</h5>
                <button 
                  onClick={() => removeOneTimeWithdrawal(withdrawal.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Amount (₹)</label>
                  <input 
                    type="number" 
                    value={withdrawal.amount}
                    onChange={e => setOneTimeWithdrawals(oneTimeWithdrawals.map(w => 
                      w.id === withdrawal.id ? { ...w, amount: e.target.value } : w
                    ))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Date</label>
                  <input 
                    type="date" 
                    value={withdrawal.date}
                    onChange={e => setOneTimeWithdrawals(oneTimeWithdrawals.map(w => 
                      w.id === withdrawal.id ? { ...w, date: e.target.value } : w
                    ))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
                  <input 
                    type="text" 
                    value={withdrawal.description}
                    onChange={e => setOneTimeWithdrawals(oneTimeWithdrawals.map(w => 
                      w.id === withdrawal.id ? { ...w, description: e.target.value } : w
                    ))}
                    placeholder="e.g., Car Purchase, Home Down Payment"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Retirement Goals */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h4 className="text-lg font-medium text-slate-800 dark:text-slate-200">Retirement Financial Goals (SWP)</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Monthly withdrawals that can only start at or after retirement age ({retirementAge}). 
              For pre-retirement expenses, use "One-time Withdrawals" above.
            </p>
          </div>
          <button 
            onClick={addRetirementGoal}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-md shadow-sm transition-colors text-sm"
          >
            + Add Goal
          </button>
        </div>
        
        {retirementGoals.map((goal, index) => (
          <div key={goal.id} className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center mb-4">
              <h5 className="font-medium text-slate-700 dark:text-slate-300">Goal #{index + 1}</h5>
              {retirementGoals.length > 1 && (
                <button 
                  onClick={() => removeRetirementGoal(goal.id)}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Description</label>
                <input 
                  type="text" 
                  value={goal.description}
                  onChange={e => setRetirementGoals(retirementGoals.map(g => 
                    g.id === goal.id ? { ...g, description: e.target.value } : g
                  ))}
                  placeholder="e.g., Living Expenses, Travel"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Monthly Amount (₹)</label>
                <input 
                  type="number" 
                  value={goal.monthlyAmount}
                  onChange={e => setRetirementGoals(retirementGoals.map(g => 
                    g.id === goal.id ? { ...g, monthlyAmount: e.target.value } : g
                  ))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Start Age</label>
                <input 
                  type="number" 
                  value={goal.startAge}
                  min={retirementAge}
                  onChange={e => {
                    const newStartAge = e.target.value;
                    if (parseInt(newStartAge) >= parseInt(retirementAge)) {
                      setRetirementGoals(retirementGoals.map(g => 
                        g.id === goal.id ? { ...g, startAge: newStartAge } : g
                      ));
                    }
                  }}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500" 
                />
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Must be ≥ retirement age ({retirementAge})
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Duration</label>
                <select 
                  value={goal.duration}
                  onChange={e => setRetirementGoals(retirementGoals.map(g => 
                    g.id === goal.id ? { ...g, duration: e.target.value } : g
                  ))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="lifetime">Lifetime</option>
                  <option value="10">10 years</option>
                  <option value="15">15 years</option>
                  <option value="20">20 years</option>
                  <option value="25">25 years</option>
                  <option value="30">30 years</option>
                </select>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Calculate Button */}
      <div className="text-center">
        <button 
          onClick={calculateRetirementPlan}
          className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg transition-all duration-200 transform hover:scale-105"
        >
          Calculate Retirement Plan
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Enhanced Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-6 rounded-xl border border-blue-200 dark:border-blue-700">
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2">Retirement Corpus</div>
              <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{fmt(result.totalCorpusAtRetirement)}</div>
              <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                At age {retirementAge}
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/30 dark:to-red-800/30 p-6 rounded-xl border border-red-200 dark:border-red-700">
              <div className="text-sm font-medium text-red-600 dark:text-red-400 mb-2">LTCG Tax Impact</div>
              <div className="text-2xl font-bold text-red-800 dark:text-red-200">{fmt(result.totalLTCGTax)}</div>
              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                12.5% on gains above ₹1.25L/year
              </div>
            </div>
            
            <div className={`bg-gradient-to-br p-6 rounded-xl border ${
              result.isFIREAchievable 
                ? 'from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 border-green-200 dark:border-green-700' 
                : 'from-orange-50 to-orange-100 dark:from-orange-900/30 dark:to-orange-800/30 border-orange-200 dark:border-orange-700'
            }`}>
              <div className={`text-sm font-medium mb-2 ${
                result.isFIREAchievable ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
              }`}>
                FIRE Age
              </div>
              <div className={`text-2xl font-bold ${
                result.isFIREAchievable ? 'text-green-800 dark:text-green-200' : 'text-orange-800 dark:text-orange-200'
              }`}>
                {result.fireAge >= 100 ? 'Not Achievable' : `${result.fireAge} years`}
              </div>
              <div className={`text-xs mt-1 ${
                result.isFIREAchievable ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'
              }`}>
                {result.isFIREAchievable ? 'Sustainable!' : 
                  result.corpusDepletionAge ? `Corpus depletes at ${result.corpusDepletionAge}` : 'Insufficient corpus'}
              </div>
            </div>
          </div>

          {/* Sustainability Analysis */}
          {result.sustainabilityAnalysis && (
            <div className={`p-6 rounded-lg border ${
              result.isFIREAchievable 
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800'
                : 'bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-red-200 dark:border-red-800'
            }`}>
              <h4 className={`text-lg font-semibold mb-4 flex items-center ${
                result.isFIREAchievable ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
              }`}>
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Corpus Sustainability Analysis
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className={`text-sm font-medium mb-2 ${
                    result.isFIREAchievable ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  }`}>
                    Sustainability to Age 80+
                  </div>
                  <div className={`text-lg font-bold ${
                    result.sustainabilityAnalysis.isSustainableToAge80 ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                  }`}>
                    {result.sustainabilityAnalysis.isSustainableToAge80 ? '✓ Sustainable' : '✗ Not Sustainable'}
                  </div>
                  <div className={`text-xs mt-1 ${
                    result.isFIREAchievable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    Until age {result.sustainabilityAnalysis.minSustainabilityAge}
                  </div>
                </div>
                <div>
                  <div className={`text-sm font-medium mb-2 ${
                    result.isFIREAchievable ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                  }`}>
                    Lifetime Goals Coverage
                  </div>
                  <div className={`text-lg font-bold ${
                    result.sustainabilityAnalysis.isSustainableForLifetime ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                  }`}>
                    {result.sustainabilityAnalysis.isSustainableForLifetime ? '✓ Covered' : '✗ Insufficient'}
                  </div>
                  <div className={`text-xs mt-1 ${
                    result.isFIREAchievable ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {result.corpusDepletionAge ? `Depletion at age ${result.corpusDepletionAge}` : 'No depletion projected'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Income vs Needs Comparison */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-6 rounded-xl border border-purple-200 dark:border-purple-700">
              <div className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2">Monthly Passive Income</div>
              <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">{fmt(result.monthlyPassiveIncome)}</div>
              <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                Based on {swpAnnualRate}% annual return
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Monthly Expenses Planned</div>
              <div className="text-2xl font-bold text-slate-800 dark:text-slate-200">{fmt(result.totalMonthlyNeeds)}</div>
              <div className={`text-xs mt-1 ${
                result.monthlyPassiveIncome >= result.totalMonthlyNeeds 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                Initial Coverage: {result.monthlyPassiveIncome >= result.totalMonthlyNeeds ? 'Sufficient' : 'Insufficient'}
              </div>
            </div>
          </div>

          {/* Investment Summary */}
          <div className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 p-6 rounded-lg border border-indigo-200 dark:border-indigo-800">
            <h4 className="text-lg font-semibold text-indigo-800 dark:text-indigo-200 mb-4">Investment Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">{fmt(result.totalInvestment)}</div>
                <div className="text-sm text-indigo-600 dark:text-indigo-400">Total Investment</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-800 dark:text-green-200">{fmt(result.totalCorpusBeforeTax - result.totalInvestment)}</div>
                <div className="text-sm text-green-600 dark:text-green-400">Gross Returns</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-indigo-800 dark:text-indigo-200">
                  {result.totalInvestment > 0 ? ((result.totalCorpusBeforeTax - result.totalInvestment) / result.totalInvestment * 100).toFixed(1) : 0}%
                </div>
                <div className="text-sm text-indigo-600 dark:text-indigo-400">Total Return %</div>
              </div>
            </div>
          </div>

          {/* Enhanced Goal Analysis */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4">Detailed Goal Sustainability Analysis</h4>
            <div className="space-y-4">
              {result.goalAnalysis.map((goal) => (
                <div key={goal.goalId} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center mb-2">
                        <div className={`w-4 h-4 rounded-full mr-3 ${
                          goal.isAffordable ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                        <span className="font-medium text-slate-700 dark:text-slate-300">{goal.description}</span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Monthly Amount:</span>
                          <div className="font-medium text-slate-700 dark:text-slate-300">{fmt(goal.monthlyAmount)}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Start Age:</span>
                          <div className="font-medium text-slate-700 dark:text-slate-300">{goal.startAge}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">End Age:</span>
                          <div className="font-medium text-slate-700 dark:text-slate-300">{goal.endAge}</div>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-slate-400">Status:</span>
                          <div className={`font-medium ${
                            goal.isAffordable ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                          }`}>
                            {goal.sustainabilityStatus}
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm font-medium px-3 py-1 rounded-full ml-4 ${
                      goal.isAffordable 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                    }`}>
                      {goal.isAffordable ? '✓ Sustainable' : '✗ Insufficient'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced 50-Year Corpus Projection */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg border border-slate-200 dark:border-slate-700">
            <h4 className="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              50-Year Detailed Corpus Projection
            </h4>
            <div className="mb-4 text-sm text-slate-600 dark:text-slate-400">
              Showing year-by-year breakdown including investments, growth, taxes, and withdrawals
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-slate-200 dark:border-slate-600">
                    <th className="text-left py-3 px-2 text-slate-600 dark:text-slate-400 font-semibold">Year</th>
                    <th className="text-left py-3 px-2 text-slate-600 dark:text-slate-400 font-semibold">Age</th>
                    <th className="text-right py-3 px-2 text-slate-600 dark:text-slate-400 font-semibold">Corpus Start</th>
                    <th className="text-right py-3 px-2 text-slate-600 dark:text-slate-400 font-semibold">Investment</th>
                    <th className="text-right py-3 px-2 text-slate-600 dark:text-slate-400 font-semibold">Growth</th>
                    <th className="text-right py-3 px-2 text-slate-600 dark:text-slate-400 font-semibold">LTCG Tax</th>
                    <th className="text-right py-3 px-2 text-slate-600 dark:text-slate-400 font-semibold">Withdrawals</th>
                    <th className="text-right py-3 px-2 text-slate-600 dark:text-slate-400 font-semibold">Corpus End</th>
                  </tr>
                </thead>
                <tbody>
                  {result.corpusBreakdown.slice(0, 50).map((year) => (
                    <tr key={year.year} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/30">
                      <td className="py-3 px-2 font-medium text-slate-800 dark:text-slate-200">{year.year}</td>
                      <td className="py-3 px-2 text-slate-600 dark:text-slate-400">{year.age}</td>
                      <td className="py-3 px-2 text-right text-slate-600 dark:text-slate-400">{fmt(year.startingCorpus)}</td>
                      <td className="py-3 px-2 text-right text-green-600 dark:text-green-400">
                        {year.yearlyInvestment > 0 ? fmt(year.yearlyInvestment) : '-'}
                      </td>
                      <td className="py-3 px-2 text-right text-blue-600 dark:text-blue-400">
                        {year.yearlyGrowth > 0 ? fmt(year.yearlyGrowth) : '-'}
                      </td>
                      <td className="py-3 px-2 text-right text-red-600 dark:text-red-400">
                        {year.ltcgTax > 0 ? fmt(year.ltcgTax) : '-'}
                      </td>
                      <td className="py-3 px-2 text-right text-orange-600 dark:text-orange-400">
                        {(year.monthlyWithdrawals * 12 + year.oneTimeWithdrawals) > 0 
                          ? fmt(year.monthlyWithdrawals * 12 + year.oneTimeWithdrawals) : '-'}
                      </td>
                      <td className={`py-3 px-2 text-right font-semibold ${
                        year.remainingCorpus > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      }`}>
                        {fmt(year.remainingCorpus)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {result.corpusBreakdown.length > 50 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Showing first 50 years.</strong> Full {result.corpusBreakdown.length}-year projection available.
                  Corpus sustains for {result.corpusBreakdown.filter(y => y.remainingCorpus > 0).length} years.
                </p>
              </div>
            )}
          </div>

          {/* Tax Information */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-3 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Taxation Assumptions
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h5 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">LTCG Tax (India)</h5>
                <ul className="space-y-1 text-yellow-600 dark:text-yellow-400">
                  <li>• 12.5% on realized gains above ₹1.25 lakh per year</li>
                  <li>• Only applied during withdrawal phase (not on unrealized gains)</li>                  <li>• Applies to equity shares & equity mutual funds</li>
                  <li>• Only for holdings &gt; 1 year</li>
                </ul>
              </div>
              <div>
                <h5 className="font-semibold text-yellow-700 dark:text-yellow-300 mb-2">Assumptions</h5>
                <ul className="space-y-1 text-yellow-600 dark:text-yellow-400">
                  <li>• Tax rates remain constant</li>
                  <li>• All investments are equity-oriented</li>
                  <li>• No surcharge/cess considered</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}