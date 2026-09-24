import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { UploadCloud, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { validateFileSignatures } from '../../utils/fileValidation';

/**
 * FileUploadZone component for drag and drop file uploads
 * 
 * @param {Object} props
 * @param {Function} props.onFilesSelected - Callback when files are accepted
 * @param {number} props.maxFiles - Maximum number of files allowed (default 10)
 * @param {Object} props.acceptedTypes - Accepted mime types, defaults to { 'image/jpeg': [], 'image/png': [], 'application/dicom': [] }
 * @param {number} props.maxSize - Maximum file size in bytes (default 50MB)
 * @param {boolean} props.disabled - Whether the upload zone is disabled
 */
const FileUploadZone = ({ 
  onFilesSelected, 
  maxFiles = 10, 
  acceptedTypes = {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'application/dicom': ['.dcm']
  }, 
  maxSize = 52428800, // 50MB
  disabled = false 
}) => {
  const [isVerifying, setIsVerifying] = useState(false);

  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    if (!acceptedFiles?.length) return;

    // The dropzone `accept` prop only checks the file extension / reported
    // MIME type, both of which are just metadata a file can be renamed to
    // fake. Re-check the actual file bytes before handing files off, so an
    // obviously mismatched file (e.g. a script renamed to .png) gets caught
    // client-side too. The backend still does its own authoritative check.
    setIsVerifying(true);
    try {
      const { valid, invalid } = await validateFileSignatures(acceptedFiles);
      invalid.forEach(({ reason }) => toast.error(reason));
      if (valid.length > 0 && onFilesSelected) {
        onFilesSelected(valid);
      }
    } finally {
      setIsVerifying(false);
    }
  }, [onFilesSelected]);

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragReject,
    fileRejections
  } = useDropzone({
    onDrop,
    maxFiles,
    accept: acceptedTypes,
    maxSize,
    disabled: disabled || isVerifying
  });

  // Determine styles and content based on state
  let containerClasses = "relative w-full h-64 border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center transition-all duration-300 ";
  let iconColor = "text-slate-400";
  
  if (disabled || isVerifying) {
    containerClasses += "border-slate-300 bg-slate-50 opacity-50 cursor-not-allowed";
  } else if (isDragReject) {
    containerClasses += "border-red-400 bg-red-50";
    iconColor = "text-red-400";
  } else if (isDragActive) {
    containerClasses += "border-teal-400 bg-teal-50 shadow-inner";
    iconColor = "text-teal-500";
  } else {
    containerClasses += "border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-teal-300 cursor-pointer";
  }

  return (
    <motion.div
      {...getRootProps()}
      className={containerClasses}
      animate={{
        scale: isDragActive && !isDragReject ? 1.02 : 1,
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      aria-label="File upload zone"
      role="button"
      tabIndex={disabled ? -1 : 0}
    >
      <input {...getInputProps()} aria-label="File upload input" />
      
      {isDragActive && !isDragReject && (
        <motion.div
          className="absolute inset-0 border-2 border-teal-400 rounded-xl"
          animate={{
            boxShadow: ["0px 0px 0px rgba(20, 184, 166, 0)", "0px 0px 15px rgba(20, 184, 166, 0.4)", "0px 0px 0px rgba(20, 184, 166, 0)"]
          }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
      )}

      <motion.div
        animate={{ y: isDragActive ? -10 : 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 10 }}
        className="mb-4"
      >
        {isDragReject ? (
          <XCircle className={`w-12 h-12 ${iconColor}`} />
        ) : (
          <UploadCloud className={`w-12 h-12 ${iconColor}`} />
        )}
      </motion.div>

      <div className="z-10">
        {isDragReject ? (
          <div>
            <p className="text-red-600 font-semibold text-lg mb-1">File type not accepted</p>
            <p className="text-red-500 text-sm">
              {fileRejections[0]?.errors[0]?.message || 'Please upload valid image files.'}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-slate-700 text-lg font-medium mb-2">
              {isDragActive ? "Drop your files here..." : "Drag & drop your X-ray images here"}
            </p>
            {!isDragActive && (
              <div className="flex items-center justify-center space-x-2 text-sm text-slate-500 mb-4">
                <span className="h-px w-8 bg-slate-300"></span>
                <span>or</span>
                <span className="h-px w-8 bg-slate-300"></span>
              </div>
            )}
            {!isDragActive && (
              <button
                type="button"
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-colors shadow-sm"
                disabled={disabled}
              >
                Browse Files
              </button>
            )}
          </div>
        )}
      </div>

      <p className="absolute bottom-4 text-xs text-slate-400 font-medium">
        Supports JPG, PNG, DICOM &bull; Max {Math.round(maxSize / 1024 / 1024)}MB per file
      </p>
    </motion.div>
  );
};

export default FileUploadZone;
