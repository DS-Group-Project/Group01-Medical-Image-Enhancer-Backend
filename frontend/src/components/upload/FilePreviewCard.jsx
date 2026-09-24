import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Loader2, FileImage } from 'lucide-react';

/**
 * FilePreviewCard component to show file information and upload status
 * 
 * @param {Object} props
 * @param {File} props.file - The File object
 * @param {Function} props.onRemove - Callback to remove this file
 * @param {number} props.uploadProgress - Upload progress percentage (0-100)
 * @param {string} props.status - Status: 'pending', 'uploading', 'success', 'error'
 */
const FilePreviewCard = ({ file, onRemove, uploadProgress = 0, status = 'pending' }) => {
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    // Generate object URL for image previews
    if (file && file.type.startsWith('image/')) {
      const objectUrl = URL.createObjectURL(file);
      setPreview(objectUrl);
      
      // Cleanup
      return () => URL.revokeObjectURL(objectUrl);
    }
  }, [file]);

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const truncateFilename = (name, maxLength = 20) => {
    if (name.length <= maxLength) return name;
    const extIndex = name.lastIndexOf('.');
    if (extIndex === -1) return name.substring(0, maxLength) + '...';
    
    const ext = name.substring(extIndex);
    const basename = name.substring(0, extIndex);
    return basename.substring(0, maxLength - ext.length - 3) + '...' + ext;
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.2 }}
      className="relative flex items-center p-3 bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
    >
      {/* Thumbnail */}
      <div className="flex-shrink-0 w-12 h-12 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center mr-4 border border-slate-200">
        {preview ? (
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
        ) : (
          <FileImage className="w-6 h-6 text-slate-400" />
        )}
      </div>

      {/* Info */}
      <div className="flex-grow min-w-0 pr-10">
        <div className="flex justify-between items-center mb-1">
          <p className="text-sm font-semibold text-slate-700 truncate" title={file.name}>
            {truncateFilename(file.name)}
          </p>
          <span className="text-xs text-slate-400 font-medium whitespace-nowrap ml-2">
            {formatFileSize(file.size)}
          </span>
        </div>
        
        {/* Progress Bar Container */}
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex items-center">
          {(status === 'uploading' || status === 'success') && (
            <motion.div
              className={`h-full rounded-full ${status === 'success' ? 'bg-emerald-500' : 'bg-gradient-to-r from-teal-400 to-teal-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${uploadProgress}%` }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            />
          )}
          {status === 'error' && <div className="h-full w-full bg-red-400 rounded-full" />}
        </div>
        
        {/* Status Text */}
        <div className="mt-1 flex items-center">
          {status === 'uploading' && (
            <p className="text-[10px] text-teal-600 font-medium">Uploading {uploadProgress}%</p>
          )}
          {status === 'success' && (
            <p className="text-[10px] text-emerald-600 font-medium">Complete</p>
          )}
          {status === 'error' && (
            <p className="text-[10px] text-red-600 font-medium">Upload failed</p>
          )}
        </div>
      </div>

      {/* Actions / Status Indicators */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-2">
        {status === 'uploading' && <Loader2 className="w-4 h-4 text-teal-500 animate-spin" />}
        {status === 'success' && <CheckCircle className="w-5 h-5 text-emerald-500" />}
        {status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
        
        {(status === 'pending' || status === 'error') && (
          <button
            onClick={() => onRemove(file)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-slate-400 opacity-0 group-hover:opacity-100 sm:opacity-100"
            aria-label="Remove file"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default FilePreviewCard;
