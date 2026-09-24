import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, Mail, Lock, User, Eye, EyeOff, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();
  const { register } = useAuth();

  // Password strength calculation
  useEffect(() => {
    let strength = 0;
    const { password } = formData;
    if (password.length > 5) strength += 1;
    if (password.length > 7) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(Math.min(4, strength));
  }, [formData.password]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (passwordStrength < 2) {
      newErrors.password = 'Password is too weak — mix in numbers, symbols, or uppercase letters';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!agreed) {
      newErrors.agreed = 'You must agree to the Terms of Service';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsLoading(true);
    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      });
      toast.success('Account created successfully!');
      navigate('/');
    } catch (error) {
      toast.error('Registration failed. Please try again.');
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

  const getStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-slate-200';
    if (passwordStrength <= 2) return 'bg-red-400';
    if (passwordStrength === 3) return 'bg-yellow-400';
    return 'bg-green-500';
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-teal-50/30 py-12">
      {/* Decorative blobs */}
      <div className="absolute top-[10%] right-[10%] w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute bottom-[10%] left-[10%] w-96 h-96 bg-indigo-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

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
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Create an account</h2>
              <p className="text-slate-500 text-sm">Join Medical Image Enhancer</p>
            </motion.div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <motion.div variants={itemVariants} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  name="name"
                  type="text"
                  autoComplete="name"
                  className={`block w-full pl-10 pr-3 py-3 border ${errors.name ? 'border-red-300' : 'border-slate-200'} rounded-xl text-slate-900 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors`}
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </motion.div>

              <motion.div variants={itemVariants} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="h-5 w-5" />
                </div>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  className={`block w-full pl-10 pr-3 py-3 border ${errors.email ? 'border-red-300' : 'border-slate-200'} rounded-xl text-slate-900 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors`}
                  placeholder="Email address"
                  value={formData.email}
                  onChange={handleChange}
                />
                {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email}</p>}
              </motion.div>

              <motion.div variants={itemVariants}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className={`block w-full pl-10 pr-10 py-3 border ${errors.password ? 'border-red-300' : 'border-slate-200'} rounded-xl text-slate-900 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors`}
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {/* Password strength indicator */}
                {formData.password.length > 0 && (
                  <div className="mt-2 flex space-x-1 h-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`flex-1 rounded-full ${level <= passwordStrength ? getStrengthColor() : 'bg-slate-200'} transition-colors duration-300`}
                      />
                    ))}
                  </div>
                )}
                {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
              </motion.div>

              <motion.div variants={itemVariants} className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  name="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  className={`block w-full pl-10 pr-3 py-3 border ${errors.confirmPassword ? 'border-red-300' : 'border-slate-200'} rounded-xl text-slate-900 bg-slate-50 hover:bg-slate-100/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors`}
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
                {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword}</p>}
              </motion.div>

              <motion.div variants={itemVariants} className="flex flex-col">
                <div className="flex items-start">
                  <input
                    id="terms"
                    type="checkbox"
                    className="mt-1 h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded cursor-pointer"
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                  />
                  <label htmlFor="terms" className="ml-2 block text-sm text-slate-600 cursor-pointer">
                    I agree to the <span className="text-teal-600 hover:underline">Terms of Service</span> and <span className="text-teal-600 hover:underline">Privacy Policy</span>
                  </label>
                </div>
                {errors.agreed && <p className="mt-1 text-xs text-red-500">{errors.agreed}</p>}
              </motion.div>

              <motion.div variants={itemVariants}>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    'Create Account'
                  )}
                </button>
              </motion.div>
            </form>

            <motion.div variants={itemVariants} className="mt-6 text-center text-sm">
              <span className="text-slate-600">Already have an account? </span>
              <Link to="/login" className="font-medium text-teal-600 hover:text-teal-500 transition-colors">
                Sign in
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
