import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import UploadPage from './pages/UploadPage';
import ProcessingPage from './pages/ProcessingPage';
import ImageViewerPage from './pages/ImageViewerPage';
import HistoryPage from './pages/HistoryPage';
import NotFoundPage from './pages/NotFoundPage';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-screen"><div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div></div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position='top-right' toastOptions={{ duration: 4000, style: { borderRadius: '12px', padding: '16px' } }} />
        <Routes>
          <Route path='/login' element={<LoginPage />} />
          <Route path='/register' element={<RegisterPage />} />
          <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
            <Route path='/' element={<DashboardPage />} />
            <Route path='/upload' element={<UploadPage />} />
            <Route path='/processing/:jobId' element={<ProcessingPage />} />
            <Route path='/viewer/:jobId' element={<ImageViewerPage />} />
            <Route path='/history' element={<HistoryPage />} />
          </Route>
          <Route path='*' element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
