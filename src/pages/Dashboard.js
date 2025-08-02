import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from 'react-query';
import { 
  Shield, 
  Smartphone, 
  MapPin, 
  Camera, 
  MessageSquare, 
  Settings, 
  AlertTriangle,
  Battery,
  Wifi,
  Signal,
  Eye,
  Lock,
  Activity,
  Users,
  Clock,
  HardDrive
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Dashboard = ({ onLogout }) => {
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [realTimeData, setRealTimeData] = useState({});

  // Fetch devices
  const { data: devices, isLoading: devicesLoading } = useQuery(
    'devices',
    async () => {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/devices`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` }
      });
      return response.data;
    },
    { refetchInterval: 30000 }
  );

  // Fetch device stats
  const { data: stats } = useQuery(
    ['deviceStats', selectedDevice?.device_id],
    async () => {
      if (!selectedDevice) return null;
      const response = await axios.get(
        `${process.env.REACT_APP_BACKEND_URL}/api/devices/${selectedDevice.device_id}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
      );
      return response.data;
    },
    { enabled: !!selectedDevice, refetchInterval: 15000 }
  );

  useEffect(() => {
    if (devices && devices.length > 0 && !selectedDevice) {
      setSelectedDevice(devices[0]);
    }
  }, [devices, selectedDevice]);

  // WebSocket connection for real-time updates
  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8001/ws/dashboard_${Date.now()}`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setRealTimeData(prev => ({
        ...prev,
        [data.device_id]: data
      }));
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => ws.close();
  }, []);

  const quickActions = [
    {
      title: 'Lock Device',
      icon: Lock,
      color: 'bg-red-500',
      action: async () => {
        try {
          await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/api/security/lock`,
            { device_id: selectedDevice.device_id },
            { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
          );
          toast.success('Device lock command sent');
        } catch (error) {
          toast.error('Failed to lock device');
        }
      }
    },
    {
      title: 'Get Location',
      icon: MapPin,
      color: 'bg-blue-500',
      action: async () => {
        try {
          await axios.get(
            `${process.env.REACT_APP_BACKEND_URL}/api/location/${selectedDevice.device_id}`,
            { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
          );
          toast.success('Location request sent');
        } catch (error) {
          toast.error('Failed to get location');
        }
      }
    },
    {
      title: 'Take Photo',
      icon: Camera,
      color: 'bg-green-500',
      action: async () => {
        try {
          await axios.post(
            `${process.env.REACT_APP_BACKEND_URL}/api/media/camera/${selectedDevice.device_id}/photo`,
            { camera: 'back' },
            { headers: { Authorization: `Bearer ${localStorage.getItem('authToken')}` } }
          );
          toast.success('Photo capture command sent');
        } catch (error) {
          toast.error('Failed to take photo');
        }
      }
    },
    {
      title: 'Emergency Mode',
      icon: AlertTriangle,
      color: 'bg-orange-500',
      action: () => {
        if (window.confirm('Are you sure you want to activate emergency mode?')) {
          window.location.href = '/emergency';
        }
      }
    }
  ];

  const menuItems = [
    { title: 'Device Control', icon: Smartphone, path: '/device-control', color: 'text-blue-400' },
    { title: 'Location Tracking', icon: MapPin, path: '/location', color: 'text-green-400' },
    { title: 'Media Viewer', icon: Camera, path: '/media', color: 'text-purple-400' },
    { title: 'Communication', icon: MessageSquare, path: '/communication', color: 'text-pink-400' },
    { title: 'System Control', icon: Settings, path: '/system', color: 'text-yellow-400' },
    { title: 'Emergency Panel', icon: AlertTriangle, path: '/emergency', color: 'text-red-400' },
  ];

  if (devicesLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="h-8 w-8 text-blue-500" />
            <h1 className="text-2xl font-bold">Personal Security Dashboard</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Device Selector */}
            {devices && devices.length > 0 && (
              <select
                value={selectedDevice?.device_id || ''}
                onChange={(e) => {
                  const device = devices.find(d => d.device_id === e.target.value);
                  setSelectedDevice(device);
                }}
                className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
              >
                {devices.map(device => (
                  <option key={device.device_id} value={device.device_id}>
                    {device.device_name} ({device.status})
                  </option>
                ))}
              </select>
            )}
            
            <button
              onClick={onLogout}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto p-6">
        {/* Device Status Cards */}
        {selectedDevice && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Device Status</p>
                  <p className={`text-lg font-semibold ${
                    selectedDevice.status === 'online' ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {selectedDevice.status === 'online' ? 'Online' : 'Offline'}
                  </p>
                </div>
                <Activity className={`h-8 w-8 ${
                  selectedDevice.status === 'online' ? 'text-green-400' : 'text-red-400'
                }`} />
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Battery Level</p>
                  <p className="text-lg font-semibold text-white">
                    {selectedDevice.battery_level || 'Unknown'}%
                  </p>
                </div>
                <Battery className="h-8 w-8 text-yellow-400" />
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Last Seen</p>
                  <p className="text-lg font-semibold text-white">
                    {selectedDevice.last_seen ? 
                      new Date(selectedDevice.last_seen).toLocaleTimeString() : 
                      'Never'
                    }
                  </p>
                </div>
                <Clock className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Storage</p>
                  <p className="text-lg font-semibold text-white">
                    {selectedDevice.storage_info ? 
                      `${selectedDevice.storage_info.used}/${selectedDevice.storage_info.total} GB` : 
                      'Unknown'
                    }
                  </p>
                </div>
                <HardDrive className="h-8 w-8 text-purple-400" />
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={action.action}
                disabled={!selectedDevice}
                className={`${action.color} hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed 
                          rounded-xl p-4 flex flex-col items-center space-y-2 transition-all duration-200 
                          hover:scale-105 active:scale-95`}
              >
                <action.icon className="h-8 w-8 text-white" />
                <span className="text-white font-medium text-sm">{action.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main Menu */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Security Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item, index) => (
              <Link
                key={index}
                to={item.path}
                className="bg-gray-800 hover:bg-gray-700 rounded-xl p-6 border border-gray-700 
                         transition-all duration-200 hover:scale-105 group"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-lg bg-gray-700 group-hover:bg-gray-600`}>
                    <item.icon className={`h-6 w-6 ${item.color}`} />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{item.title}</h3>
                    <p className="text-gray-400 text-sm">
                      Access {item.title.toLowerCase()} features
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {[
              { action: 'Device connected', time: '2 minutes ago', type: 'success' },
              { action: 'Location updated', time: '5 minutes ago', type: 'info' },
              { action: 'Photo captured', time: '10 minutes ago', type: 'success' },
              { action: 'Command executed', time: '15 minutes ago', type: 'warning' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'success' ? 'bg-green-400' :
                    activity.type === 'warning' ? 'bg-yellow-400' : 'bg-blue-400'
                  }`}></div>
                  <span className="text-white">{activity.action}</span>
                </div>
                <span className="text-gray-400 text-sm">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;