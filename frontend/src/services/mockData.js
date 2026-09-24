/**
 * Mock Data and Services for local development and testing without a backend.
 */

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// SECURITY: No external CDN URLs in mock data. In a medical/healthcare app,
// loading images from third-party services (picsum.photos, pravatar.cc) leaks
// network requests that could be logged, and violates the app's CSP policy.
// Use null — the UI components handle missing URLs with local placeholders.
export const mockUser = {
  id: 'usr_001',
  name: 'Dr. Jane Smith',
  email: 'jane.smith@medical.example.com',
  avatar: null,
  role: 'radiologist'
};

const getDaysAgo = (days) => {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
};

export const mockJobs = [
  { id: 'job_001', status: 'completed', filename: 'chest_xray_001.jpg', createdAt: getDaysAgo(0), completedAt: getDaysAgo(0), originalUrl: null, enhancedUrl: null },
  { id: 'job_002', status: 'processing', filename: 'brain_mri_ax.png', createdAt: getDaysAgo(0), progress: 45, originalUrl: null },
  { id: 'job_003', status: 'completed', filename: 'knee_xr_lat.jpg', createdAt: getDaysAgo(1), completedAt: getDaysAgo(1), originalUrl: null, enhancedUrl: null },
  { id: 'job_004', status: 'pending', filename: 'spine_ct_03.dcm', createdAt: getDaysAgo(1), originalUrl: null },
  { id: 'job_005', status: 'failed', filename: 'corrupted_file.jpg', createdAt: getDaysAgo(2), error: 'Invalid image format or corrupted data', originalUrl: null },
  { id: 'job_006', status: 'completed', filename: 'dental_panoramic.png', createdAt: getDaysAgo(2), completedAt: getDaysAgo(2), originalUrl: null, enhancedUrl: null },
  { id: 'job_007', status: 'completed', filename: 'hand_xray_AP.jpg', createdAt: getDaysAgo(3), completedAt: getDaysAgo(3), originalUrl: null, enhancedUrl: null },
  { id: 'job_008', status: 'completed', filename: 'chest_CT_coronal.png', createdAt: getDaysAgo(3), completedAt: getDaysAgo(3), originalUrl: null, enhancedUrl: null },
  { id: 'job_009', status: 'processing', filename: 'pelvis_mri_t2.dcm', createdAt: getDaysAgo(4), progress: 85, originalUrl: null },
  { id: 'job_010', status: 'completed', filename: 'skull_xray_lat.jpg', createdAt: getDaysAgo(5), completedAt: getDaysAgo(5), originalUrl: null, enhancedUrl: null },
  { id: 'job_011', status: 'completed', filename: 'shoulder_mri.png', createdAt: getDaysAgo(6), completedAt: getDaysAgo(6), originalUrl: null, enhancedUrl: null },
  { id: 'job_012', status: 'completed', filename: 'abd_ultrasound.jpg', createdAt: getDaysAgo(7), completedAt: getDaysAgo(7), originalUrl: null, enhancedUrl: null },
];

export const mockStats = {
  totalUploads: 147,
  processing: 3,
  completed: 138,
  failed: 6
};

/**
 * Mock auth session state.
 *
 * Deliberately kept in memory (module-level variable) rather than in
 * localStorage/sessionStorage. The real backend will use an HttpOnly cookie
 * that JS cannot read, so the mock should not simulate "logged in" via any
 * JS-readable storage either — that would make the mock's security shape
 * misleading and mask bugs (e.g. code that accidentally reads a client-side
 * token) before they hit the real backend. A page refresh resetting the
 * mock session is expected and mirrors calling getCurrentUser() against a
 * real server after a cookie expires.
 */
let mockSessionActive = false;

export const mockAuthService = {
  login: async (email, password) => {
    await delay(600);
    if (!email || !password) {
      throw { response: { status: 400, data: { message: 'Email and password are required' } } };
    }
    // NOTE: this mock intentionally does not "validate" credentials against a
    // real user store because there isn't one yet — any non-empty email and
    // password 'succeeds', matching how most people wire up mocks before the
    // backend exists. Don't carry this permissiveness into the real authService.
    mockSessionActive = true;
    return { user: mockUser };
  },
  register: async (userData) => {
    await delay(800);
    mockSessionActive = true;
    return { user: { ...mockUser, name: userData.name, email: userData.email } };
  },
  logout: async () => {
    await delay(300);
    mockSessionActive = false;
  },
  getCurrentUser: async () => {
    await delay(400);
    if (!mockSessionActive) {
      throw { response: { status: 401, data: { message: 'Unauthorized' } } };
    }
    return { user: mockUser };
  },
};

export const mockUploadService = {
  uploadImages: async (files, onProgress) => {
    // Simulate upload progress
    if (onProgress) {
      for (let i = 10; i <= 100; i += 10) {
        await delay(100);
        onProgress(i);
      }
    } else {
      await delay(1000);
    }
    const newJobs = files.map((file, idx) => ({
      id: `job_new_${Date.now()}_${idx}`,
      status: 'pending',
      filename: file.name,
      createdAt: new Date().toISOString(),
      originalUrl: URL.createObjectURL(file)
    }));
    return { jobs: newJobs };
  },
  getJobStatus: async (jobId) => {
    await delay(300);
    const job = mockJobs.find(j => j.id === jobId) || { id: jobId, status: 'completed', filename: 'mock.jpg' };
    return job;
  },
  getJobs: async (params = {}) => {
    await delay(500);
    const { page = 1, limit = 10, status, search } = params;
    let filteredJobs = [...mockJobs];
    
    if (status) {
      filteredJobs = filteredJobs.filter(job => job.status === status);
    }
    if (search) {
      filteredJobs = filteredJobs.filter(job => job.filename.toLowerCase().includes(search.toLowerCase()));
    }
    
    const startIndex = (page - 1) * limit;
    const paginatedJobs = filteredJobs.slice(startIndex, startIndex + limit);
    
    return {
      jobs: paginatedJobs,
      total: filteredJobs.length,
      page,
      totalPages: Math.ceil(filteredJobs.length / limit)
    };
  },
  downloadImage: async (jobId, type) => {
    await delay(600);
    // Simulate file download by creating an empty blob
    const url = window.URL.createObjectURL(new Blob(['mock data']));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${type}-${jobId}.mock`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
  deleteJob: async (jobId) => {
    await delay(400);
    return { message: 'Job deleted successfully' };
  }
};
