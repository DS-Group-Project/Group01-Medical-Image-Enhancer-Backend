import React from 'react';
import Button from './Button';

/**
 * EmptyState component for lists or sections with no data.
 * 
 * @param {Object} props
 * @param {React.ElementType} props.icon
 * @param {string} props.title
 * @param {string} props.description
 * @param {string} [props.actionLabel]
 * @param {Function} [props.onAction]
 */
const EmptyState = ({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50">
      <div className="bg-white p-4 rounded-full shadow-sm border border-slate-100 mb-4 text-slate-400">
        <Icon size={32} strokeWidth={1.5} />
      </div>
      
      <h3 className="text-lg font-semibold text-slate-800 mb-2">
        {title}
      </h3>
      
      <p className="text-sm text-slate-500 max-w-sm mb-6">
        {description}
      </p>
      
      {actionLabel && onAction && (
        <Button onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
