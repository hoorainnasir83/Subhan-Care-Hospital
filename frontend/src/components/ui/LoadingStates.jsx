import React from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Page-level loading spinner
 */
export const PageLoader = ({ message = 'Loading...' }) => (
  <div className="flex flex-col items-center justify-center py-24 gap-4">
    <Loader2 className="h-10 w-10 text-brand-600 dark:text-brand-400 animate-spin" />
    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{message}</p>
  </div>
);

/**
 * Inline button loading indicator
 */
export const ButtonLoader = ({ text = 'Saving...', className = '' }) => (
  <span className={`inline-flex items-center gap-2 ${className}`}>
    <Loader2 className="h-4 w-4 animate-spin" />
    {text}
  </span>
);

/**
 * Skeleton block for cards
 */
export const CardSkeleton = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse">
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
        <div className="h-8 w-16 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
        <div className="h-3 w-32 bg-slate-100 dark:bg-slate-800 rounded" />
      </div>
    ))}
  </div>
);

/**
 * Skeleton block for table rows
 */
export const TableSkeleton = ({ rows = 5, cols = 5 }) => (
  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
    {/* Header */}
    <div className="flex gap-4 p-4 border-b border-slate-100 dark:border-slate-800 animate-pulse">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="h-4 flex-1 bg-slate-200 dark:bg-slate-700 rounded" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, ri) => (
      <div key={ri} className="flex gap-4 p-4 border-b border-slate-50 dark:border-slate-800/50 animate-pulse">
        {Array.from({ length: cols }).map((_, ci) => (
          <div key={ci} className="h-4 flex-1 bg-slate-100 dark:bg-slate-800 rounded" />
        ))}
      </div>
    ))}
  </div>
);

/**
 * Skeleton block for charts
 */
export const ChartSkeleton = ({ height = 'h-64' }) => (
  <div className={`bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 animate-pulse ${height}`}>
    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
    <div className="flex items-end gap-3 h-full pb-6">
      {[40, 65, 30, 80, 55, 70, 45, 60, 35, 75, 50, 68].map((h, i) => (
        <div key={i} className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-t" style={{ height: `${h}%` }} />
      ))}
    </div>
  </div>
);

/**
 * Form skeleton
 */
export const FormSkeleton = ({ fields = 4 }) => (
  <div className="space-y-5 animate-pulse">
    {Array.from({ length: fields }).map((_, i) => (
      <div key={i}>
        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-700 rounded mb-2" />
        <div className="h-10 w-full bg-slate-100 dark:bg-slate-800 rounded-lg" />
      </div>
    ))}
    <div className="h-10 w-32 bg-slate-200 dark:bg-slate-700 rounded-lg mt-6" />
  </div>
);
