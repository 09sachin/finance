'use client';

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatINR } from '@/lib/calculators';

export interface ChartLine {
  key: string;
  label: string;
  color: string;
  dashed?: boolean;
}

export default function CorpusChart({
  data,
  xKey = 'year',
  lines,
  height = 280,
}: {
  data: object[];
  xKey?: string;
  lines: ChartLine[];
  height?: number;
}) {
  if (data.length === 0) return null;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-800">
      <div style={{ width: '100%', height }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#94a3b8" opacity={0.3} />
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} />
            <YAxis
              tick={{ fontSize: 12 }}
              tickFormatter={(v) =>
                v >= 10_000_000 ? `${(v / 10_000_000).toFixed(1)}Cr` : v >= 100_000 ? `${(v / 100_000).toFixed(1)}L` : `${Math.round(v / 1000)}k`
              }
            />
            <Tooltip
              formatter={(value: number | string) => formatINR(Number(value))}
              contentStyle={{
                backgroundColor: 'rgb(15 23 42)',
                border: 'none',
                borderRadius: 8,
                color: 'white',
              }}
            />
            <Legend />
            {lines.map((line) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.label}
                stroke={line.color}
                strokeWidth={2}
                dot={false}
                strokeDasharray={line.dashed ? '6 4' : undefined}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function CorpusAreaChart({
  data,
  xKey = 'year',
  valueKey = 'value',
  investedKey,
}: {
  data: object[];
  xKey?: string;
  valueKey?: string;
  investedKey?: string;
}) {
  const lines: ChartLine[] = [{ key: valueKey, label: 'Value', color: '#2563eb' }];
  if (investedKey) lines.unshift({ key: investedKey, label: 'Invested', color: '#64748b', dashed: true });
  return <CorpusChart data={data} xKey={xKey} lines={lines} />;
}
