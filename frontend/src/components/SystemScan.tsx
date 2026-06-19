import React from 'react';
import { Search, Monitor, AlertCircle, Play } from 'lucide-react';

interface SystemScanProps {
  isScanning: boolean;
  onStartScan: () => void;
}

const SystemScan: React.FC<SystemScanProps> = ({ isScanning, onStartScan }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
            <Monitor className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🔒 Secure Data Wiper
          </h1>
          <p className="text-lg text-gray-600">
            NIST SP 800-88 Compliant Data Sanitization Tool
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          {!isScanning ? (
            <>
              {/* Welcome Content */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                  Welcome to Secure Data Wiping
                </h2>
                <p className="text-gray-600 mb-6">
                  This tool will securely wipe your files according to NIST SP 800-88 Rev. 1 
                  guidelines, making them unrecoverable even with advanced forensic tools.
                </p>
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 border border-gray-200 rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-green-300 hover:-translate-y-1 cursor-pointer">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">System Detection</h3>
                  <p className="text-sm text-gray-600">
                    Automatically detects drives, file systems, and storage types
                  </p>
                </div>
                
                <div className="text-center p-4 border border-gray-200 rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-blue-300 hover:-translate-y-1 cursor-pointer">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Monitor className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Multiple Security Levels</h3>
                  <p className="text-sm text-gray-600">
                    Choose from Quick (1-pass), Standard (3-pass), or Maximum (7-pass)
                  </p>
                </div>
                
                <div className="text-center p-4 border border-gray-200 rounded-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl hover:border-purple-300 hover:-translate-y-1 cursor-pointer">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <AlertCircle className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-800 mb-2">Verification Reports</h3>
                  <p className="text-sm text-gray-600">
                    Generate PDF and JSON certificates with digital signatures
                  </p>
                </div>
              </div>

              {/* Security Levels Info */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="font-semibold text-gray-800 mb-4">Security Levels</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-green-600">Quick (1-pass)</span>
                    <span className="text-sm text-gray-600">Personal files, fast deletion</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-blue-600">Standard (3-pass)</span>
                    <span className="text-sm text-gray-600">Business data, DoD 5220.22-M</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-red-600">Maximum (7-pass)</span>
                    <span className="text-sm text-gray-600">Classified data, government grade</span>
                  </div>
                </div>
              </div>

              {/* System Requirements */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="font-semibold text-yellow-800 mb-2">Important Notes</h4>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Administrator privileges may be required for system files</li>
                      <li>• Secure wiping is irreversible - ensure you have backups</li>
                      <li>• SSD drives use different wiping methods than traditional HDDs</li>
                      <li>• Large files may take considerable time to wipe securely</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Start Button */}
              <div className="text-center">
                <button
                  onClick={onStartScan}
                  className="inline-flex items-center px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start System Scan
                </button>
                <p className="text-sm text-gray-500 mt-3">
                  This will detect your drives and system configuration
                </p>
              </div>
            </>
          ) : (
            /* Scanning State */
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                Scanning Your System...
              </h2>
              <div className="max-w-md mx-auto space-y-3 text-left">
                <div className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 animate-pulse"></div>
                  Detecting storage devices
                </div>
                <div className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 animate-pulse animation-delay-200"></div>
                  Analyzing file systems
                </div>
                <div className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 animate-pulse animation-delay-400"></div>
                  Checking permissions
                </div>
                <div className="flex items-center text-gray-600">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mr-3 animate-pulse animation-delay-600"></div>
                  Preparing dashboard
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-6">
                This usually takes 10-30 seconds...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>
            Version 1.0.0 | Windows Prototype | NIST SP 800-88 Rev. 1 Compliant — Made with love by Aqdas Mirza ❤️
          </p>
        </div>
      </div>
    </div>
  );
};

export default SystemScan;