import api from './api';

/**
 * Service for handling image uploads and job management API calls.
 */
export const uploadService = {
  /**
   * Uploads one or more images for enhancement.
   * The API uploads them to S3, creates Job records in DynamoDB,
   * and queues each job on SQS.
   *
   * @param {File[]} files - Array of File objects to upload.
   * @param {Function} [onProgress] - Optional progress callback (0–100).
   * @returns {Promise<{jobs: Object[]}>}
   */
  uploadImages: async (files, onProgress) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));

    const response = await api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(pct);
        }
      },
    });

    // Normalise: backend returns { jobs } where each job has jobId.
    // Map jobId → id so the frontend can use job.id throughout.
    const jobs = (response.data.jobs || []).map(normaliseJob);
    return { jobs };
  },

  /**
   * Retrieves the status of a specific enhancement job.
   *
   * @param {string} jobId
   * @returns {Promise<Object>} The job details.
   */
  getJobStatus: async (jobId) => {
    const response = await api.get(`/jobs/${jobId}`);
    return normaliseJob(response.data);
  },

  /**
   * Retrieves a paginated list of the current user's enhancement jobs.
   *
   * @param {Object} params
   * @param {number} [params.limit=10]
   * @param {string} [params.cursor]   - Opaque pagination cursor from the previous response.
   * @param {string} [params.status]   - Filter by status.
   * @returns {Promise<{jobs: Object[], nextCursor: string|null}>}
   */
  getJobs: async (params = {}) => {
    const response = await api.get('/jobs', { params });
    const jobs = (response.data.jobs || []).map(normaliseJob);
    return { jobs, nextCursor: response.data.nextCursor ?? null };
  },

  /**
   * Fetches a short-lived presigned S3 URL for viewing an image.
   *
   * @param {string} jobId
   * @param {'original'|'enhanced'} type
   * @returns {Promise<string>} The presigned URL.
   */
  getImageUrl: async (jobId, type = 'original') => {
    const response = await api.get(`/jobs/${jobId}/image`, { params: { type } });
    return response.data.url;
  },

  /**
   * Downloads an image via a presigned URL by opening it in a new tab.
   * (Direct S3 streaming to the browser avoids proxying large files through the API.)
   *
   * @param {string} jobId
   * @param {'original'|'enhanced'} type
   */
  downloadImage: async (jobId, type) => {
    const url = await uploadService.getImageUrl(jobId, type);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}-${jobId}.jpg`;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  },

  /**
   * Deletes a specific enhancement job and its associated files.
   *
   * @param {string} jobId
   * @returns {Promise<{message: string}>}
   */
  deleteJob: async (jobId) => {
    const response = await api.delete(`/jobs/${jobId}`);
    return response.data;
  },
};

// ─── Helper ───────────────────────────────────────────────────────────────────
/**
 * Normalise a job object from the API to the shape the frontend expects.
 * The backend uses `jobId` as the primary key; components use `id`.
 */
function normaliseJob(job) {
  return {
    id: job.jobId ?? job.id,
    jobId: job.jobId ?? job.id,
    userId: job.userId,
    filename: job.filename,
    status: job.status,
    originalKey: job.originalKey,
    enhancedKey: job.enhancedKey ?? null,
    progress: job.progress ?? 0,
    error: job.error ?? null,
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
    completedAt: job.completedAt ?? null,
  };
}
