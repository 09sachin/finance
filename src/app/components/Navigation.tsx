'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

const Navigation: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) =>
    pathname === path || (path !== '/' && pathname.startsWith(path));

  const navItems = [
    { name: 'Dashboard', path: '/' },
    { name: 'SIP Calculator', path: '/sip-calculator' },
    { name: 'FundCompare', path: '/compare' },
    { name: 'SIP Compare', path: '/sip-compare' },
    { name: 'Financial Calculators', path: '/financial-calculator' },
    { name: 'Favorites', path: '/favorites' },
  ];

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <nav className="fixed top-0 inset-x-0 z-50 border-b border-slate-200/80 bg-slate-50/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center text-xl font-bold text-blue-600 dark:text-blue-400">
            <Image src="/logo-removebg.png" alt="BitsAndBots" width={40} height={40} className="h-10 w-auto" />
          </Link>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 md:hidden"
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          <div className="hidden space-x-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`rounded-md px-3 py-2 text-sm font-medium ${
                  isActive(item.path)
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        </div>

        {isMenuOpen && (
          <div className="overflow-hidden rounded-lg bg-white pb-3 shadow-lg dark:bg-slate-800 md:hidden">
            {navItems.map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`block px-4 py-3 text-sm font-medium ${
                  isActive(item.path)
                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                    : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-700/30'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
