export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Medical Image Enhancer';
export const POLLING_INTERVAL = parseInt(import.meta.env.VITE_POLLING_INTERVAL || '3000', 10);
export const MAX_FILE_SIZE = parseInt(import.meta.env.VITE_MAX_FILE_SIZE || '52428800', 10);
export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true';

export const ACCEPTED_FILE_TYPES = {
  'image/jpeg': ['.jpeg', '.jpg'],
  'image/png': ['.png'],
  'application/dicom': ['.dcm', '.dicom'],
};

export const JOB_STATUS = {
  PENDING: 'PENDING',
  UPLOADING: 'UPLOADING',
  QUEUED: 'QUEUED',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
};

export const STATUS_COLORS = {
  [JOB_STATUS.PENDING]: 'text-slate-500 bg-slate-100 border-slate-200',
  [JOB_STATUS.UPLOADING]: 'text-primary-600 bg-primary-50 border-primary-200',
  [JOB_STATUS.QUEUED]: 'text-secondary-600 bg-secondary-50 border-secondary-200',
  [JOB_STATUS.PROCESSING]: 'text-primary-700 bg-primary-100 border-primary-300',
  [JOB_STATUS.COMPLETED]: 'text-success bg-success/10 border-success/20',
  [JOB_STATUS.FAILED]: 'text-error bg-error/10 border-error/20',
};

export const ROUTES = {
  HOME: '/',
  UPLOAD: '/upload',
  RESULTS: '/results',
  RESULT_DETAIL: '/results/:id',
  SETTINGS: '/settings',
};
