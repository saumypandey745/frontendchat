import React, { useState } from 'react';

const Tooltip = ({ children, content, position = 'top' }) => {
  const [visible, setVisible] = useState(false);

  const positionStyles = {
    top: '-top-8 left-1/2 -translate-x-1/2',
    bottom: '-bottom-8 left-1/2 -translate-x-1/2',
    left: '-left-8 top-1/2 -translate-y-1/2',
    right: 'right-0 top-1/2 -translate-y-1/2',
  };

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && content && (
        <div
          className={`absolute ${positionStyles[position]} z-50 px-2 py-1 text-[10px] font-semibold text-white bg-slate-900/90 dark:bg-slate-800/95 backdrop-blur-md rounded-lg shadow-lg pointer-events-none whitespace-nowrap animate-pop-in`}
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
