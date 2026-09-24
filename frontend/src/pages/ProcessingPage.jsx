import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  Cloud, 
  Clock, 
  Cpu, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle,
  Image as ImageIcon
} from 'lucide-react';

import { uploadService } from '../services/uploadService';
import { mockUploadService } from '../services/mockData';
import { usePolling } from '../hooks/usePolling';
import StatusBadge from '../components/ui/StatusBadge';
import { safeLog } from '../utils/safeLog';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const activeService = USE_MOCK ? mockUploadService : uploadService;

const STEPS = [
  { id: 'pending', label: 'Uploaded', icon: CheckCircle, description: 'File received safely' },
  { id: 'queued', label: 'Queued for Processing', icon: Clock, description: 'Waiting for available GPU' },
  { id: 'processing', label: 'AI Enhancement', icon: Cpu, description: 'Applying enhancement algorithms' },
  { id: 'completed', label: 'Complete', icon: CheckCircle2, description: 'Ready for review' }
];

export default function ProcessingPage() {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [jobData, setJobData] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Determine active step index
  const getStepIndex = (status) => {
    switch (status) {
      case 'pending': return 0;
      case 'queued': return 1;
      case 'processing': return 2;
      case 'completed': return 3;
      default: return 0;
    }
  };

  const activeIndex = getStepIndex(currentStatus);

  // Poll logic
  const fetchStatus = async () => {
    try {
      const data = await activeService.getJobStatus(jobId);
      if (!jobData) setJobData(data);
      
      setCurrentStatus(data.status);
      
      if (data.status === 'completed') {
        navigate(`/viewer/${jobId}`);
      }
      
      setError(null);
    } catch (err) {
      safeLog.error('Failed to fetch status', err);
      setError('Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    fetchStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  // Polling hook
  usePolling(
    fetchStatus, 
    3000, 
    currentStatus !== 'completed' && currentStatus !== 'failed' && !error
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
        <div className="w-16 h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin mb-4" />
        <h2 className="text-xl font-medium text-slate-700">Connecting to job...</h2>
      </div>
    );
  }

  if (error || currentStatus === 'failed') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-red-100"
        >
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Processing Failed</h2>
          <p className="text-slate-600 mb-6">{error || 'An error occurred during AI enhancement.'}</p>
          <div className="space-y-3">
            <button
              onClick={() => { setError(null); setCurrentStatus('pending'); fetchStatus(); }}
              className="w-full py-3 bg-slate-900 text-white font-medium rounded-xl hover:bg-slate-800 transition-colors"
            >
              Retry Job
            </button>
            <button
              onClick={() => navigate('/upload')}
              className="w-full py-3 bg-white text-slate-700 border border-slate-200 font-medium rounded-xl hover:bg-slate-50 transition-colors"
            >
              Upload New Image
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const isCompleted = currentStatus === 'completed';

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-50 pt-24 pb-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-2">
            Processing Your Image
          </h1>
          <p className="text-slate-500 flex items-center justify-center gap-2">
            <ImageIcon className="w-4 h-4" />
            {jobData?.filename || 'Unknown File'}
            <span className="text-slate-300">•</span>
            ID: {jobId}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Status Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 pb-6 border-b border-slate-100 gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Current Status</h3>
                  <p className="text-sm text-slate-500">
                    Started at: {jobData ? new Date(jobData.timestamp).toLocaleTimeString() : '--'}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Time Remaining</p>
                    <p className="text-sm font-medium text-slate-700">
                      {isCompleted ? 'Finished' : currentStatus === 'processing' ? '~15 seconds' : 'Calculating...'}
                    </p>
                  </div>
                  <StatusBadge status={currentStatus} />
                </div>
              </div>

              {/* Stepper */}
              <div className="relative">
                <div className="absolute left-[27px] sm:left-auto sm:top-[27px] sm:w-full sm:h-auto h-full w-0.5 sm:border-t-2 border-l-2 sm:border-l-0 border-slate-200 -z-10" />
                
                <div className="flex flex-col sm:flex-row justify-between gap-6 sm:gap-0">
                  {STEPS.map((step, index) => {
                    const isActive = index === activeIndex;
                    const isPast = index < activeIndex;
                    const Icon = step.icon;

                    let circleColor = 'bg-white border-slate-300 text-slate-400';
                    if (isPast || isCompleted) circleColor = 'bg-teal-500 border-teal-500 text-white';
                    else if (isActive) circleColor = 'bg-white border-teal-500 text-teal-600 ring-4 ring-teal-50';

                    return (
                      <div key={step.id} className="flex sm:flex-col items-center sm:w-1/5 relative">
                        {/* Connecting Line active state */}
                        {(isPast || (isCompleted && index < STEPS.length - 1)) && (
                          <div className="hidden sm:block absolute top-[27px] left-1/2 w-full h-0.5 bg-gradient-to-r from-teal-500 to-indigo-500 -z-10" />
                        )}

                        <div className={`
                          w-14 h-14 rounded-full border-2 flex items-center justify-center bg-white z-10 transition-colors duration-300
                          ${circleColor}
                          ${isActive && !isCompleted ? 'shadow-[0_0_15px_rgba(20,184,166,0.3)]' : ''}
                        `}>
                          <Icon className={`w-6 h-6 ${isActive && !isCompleted && step.id === 'processing' ? 'animate-pulse' : ''}`} />
                        </div>
                        
                        <div className="ml-4 sm:ml-0 sm:mt-4 text-left sm:text-center">
                          <p className={`font-medium text-sm ${isPast || isActive ? 'text-slate-900' : 'text-slate-500'}`}>
                            {step.label}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 hidden sm:block px-2">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Completion View */}
            {isCompleted && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-teal-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-center text-white relative overflow-hidden"
              >
                {/* Decorative sparkles */}
                <Sparkles className="absolute top-4 left-4 text-white/20 w-8 h-8" />
                <Sparkles className="absolute bottom-4 right-4 text-white/20 w-12 h-12" />
                <Sparkles className="absolute top-8 right-12 text-white/10 w-6 h-6" />

                <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                  <CheckCircle2 className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Enhancement Complete!</h2>
                <p className="text-white/80 mb-8 max-w-md mx-auto">
                  Your image has been successfully processed using our AI model. The results are ready to be reviewed.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
                  <button
                    onClick={() => navigate(`/viewer/${jobId}`)}
                    className="w-full sm:w-auto px-8 py-3 bg-white text-slate-900 font-bold rounded-xl shadow-md hover:bg-slate-50 transition-colors"
                  >
                    View Results
                  </button>
                  <button
                    onClick={() => navigate('/upload')}
                    className="w-full sm:w-auto px-8 py-3 bg-white/10 border border-white/20 text-white font-medium rounded-xl hover:bg-white/20 transition-colors backdrop-blur-sm"
                  >
                    Upload Another
                  </button>
                </div>
              </motion.div>
            )}

          </div>

          {/* Sidebar Area */}
          <div className="space-y-6">
            
            {/* Animated Progress Ring Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center min-h-[250px]">
              <div className="relative w-40 h-40">
                {/* Background Ring */}
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth="8"
                  />
                  {/* Progress Ring */}
                  <motion.circle
                    cx="50" cy="50" r="45"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 283" }}
                    animate={{ 
                      strokeDasharray: `${(activeIndex / (STEPS.length - 1)) * 283} 283`
                    }}
                    transition={{ duration: 0.8, ease: "easeInOut" }}
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0D9488" />
                      <stop offset="100%" stopColor="#6366F1" />
                    </linearGradient>
                  </defs>
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-slate-800">
                    {Math.round((activeIndex / (STEPS.length - 1)) * 100)}%
                  </span>
                </div>
              </div>
              <p className="mt-4 text-sm font-medium text-slate-500 uppercase tracking-widest">
                Overall Progress
              </p>
            </div>

            {/* Original Image Preview Box */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-semibold text-slate-700">Source Image</h3>
              </div>
              <div className="aspect-square bg-slate-100 flex items-center justify-center p-8 relative group">
                <ImageIcon className="w-16 h-16 text-slate-300" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <p className="text-white text-sm font-medium">Preview available in viewer</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </motion.div>
  );
}
