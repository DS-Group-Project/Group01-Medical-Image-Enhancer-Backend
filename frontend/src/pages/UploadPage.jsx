import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { 
  UploadCloud, 
  X, 
  FileImage, 
  Trash2, 
  Loader2, 
  CheckCircle, 
  Sparkles,
  AlertCircle
} from 'lucide-react';

import FileUploadZone from '../components/upload/FileUploadZone';
import FilePreviewCard from '../components/upload/FilePreviewCard';
import { formatFileSize } from '../utils/helpers';
import { sanitizeFilename } from '../utils/fileValidation';
import { uploadService } from '../services/uploadService';
import { mockUploadService } from '../services/mockData';
import { safeLog } from '../utils/safeLog';

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';
const activeUploadService = USE_MOCK ? mockUploadService : uploadService;

export default function UploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [jobIds, setJobIds] = useState([]);

  const onFilesSelected = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles && rejectedFiles.length > 0) {
      toast.error('Some files were rejected. Please check file type and size.');
    }
    
    setFiles(prev => {
      const newFiles = [...prev];
      acceptedFiles.forEach(file => {
        // Sanitize file name before adding
        const safeName = sanitizeFilename(file.name);
        if (!newFiles.some(f => f.name === file.name && f.size === file.size)) {
          newFiles.push(file);
        }
      });
      return newFiles;
    });
  }, []);

  const removeFile = (fileToRemove) => {
    setFiles(files.filter(file => file !== fileToRemove));
  };

  const clearAll = () => {
    setFiles([]);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const response = await activeUploadService.uploadImages(files, (progress) => {
        setUploadProgress(progress);
      });

      // Extract jobs properly from response
      setJobIds(response.jobs);
      setUploadComplete(true);
      toast.success('Images uploaded successfully!');
    } catch (error) {
      // Secure logging for errors
      safeLog.error('Upload failed', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const totalSize = files.reduce((acc, file) => acc + file.size, 0);

  return (
    <motion.div 
      initial={{ opacity: 1, y: 0 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-indigo-600">
              Upload X-Ray Images
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Upload your medical images for AI-powered enhancement. Fast, secure, and accurate.
          </p>
        </div>

        {uploadComplete ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100"
          >
            <div className="mx-auto w-20 h-20 bg-teal-100 text-teal-600 rounded-full flex items-center justify-center mb-6">
              <Sparkles className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Upload Complete!</h2>
            <p className="text-slate-600 mb-8">
              Your {files.length} image{files.length > 1 ? 's have' : ' has'} been queued for enhancement.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => navigate(`/processing/${jobIds[0]?.id || jobIds[0]}`)}
                className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-teal-600 to-indigo-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
              >
                View Progress
              </button>
              <button
                onClick={() => {
                  setFiles([]);
                  setUploadComplete(false);
                  setUploadProgress(0);
                }}
                className="w-full sm:w-auto px-8 py-3 bg-white border-2 border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition-colors"
              >
                Upload More
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            {/* Upload Zone */}
            <FileUploadZone onFilesSelected={onFilesSelected} isUploading={isUploading} />

            {/* Selected Files Section */}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between px-2">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                      Selected Files
                      <span className="bg-teal-100 text-teal-800 text-xs py-0.5 px-2 rounded-full">
                        {files.length}
                      </span>
                    </h2>
                    <button
                      onClick={clearAll}
                      disabled={isUploading}
                      className="text-sm font-medium text-slate-500 hover:text-red-600 transition-colors disabled:opacity-50"
                    >
                      Clear All
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                      {files.map((file, index) => (
                        <FilePreviewCard
                          key={`${file.name}-${index}`}
                          file={file}
                          onRemove={removeFile}
                          isUploading={isUploading}
                          progress={uploadProgress}
                        />
                      ))}
                    </AnimatePresence>
                  </div>

                  {/* Upload Summary Bar */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="sticky bottom-4 mt-8 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 text-slate-600">
                      <div className="bg-slate-100 p-2 rounded-lg">
                        <FileImage className="w-5 h-5 text-slate-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{files.length} Files Ready</p>
                        <p className="text-sm">Total size: {formatFileSize(totalSize)}</p>
                      </div>
                    </div>

                    <div className="flex items-center w-full sm:w-auto gap-3">
                      <button
                        onClick={clearAll}
                        disabled={isUploading}
                        className="flex-1 sm:flex-none px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl font-medium transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="flex-1 sm:flex-none relative overflow-hidden px-8 py-2.5 bg-gradient-to-r from-teal-600 to-indigo-600 text-white rounded-xl font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-75 disabled:cursor-not-allowed group"
                      >
                        <span className={`flex items-center justify-center gap-2 ${isUploading ? 'opacity-0' : 'opacity-100'}`}>
                          <UploadCloud className="w-5 h-5" />
                          Upload & Enhance
                        </span>
                        
                        {isUploading && (
                          <div className="absolute inset-0 flex items-center justify-center gap-2">
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>{uploadProgress}%</span>
                          </div>
                        )}
                        
                        {/* Overall Progress Bar Background */}
                        {isUploading && (
                          <div 
                            className="absolute left-0 bottom-0 h-full bg-black/10 transition-all duration-300"
                            style={{ width: `${uploadProgress}%` }}
                          />
                        )}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>
    </motion.div>
  );
}
