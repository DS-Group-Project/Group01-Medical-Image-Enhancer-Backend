import React, { useEffect } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import Navbar from './Navbar';
import Footer from './Footer';
import { useAuth } from '../../context/AuthContext';

const AppLayout = () => {
  // No fallback here on purpose: if AuthContext is missing or throws, that's
  // a bug that must be visible (crash / redirect), not silently treated as
  // "authenticated". A previous version defaulted to `isAuthenticated: true`
  // in that case, which fails OPEN — i.e. grants access to protected pages
  // precisely when the auth system is broken. This route is already wrapped
  // in <ProtectedRoute> in App.jsx, which is the real gate; this component
  // should never need to guess.
  const { isAuthenticated } = useAuth();

  const location = useLocation();

  // Defense against bfcache replay: if a logged-out user hits the browser
  // Back button, some browsers can restore this page from the back-forward
  // cache (already-rendered DOM, including any images shown) without
  // re-running React or this auth check. `pageshow` with `event.persisted`
  // fires in that case; force a real reload so the auth check (and route
  // guard) actually run again instead of showing stale, possibly sensitive
  // content.
  useEffect(() => {
    const handlePageShow = (event) => {
      if (event.persisted) {
        window.location.reload();
      }
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-teal-100 via-sky-50 to-indigo-100">
      <Navbar />

      <main className="flex-grow pt-20 relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="w-full h-full"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
};

export default AppLayout;
