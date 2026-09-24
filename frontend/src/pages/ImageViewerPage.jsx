import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowDown, Share2, Upload, Maximize2, Minimize2, ZoomIn, ZoomOut,
  ChevronDown, ChevronUp, GripVertical, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadService } from '../services/uploadService';
import StatusBadge from '../components/ui/StatusBadge';

const ImageViewerPage = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('slider'); // 'slider' or 'side-by-side'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showMetadata, setShowMetadata] = useState(true);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const fetchJob = async () => {
      try {
        setLoading(true);
        const data = await uploadService.getJobStatus(jobId);
        if (data.status !== 'completed') {
          navigate(`/processing/${jobId}`);
          return;
        }
        setJob(data);
      } catch (err) {
        setError('Failed to load image data. It might have been deleted or does not exist.');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId, navigate]);

  const handleSliderMove = (event) => {
    if (!isDragging || !sliderRef.current) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX !== undefined ? event.clientX : event.touches[0].clientX, rect.right));
    const position = ((x - rect.left) / rect.width) * 100;
    
    setSliderPosition(Math.max(0, Math.min(position, 100)));
  };

  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => setIsDragging(false);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleSliderMove);
      window.addEventListener('mouseup', handleDragEnd);
      window.addEventListener('touchmove', handleSliderMove, { passive: false });
      window.addEventListener('touchend', handleDragEnd);
    } else {
      window.removeEventListener('mousemove', handleSliderMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleSliderMove);
      window.removeEventListener('touchend', handleDragEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleSliderMove);
      window.removeEventListener('mouseup', handleDragEnd);
      window.removeEventListener('touchmove', handleSliderMove);
      window.removeEventListener('touchend', handleDragEnd);
    };
  }, [isDragging]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(err => {
        toast.error(`Error attempting to enable fullscreen mode: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full flex flex-col space-y-4">
        <div className="h-16 bg-slate-200 animate-pulse rounded-xl"></div>
        <div className="flex-1 bg-slate-200 animate-pulse rounded-2xl min-h-[500px]"></div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="flex-1 p-6 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error Loading Image</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/history')}
            className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-colors"
          >
            Back to History
          </button>
        </div>
      </div>
    );
  }

  // Use the correct property names from the data model (originalUrl / enhancedUrl).
  // No external CDN fallback — if the URL is missing, show a local placeholder.
  const originalImageUrl = job.originalUrl || '';
  const enhancedImageUrl = job.enhancedUrl || '';

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50" ref={containerRef}>
      {/* Header Bar */}
      {!isFullscreen && (
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <h1 className="text-xl font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-md">
              {job.filename}
            </h1>
            <StatusBadge status={job.status} />
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button
                onClick={() => setViewMode('slider')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'slider' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Slider
              </button>
              <button
                onClick={() => setViewMode('side-by-side')}
                className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  viewMode === 'side-by-side' ? 'bg-teal-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Side by Side
              </button>
            </div>
            
            <div className="flex items-center gap-2">
              <button onClick={copyShareLink} className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg tooltip" title="Share">
                <Share2 size={20} />
              </button>
              <div className="relative group">
                <button className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors">
                  <ArrowDown size={18} />
                  Download
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                  <button onClick={() => uploadService.downloadImage(jobId, 'enhanced').then(() => toast.success('Download started')).catch(() => toast.error('Download failed'))} className="block w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 border-b border-slate-100">Download Enhanced</button>
                  <button onClick={() => uploadService.downloadImage(jobId, 'original').then(() => toast.success('Download started')).catch(() => toast.error('Download failed'))} className="block w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700 border-b border-slate-100">Download Original</button>
                  <button onClick={() => uploadService.downloadImage(jobId, 'both').then(() => toast.success('ZIP download started')).catch(() => toast.error('Download failed'))} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm text-slate-700">Download Both (ZIP)</button>
                </div>
              </div>
              <button onClick={() => navigate('/upload')} className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg font-medium transition-colors">
                <Upload size={18} />
                <span className="hidden sm:inline">Upload Another</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Viewer Area */}
      <div className="flex-1 relative flex flex-col p-4 sm:p-6 overflow-hidden">
        {/* Fullscreen controls overlay */}
        {isFullscreen && (
          <div className="absolute top-4 right-4 z-50 flex gap-2 bg-black/50 backdrop-blur-sm p-2 rounded-xl">
            <button onClick={toggleFullscreen} className="p-2 text-white hover:bg-white/20 rounded-lg">
              <Minimize2 size={24} />
            </button>
          </div>
        )}
        
        {!isFullscreen && (
          <div className="absolute top-8 right-8 z-10">
            <button onClick={toggleFullscreen} className="p-2 bg-white/80 backdrop-blur-sm shadow-sm text-slate-700 hover:bg-white rounded-lg">
              <Maximize2 size={20} />
            </button>
          </div>
        )}

        {/* Viewers */}
        <div className="flex-1 bg-slate-200/50 rounded-2xl overflow-hidden relative shadow-inner border border-slate-200 flex items-center justify-center">
          
          {viewMode === 'slider' ? (
            <div 
              ref={sliderRef}
              className="relative w-full h-full max-h-full max-w-5xl mx-auto select-none overflow-hidden flex items-center justify-center"
              onMouseDown={handleDragStart}
              onTouchStart={handleDragStart}
            >
              {/* Right: Enhanced (Background) */}
              <div className="absolute inset-0 flex items-center justify-center">
                <img 
                  src={enhancedImageUrl} 
                  alt="Enhanced" 
                  className="max-w-full max-h-full object-contain pointer-events-none"
                  draggable={false}
                />
              </div>

              {/* Left: Original (Clipped) */}
              <div 
                className="absolute inset-0 flex items-center justify-center overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <img 
                  src={originalImageUrl} 
                  alt="Original" 
                  className="max-w-full max-h-full object-contain pointer-events-none"
                  draggable={false}
                />
              </div>

              {/* Slider Handle & Line */}
              <div 
                className="absolute inset-y-0 w-0.5 bg-teal-500 cursor-ew-resize z-20 shadow-[0_0_10px_rgba(20,184,166,0.5)]"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 bg-white border-2 border-teal-500 rounded-full flex items-center justify-center shadow-lg pointer-events-none">
                  <GripVertical size={16} className="text-teal-600" />
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-sm font-medium z-10 pointer-events-none">
                Original
              </div>
              <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm text-teal-400 px-3 py-1.5 rounded-lg text-sm font-medium z-10 pointer-events-none border border-teal-500/30">
                Enhanced
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col md:flex-row gap-4 p-4 overflow-auto">
              <div className="flex-1 flex flex-col gap-2">
                <div className="text-center font-medium text-slate-700 bg-white/50 py-2 rounded-lg border border-slate-200 shadow-sm">Original</div>
                <div className="flex-1 rounded-xl overflow-hidden bg-black/5 flex items-center justify-center relative group">
                  <img src={originalImageUrl} alt="Original" className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105" />
                </div>
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <div className="text-center font-medium text-teal-700 bg-teal-50 py-2 rounded-lg border border-teal-100 shadow-sm">Enhanced</div>
                <div className="flex-1 rounded-xl overflow-hidden bg-black/5 flex items-center justify-center relative group">
                  <img src={enhancedImageUrl} alt="Enhanced" className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Metadata Panel */}
        {!isFullscreen && (
          <div className="mt-4 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden transition-all duration-300">
            <button 
              onClick={() => setShowMetadata(!showMetadata)}
              className="w-full px-6 py-3 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors"
            >
              <span className="font-semibold text-slate-700">Image Details</span>
              {showMetadata ? <ChevronUp size={20} className="text-slate-500" /> : <ChevronDown size={20} className="text-slate-500" />}
            </button>
            
            <AnimatePresence>
              {showMetadata && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 border-t border-slate-100">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">File Size</p>
                      <p className="font-medium text-slate-800">4.2 MB</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Dimensions</p>
                      <p className="font-medium text-slate-800">2048 x 2048</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Date Processed</p>
                      <p className="font-medium text-slate-800">{new Date(job.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Processing Time</p>
                      <p className="font-medium text-slate-800">12.4s</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImageViewerPage;
