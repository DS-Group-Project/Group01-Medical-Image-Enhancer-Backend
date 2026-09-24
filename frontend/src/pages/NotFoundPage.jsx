import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Home } from 'lucide-react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background blobs */}
      <motion.div 
        animate={{ scale: [1, 1.2, 1], rotate: [0, 90, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
        className="absolute -top-40 -left-40 w-96 h-96 bg-teal-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"
      />
      <motion.div 
        animate={{ scale: [1, 1.3, 1], rotate: [0, -90, 0] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="z-10 text-center"
      >
        <h1 className="text-9xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-500 to-indigo-500 mb-4 drop-shadow-sm">
          404
        </h1>
        <h2 className="text-3xl font-bold text-slate-800 mb-4">
          Page Not Found
        </h2>
        <p className="text-slate-600 mb-8 max-w-md mx-auto text-lg">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 hover:text-slate-900 transition-colors font-medium shadow-sm w-full sm:w-auto justify-center"
          >
            <ArrowLeft size={20} />
            Go Back
          </button>
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-teal-500 to-teal-600 text-white hover:from-teal-600 hover:to-teal-700 transition-all font-medium shadow-md shadow-teal-500/30 w-full sm:w-auto justify-center"
          >
            <Home size={20} />
            Go Home
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFoundPage;
