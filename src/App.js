import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import AuthProvider from './contexts/AuthContext';
import PinLogin from './components/auth/PinLogin';
import Dashboard from './pages/Dashboard';
import DeviceControl from './pages/DeviceControl';
import LocationTracking from './pages/LocationTracking';
import MediaViewer from './pages/MediaViewer';
import CommunicationMonitor from './pages/CommunicationMonitor';
import SystemControl from './pages/SystemControl';
import EmergencyPanel from './pages/EmergencyPanel';
import Settings from './pages/Settings';
import './App.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing authentication token
    const token = localStorage.getItem('authToken');
    const pinBypassTime = localStorage.getItem('pinBypassTime');
    
    if (token) {
      // Check if token is still valid
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        
        if (payload.exp > currentTime) {
          setIsAuthenticated(true);
        } else {
          localStorage.removeItem('authToken');
        }
      } catch (error) {
        localStorage.removeItem('authToken');
      }
    }
    
    // Check PIN bypass (1 minute window)
    if (pinBypassTime) {
      const bypassTime = parseInt(pinBypassTime);
      const currentTime = Date.now();
      
      if (currentTime - bypassTime < 60000) { // 1 minute
        setIsAuthenticated(true);
      } else {
        localStorage.removeItem('pinBypassTime');
      }
    }
    
    setIsLoading(false);
  }, []);

  const handleAuthSuccess = (token, isPinBypass = false) => {
    if (isPinBypass) {
      localStorage.setItem('pinBypassTime', Date.now().toString());
    } else {
      localStorage.setItem('authToken', token);
    }
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('pinBypassTime');
    setIsAuthenticated(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1f2937',
                  color: '#f9fafb',
                },
              }}
            />
            
            {!isAuthenticated ? (
              <PinLogin onAuthSuccess={handleAuthSuccess} />
            ) : (
              <Routes>
                <Route path="/" element={<Dashboard onLogout={handleLogout} />} />
                <Route path="/device-control" element={<DeviceControl />} />
                <Route path="/location" element={<LocationTracking />} />
                <Route path="/media" element={<MediaViewer />} />
                <Route path="/communication" element={<CommunicationMonitor />} />
                <Route path="/system" element={<SystemControl />} />
                <Route path="/emergency" element={<EmergencyPanel />} />
                <Route path="/settings" element={<Settings onLogout={handleLogout} />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            )}
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;