import React from 'react';

const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-sm text-slate-400">
        <div className="mb-2 sm:mb-0">
          &copy; {currentYear} Medical Image Enhancer. All rights reserved.
        </div>
        <div>
          Built with <span className="text-red-500">❤️</span> for better diagnostics
        </div>
      </div>
    </footer>
  );
};

export default Footer;
