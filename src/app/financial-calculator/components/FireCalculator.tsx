'use client';

import { useMemo, useState } from 'react';
import {
  addYearsIso,
  calculateFireScenarios,
  calculateFireSipPlan,
  formatINR,
  parseNumber,
  todayIso,
  type FireKind,
} from '@/lib/calculators';
import CalculatorLayout, { ResultsPanel, TaxSettings, ValidationBanner } from './shared/CalculatorLayout';
import NumberField from './shared/NumberField';
import ResultCard, { ResultGrid } from './shared/ResultCard';
import BreakdownTable from './shared/BreakdownTable';
import CorpusChart from './shared/CorpusChart';
import HowItWorks, { CollapsibleSection } from './shared/HowItWorks';
import { useAutoCalculate } from './shared/useAutoCalculate';

const FIRE_COPY: Record<
  FireKind,
  { title: string; tag: string; spendLabel: string; accent: string; selected: string; tone: 'green' | 'blue' | 'purple' }
> = {
  lean: {
    title: 'Lean FIRE',
    tag: 'Today’s lifestyle',
    spendLabel: 'Same spend as today, inflation-adjusted',
    accent: 'border-emerald-300 dark:border-emerald-700',
    selected: 'ring-2 ring-emerald-500',
    tone: 'green',
  },
  comfortable: {
    title: 'Comfortable FIRE',
    tag: 'Lifestyle upgrade',
    spendLabel: 'Today’s spend plus your comfortable uplift',
    accent: 'border-sky-300 dark:border-sky-700',
    selected: 'ring-2 ring-sky-500',
    tone: 'blue',
  },
  fat: {
    title: 'Fat FIRE',
    tag: 'Bigger lifestyle',
    spendLabel: 'Today’s spend plus your fat-FIRE uplift',
    accent: 'border-violet-300 dark:border-violet-700',
    selected: 'ring-2 ring-violet-500',
    tone: 'purple',
  },
};

const KINDS: FireKind[] = ['lean', 'comfortable', 'fat'];

function parseUplift(value: string): number | null {
  if (value.trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function FireCalculator() {
  const today = todayIso();
  const [currentAge, setCurrentAge] = useState('30');
  const [monthlyExpense, setMonthlyExpense] = useState('80000');
  const [inflation, setInflation] = useState('6');
  const [postFireReturn, setPostFireReturn] = useState('8');
  const [ltcgEnabled, setLtcgEnabled] = useState(true);
  const [ltcgRate, setLtcgRate] = useState('12.5');
  const [leanUplift, setLeanUplift] = useState('0');
  const [comfortableUplift, setComfortableUplift] = useState('20');
  const [fatUplift, setFatUplift] = useState('50');
  const [mode, setMode] = useState<'age' | 'sip'>('age');
  const [selected, setSelected] = useState<FireKind>('lean');
  const [targetAges, setTargetAges] = useState({ lean: '45', comfortable: '50', fat: '55' });
  const [sustainToAge, setSustainToAge] = useState('90');
  const [preserveCorpusAtFire, setPreserveCorpusAtFire] = useState(false);
  const [checkpointAges, setCheckpointAges] = useState(['60', '80']);
  const [investments, setInvestments] = useState([
    { id: '1', name: 'Equity funds', amount: '1000000', annualRate: '12' },
    { id: '2', name: 'Debt funds', amount: '500000', annualRate: '7' },
  ]);
  const [sips, setSips] = useState([
    { id: '1', name: 'Equity SIP', monthlyAmount: '25000', annualRate: '12', stepUp: '10' },
  ]);
  const [oneOffs, setOneOffs] = useState<{ id: string; description: string; amount: string; date: string }[]>([]);

  const age = parseNumber(currentAge);
  const expense = parseNumber(monthlyExpense);
  const inf = parseNumber(inflation);
  const post = parseNumber(postFireReturn);
  const taxRate = parseNumber(ltcgRate);
  const lifeAge = parseNumber(sustainToAge);
  const uplifts = {
    lean: parseUplift(leanUplift),
    comfortable: parseUplift(comfortableUplift),
    fat: parseUplift(fatUplift),
  };
  const errors: string[] = [];
  if (age === null || age < 18 || age > 70) errors.push('Current age should be between 18 and 70');
  if (expense === null || expense <= 0) errors.push('Monthly expense must be greater than 0');
  if (inf === null || inf < 0) errors.push('Expense inflation cannot be negative');
  if (post === null || post <= 0) errors.push('Return after FIRE must be greater than 0');
  if (ltcgEnabled && (taxRate === null || taxRate < 0)) errors.push('LTCG tax rate cannot be negative');
  if (lifeAge === null || (age !== null && lifeAge <= age)) errors.push('Corpus must last until an age later than your current age');
  if (lifeAge !== null && lifeAge > 120) errors.push('Corpus must last until an age of 120 or less');
  for (const kind of KINDS) {
    if (uplifts[kind] === null) errors.push(`${FIRE_COPY[kind].title} lifestyle % must be a number (0 and negatives are allowed)`);
  }

  const baseInput = useMemo(() => {
    if (age === null || expense === null || inf === null || post === null) return null;
    return {
      currentAge: age,
      investments: investments.map((i) => ({
        name: i.name,
        amount: parseNumber(i.amount) ?? 0,
        annualPercent: parseNumber(i.annualRate) ?? 0,
      })),
      sips: sips.map((s) => ({
        name: s.name,
        monthlyAmount: parseNumber(s.monthlyAmount) ?? 0,
        annualPercent: parseNumber(s.annualRate) ?? 0,
        stepUpPercent: parseNumber(s.stepUp) ?? 0,
      })),
      monthlyExpenseToday: expense,
      expenseInflationPercent: inf,
      oneOffs: oneOffs.map((o) => ({
        amountToday: parseNumber(o.amount) ?? 0,
        date: new Date(`${o.date}T00:00:00`),
        description: o.description,
      })),
      postFireAnnualPercent: post,
      ltcgEnabled,
      ltcgRatePercent: taxRate ?? 12.5,
      asOf: new Date(),
      sustainToAge: lifeAge ?? 90,
      preserveCorpusAtFire,
      checkpointAges: checkpointAges.map((a) => parseNumber(a)).filter((a): a is number => a !== null && a > 0),
    };
  }, [age, expense, inf, post, investments, sips, oneOffs, ltcgEnabled, taxRate, lifeAge, preserveCorpusAtFire, checkpointAges]);

  const numericUplifts =
    uplifts.lean !== null && uplifts.comfortable !== null && uplifts.fat !== null
      ? { lean: uplifts.lean, comfortable: uplifts.comfortable, fat: uplifts.fat }
      : null;

  const ageResults = useAutoCalculate(() => {
    if (errors.length || !baseInput || !numericUplifts || mode !== 'age') return null;
    return calculateFireScenarios(baseInput, numericUplifts);
  }, [errors.length, baseInput, numericUplifts, mode, currentAge, monthlyExpense, inflation, postFireReturn, ltcgEnabled, ltcgRate, investments, sips, oneOffs, leanUplift, comfortableUplift, fatUplift, checkpointAges, sustainToAge, preserveCorpusAtFire]);

  const sipResults = useAutoCalculate(() => {
    if (errors.length || !baseInput || !numericUplifts || mode !== 'sip') return null;
    return calculateFireSipPlan(baseInput, numericUplifts, {
      lean: parseNumber(targetAges.lean) ?? age ?? 45,
      comfortable: parseNumber(targetAges.comfortable) ?? 50,
      fat: parseNumber(targetAges.fat) ?? 55,
    });
  }, [errors.length, baseInput, numericUplifts, mode, targetAges, currentAge, monthlyExpense, inflation, postFireReturn, ltcgEnabled, ltcgRate, investments, sips, oneOffs, leanUplift, comfortableUplift, fatUplift, checkpointAges, sustainToAge, preserveCorpusAtFire]);

  const selectedAge = ageResults?.[selected];

  const formatUplift = (n: number) => {
    if (n === 0) return 'no lifestyle change';
    if (n > 0) return `+${n}% vs today`;
    return `${n}% vs today`;
  };

  return (
    <CalculatorLayout
      howItWorks={(
        <HowItWorks>
          <p>
            <strong>Lean FIRE</strong> covers today’s monthly expenses, grown with inflation. <strong>Comfortable</strong> and{' '}
            <strong>Fat FIRE</strong> first raise that spend by your lifestyle %, then inflate the full amount.
          </p>
          <p>
            FIRE age is the earliest age whose corpus can pay that spend through age {lifeAge ?? 90}. SIPs stop at FIRE; after that the corpus
            grows at your post-FIRE return. If you turn on “keep FIRE corpus”, leftover at that age must also be at least the corpus you had
            when you retired. Use reverse SIP to pick an age and see the extra monthly SIP needed, on top of SIPs you already have.
          </p>
        </HowItWorks>
      )}
      results={
        (ageResults || sipResults) && (
          <ResultsPanel title={mode === 'age' ? 'Your FIRE ages' : 'SIP needed for your target ages'} accent="green">
            {mode === 'age' && ageResults && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {KINDS.map((kind) => {
                  const row = ageResults[kind];
                  const copy = FIRE_COPY[kind];
                  return (
                    <button
                      key={kind}
                      type="button"
                      onClick={() => setSelected(kind)}
                      className={`rounded-2xl border bg-white p-5 text-left shadow-sm dark:bg-slate-800 ${copy.accent} ${
                        selected === kind ? copy.selected : ''
                      }`}
                    >
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.tag}</div>
                      <div className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-100">{copy.title}</div>
                      <div className={`mt-3 text-4xl font-bold ${
                        row.fireAge === null ? 'text-orange-500' : kind === 'lean' ? 'text-emerald-600' : kind === 'comfortable' ? 'text-sky-600' : 'text-violet-600'
                      }`}>
                        {row.fireAge === null ? 'Not by 70' : `Age ${row.fireAge}`}
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        {row.yearsToFire === null
                          ? 'Not reachable with the current plan'
                          : row.yearsToFire <= 0
                            ? 'You can FIRE now'
                            : `${row.yearsToFire} year${row.yearsToFire === 1 ? '' : 's'} from now`}
                      </p>
                      <p className="mt-3 text-xs text-slate-500">{formatUplift(row.lifestyleUpliftPercent)} · {copy.spendLabel}</p>
                      <p className="mt-1 text-sm text-slate-700 dark:text-slate-200">
                        Spend today: <strong>{formatINR(row.monthlyExpenseToday)}</strong>
                      </p>
                      <p className="text-sm text-slate-700 dark:text-slate-200">
                        Spend at FIRE: <strong>{formatINR(row.monthlyExpenseAtFire)}</strong>
                      </p>
                      <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 dark:border-slate-700">
                        {row.checkpointCorpus.map((point) => (
                          <p key={point.age} className="text-sm text-slate-700 dark:text-slate-200">
                            Corpus at {point.age}:{' '}
                            <strong>
                              {point.corpus === null ? '—' : formatINR(point.corpus)}
                            </strong>
                          </p>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {mode === 'sip' && sipResults && (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                {KINDS.map((kind) => {
                  const row = sipResults[kind];
                  const copy = FIRE_COPY[kind];
                  const uplift = numericUplifts?.[kind] ?? 0;
                  return (
                    <div key={kind} className={`rounded-2xl border bg-white p-5 dark:bg-slate-800 ${copy.accent}`}>
                      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{copy.tag}</div>
                      <div className="mt-1 text-lg font-bold text-slate-800 dark:text-slate-100">{copy.title}</div>
                      <div className="mt-3">
                        <NumberField
                          label="Target FIRE age"
                          kind="number"
                          value={targetAges[kind]}
                          onChange={(v) => setTargetAges((prev) => ({ ...prev, [kind]: v }))}
                        />
                      </div>
                      <div className={`mt-4 text-3xl font-bold ${
                        !row.reachable ? 'text-orange-500' : row.alreadyOnTrack ? 'text-emerald-600' : 'text-sky-600'
                      }`}>
                        {!row.reachable
                          ? 'Not reachable'
                          : row.alreadyOnTrack
                            ? '₹0 extra'
                            : `${formatINR(row.extraMonthlySip)} / mo`}
                      </div>
                      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                        {!row.reachable
                          ? 'Even a very large extra SIP is not enough by this age'
                          : row.alreadyOnTrack
                            ? 'Current SIPs already get you there'
                            : `Extra SIP on top of what you already invest, at ~${row.extraSipAnnualPercent.toFixed(1)}%`}
                      </p>
                      <p className="mt-3 text-xs text-slate-500">{formatUplift(uplift)}</p>
                      <p className="text-sm text-slate-700 dark:text-slate-200">
                        Spend today at this lifestyle: <strong>{formatINR(row.monthlyExpenseToday)}</strong>
                      </p>
                      <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 dark:border-slate-700">
                        {row.checkpointCorpus.map((point) => (
                          <p key={point.age} className="text-sm text-slate-700 dark:text-slate-200">
                            Corpus at {point.age}:{' '}
                            <strong>
                              {point.corpus === null ? '—' : formatINR(point.corpus)}
                            </strong>
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {mode === 'age' && selectedAge && (
              <>
                <ResultGrid>
                  <ResultCard label={`${FIRE_COPY[selected].title} corpus`} value={formatINR(selectedAge.corpusAtFire)} tone="blue" hint="Corpus when that FIRE age is hit" />
                  <ResultCard label="Total invested" value={formatINR(selectedAge.totalInvestment)} />
                  {ltcgEnabled && <ResultCard label="Estimated LTCG" value={formatINR(selectedAge.totalLtcgTax)} tone="orange" />}
                </ResultGrid>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  Chart and table for <strong>{FIRE_COPY[selected].title}</strong>. Click a card above to switch.
                </p>
                <CorpusChart
                  data={selectedAge.chartSeries}
                  lines={[
                    { key: 'corpus', label: 'Corpus', color: selected === 'fat' ? '#7c3aed' : selected === 'comfortable' ? '#0284c7' : '#16a34a' },
                    { key: 'invested', label: 'Invested', color: '#64748b', dashed: true },
                  ]}
                />
                <BreakdownTable
                  title={`${FIRE_COPY[selected].title} year-by-year`}
                  rows={selectedAge.yearlyBreakdown}
                  columns={[
                    { key: 'year', header: 'Year', render: (row) => row.year },
                    { key: 'age', header: 'Age', render: (row) => row.age },
                    { key: 'start', header: 'Starting', align: 'right', render: (row) => formatINR(row.startingCorpus) },
                    { key: 'inv', header: 'Invested', align: 'right', render: (row) => formatINR(row.invested) },
                    { key: 'g', header: 'Growth', align: 'right', className: 'text-green-600 dark:text-green-400', render: (row) => formatINR(row.growth) },
                    { key: 'e', header: 'Spend', align: 'right', render: (row) => formatINR(row.expenses) },
                    { key: 'o', header: 'One-off', align: 'right', render: (row) => formatINR(row.oneOffs) },
                    ...(ltcgEnabled
                      ? [{ key: 't', header: 'LTCG', align: 'right' as const, className: 'text-orange-600 dark:text-orange-400', render: (row: (typeof selectedAge.yearlyBreakdown)[0]) => formatINR(row.ltcgTax) }]
                      : []),
                    { key: 'end', header: 'Remaining', align: 'right', className: 'text-blue-600 dark:text-blue-400', render: (row) => formatINR(row.remainingCorpus) },
                  ]}
                />
              </>
            )}
          </ResultsPanel>
        )
      }
    >
      <section className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">Lifestyle settings</h3>
        <p className="mt-1 text-xs text-slate-500">
          Applied on today’s expenses before inflation. 0 keeps spend unchanged. Negative values mean a cheaper lifestyle.
        </p>
        <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-3">
          <NumberField label="Lean FIRE lifestyle change" kind="percent" value={leanUplift} onChange={setLeanUplift} hint="Default 0%: same as today’s expenses" />
          <NumberField label="Comfortable FIRE lifestyle change" kind="percent" value={comfortableUplift} onChange={setComfortableUplift} hint="Default 20% more than today" />
          <NumberField label="Fat FIRE lifestyle change" kind="percent" value={fatUplift} onChange={setFatUplift} hint="Default 50% more than today" />
        </div>
        <h3 className="mt-5 text-sm font-semibold text-slate-800 dark:text-slate-100">How long the corpus must last</h3>
        <p className="mt-1 text-xs text-slate-500">
          FIRE is reached only if remaining corpus stays above zero through this age. Default is 90.
        </p>
        <div className="mt-3 max-w-xs">
          <NumberField
            label="Corpus must last until age"
            kind="number"
            value={sustainToAge}
            onChange={setSustainToAge}
            hint="This is the sustainability horizon, not a checkpoint"
          />
        </div>
        <label className="mt-4 flex items-start text-sm font-medium text-slate-700 dark:text-slate-300">
          <input
            type="checkbox"
            checked={preserveCorpusAtFire}
            onChange={(e) => setPreserveCorpusAtFire(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span className="ml-2">
            At survival age, corpus must be at least the corpus at FIRE
            <span className="mt-0.5 block text-xs font-normal text-slate-500">
              Off: leftover just needs to stay above zero. On: leftover at age {lifeAge ?? 90} must be ≥ corpus when you retired.
            </span>
          </span>
        </label>
        <h3 className="mt-5 text-sm font-semibold text-slate-800 dark:text-slate-100">Corpus checkpoints</h3>
        <p className="mt-1 text-xs text-slate-500">
          Snapshots of remaining corpus at these ages. They do not define how long the corpus must last. Defaults are 60 and 80.
        </p>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          {checkpointAges.map((value, index) => (
            <div key={`${index}-${checkpointAges.length}`} className="w-28">
              <NumberField
                label={`Age ${index + 1}`}
                kind="number"
                value={value}
                onChange={(v) => setCheckpointAges((rows) => rows.map((row, i) => (i === index ? v : row)))}
              />
              {checkpointAges.length > 1 && (
                <button
                  type="button"
                  onClick={() => setCheckpointAges((rows) => rows.filter((_, i) => i !== index))}
                  className="mt-1 text-xs text-red-600"
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={() => setCheckpointAges((rows) => [...rows, ''])}
            className="mb-1 rounded-md px-3 py-2 text-sm text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
          >
            + Add age
          </button>
        </div>
      </section>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setMode('age')}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            mode === 'age'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          When can I FIRE?
        </button>
        <button
          type="button"
          onClick={() => setMode('sip')}
          className={`rounded-full px-4 py-2 text-sm font-medium ${
            mode === 'sip'
              ? 'bg-emerald-600 text-white'
              : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
          }`}
        >
          SIP needed for a FIRE age
        </button>
      </div>

      <ValidationBanner errors={errors} />

      <CollapsibleSection title="You">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <NumberField label="Current age" kind="number" value={currentAge} onChange={setCurrentAge} />
          <NumberField label="Monthly expenses today" kind="currency" value={monthlyExpense} onChange={setMonthlyExpense} hint="Before Lean / Comfortable / Fat uplifts" />
          <NumberField label="Expense inflation" kind="percent" value={inflation} onChange={setInflation} hint="Yearly increase in living costs" />
          <NumberField label="Return after FIRE" kind="percent" value={postFireReturn} onChange={setPostFireReturn} hint="Used once you stop working" />
        </div>
        <TaxSettings enabled={ltcgEnabled} rate={ltcgRate} onEnabled={setLtcgEnabled} onRate={setLtcgRate} />
      </CollapsibleSection>

      <CollapsibleSection
        title="Current investments"
        actions={<button type="button" onClick={() => setInvestments((rows) => [...rows, { id: Date.now().toString(), name: 'New bucket', amount: '100000', annualRate: '10' }])} className="text-sm text-green-700">+ Add</button>}
      >
        {investments.map((row) => (
          <div key={row.id} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <NumberField label="Type" kind="text" value={row.name} onChange={(v) => setInvestments((rows) => rows.map((r) => (r.id === row.id ? { ...r, name: v } : r)))} />
            <NumberField label="Amount today" kind="currency" value={row.amount} onChange={(v) => setInvestments((rows) => rows.map((r) => (r.id === row.id ? { ...r, amount: v } : r)))} />
            <NumberField label="Expected return" kind="percent" value={row.annualRate} onChange={(v) => setInvestments((rows) => rows.map((r) => (r.id === row.id ? { ...r, annualRate: v } : r)))} />
            {investments.length > 1 && (
              <div className="flex items-end">
                <button type="button" onClick={() => setInvestments((rows) => rows.filter((r) => r.id !== row.id))} className="text-sm text-red-600">Remove</button>
              </div>
            )}
          </div>
        ))}
      </CollapsibleSection>

      <CollapsibleSection
        title="Monthly investments"
        actions={<button type="button" onClick={() => setSips((rows) => [...rows, { id: Date.now().toString(), name: 'SIP', monthlyAmount: '10000', annualRate: '12', stepUp: '0' }])} className="text-sm text-green-700">+ Add</button>}
      >
        <p className="text-xs text-slate-500">These run until FIRE age. Reverse SIP is extra on top of these.</p>
        {sips.map((row) => (
          <div key={row.id} className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <NumberField label="Name" kind="text" value={row.name} onChange={(v) => setSips((rows) => rows.map((r) => (r.id === row.id ? { ...r, name: v } : r)))} />
            <NumberField label="Monthly amount" kind="currency" value={row.monthlyAmount} onChange={(v) => setSips((rows) => rows.map((r) => (r.id === row.id ? { ...r, monthlyAmount: v } : r)))} />
            <NumberField label="Expected return" kind="percent" value={row.annualRate} onChange={(v) => setSips((rows) => rows.map((r) => (r.id === row.id ? { ...r, annualRate: v } : r)))} />
            <NumberField label="Yearly step-up" kind="percent" value={row.stepUp} onChange={(v) => setSips((rows) => rows.map((r) => (r.id === row.id ? { ...r, stepUp: v } : r)))} />
            {sips.length > 1 && (
              <div className="flex items-end">
                <button type="button" onClick={() => setSips((rows) => rows.filter((r) => r.id !== row.id))} className="text-sm text-red-600">Remove</button>
              </div>
            )}
          </div>
        ))}
      </CollapsibleSection>

      <CollapsibleSection
        title="One-off future expenses"
        defaultOpen={false}
        actions={<button type="button" onClick={() => setOneOffs((rows) => [...rows, { id: Date.now().toString(), description: 'Home / car / wedding', amount: '500000', date: addYearsIso(today, 5) }])} className="text-sm text-green-700">+ Add</button>}
      >
        {oneOffs.length === 0 && <p className="text-sm text-slate-500">None. Add a house, car, or other planned cost in today’s rupees.</p>}
        {oneOffs.map((row) => (
          <div key={row.id} className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <NumberField label="Note" kind="text" value={row.description} onChange={(v) => setOneOffs((rows) => rows.map((r) => (r.id === row.id ? { ...r, description: v } : r)))} />
            <NumberField label="Amount today" kind="currency" value={row.amount} onChange={(v) => setOneOffs((rows) => rows.map((r) => (r.id === row.id ? { ...r, amount: v } : r)))} />
            <NumberField label="Date" kind="date" value={row.date} onChange={(v) => setOneOffs((rows) => rows.map((r) => (r.id === row.id ? { ...r, date: v } : r)))} />
            <div className="flex items-end">
              <button type="button" onClick={() => setOneOffs((rows) => rows.filter((r) => r.id !== row.id))} className="text-sm text-red-600">Remove</button>
            </div>
          </div>
        ))}
      </CollapsibleSection>
    </CalculatorLayout>
  );
}
