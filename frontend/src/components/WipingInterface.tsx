import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  FolderOpen, 
  File, 
  Trash2, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  X,
  Play,
  Pause,
  RotateCcw,
  Download
} from 'lucide-react';
import axios from 'axios';
import { SystemInfo } from '../App';

interface WipingInterfaceProps {
  systemInfo: SystemInfo | null;
  socket: any;
  sessionId: string | null;
}

interface SelectedFile {
  path: string;
  name: string;
  size: number;
  type: 'file' | 'folder';
}

interface WipeProgress {
  sessionId: string;
  status: 'preparing' | 'wiping' | 'verifying' | 'completed' | 'error';
  currentFile: string;
  filesProcessed: number;
  totalFiles: number;
  currentPass: number;
  totalPasses: number;
  bytesProcessed: number;
  totalBytes: number;
  startTime: Date;
  estimatedCompletion?: Date;
  error?: string;
}

const WipingInterface: React.FC<WipingInterfaceProps> = ({ 
  systemInfo, 
  socket, 
  sessionId 
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [securityLevel, setSecurityLevel] = useState<'quick' | 'standard' | 'maximum'>('standard');
  const [isWiping, setIsWiping] = useState(false);
  const [progress, setProgress] = useState<WipeProgress | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get initial state from navigation
  const navigationState = location.state as any;
  const selectedDrive = navigationState?.selectedDrive;
  const wipingMode = navigationState?.mode; // 'files', 'freeSpace', 'fullDrive'

  useEffect(() => {
    if (socket && sessionId) {
      console.log(`🔌 Joining wipe session: ${sessionId}`);
      socket.emit('join-wipe-session', sessionId);
      
      socket.on('wipe-progress', (progressData: WipeProgress) => {
        console.log('📥 Received progress update:', progressData);
        setProgress(progressData);
      });

      socket.on('wipe-completed', async (data: any) => {
        console.log('✅ Wipe completed:', data);
        setProgress(prev => prev ? { ...prev, status: 'completed' } : null);
        setIsWiping(false);
        try {
          // Trigger report generation (backend can synthesize details from sessionId)
          await axios.post('/api/reports/generate', { sessionId: data.sessionId });
        } catch (e) {
          console.warn('Report generation request failed:', e);
        }
      });

      socket.on('wipe-error', (data: any) => {
        console.error('❌ Wipe error:', data);
        setError(data.error);
        setIsWiping(false);
      });

      socket.on('wipe-cancelled', (data: any) => {
        console.log('🚫 Wipe cancelled:', data);
        setProgress(prev => prev ? { ...prev, status: 'error', error: 'Cancelled by user' } : null);
        setIsWiping(false);
      });

      return () => {
        console.log(`🔌 Leaving wipe session: ${sessionId}`);
        socket.off('wipe-progress');
        socket.off('wipe-completed');
        socket.off('wipe-error');
        socket.off('wipe-cancelled');
      };
    }
  }, [socket, sessionId]);

  // Add polling as backup for progress updates
  useEffect(() => {
    if (!progress || !isWiping) return;
    
    if (progress.status === 'completed' || progress.status === 'error') {
      return; // Stop polling when done
    }

    // Poll every 2 seconds for progress updates (backup to socket)
    const pollInterval = setInterval(async () => {
      try {
        console.log(`🔄 Polling progress for session ${progress.sessionId}`);
        const response = await axios.get(`/api/wiping/progress/${progress.sessionId}`);
        if (response.data.success) {
          console.log('📊 Polled progress:', response.data.data);
          setProgress(response.data.data);
        }
      } catch (error) {
        console.error('Failed to poll progress:', error);
      }
    }, 2000);

    return () => clearInterval(pollInterval);
  }, [progress, isWiping]);

  const handleFileSelect = () => {
    // Create a file input element programmatically
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.style.display = 'none';
    
    input.onchange = (event: any) => {
      const files = Array.from(event.target.files) as File[];
      const newSelectedFiles: SelectedFile[] = files.map(file => ({
        path: (file as any).path || file.webkitRelativePath || file.name,
        name: file.name,
        size: file.size,
        type: 'file'
      }));
      
      setSelectedFiles(prev => [...prev, ...newSelectedFiles]);
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  };

  const handleFolderSelect = () => {
    // Create a directory input
    const input = document.createElement('input');
    input.type = 'file';
    (input as any).webkitdirectory = true;
    input.multiple = true;
    input.style.display = 'none';
    
    input.onchange = (event: any) => {
      const files = Array.from(event.target.files) as File[];
      const newSelectedFiles: SelectedFile[] = files.map(file => ({
        path: (file as any).webkitRelativePath || file.name,
        name: file.name,
        size: file.size,
        type: 'file'
      }));
      
      setSelectedFiles(prev => [...prev, ...newSelectedFiles]);
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  };

  // Enhanced file path input for testing
  const handleManualPathInput = () => {
    const path = prompt('Enter file path (for testing purposes):');
    if (path && path.trim()) {
      const newFile: SelectedFile = {
        path: path.trim(),
        name: path.split(/[/\\]/).pop() || path.trim(),
        size: 1000, // Estimated size
        type: 'file'
      };
      setSelectedFiles(prev => [...prev, newFile]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getTotalSize = () => {
    return selectedFiles.reduce((total, file) => total + file.size, 0);
  };

  const handleStartWipe = async () => {
    if (selectedFiles.length === 0) {
      setError('Please select files to wipe');
      return;
    }

    setShowConfirmation(true);
  };

  const confirmWipe = async () => {
    try {
      setIsWiping(true);
      setShowConfirmation(false);
      setError(null);

      console.log('🚀 Starting wipe request...');
      console.log('Files:', selectedFiles.map(f => f.path));
      console.log('Security Level:', securityLevel);

      const response = await axios.post('/api/wiping/start', {
        files: selectedFiles.map(f => f.path),
        securityLevel
      });

      console.log('📡 Wipe started response:', response.data);

      if (response.data.success) {
        const newSessionId = response.data.sessionId;
        console.log(`✅ Wipe session created: ${newSessionId}`);
        
        // Join the socket room immediately
        if (socket) {
          console.log(`🔌 Joining socket room: wipe-${newSessionId}`);
          socket.emit('join-wipe-session', newSessionId);
        }

        setProgress({
          sessionId: newSessionId,
          status: 'preparing',
          currentFile: '',
          filesProcessed: 0,
          totalFiles: selectedFiles.length,
          currentPass: 0,
          totalPasses: getPassesForLevel(securityLevel),
          bytesProcessed: 0,
          totalBytes: getTotalSize(),
          startTime: new Date()
        });
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      console.error('❌ Failed to start wipe:', error);
      setError(error.response?.data?.error || error.message || 'Failed to start wiping');
      setIsWiping(false);
    }
  };

  const handleCancelWipe = async () => {
    if (progress?.sessionId) {
      try {
        await axios.post(`/api/wiping/cancel/${progress.sessionId}`);
        setIsWiping(false);
        setProgress(null);
      } catch (error: any) {
        setError('Failed to cancel wiping process');
      }
    }
  };

  const getPassesForLevel = (level: string): number => {
    switch (level) {
      case 'quick': return 1;
      case 'standard': return 3;
      case 'maximum': return 7;
      default: return 3;
    }
  };

  const getProgressPercentage = (): number => {
    if (!progress) return 0;
    if (!progress.totalBytes || progress.totalBytes <= 0) return 0;
    const pct = (progress.bytesProcessed / progress.totalBytes) * 100;
    return Math.max(0, Math.min(100, pct));
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'preparing': return 'text-blue-600 bg-blue-100';
      case 'wiping': return 'text-orange-600 bg-orange-100';
      case 'verifying': return 'text-purple-600 bg-purple-100';
      case 'completed': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimeRemaining = (estimated?: Date | string | number): string => {
    if (!estimated) return 'Calculating...';
    const estDate = estimated instanceof Date ? estimated : new Date(estimated);
    if (isNaN(estDate.getTime())) return 'Calculating...';
    const now = Date.now();
    const remaining = estDate.getTime() - now;
    if (remaining <= 0) return 'Almost done...';
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    if (minutes > 60) {
      const hours = Math.floor(minutes / 60);
      return `${hours}h ${minutes % 60}m`;
    }
    
    return minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  };

  if (progress && isWiping) {
    return (
      <div className="max-w-4xl mx-auto">
        {/* Progress Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Secure Wiping in Progress</h1>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(progress.status)}`}>
              {progress.status.charAt(0).toUpperCase() + progress.status.slice(1)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Overall Progress</span>
              <span>{getProgressPercentage().toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${getProgressPercentage()}%` }}
              ></div>
            </div>
          </div>

          {/* Current Status */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Current File:</span>
                <p className="font-medium text-gray-900 truncate">
                  {progress.currentFile || 'Preparing...'}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Pass:</span>
                <p className="font-medium text-gray-900">
                  {progress.currentPass} of {progress.totalPasses}
                </p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <span className="text-sm text-gray-500">Files Processed:</span>
                <p className="font-medium text-gray-900">
                  {progress.filesProcessed} of {progress.totalFiles}
                </p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Estimated Time Remaining:</span>
                <p className="font-medium text-gray-900">
                  {formatTimeRemaining(progress.estimatedCompletion)}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center mt-6">
            {progress.status !== 'completed' && progress.status !== 'error' && (
              <button
                onClick={handleCancelWipe}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors"
              >
                Cancel Wiping
              </button>
            )}
            
            {progress.status === 'completed' && (
              <div className="flex space-x-4">
                <button
                  onClick={() => navigate('/reports')}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center"
                >
                  <Download className="w-4 h-4 mr-2" />
                  View Reports
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Wipe More Files
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Completion Status */}
        {progress.status === 'completed' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <CheckCircle className="w-6 h-6 text-green-600 mr-3" />
              <div>
                <h3 className="font-semibold text-green-800">Wiping Completed Successfully!</h3>
                <p className="text-green-700 mt-1">
                  All {progress.totalFiles} files have been securely wiped according to NIST standards.
                  Verification reports are now available.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Status */}
        {progress.status === 'error' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <div>
                <h3 className="font-semibold text-red-800">Wiping Process Failed</h3>
                <p className="text-red-700 mt-1">
                  {progress.error || 'An unknown error occurred during the wiping process.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Secure File Wiping</h1>
        <p className="text-gray-600">
          Select files and configure wiping settings. All operations comply with NIST SP 800-88 Rev. 1.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
            <span className="text-red-700">{error}</span>
            <button 
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* File Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">File Selection</h2>
        
        {/* Selection Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={handleFileSelect}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <File className="w-4 h-4 mr-2" />
            Select Files
          </button>
          <button
            onClick={handleFolderSelect}
            className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
          >
            <FolderOpen className="w-4 h-4 mr-2" />
            Select Folder
          </button>
          <button
            onClick={handleManualPathInput}
            className="flex items-center px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
            title="For testing - enter file path manually"
          >
            <File className="w-4 h-4 mr-2" />
            Manual Path (Test)
          </button>
        </div>

        {/* Selected Files List */}
        {selectedFiles.length > 0 ? (
          <div>
            <div className="flex justify-between items-center mb-4">
              <span className="font-medium text-gray-900">
                {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
              </span>
              <span className="text-sm text-gray-600">
                Total: {formatBytes(getTotalSize())}
              </span>
            </div>
            
            <div className="max-h-64 overflow-y-auto border rounded-lg">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 border-b last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <File className="w-4 h-4 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatBytes(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
            <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No files selected</p>
            <p className="text-sm text-gray-500">Click the buttons above to select files or folders</p>
          </div>
        )}
      </div>

      {/* Security Level Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Level</h2>
        
        <div className="grid gap-4">
          <label className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
            securityLevel === 'quick' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="radio"
              name="securityLevel"
              value="quick"
              checked={securityLevel === 'quick'}
              onChange={(e) => setSecurityLevel(e.target.value as any)}
              className="sr-only"
            />
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Quick (1-pass)</h3>
                <p className="text-gray-600 text-sm">Single overwrite with zeros. Suitable for personal files and SSDs.</p>
              </div>
              <div className="text-green-600 font-medium">Fastest</div>
            </div>
          </label>

          <label className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
            securityLevel === 'standard' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="radio"
              name="securityLevel"
              value="standard"
              checked={securityLevel === 'standard'}
              onChange={(e) => setSecurityLevel(e.target.value as any)}
              className="sr-only"
            />
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Standard (3-pass)</h3>
                <p className="text-gray-600 text-sm">DoD 5220.22-M compliant. Recommended for business data.</p>
              </div>
              <div className="text-blue-600 font-medium">Recommended</div>
            </div>
          </label>

          <label className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
            securityLevel === 'maximum' ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
          }`}>
            <input
              type="radio"
              name="securityLevel"
              value="maximum"
              checked={securityLevel === 'maximum'}
              onChange={(e) => setSecurityLevel(e.target.value as any)}
              className="sr-only"
            />
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Maximum (7-pass)</h3>
                <p className="text-gray-600 text-sm">Military-grade security for highly sensitive or classified data.</p>
              </div>
              <div className="text-red-600 font-medium">Most Secure</div>
            </div>
          </label>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Back to Dashboard
          </button>
          
          <button
            onClick={handleStartWipe}
            disabled={selectedFiles.length === 0}
            className="flex items-center px-8 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors disabled:cursor-not-allowed"
          >
            <Shield className="w-4 h-4 mr-2" />
            Start Secure Wipe
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
              <h3 className="text-lg font-semibold text-gray-900">Confirm Secure Wipe</h3>
            </div>
            
            <p className="text-gray-600 mb-4">
              You are about to securely wipe <strong>{selectedFiles.length}</strong> file
              {selectedFiles.length !== 1 ? 's' : ''} using <strong>{securityLevel}</strong> security level.
            </p>
            
            <div className="bg-red-50 border border-red-200 rounded p-3 mb-6">
              <p className="text-red-800 text-sm font-medium">
                ⚠️ This action cannot be undone. The files will be permanently destroyed.
              </p>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmWipe}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-medium transition-colors"
              >
                Confirm Wipe
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WipingInterface;