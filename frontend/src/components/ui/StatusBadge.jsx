import React from 'react';

/**
 * StatusBadge component to indicate various status states.
 * 
 * @param {Object} props
 * @param {'pending'|'processing'|'completed'|'failed'} props.status
 * @param {'sm'|'md'} [props.size='md']
 * @param {boolean} [props.withDot=true]
 */
const StatusBadge = ({ 
  status = 'pending', 
  size = 'md', 
  withDot = true 
}) => {
  const statusStyles = {
    pending: "bg-slate-100 text-slate-600 border-slate-200",
    processing: "bg-amber-100 text-amber-700 border-amber-200",
    completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
    failed: "bg-red-100 text-red-700 border-red-200"
  };

  const dotStyles = {
    pending: "bg-slate-400",
    processing: "bg-amber-500 animate-pulse",
    completed: "bg-emerald-500",
    failed: "bg-red-500"
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm"
  };

  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span 
      className={`inline-flex items-center font-medium rounded-full border ${statusStyles[status]} ${sizes[size]}`}
    >
      {withDot && (
        <span className="flex items-center justify-center mr-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${dotStyles[status]}`}></span>
        </span>
      )}
      {label}
    </span>
  );
};

export default StatusBadge;
