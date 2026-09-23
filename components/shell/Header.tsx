'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { loadEnginePreference } from '@/lib/storage/local';

export function Header() {
  const pathname = usePathname();
  const [engine, setEngine] = useState<'laya' | 'jev' | 'mock'>('laya');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const pref = loadEnginePreference();
    setEngine((pref as any) || 'laya');

    const handleStorage = () => {
      const p = loadEnginePreference();
      setEngine((p as any) || 'laya');
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const navLinks = [
    { href: '/live', label: 'LIVE' },
    { href: '/replay', label: 'REPLAY' },
    { href: '/benchmark', label: 'BENCHMARK' },
    { href: '/how-it-works', label: 'HOW IT WORKS' },
    { href: '/settings', label: 'SETTINGS' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-paper border-b border-line">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-baseline gap-2 group">
          <span className="font-display font-black text-xl tracking-tight text-ink group-hover:text-pink transition-colors">
            FOCUSFIREWALL
          </span>
          <span className="font-mono text-[11px] text-ink-muted tracking-widest hidden sm:inline">
            {"// ATTENTION ROUTER"}
          </span>
        </Link>

        {/* Center Nav */}
        <nav className="hidden md:flex items-center gap-1 font-mono text-xs font-semibold tracking-wider">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 border transition-all ${
                  isActive
                    ? 'bg-line text-surface border-line shadow-hard'
                    : 'bg-transparent text-ink border-transparent hover:border-line hover:bg-surface'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Engine status indicator & Mobile toggle */}
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            className={`font-mono text-[11px] font-bold px-2.5 py-1 border border-line flex items-center gap-1.5 shadow-hard transition-all ${
              engine === 'laya'
                ? 'bg-ink text-white'
                : engine === 'jev'
                ? 'bg-orange text-white'
                : 'bg-surface text-ink'
            }`}
            title="Configure active engine in Settings"
          >
            <span
              className={`w-2 h-2 rounded-full inline-block ${
                engine === 'laya'
                  ? 'bg-pink animate-pulse'
                  : engine === 'jev'
                  ? 'bg-white animate-pulse'
                  : 'bg-orange'
              }`}
            />
            <span>ENGINE: {engine.toUpperCase()}</span>
            <span className="text-[9px] opacity-75 hidden sm:inline">
              [{engine === 'laya' ? 'OPEN-WEIGHTS' : engine === 'jev' ? 'API' : 'DEMO'}]
            </span>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-1.5 border border-line bg-surface font-mono text-xs"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-line bg-paper-2 px-4 py-3 space-y-2">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 border font-mono text-xs font-bold tracking-wider ${
                  isActive ? 'bg-line text-surface border-line' : 'bg-surface border-line text-ink'
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
