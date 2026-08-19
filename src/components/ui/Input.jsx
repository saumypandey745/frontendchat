import React from 'react';

const Input = ({
  label,
  error,
  leftIcon: LeftIcon,
  rightIcon: RightIcon,
  className = '',
  ...props
}) => {
  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {LeftIcon && (
          <div className="absolute left-3.5 text-slate-400 pointer-events-none">
            <LeftIcon className="w-4 h-4" />
          </div>
        )}
        <input
          className={`w-full py-2.5 rounded-2xl border text-sm transition-all duration-150 bg-slate-50 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/50 ${
            LeftIcon ? 'pl-10' : 'pl-4'
          } ${RightIcon ? 'pr-10' : 'pr-4'} ${
            error
              ? 'border-red-500 focus:ring-red-500/50'
              : 'border-slate-200 dark:border-slate-700/80'
          } ${className}`}
          {...props}
        />
        {RightIcon && (
          <div className="absolute right-3.5 text-slate-400 pointer-events-none">
            <RightIcon className="w-4 h-4" />
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
    </div>
  );
};

export default Input;
