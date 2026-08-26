'use client';

import { useEffect, useState } from 'react';

export function useAutoCalculate<T>(fn: () => T | null, deps: unknown[], delay = 250): T | null {
  const [result, setResult] = useState<T | null>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        setResult(fn());
      } catch {
        setResult(null);
      }
    }, delay);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return result;
}
