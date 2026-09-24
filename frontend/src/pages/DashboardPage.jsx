import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Loader2, Image as ImageIcon, CheckCircle, AlertCircle, Clock, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { mockUploadService, mockStats, mockJobs } from '../services/mockData';
import StatusBadge from '../components/ui/StatusBadge';
import { safeLog } from '../utils/safeLog';
import { uploadService } from '../services/uploadService';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export default function DashboardPage() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        if (USE_MOCK) {
          const result = await mockUploadService.getJobs({ limit: 5 });
          setJobs(result.jobs);
          setStats(mockStats);
        } else {
          // Fetch recent jobs and derive stats from them
          const result = await uploadService.getJobs({ limit: 10 });
          const fetchedJobs = result.jobs || [];
          setJobs(fetchedJobs.slice(0, 5));
          setStats({
            totalUploads: fetchedJobs.length,
            processing: fetchedJobs.filter(j => j.status === 'processing').length,
            completed: fetchedJobs.filter(j => j.status === 'completed').length,
            failed: fetchedJobs.filter(j => j.status === 'failed').length,
          });
        }
      } catch (error) {
        safeLog.error('Failed to fetch dashboard data:', error?.message || error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const processingCount = jobs.filter(j => j.status === 'processing').length;
  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  const pageVariants = {
    hidden: { opacity: 1 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.4, staggerChildren: 0.1 }
    }
  };

  const childVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { ease: 'easeOut', duration: 0.5 } }
  };

  const statCards = stats ? [
    { 
      label: 'Total Uploads', 
      value: stats.totalUploads, 
      icon: <ImageIcon size={24} className="text-teal-600" />,
      colorClass: 'bg-teal-50',
      borderColor: 'border-teal-100'
    },
    { 
      label: 'Processing', 
      value: stats.processing, 
      icon: <Loader2 size={24} className="text-amber-600 animate-spin" />,
      colorClass: 'bg-amber-50',
      borderColor: 'border-amber-100'
    },
    { 
      label: 'Completed', 
      value: stats.completed, 
      icon: <CheckCircle size={24} className="text-emerald-600" />,
      colorClass: 'bg-emerald-50',
      borderColor: 'border-emerald-100'
    },
    { 
      label: 'Failed', 
      value: stats.failed, 
      icon: <AlertCircle size={24} className="text-red-500" />,
      colorClass: 'bg-red-50',
      borderColor: 'border-red-100'
    },
  ] : [];

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.div 
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Processing Banner */}
      <AnimatePresence>
        {processingCount > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0, y: -20 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-center text-amber-800 shadow-sm"
          >
            <Loader2 className="w-5 h-5 animate-spin mr-3 text-amber-600" />
            <span className="font-medium text-sm">You have {processingCount} image{processingCount !== 1 ? 's' : ''} currently processing. We'll notify you when they're ready.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Section */}
      <motion.div variants={childVariants} className="flex flex-col md:flex-row md:items-end justify-between">
        <div>
          <p className="text-slate-500 font-medium mb-1">{currentDate}</p>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center">
            Welcome back, {user?.name || 'Doctor'} 
          </h1>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={childVariants}>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="space-y-3">
                    <div className="h-4 w-20 bg-slate-200 rounded"></div>
                    <div className="h-8 w-16 bg-slate-200 rounded"></div>
                  </div>
                  <div className="w-12 h-12 bg-slate-200 rounded-full"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                className={`bg-white p-6 rounded-2xl shadow-sm border ${stat.borderColor} hover:shadow-md transition-shadow cursor-default`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500 font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.colorClass}`}>
                    {stat.icon}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Recent Activity (2/3) */}
        <motion.div variants={childVariants} className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Recent Activity</h3>
              <Link to="/history" className="text-sm text-teal-600 hover:text-teal-700 font-medium flex items-center gap-1 transition-colors">
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 animate-pulse">
                    <div className="w-10 h-10 bg-slate-200 rounded-lg"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-32 bg-slate-200 rounded"></div>
                      <div className="h-3 w-20 bg-slate-200 rounded"></div>
                    </div>
                    <div className="h-6 w-20 bg-slate-200 rounded-full"></div>
                  </div>
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-12">
                <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500 text-sm">No recent activity. Upload your first image!</p>
              </div>
            ) : (
              <div className="space-y-2">
                {jobs.map((job) => (
                  <Link
                    key={job.id}
                    to={job.status === 'completed' ? `/viewer/${job.id}` : `/processing/${job.id}`}
                    className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-xl transition-colors group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600">
                        <ImageIcon size={20} />
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 text-sm group-hover:text-teal-600 transition-colors">{job.filename}</p>
                        <p className="text-xs text-slate-500">{formatDate(job.createdAt)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={job.status} size="sm" />
                      <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Right Column: Quick Upload CTA (1/3) */}
        <motion.div variants={childVariants} className="lg:col-span-1">
          <div className="relative overflow-hidden bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl p-6 text-white h-full shadow-lg flex flex-col justify-between min-h-[280px]">
            {/* Decorative Pattern overlay */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-32 h-32 bg-teal-900 opacity-20 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center mb-4 border border-white/20">
                <UploadCloud className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Ready to enhance?</h3>
              <p className="text-teal-50 text-sm mb-6 max-w-[220px]">
                Upload your X-ray images for AI-powered noise reduction and enhancement.
              </p>
            </div>

            <Link 
              to="/upload" 
              className="relative z-10 w-full bg-white text-teal-700 font-semibold py-3 px-4 rounded-xl text-center hover:bg-slate-50 transition-colors shadow-sm inline-block"
            >
              Upload Now
            </Link>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}
