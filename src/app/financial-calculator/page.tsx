'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function FinancialCalculatorIndexPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/financial-calculator/sip/');
  }, [router]);
  return <p className="text-sm text-slate-500">Opening SIP calculator…</p>;
}
