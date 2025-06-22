'use client';
import React from 'react';

interface SliderWithInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step: number;
  prefix?: string;
}

export default function SliderWithInput({
  label,
  value,
  onChange,
  min,
  max,
  step,
  prefix = ''
}: SliderWithInputProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === '') {
      onChange(min);
      return;
    }
    const newValue = parseInt(val, 10);
    if (!isNaN(newValue)) {
      const clampedValue = Math.max(min, Math.min(max, newValue));
      onChange(clampedValue);
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (e.target.value === '') {
        onChange(min);
    }
  }

  return (
    <div>
      <div className="flex justify-between mb-1">
        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {label}
        </label>
        <span className="text-sm font-semibold">{prefix}{value.toLocaleString()}</span>
      </div>
      <div className="grid grid-cols-12 gap-4 items-center">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500 col-span-8"
        />
        <div className="relative col-span-4">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className="text-gray-500 sm:text-sm">{prefix}</span>
          </div>
          <input
            type="number"
            value={value}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            min={min}
            max={max}
            step={step}
            className="app-input w-full pl-7" 
          />
        </div>
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>{prefix}{min.toLocaleString()}</span>
        <span>{prefix}{max.toLocaleString()}</span>
      </div>
    </div>
  );
} 