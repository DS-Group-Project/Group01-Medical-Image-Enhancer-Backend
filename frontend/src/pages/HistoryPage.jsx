import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, LayoutGrid, List as ListIcon, 
  ChevronLeft, ChevronRight, Eye, ArrowDown, Trash2,
  Inbox
} from 'lucide-react';
import { uploadService } from '../services/uploadService';
import { sanitizeSearchQuery } from '../utils/inputSanitizer';
import StatusBadge from '../components/ui/StatusBadge';
import toast from 'react-hot-toast';
import { safeLog } from '../utils/safeLog';

const HistoryPage = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filters = ['All', 'Completed', 'Processing', 'Pending', 'Failed'];

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const response = await uploadService.getJobs();
        // Extract jobs array to prevent crash on non-array responses
        const jobList = Array.isArray(response) ? response : (response.jobs || []);
        jobList.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setJobs(jobList);
      } catch (error) {
        safeLog.error('Failed to load history:', error?.message || error);
        toast.error('Failed to load history');
      } finally {
        setLoading(false);
      }
    };
    fetchJobs();
  }, []);

  // Filter and search logic
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = activeFilter === 'All' || job.status.toLowerCase() === activeFilter.toLowerCase();
    return matchesSearch && matchesFilter;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this record?')) {
      try {
        await uploadService.deleteJob(id);
        setJobs(jobs.filter(j => j.id !== id));
        toast.success('Record deleted successfully');
      } catch (error) {
        safeLog.error('Failed to delete job:', error?.message || error);
        toast.error('Failed to delete record. Please try again.');
      }
    }
  };

  const handleRowClick = (job) => {
    if (job.status === 'completed') {
      navigate(`/viewer/${job.id}`);
    } else {
      navigate(`/processing/${job.id}`);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Enhancement History</h1>
          <p className="text-slate-500">Total {jobs.length} records found</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search files..." 
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(sanitizeSearchQuery(e.target.value));
                setCurrentPage(1);
              }}
              className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 w-full sm:w-64 transition-all bg-white"
            />
          </div>
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <ListIcon size={18} />
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-white shadow-sm text-teal-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex overflow-x-auto pb-4 mb-4 gap-2 no-scrollbar">
        {filters.map(filter => (
          <button
            key={filter}
            onClick={() => {
              setActiveFilter(filter);
              setCurrentPage(1);
            }}
            className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              activeFilter === filter 
                ? 'bg-teal-500 text-white shadow-md shadow-teal-500/20' 
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="h-16 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Inbox className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-2">No records found</h3>
          <p className="text-slate-500 max-w-sm mb-6">
            {searchTerm || activeFilter !== 'All' 
              ? "We couldn't find any jobs matching your current filters."
              : "You haven't enhanced any images yet."}
          </p>
          {(searchTerm || activeFilter !== 'All') ? (
            <button 
              onClick={() => { setSearchTerm(''); setActiveFilter('All'); }}
              className="text-teal-600 font-medium hover:text-teal-700"
            >
              Clear filters
            </button>
          ) : (
            <button 
              onClick={() => navigate('/upload')}
              className="px-6 py-2 bg-teal-500 text-white rounded-xl hover:bg-teal-600 transition-colors font-medium shadow-sm"
            >
              Upload New Image
            </button>
          )}
        </div>
      ) : (
        <>
          {viewMode === 'table' ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-sm text-slate-500 font-medium">
                      <th className="py-4 px-6">File</th>
                      <th className="py-4 px-6">Upload Date</th>
                      <th className="py-4 px-6">Status</th>
                      <th className="py-4 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <motion.tbody 
                    variants={containerVariants}
                    initial="hidden"
                    animate="show"
                    className="divide-y divide-slate-100"
                  >
                    {paginatedJobs.map((job) => (
                      <motion.tr 
                        key={job.id} 
                        variants={itemVariants}
                        className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                        onClick={() => handleRowClick(job)}
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200">
                              {job.thumbnailUrl ? (
                                <img src={job.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-teal-50 flex items-center justify-center text-teal-500 font-bold text-xs">
                                  {job.filename.substring(0,2).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="truncate max-w-[200px] md:max-w-xs font-medium text-slate-800">
                              {job.filename}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-slate-500 text-sm">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6">
                          <StatusBadge status={job.status} />
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleRowClick(job); }}
                              className="p-2 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                              title="View"
                            >
                              <Eye size={18} />
                            </button>
                            {job.status === 'completed' && (
                              <button 
                                onClick={(e) => { e.stopPropagation(); toast.success('Download started'); }}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                                title="Download"
                              >
                                <ArrowDown size={18} />
                              </button>
                            )}
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDelete(job.id); }}
                              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </motion.tbody>
                </table>
              </div>
            </div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {paginatedJobs.map((job) => (
                <motion.div 
                  key={job.id}
                  variants={itemVariants}
                  onClick={() => handleRowClick(job)}
                  className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group flex flex-col h-full"
                >
                  <div className="aspect-video bg-slate-100 relative overflow-hidden">
                    {job.thumbnailUrl ? (
                      <img src={job.thumbnailUrl} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-teal-50 to-indigo-50 flex items-center justify-center">
                        <span className="text-teal-300 font-bold text-4xl opacity-50">{job.filename.substring(0,3).toUpperCase()}</span>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <StatusBadge status={job.status} />
                    </div>
                  </div>
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className="font-semibold text-slate-800 truncate mb-1" title={job.filename}>{job.filename}</h3>
                    <p className="text-xs text-slate-500 mb-4">{new Date(job.createdAt).toLocaleDateString()}</p>
                    
                    <div className="mt-auto flex justify-between items-center border-t border-slate-100 pt-3">
                      <button className="text-sm font-medium text-teal-600 flex items-center gap-1 group-hover:text-teal-700">
                        <Eye size={16} /> View Details
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleDelete(job.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-8 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <span className="text-sm text-slate-500">
                Showing <span className="font-medium text-slate-800">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-medium text-slate-800">{Math.min(currentPage * itemsPerPage, filteredJobs.length)}</span> of <span className="font-medium text-slate-800">{filteredJobs.length}</span> results
              </span>
              <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex gap-1">
                  {[...Array(totalPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === i + 1 
                          ? 'bg-teal-500 text-white' 
                          : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryPage;
