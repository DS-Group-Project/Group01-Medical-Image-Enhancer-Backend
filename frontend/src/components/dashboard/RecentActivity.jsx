import React from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, FileImage, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const StatusBadge = ({ status }) => {
  const config = {
    completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle },
    processing: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Loader2 },
    failed: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: AlertCircle },
  };

  const current = config[status] || config.processing;
  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${current.bg} ${current.text} ${current.border}`}>
      <Icon className={`w-3 h-3 mr-1 ${status === 'processing' ? 'animate-spin' : ''}`} />
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
};

/**
 * RecentActivity component showing latest jobs
 * 
 * @param {Object} props
 * @param {Array} props.jobs - Array of job objects { id, filename, status, createdAt, thumbnail }
 */
const RecentActivity = ({ jobs = [] }) => {
  const navigate = useNavigate();

  const handleRowClick = (job) => {
    if (job.status === 'completed') {
      navigate(`/viewer/${job.id}`);
    } else {
      navigate(`/status/${job.id}`);
    }
  };

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
      <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
        <Link to="/history" className="text-sm font-medium text-teal-600 hover:text-teal-700 transition-colors">
          View All
        </Link>
      </div>

      <div className="p-0">
        {jobs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <FileImage className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p>No recent activity found.</p>
            <Link to="/upload" className="text-teal-600 font-medium hover:underline mt-2 inline-block">
              Upload your first image
            </Link>
          </div>
        ) : (
          <motion.ul 
            variants={container}
            initial="hidden"
            animate="show"
            className="divide-y divide-slate-100"
          >
            {jobs.slice(0, 5).map((job) => (
              <motion.li 
                key={job.id} 
                variants={item}
                onClick={() => handleRowClick(job)}
                className="hover:bg-slate-50 transition-colors cursor-pointer"
              >
                <div className="px-6 py-4 flex items-center">
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center mr-4">
                    {job.thumbnail ? (
                      <img src={job.thumbnail} alt={job.filename} className="w-full h-full object-cover" />
                    ) : (
                      <FileImage className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-4">
                    <p className="text-sm font-medium text-slate-900 truncate" title={job.filename}>
                      {job.filename}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {formatDate(job.createdAt)}
                    </p>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <StatusBadge status={job.status} />
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-teal-500 transition-colors hidden sm:block" />
                  </div>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
