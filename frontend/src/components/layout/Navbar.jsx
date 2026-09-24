import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, LayoutDashboard, Upload, Clock, User, Settings, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Navbar = () => {
  // No fallback: if this ever renders outside AuthProvider, that's a real
  // bug that should surface loudly. The previous fallback silently swapped
  // in a fake user and a logout button that only did `console.log('logout')`
  // — meaning if that path were ever hit, a user clicking "Logout" would see
  // the UI behave as if they logged out while their session stayed live.
  const { user, logout } = useAuth();
  
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Upload', path: '/upload', icon: Upload },
    { name: 'History', path: '/history', icon: Clock },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : 'U';
  };

  return (
    <nav className="fixed top-0 w-full bg-white/30 backdrop-blur-md border-b-3 border-white/90 shadow-sm z-50 h-20 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-teal-500 to-teal-400 flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-indigo-600 hidden sm:block">
              Medical Image Enhancer
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex space-x-1 h-full">
            {navLinks.map((link) => {
              const isActive = link.path === '/' ? location.pathname === '/' : location.pathname.startsWith(link.path);
              const Icon = link.icon;
              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`relative flex items-center px-4 h-full space-x-2 text-sm font-medium transition-colors ${
                    isActive ? 'text-teal-600' : 'text-slate-600 hover:text-teal-500'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                  {isActive && (
                    <motion.div
                      layoutId="navbar-indicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-teal-600"
                      initial={false}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </div>

          {/* User Section & Mobile Toggle */}
          <div className="flex items-center space-x-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-2 focus:outline-none"
              >
                <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center border border-indigo-200 text-indigo-700 font-semibold text-sm">
                  {getInitials(user?.name)}
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:block">
                  {user?.name || 'User'}
                </span>
              </button>

              <AnimatePresence>
                {isProfileDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1"
                  >
                    <Link to="/profile" className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setIsProfileDropdownOpen(false)}>
                      <User className="w-4 h-4 mr-3 text-slate-400" /> Profile
                    </Link>
                    <Link to="/settings" className="flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors" onClick={() => setIsProfileDropdownOpen(false)}>
                      <Settings className="w-4 h-4 mr-3 text-slate-400" /> Settings
                    </Link>
                    <div className="h-px bg-slate-100 my-1"></div>
                    <button
                      onClick={() => {
                        setIsProfileDropdownOpen(false);
                        logout();
                      }}
                      className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="w-4 h-4 mr-3 text-red-400" /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-teal-600 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Panel */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-b border-slate-200 overflow-hidden shadow-md"
          >
            <div className="px-4 pt-2 pb-4 space-y-1">
              {navLinks.map((link) => {
                const isActive = location.pathname.startsWith(link.path);
                const Icon = link.icon;
                return (
                  <Link
                    key={link.name}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-3 py-3 rounded-md text-base font-medium transition-colors ${
                      isActive ? 'bg-teal-50 text-teal-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
