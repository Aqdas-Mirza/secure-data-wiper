import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HardDrive, 
  Usb, 
  Network, 
  Shield, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  Info,
  Trash2,
  FolderOpen
} from 'lucide-react';
import { SystemInfo, DriveInfo } from '../App';

interface DashboardProps {
  systemInfo: SystemInfo;
  socket: any;
  onUpdateSession: (sessionId: string | null) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ systemInfo, socket, onUpdateSession }) => {
  const navigate = useNavigate();
  const [selectedDrives, setSelectedDrives] = useState<string[]>([]);

  const getDriveIcon = (type: DriveInfo['type']) => {
    switch (type) {
      case 'SSD': return <HardDrive className="w-5 h-5" />; // fallback for SSD
      case 'HDD': return <HardDrive className="w-5 h-5" />;
      case 'USB': return <Usb className="w-5 h-5" />;
      case 'Network': return <Network className="w-5 h-5" />;
      default: return <HardDrive className="w-5 h-5" />;
    }
  };

  const getDriveTypeColor = (type: DriveInfo['type']) => {
    switch (type) {
      case 'SSD': return 'text-blue-600 bg-blue-100';
      case 'HDD': return 'text-gray-600 bg-gray-100';
      case 'USB': return 'text-orange-600 bg-orange-100';
      case 'Network': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getUsagePercentage = (used: number, total: number): number => {
    return (used / total) * 100;
  };

  const getUsageColor = (percentage: number): string => {
    if (percentage > 90) return 'bg-red-500';
    if (percentage > 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleWipeFiles = () => {
    navigate('/wipe');
  };

  const handleWipeFreeSpace = (driveDevice: string) => {
    // Set selected drive and navigate to wipe interface
    onUpdateSession(null);
    navigate('/wipe', { state: { selectedDrive: driveDevice, mode: 'freeSpace' } });
  };

  const handleFullDriveWipe = (driveDevice: string) => {
    // Set selected drive and navigate to wipe interface  
    onUpdateSession(null);
    navigate('/wipe', { state: { selectedDrive: driveDevice, mode: 'fullDrive' } });
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              System Dashboard
            </h1>
            <p className="text-gray-600">
              Overview of your system drives and secure wiping options
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {systemInfo.permissions.isAdmin ? (
              <div className="flex items-center px-3 py-2 bg-green-100 text-green-800 rounded-lg">
                <CheckCircle className="w-4 h-4 mr-2" />
                Administrator Access
              </div>
            ) : (
              <div className="flex items-center px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg">
                <AlertTriangle className="w-4 h-4 mr-2" />
                Limited Access
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid md:grid-cols-3 gap-4">
        <button
          onClick={handleWipeFiles}
          className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow duration-200 text-left group"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center group-hover:bg-blue-200 transition-colors">
              <FolderOpen className="w-6 h-6 text-blue-600" />
            </div>
            <span className="text-blue-600 font-semibold">→</span>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Wipe Files</h3>
          <p className="text-gray-600 text-sm">
            Select specific files and folders to securely wipe
          </p>
        </button>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <HardDrive className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Free Space</h3>
          <p className="text-gray-600 text-sm">
            Wipe deleted file remnants from free space
          </p>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Full Drive</h3>
          <p className="text-gray-600 text-sm">
            Complete drive sanitization (destructive)
          </p>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">System Information</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-500 mb-1">Platform</div>
            <div className="text-lg font-semibold text-gray-900">
              {systemInfo.platform} {systemInfo.arch}
            </div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-500 mb-1">Hostname</div>
            <div className="text-lg font-semibold text-gray-900">{systemInfo.hostname}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-500 mb-1">User</div>
            <div className="text-lg font-semibold text-gray-900">{systemInfo.user}</div>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm font-medium text-gray-500 mb-1">Drives Detected</div>
            <div className="text-lg font-semibold text-gray-900">{systemInfo.drives.length}</div>
          </div>
        </div>
      </div>

      {/* Detected Drives */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Detected Storage Drives</h2>
          <span className="text-sm text-gray-500">
            {systemInfo.drives.length} drive{systemInfo.drives.length !== 1 ? 's' : ''} found
          </span>
        </div>

        <div className="space-y-4">
          {systemInfo.drives.map((drive, index) => {
            const usagePercent = getUsagePercentage(drive.used, drive.size);
            
            return (
              <div key={drive.device} className="border rounded-lg p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getDriveTypeColor(drive.type)}`}>
                      {getDriveIcon(drive.type)}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {drive.device}
                        </h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getDriveTypeColor(drive.type)}`}>
                          {drive.type}
                        </span>
                        {drive.isRemovable && (
                          <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                            Removable
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {drive.label || 'Unnamed Drive'} • {drive.filesystem}
                      </p>
                    </div>
                  </div>

                  {/* Drive Actions */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleWipeFreeSpace(drive.device)}
                      className="px-3 py-1 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded"
                      title="Wipe free space"
                    >
                      Free Space
                    </button>
                    <button
                      onClick={() => handleFullDriveWipe(drive.device)}
                      className="px-3 py-1 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded"
                      title="Full drive wipe"
                    >
                      Full Wipe
                    </button>
                  </div>
                </div>

                {/* Drive Usage Bar */}
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Storage Usage</span>
                    <span>{usagePercent.toFixed(1)}% used</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${getUsageColor(usagePercent)}`}
                      style={{ width: `${usagePercent}%` }}
                    ></div>
                  </div>
                </div>

                {/* Drive Stats */}
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-gray-500">Total Size</div>
                    <div className="font-medium text-gray-900">{formatBytes(drive.size)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Used Space</div>
                    <div className="font-medium text-gray-900">{formatBytes(drive.used)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Available</div>
                    <div className="font-medium text-gray-900">{formatBytes(drive.available)}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Security Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <div className="flex items-start">
          <Info className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-yellow-800 mb-2">Security Recommendations</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Always backup important data before performing secure wipes</li>
              <li>• Administrator privileges provide access to more system files</li>
              <li>• SSD drives use TRIM commands in addition to overwrite patterns</li>
              <li>• Network drives may have different security requirements</li>
              <li>• USB drives should be ejected safely after wiping operations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;