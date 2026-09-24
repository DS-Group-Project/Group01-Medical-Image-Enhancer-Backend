import React from 'react';
import { motion } from 'framer-motion';
import { Upload, Loader, CheckCircle, AlertCircle } from 'lucide-react';

const StatsCard = ({ title, value, icon: Icon, colorClass, delay }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white p-6 rounded-none shadow-sm border border-slate-100 flex items-start space-x-4 relative overflow-hidden"
    >
      {/* Decorative gradient blur in background */}
      <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 blur-xl ${colorClass.bg}`}></div>
      
      <div className={`p-3 rounded-xl ${colorClass.bg} ${colorClass.text} shadow-sm z-10`}>
        <Icon className="w-6 h-6" />
      </div>
      
      <div className="z-10">
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
    </motion.div>
  );
};

/**
 * Dashboard grid for stats
 * 
 * @param {Object} props
 * @param {Object} props.stats - Stats data {totalUploads, processing, completed, failed}
 */
const StatsGrid = ({ stats = { totalUploads: 0, processing: 0, completed: 0, failed: 0 } }) => {
  const cards = [
    {
      title: 'Total Uploads',
      value: stats.totalUploads,
      icon: Upload,
      colorClass: { bg: 'bg-teal-100', text: 'text-teal-600' },
    },
    {
      title: 'Processing',
      value: stats.processing,
      icon: Loader,
      colorClass: { bg: 'bg-amber-100', text: 'text-amber-600' },
    },
    {
      title: 'Completed',
      value: stats.completed,
      icon: CheckCircle,
      colorClass: { bg: 'bg-emerald-100', text: 'text-emerald-600' },
    },
    {
      title: 'Failed',
      value: stats.failed,
      icon: AlertCircle,
      colorClass: { bg: 'bg-red-100', text: 'text-red-600' },
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 w-full">
      {cards.map((card, index) => (
        <StatsCard
          key={card.title}
          title={card.title}
          value={card.value}
          icon={card.icon}
          colorClass={card.colorClass}
          delay={index * 0.1}
        />
      ))}
    </div>
  );
};

export default StatsGrid;
