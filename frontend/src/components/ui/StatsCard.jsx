import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

/**
 * StatsCard component for dashboard metrics.
 * 
 * @param {Object} props
 * @param {string} props.title
 * @param {string|number} props.value
 * @param {React.ElementType} props.icon
 * @param {number} [props.trend]
 * @param {'teal'|'indigo'|'emerald'|'red'} [props.color='teal']
 */
const StatsCard = ({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  color = 'teal' 
}) => {
  const colorStyles = {
    teal: "from-teal-500 to-teal-600 bg-teal-50 text-teal-600",
    indigo: "from-indigo-500 to-indigo-600 bg-indigo-50 text-indigo-600",
    emerald: "from-emerald-500 to-emerald-600 bg-emerald-50 text-emerald-600",
    red: "from-red-500 to-red-600 bg-red-50 text-red-600"
  };

  const [gradientClasses, bgClass, iconTextClass] = colorStyles[color].split(' ');

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" }
    }
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      whileHover={{ scale: 1.02, y: -4 }}
      className="bg-white/80 backdrop-blur-md rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow duration-300 relative overflow-hidden"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900">{value}</h3>
          
          {trend !== undefined && (
            <div className={`flex items-center mt-2 text-sm font-medium ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {trend >= 0 ? (
                <ArrowUpRight size={16} className="mr-1" />
              ) : (
                <ArrowDownRight size={16} className="mr-1" />
              )}
              <span>{Math.abs(trend)}%</span>
              <span className="text-slate-400 ml-1 font-normal">vs last month</span>
            </div>
          )}
        </div>
        
        <div className={`p-3 rounded-2xl ${bgClass}`}>
          <Icon className={iconTextClass} size={24} />
        </div>
      </div>
      
      {/* Decorative gradient blur */}
      <div className={`absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br ${gradientClasses} rounded-full blur-3xl opacity-20`} />
    </motion.div>
  );
};

export default StatsCard;
