import { notFound } from 'next/navigation';
import { CALCULATOR_REGISTRY, getCalculator } from '../calculatorRegistry';
import CalculatorView from '../CalculatorView';

export function generateStaticParams() {
  return CALCULATOR_REGISTRY.map((calc) => ({ calcId: calc.id }));
}

export default async function CalculatorPage({ params }: { params: Promise<{ calcId: string }> }) {
  const { calcId } = await params;
  const meta = getCalculator(calcId);
  if (!meta) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-100">{meta.name}</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{meta.description}</p>
      </div>
      <CalculatorView calcId={calcId} />
    </div>
  );
}
