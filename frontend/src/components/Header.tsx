import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Monitor, Shield, FileText, RotateCcw, User, Computer } from 'lucide-react';
import { SystemInfo } from '../App';

interface HeaderProps {
  systemInfo: SystemInfo | null;
  isScanning: boolean;
  onRescan: () => void;
}

const Header: React.FC<HeaderProps> = ({ systemInfo, isScanning, onRescan }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Secure Data Wiper</h1>
                <p className="text-xs text-gray-500">NIST SP 800-88 Compliant</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          {systemInfo && (
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                to="/dashboard"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive('/dashboard')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Monitor className="w-4 h-4 inline mr-2" />
                Dashboard
              </Link>
              
              <Link
                to="/wipe"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive('/wipe')
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Shield className="w-4 h-4 inline mr-2" />
                Secure Wipe
              </Link>
              
              <Link
                to="/reports"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive('/reports')
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-4 h-4 inline mr-2" />
                Reports
              </Link>
            </nav>
          )}

          {/* System Info and Actions */}
          <div className="flex items-center space-x-4">
            {systemInfo && (
              <>
                {/* System Info Dropdown */}
                <div className="hidden lg:flex items-center text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
                  <Computer className="w-4 h-4 mr-2" />
                  <span className="mr-4">{systemInfo.hostname}</span>
                  <User className="w-4 h-4 mr-1" />
                  <span>{systemInfo.user}</span>
                  {systemInfo.permissions.isAdmin && (
                    <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                      Admin
                    </span>
                  )}
                </div>

                {/* Rescan Button */}
                <button
                  onClick={onRescan}
                  disabled={isScanning}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Rescan system"
                >
                  <RotateCcw className={`w-4 h-4 mr-1 ${isScanning ? 'animate-spin' : ''}`} />
                  {isScanning ? 'Scanning...' : 'Rescan'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        {systemInfo && (
          <div className="md:hidden pb-3 border-t border-gray-100 mt-3 pt-3">
            <nav className="flex space-x-1">
              <Link
                to="/dashboard"
                className={`flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive('/dashboard')
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Monitor className="w-4 h-4 mx-auto mb-1" />
                Dashboard
              </Link>
              
              <Link
                to="/wipe"
                className={`flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive('/wipe')
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Shield className="w-4 h-4 mx-auto mb-1" />
                Wipe
              </Link>
              
              <Link
                to="/reports"
                className={`flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  isActive('/reports')
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-4 h-4 mx-auto mb-1" />
                Reports
              </Link>
            </nav>
          </div>
        )}

        {/* System Status Bar */}
        {systemInfo && (
          <div className="lg:hidden pb-3">
            <div className="text-xs text-gray-500 bg-gray-50 rounded px-3 py-2">
              <span className="font-medium">{systemInfo.hostname}</span>
              <span className="mx-2">•</span>
              <span>{systemInfo.user}</span>
              {systemInfo.permissions.isAdmin && (
                <>
                  <span className="mx-2">•</span>
                  <span className="text-yellow-700">Administrator</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;