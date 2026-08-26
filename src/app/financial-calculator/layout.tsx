import CalculatorShell from './CalculatorShell';

export default function FinancialCalculatorLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 px-4 py-6 dark:from-slate-900 dark:to-slate-800 sm:py-8">
      <div className="container mx-auto">
        <header className="mb-6 text-center sm:text-left">
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Financial Calculators</h1>
          <p className="mt-1 text-slate-600 dark:text-slate-300">
            Hypothetical-rate planning tools. For live fund NAVs, use the SIP Calculator in the main nav.
          </p>
        </header>
        <CalculatorShell>{children}</CalculatorShell>
      </div>
    </div>
  );
}
