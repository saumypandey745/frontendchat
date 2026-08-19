import React from 'react';

const Skeleton = ({ className = '', ...props }) => {
  return (
    <div
      className={`relative overflow-hidden bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl ${className}`}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 dark:via-slate-700/30 to-transparent animate-shimmer" />
    </div>
  );
};

export default Skeleton;
