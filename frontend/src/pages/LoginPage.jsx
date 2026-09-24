import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Mail, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext'; // Assumed path

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(null);
  const navigate = useNavigate();
  const { login } = useAuth();

  // Soft client-side throttle after repeated failures. This is UX only — it
  // slows down a casual retry loop and makes brute-forcing feel unproductive,
  // but it is trivially bypassed by anyone hitting the API directly, so the
  // backend must independently rate-limit /auth/login (e.g. by IP + email,
  // with exponential backoff or an account lockout after N attempts).
  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  const validate = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) {
      const waitSec = Math.ceil((lockedUntil - Date.now()) / 1000);
      toast.error(`Too many attempts. Try again in ${waitSec}s.`);
      return;
    }
    if (!validate()) return;

    setIsLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      setFailedAttempts(0);
      toast.success('Successfully logged in!');
      navigate('/');
    } catch (error) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= 5) {
        setLockedUntil(Date.now() + 30_000);
        setFailedAttempts(0);
        toast.error('Too many failed attempts. Please wait 30 seconds.');
      } else {
        // Intentionally generic — don't reveal whether the email exists.
        toast.error('Invalid email or password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut', staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50/30">
      {/* Decorative blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-[-20%] left-[20%] w-96 h-96 bg-cyan-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md z-10 mx-4"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-teal-500 to-indigo-500 w-full" />
          
          <div className="p-8">
            <motion.div variants={itemVariants} className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-teal-200">
                <Activity className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Medical Image Enhancer</h2>
              <p className="text-slate-500 text-sm">Sign in to your account</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <motion.div variants={itemVariants} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={`block w-full pl-10 pr-3 py-3 border ${errors.email ? 'border-red-300' : 'border-slate-200'} rounded-xl text-slate-900 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors`}
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                )}
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </motion.div>

              <motion.div variants={itemVariants} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  className={`block w-full pl-10 pr-10 py-3 border ${errors.password ? 'border-red-300' : 'border-slate-200'} rounded-xl text-slate-900 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors`}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded cursor-pointer"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-slate-600 cursor-pointer">
                    Remember me
                  </label>
                </div>
                <div className="text-sm">
                  <a href="#" className="font-medium text-teal-600 hover:text-teal-500 transition-colors">
                    Forgot password?
                  </a>
                </div>
              </motion.div>

              <motion.div variants={itemVariants}>
                <button
                  type="submit"
                  disabled={isLoading || isLocked}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Sign In'
                  )}
                </button>
              </motion.div>
            </form>

            <motion.div variants={itemVariants} className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-slate-500">or</span>
                </div>
              </div>

              <div className="mt-6 text-center text-sm">
                <span className="text-slate-600">Don't have an account? </span>
                <Link to="/register" className="font-medium text-teal-600 hover:text-teal-500 transition-colors">
                  Sign up
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
