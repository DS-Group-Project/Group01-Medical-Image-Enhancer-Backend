import React from 'react';

/**
 * Base Skeleton Component
 */
export const Skeleton = ({ 
  width = '100%', 
  height = '1rem', 
  className = '', 
  variant = 'rectangular' 
}) => {
  const variantStyles = {
    text: 'rounded-md',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  return (
    <div
      className={`bg-slate-200 relative overflow-hidden ${variantStyles[variant]} ${className}`}
      style={{ width, height }}
    >
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/40 to-transparent" />
    </div>
  );
};

/**
 * Full Card Skeleton
 */
export const CardSkeleton = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm h-full w-full">
      <Skeleton height="160px" className="mb-4" />
      <Skeleton height="24px" width="70%" className="mb-2" />
      <Skeleton height="16px" width="40%" className="mb-4" />
      <div className="flex justify-between items-center mt-auto pt-4 border-t border-slate-100">
        <Skeleton height="20px" width="60px" />
        <Skeleton height="32px" width="80px" variant="rectangular" className="rounded-lg" />
      </div>
    </div>
  );
};

/**
 * Table Row Skeleton
 */
export const TableRowSkeleton = ({ columns = 4 }) => {
  return (
    <tr className="border-b border-slate-100">
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4 whitespace-nowrap">
          <Skeleton height="16px" width={i === 0 ? '120px' : '80px'} />
        </td>
      ))}
    </tr>
  );
};

/**
 * Stats Grid Skeleton
 */
export const StatsSkeleton = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <Skeleton height="14px" width="80px" className="mb-2" />
              <Skeleton height="36px" width="60px" />
              <Skeleton height="14px" width="100px" className="mt-3" />
            </div>
            <Skeleton variant="circular" height="48px" width="48px" />
          </div>
        </div>
      ))}
    </div>
  );
};

// Add shimmer keyframes to document if not present
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes shimmer {
      100% {
        transform: translateX(100%);
      }
    }
  `;
  document.head.appendChild(style);
}
