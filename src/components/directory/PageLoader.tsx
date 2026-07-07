'use client';

import { useEffect, useState } from 'react';

// ─── Full-screen initial page loader ────────────────────────────────────────
// Shows while the app hydrates + fetches initial data (auth, categories, etc.)

export function InitialPageLoader() {
  const [phase, setPhase] = useState<'enter' | 'hold' | 'exit'>('enter');

  useEffect(() => {
    // Phase 1: Enter animation (logo + text animate in)
    const enterTimer = setTimeout(() => setPhase('hold'), 100);
    // Phase 2: Hold briefly, then start exit
    const exitTimer = setTimeout(() => setPhase('exit'), 1800);
    // Phase 3: Fully exited — removed from DOM
    return () => {
      clearTimeout(enterTimer);
      clearTimeout(exitTimer);
    };
  }, []);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-background transition-all duration-500 ease-in-out ${
        phase === 'enter'
          ? 'opacity-100'
          : phase === 'hold'
            ? 'opacity-100'
            : 'opacity-0 pointer-events-none'
      }`}
    >
      {/* Background subtle gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 rounded-full bg-primary/5 blur-3xl animate-pulse" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 rounded-full bg-primary/5 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      {/* Main loader content */}
      <div className={`relative flex flex-col items-center transition-all duration-700 ease-out ${
        phase === 'enter' ? 'opacity-0 scale-90' : phase === 'hold' ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
      }`}>
        {/* Animated logo ring */}
        <div className="relative w-20 h-20 mb-6">
          {/* Outer spinning ring */}
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary border-r-primary/50 animate-spin" style={{ animationDuration: '1.2s' }} />
          {/* Middle counter-spinning ring */}
          <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-primary/60 border-l-primary/30 animate-spin" style={{ animationDuration: '1.8s', animationDirection: 'reverse' }} />
          {/* Inner pulsing core */}
          <div className="absolute inset-4 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-6 h-6 rounded-full bg-primary animate-pulse" />
          </div>
          {/* Orbiting dot */}
          <div className="absolute inset-0 animate-spin" style={{ animationDuration: '2.4s' }}>
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-primary shadow-lg shadow-primary/40" />
          </div>
        </div>

        {/* Brand name */}
        <h1
          className={`text-2xl font-bold tracking-tight text-foreground transition-all duration-700 delay-200 ${
            phase === 'enter' ? 'opacity-0 translate-y-2' : phase === 'hold' ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1'
          }`}
        >
          City<span className="text-primary">Dir</span>
        </h1>

        {/* Tagline */}
        <p
          className={`text-sm text-muted-foreground mt-1.5 transition-all duration-700 delay-300 ${
            phase === 'enter' ? 'opacity-0' : phase === 'hold' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          Your Complete City Directory
        </p>

        {/* Animated dots */}
        <div
          className={`flex gap-1.5 mt-6 transition-all duration-700 delay-400 ${
            phase === 'enter' ? 'opacity-0' : phase === 'hold' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary animate-bounce"
              style={{
                animationDuration: '1.4s',
                animationDelay: `${i * 0.16}s`,
                animationIterationCount: 'infinite',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Inline content area loader for SPA view transitions ────────────────────

interface ViewTransitionLoaderProps {
  /** When true, shows the animated loader */
  isLoading: boolean;
  /** Optional custom message */
  message?: string;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
}

export function ViewTransitionLoader({ isLoading, message, size = 'md' }: ViewTransitionLoaderProps) {
  if (!isLoading) return null;

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  const dotSize = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2',
  };

  return (
    <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
      <div className="relative mb-4">
        {/* Spinning ring */}
        <div className={`${sizeClasses[size]} rounded-full border-2 border-transparent border-t-primary border-r-primary/40 animate-spin`} style={{ animationDuration: '1s' }} />
        {/* Inner pulsing dot */}
        <div className={`absolute inset-0 flex items-center justify-center`}>
          <div className={`${dotSize[size]} rounded-full bg-primary/30 animate-ping`} />
        </div>
      </div>
      {message && (
        <p className="text-sm text-muted-foreground animate-fade-in mt-1">{message}</p>
      )}
    </div>
  );
}

// ─── Minimal inline spinner (for buttons, cards, etc.) ─────────────────────

interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md';
}

export function Spinner({ className = '', size = 'sm' }: SpinnerProps) {
  const sizeClass = size === 'sm' ? 'w-4 h-4' : 'w-6 h-6';
  return (
    <svg
      className={`${sizeClass} animate-spin text-primary ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      role="status"
      aria-label="Loading"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// ─── Skeleton card grid loader (for browse/search pages) ───────────────────

export function CardGridLoader({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card overflow-hidden animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
          {/* Image placeholder */}
          <div className="h-40 bg-muted animate-pulse" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-muted rounded-md w-3/4 animate-pulse" />
            <div className="h-3 bg-muted rounded-md w-1/2 animate-pulse" />
            <div className="h-3 bg-muted rounded-md w-full animate-pulse" />
            <div className="flex gap-2 pt-2">
              <div className="h-7 bg-muted rounded-md w-16 animate-pulse" />
              <div className="h-7 bg-muted rounded-md w-16 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Business detail skeleton loader ────────────────────────────────────────

export function BusinessDetailLoader() {
  return (
    <div className="animate-fade-in max-w-6xl mx-auto px-4 py-6">
      {/* Cover image */}
      <div className="h-48 md:h-64 rounded-2xl bg-muted animate-pulse mb-6" />
      {/* Title area */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1 space-y-4">
          <div className="h-7 bg-muted rounded-md w-2/3 animate-pulse" />
          <div className="h-4 bg-muted rounded-md w-1/3 animate-pulse" />
          <div className="h-4 bg-muted rounded-md w-1/4 animate-pulse" />
          <div className="flex gap-3 pt-2">
            <div className="h-10 bg-muted rounded-md w-28 animate-pulse" />
            <div className="h-10 bg-muted rounded-md w-28 animate-pulse" />
            <div className="h-10 bg-muted rounded-md w-10 animate-pulse" />
          </div>
          <div className="h-20 bg-muted rounded-md w-full animate-pulse mt-4" />
          <div className="h-20 bg-muted rounded-md w-full animate-pulse" />
        </div>
        {/* Sidebar */}
        <div className="w-full md:w-80 space-y-4">
          <div className="h-48 bg-muted rounded-xl animate-pulse" />
          <div className="h-32 bg-muted rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}