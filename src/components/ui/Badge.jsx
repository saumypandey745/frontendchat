import React from 'react';

const Badge = ({ children, variant = 'brand', className = '' }) => {
  const variants = {
    brand: 'bg-brand-500/10 text-brand-600 dark:text-brand-400 border-brand-500/20',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    neutral: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full border animate-pop-in ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
