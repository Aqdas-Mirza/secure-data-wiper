import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';

// Components
import Dashboard from './components/Dashboard';
import SystemScan from './components/SystemScan';
import WipingInterface from './components/WipingInterface';
import ReportsView from './components/ReportsView';
import Header from './components/Header';

// Types
export interface DriveInfo {
  device: string;
  label: string;
  type: 'HDD' | 'SSD' | 'USB' | 'Network';
  size: number;
  used: number;
  available: number;
  filesystem: string;
  mountpoint: string;
  isRemovable: boolean;
}

export interface SystemInfo {
  platform: string;
  arch: string;
  hostname: string;
  user: string;
  drives: DriveInfo[];
  permissions: {
    isAdmin: boolean;
    canAccessSystemFiles: boolean;
  };
}

export interface AppState {
  systemInfo: SystemInfo | null;
  isScanning: boolean;
  socket: any;
  currentSession: string | null;
}

// Configure axios defaults
axios.defaults.baseURL = process.env.REACT_APP_API_URL || '';
axios.defaults.timeout = 30000;

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>({
    systemInfo: null,
    isScanning: false,
    socket: null,
    currentSession: null
  });

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize socket connection
    const socketUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
    console.log(`🔌 Connecting to Socket.io at: ${socketUrl}`);
    
    const socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000
    });
    
    socket.on('connect', () => {
      console.log('✅ Connected to server - Socket ID:', socket.id);
      setError(null);
    });

    socket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from server. Reason:', reason);
      setError('Connection lost. Please refresh the page.');
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
      setError('Unable to connect to server. Please ensure the backend is running.');
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log(`🔄 Reconnected after ${attemptNumber} attempts`);
      setError(null);
    });

    setAppState(prev => ({ ...prev, socket }));

    // Cleanup on unmount
    return () => {
      console.log('🔌 Disconnecting socket');
      socket.disconnect();
    };
  }, []);

  const scanSystem = async () => {
    setAppState(prev => ({ ...prev, isScanning: true }));
    setError(null);

    try {
      console.log('🔍 Starting system scan...');
      const response = await axios.get('/api/system/scan');
      
      if (response.data.success) {
        setAppState(prev => ({ 
          ...prev, 
          systemInfo: response.data.data,
          isScanning: false 
        }));
        console.log('✅ System scan completed');
      } else {
        throw new Error(response.data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('❌ System scan failed:', error);
      setError(
        error instanceof Error 
          ? error.message 
          : 'Failed to scan system. Please check if the backend server is running.'
      );
      setAppState(prev => ({ ...prev, isScanning: false }));
    }
  };

  const updateSession = (sessionId: string | null) => {
    setAppState(prev => ({ ...prev, currentSession: sessionId }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Router>
        <Header 
          systemInfo={appState.systemInfo}
          isScanning={appState.isScanning}
          onRescan={scanSystem}
        />
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mx-4 mt-4">
            <div className="flex items-center">
              <span className="text-red-500 mr-2">⚠️</span>
              <span>{error}</span>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        <main className="container mx-auto px-4 py-6">
          <Routes>
            <Route 
              path="/" 
              element={
                appState.systemInfo ? (
                  <Navigate to="/dashboard" replace />
                ) : (
                  <SystemScan 
                    isScanning={appState.isScanning}
                    onStartScan={scanSystem}
                  />
                )
              } 
            />
            
            <Route 
              path="/dashboard" 
              element={
                appState.systemInfo ? (
                  <Dashboard 
                    systemInfo={appState.systemInfo}
                    socket={appState.socket}
                    onUpdateSession={updateSession}
                  />
                ) : (
                  <Navigate to="/" replace />
                )
              } 
            />
            
            <Route 
              path="/wipe" 
              element={
                <WipingInterface 
                  systemInfo={appState.systemInfo}
                  socket={appState.socket}
                  sessionId={appState.currentSession}
                />
              } 
            />
            
            <Route 
              path="/reports" 
              element={<ReportsView />} 
            />
          </Routes>
        </main>
      </Router>
    </div>
  );
};

export default App;