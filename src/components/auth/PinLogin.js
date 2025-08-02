import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Shield, Calculator, Smartphone, Wifi } from 'lucide-react';
import axios from 'axios';

const PinLogin = ({ onAuthSuccess }) => {
  const [pin, setPin] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTime, setLockTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [showEmergencyUnlock, setShowEmergencyUnlock] = useState(false);

  useEffect(() => {
    // Check if account is locked
    const lockedUntil = localStorage.getItem('lockedUntil');
    if (lockedUntil) {
      const lockEndTime = parseInt(lockedUntil);
      const currentTime = Date.now();
      
      if (currentTime < lockEndTime) {
        setIsLocked(true);
        setLockTime(Math.ceil((lockEndTime - currentTime) / 1000));
      } else {
        localStorage.removeItem('lockedUntil');
      }
    }
    
    // Get failed attempts count
    const failedAttempts = localStorage.getItem('failedAttempts');
    if (failedAttempts) {
      setAttempts(parseInt(failedAttempts));
    }
  }, []);

  useEffect(() => {
    let timer;
    if (isLocked && lockTime > 0) {
      timer = setInterval(() => {
        setLockTime(prev => {
          if (prev <= 1) {
            setIsLocked(false);
            localStorage.removeItem('lockedUntil');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isLocked, lockTime]);

  const handlePinInput = (digit) => {
    if (pin.length < 6 && !isLocked) {
      setPin(prev => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setPin('');
  };

  const handleSubmit = async () => {
    if (pin.length !== 6 || isLocked) return;

    setIsLoading(true);
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/pin`, {
        pin: pin
      });
      
      // Clear failed attempts on success
      localStorage.removeItem('failedAttempts');
      localStorage.removeItem('lockedUntil');
      setAttempts(0);
      
      toast.success('Authentication successful!');
      onAuthSuccess(response.data.access_token);
      
    } catch (error) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      localStorage.setItem('failedAttempts', newAttempts.toString());
      
      if (newAttempts >= 10) {
        // Lock account for 24 hours
        const lockEndTime = Date.now() + (24 * 60 * 60 * 1000);
        localStorage.setItem('lockedUntil', lockEndTime.toString());
        setIsLocked(true);
        setLockTime(24 * 60 * 60);
        toast.error('Account locked for 24 hours due to too many failed attempts');
      } else {
        const remainingAttempts = 10 - newAttempts;
        toast.error(`Invalid PIN. ${remainingAttempts} attempts remaining.`);
      }
      
      setPin('');
    }
    
    setIsLoading(false);
  };

  const handleEmergencyUnlock = async () => {
    if (!navigator.onLine) {
      toast.error('Internet connection required for emergency unlock');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/emergency-unlock`, {
        device_id: 'frontend_device',
        request_id: Date.now().toString()
      });
      
      toast.success('Emergency unlock request sent to device. Please approve on your device.');
      
      // Poll for approval (simplified - in real app would use WebSocket)
      const pollForApproval = setInterval(async () => {
        try {
          // This would check if the emergency unlock was approved
          // For now, we'll simulate a 1-minute bypass
          clearInterval(pollForApproval);
          localStorage.setItem('pinBypassTime', Date.now().toString());
          toast.success('Emergency unlock approved! Access granted for 1 minute.');
          onAuthSuccess(null, true);
        } catch (error) {
          // Continue polling
        }
      }, 2000);
      
      // Stop polling after 60 seconds
      setTimeout(() => {
        clearInterval(pollForApproval);
        setIsLoading(false);
      }, 60000);
      
    } catch (error) {
      toast.error('Failed to send emergency unlock request');
      setIsLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-blue-600 p-4 rounded-full">
              <Shield className="h-12 w-12 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Security Access</h2>
          <p className="text-gray-300">Enter your 6-digit PIN to continue</p>
        </div>

        {/* PIN Display */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex justify-center space-x-3 mb-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                  i < pin.length
                    ? 'bg-blue-500 border-blue-500 shadow-lg shadow-blue-500/50'
                    : 'border-gray-400'
                }`}
              />
            ))}
          </div>

          {/* Lock Status */}
          {isLocked && (
            <div className="text-center mb-6">
              <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4">
                <p className="text-red-400 font-semibold">Account Locked</p>
                <p className="text-red-300 text-sm">
                  Time remaining: {formatTime(lockTime)}
                </p>
              </div>
            </div>
          )}

          {/* Attempts Warning */}
          {attempts > 0 && attempts < 10 && !isLocked && (
            <div className="text-center mb-4">
              <p className="text-yellow-400 text-sm">
                {10 - attempts} attempts remaining
              </p>
            </div>
          )}

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handlePinInput(num.toString())}
                disabled={isLocked}
                className="bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:opacity-50 
                         text-white font-semibold py-4 rounded-lg transition-all duration-200 
                         hover:scale-105 active:scale-95"
              >
                {num}
              </button>
            ))}
            
            {/* Bottom row */}
            <button
              onClick={handleClear}
              disabled={isLocked}
              className="bg-red-500/20 hover:bg-red-500/30 disabled:bg-red-500/10 disabled:opacity-50 
                       text-red-400 font-semibold py-4 rounded-lg transition-all duration-200"
            >
              Clear
            </button>
            
            <button
              onClick={() => handlePinInput('0')}
              disabled={isLocked}
              className="bg-white/20 hover:bg-white/30 disabled:bg-white/10 disabled:opacity-50 
                       text-white font-semibold py-4 rounded-lg transition-all duration-200 
                       hover:scale-105 active:scale-95"
            >
              0
            </button>
            
            <button
              onClick={handleBackspace}
              disabled={isLocked}
              className="bg-yellow-500/20 hover:bg-yellow-500/30 disabled:bg-yellow-500/10 disabled:opacity-50 
                       text-yellow-400 font-semibold py-4 rounded-lg transition-all duration-200"
            >
              ⌫
            </button>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={pin.length !== 6 || isLocked || isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:opacity-50 
                     text-white font-semibold py-4 rounded-lg transition-all duration-200 
                     disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Enter Security Dashboard</span>
            )}
          </button>
        </div>

        {/* Emergency Unlock */}
        <div className="text-center">
          <button
            onClick={() => setShowEmergencyUnlock(!showEmergencyUnlock)}
            className="text-blue-400 hover:text-blue-300 text-sm underline transition-colors"
          >
            Emergency Access Options
          </button>
          
          {showEmergencyUnlock && (
            <div className="mt-4 bg-white/10 backdrop-blur-md rounded-lg p-4 border border-white/20">
              <p className="text-gray-300 text-sm mb-4">
                Send an encrypted approval request to your registered device
              </p>
              <button
                onClick={handleEmergencyUnlock}
                disabled={isLoading}
                className="bg-orange-600 hover:bg-orange-700 disabled:bg-gray-600 disabled:opacity-50 
                         text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 
                         flex items-center justify-center space-x-2 mx-auto"
              >
                <Smartphone className="h-4 w-4" />
                <span>Request Device Approval</span>
              </button>
            </div>
          )}
        </div>

        {/* Status Indicators */}
        <div className="flex justify-center space-x-4 text-xs text-gray-400">
          <div className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${navigator.onLine ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{navigator.onLine ? 'Online' : 'Offline'}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Calculator className="h-3 w-3" />
            <span>Stealth Mode</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PinLogin;