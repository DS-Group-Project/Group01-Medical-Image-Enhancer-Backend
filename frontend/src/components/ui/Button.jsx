import React from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Reusable Button component with multiple variants, sizes, and states.
 * 
 * @param {Object} props
 * @param {'primary'|'secondary'|'ghost'|'danger'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.loading=false]
 * @param {boolean} [props.disabled=false]
 * @param {React.ElementType} [props.icon]
 * @param {'left'|'right'} [props.iconPosition='left']
 * @param {boolean} [props.fullWidth=false]
 * @param {React.ReactNode} props.children
 * @param {string} [props.className='']
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  fullWidth = false,
  children,
  className = '',
  ...rest
}) => {
  const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 shadow-lg shadow-teal-500/25 focus:ring-teal-500 border border-transparent",
    secondary: "border-2 border-red-500 text-red-600 hover:bg-teal-50 focus:ring-teal-500 bg-transparent",
    ghost: "text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:ring-slate-500 bg-transparent",
    danger: "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 shadow-lg shadow-red-500/25 focus:ring-red-500 border border-transparent",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24,
  };

  const classes = `
    ${baseClasses}
    ${variants[variant]}
    ${sizes[size]}
    ${fullWidth ? 'w-full' : ''}
    ${disabled || loading ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
    ${className}
  `;

  return (
    <motion.button
      whileHover={disabled || loading ? {} : { scale: 1.02 }}
      whileTap={disabled || loading ? {} : { scale: 0.98 }}
      className={classes}
      disabled={disabled || loading}
      {...rest}
    >
      {loading && (
        <Loader2 
          className={`animate-spin ${children ? 'mr-2' : ''}`} 
          size={iconSizes[size]} 
        />
      )}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon className="mr-2" size={iconSizes[size]} />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="ml-2" size={iconSizes[size]} />
      )}
    </motion.button>
  );
};

export default Button;
