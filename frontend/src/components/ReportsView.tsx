import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Download, 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  HardDrive,
  Eye,
  Trash2,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

interface Report {
  reportId: string;
  sessionId: string;
  timestamp: Date;
  totalFiles: number;
  totalBytes: number;
  securityLevel: string;
  compliant: boolean;
}

interface DetailedReport {
  reportId: string;
  sessionId: string;
  timestamp: Date;
  systemInfo: {
    hostname: string;
    platform: string;
    user: string;
    nodeVersion: string;
  };
  wipingDetails: {
    filesWiped: Array<{
      originalPath: string;
      size: number;
      lastModified: Date;
      wipedAt: Date;
      passes: number;
      verified: boolean;
    }>;
    securityLevel: string;
    totalFiles: number;
    totalBytes: number;
    duration: number;
    passes: number;
  };
  verification: {
    method: string;
    successful: boolean;
    details: string;
    timestamp: Date;
  };
  compliance: {
    standard: string;
    certified: boolean;
    details: string[];
  };
  integrity: {
    reportHash: string;
    signature: string;
  };
}

const ReportsView: React.FC = () => {
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<DetailedReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/reports');
      if (response.data?.success && Array.isArray(response.data.data)) {
        const mapped: Report[] = response.data.data.map((item: any) => ({
          reportId: item.reportId,
          sessionId: item.sessionId,
          timestamp: new Date(item.timestamp || item.createdAt),
          totalFiles: item.details?.totalFiles ?? 0,
          totalBytes: item.details?.totalBytes ?? 0,
          securityLevel: item.details?.securityLevel ?? 'standard',
          compliant: item.details?.verified ?? true
        }));
        setReports(mapped);
      } else {
        setReports([]);
      }
    } catch (error: any) {
      setError('Failed to load reports');
    } finally {
      setLoading(false);
    }
  };

  const viewReportDetails = async (reportId: string) => {
    try {
      const response = await axios.get(`/api/reports/${reportId}`);
      if (response.data.success) {
        setSelectedReport({
          ...response.data.data,
          timestamp: new Date(response.data.data.timestamp),
          verification: {
            ...response.data.data.verification,
            timestamp: new Date(response.data.data.verification.timestamp)
          },
          wipingDetails: {
            ...response.data.data.wipingDetails,
            filesWiped: response.data.data.wipingDetails.filesWiped.map((file: any) => ({
              ...file,
              lastModified: new Date(file.lastModified),
              wipedAt: new Date(file.wipedAt)
            }))
          }
        });
        setShowDetails(true);
      }
    } catch (error: any) {
      setError('Failed to load report details');
    }
  };

  const downloadReport = async (reportId: string, format: 'pdf' | 'json') => {
    try {
      const response = await fetch(`/api/reports/download/${reportId}/${format}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SecureWipe_Report_${reportId.substring(0, 8)}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        throw new Error('Download failed');
      }
    } catch (error) {
      setError(`Failed to download ${format.toUpperCase()} report`);
    }
  };

  const verifyReportIntegrity = async (reportId: string) => {
    try {
      const response = await axios.post(`/api/reports/verify/${reportId}`);
      if (response.data.success) {
        const { isValid } = response.data.data;
        alert(isValid ? 'Report integrity verified ✅' : 'Report integrity check failed ❌');
      }
    } catch (error) {
      setError('Failed to verify report integrity');
    }
  };

  const formatBytes = (bytes: number): string => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const getSecurityLevelColor = (level: string): string => {
    switch (level.toLowerCase()) {
      case 'quick': return 'text-green-600 bg-green-100';
      case 'standard': return 'text-blue-600 bg-blue-100';
      case 'maximum': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Loading reports...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Wiping Reports</h1>
            <p className="text-gray-600">
              View and download verification reports for completed wiping operations
            </p>
          </div>
          <button
            onClick={fetchReports}
            className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>
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
              ×
            </button>
          </div>
        </div>
      )}

      {/* Reports List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {reports.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Reports Available</h3>
            <p className="text-gray-600">
              Complete a secure wiping operation to generate your first report.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Report
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Files Wiped
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Security Level
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports.map((report) => (
                  <tr key={report.reportId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <FileText className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {report.reportId.substring(0, 8)}
                          </div>
                          <div className="text-sm text-gray-500">
                            Session: {report.sessionId.substring(0, 8)}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {report.timestamp.toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {report.timestamp.toLocaleTimeString()}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {report.totalFiles} files
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatBytes(report.totalBytes)}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getSecurityLevelColor(report.securityLevel)}`}>
                        {report.securityLevel.charAt(0).toUpperCase() + report.securityLevel.slice(1)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {report.compliant ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
                            <span className="text-sm text-green-600 font-medium">Compliant</span>
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="w-4 h-4 text-red-600 mr-1" />
                            <span className="text-sm text-red-600 font-medium">Non-compliant</span>
                          </>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => viewReportDetails(report.reportId)}
                          className="text-blue-600 hover:text-blue-800 p-1 rounded"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadReport(report.reportId, 'pdf')}
                          className="text-green-600 hover:text-green-800 p-1 rounded"
                          title="Download PDF"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => downloadReport(report.reportId, 'json')}
                          className="text-purple-600 hover:text-purple-800 p-1 rounded"
                          title="Download JSON"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => verifyReportIntegrity(report.reportId)}
                          className="text-orange-600 hover:text-orange-800 p-1 rounded"
                          title="Verify Integrity"
                        >
                          <Shield className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Report Details Modal */}
      {showDetails && selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Report Details</h2>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="text-2xl">×</span>
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Report Header */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Report Information</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-500">Report ID:</span> {selectedReport.reportId}</p>
                      <p><span className="text-gray-500">Generated:</span> {selectedReport.timestamp.toLocaleString()}</p>
                      <p><span className="text-gray-500">Session ID:</span> {selectedReport.sessionId}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">System Information</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="text-gray-500">Hostname:</span> {selectedReport.systemInfo.hostname}</p>
                      <p><span className="text-gray-500">Platform:</span> {selectedReport.systemInfo.platform}</p>
                      <p><span className="text-gray-500">User:</span> {selectedReport.systemInfo.user}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Wiping Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Wiping Operation</h3>
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Security Level</p>
                      <p className="font-semibold text-gray-900">
                        {selectedReport.wipingDetails.securityLevel.charAt(0).toUpperCase() + 
                         selectedReport.wipingDetails.securityLevel.slice(1)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Files Processed</p>
                      <p className="font-semibold text-gray-900">{selectedReport.wipingDetails.totalFiles}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Data</p>
                      <p className="font-semibold text-gray-900">{formatBytes(selectedReport.wipingDetails.totalBytes)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Overwrite Passes</p>
                      <p className="font-semibold text-gray-900">{selectedReport.wipingDetails.passes}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Duration</p>
                      <p className="font-semibold text-gray-900">{formatDuration(selectedReport.wipingDetails.duration)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Files List */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Wiped Files</h3>
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {selectedReport.wipingDetails.filesWiped.slice(0, 20).map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border-b last:border-b-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{file.originalPath}</p>
                        <p className="text-xs text-gray-500">
                          {formatBytes(file.size)} • {file.passes} passes • Wiped: {file.wipedAt.toLocaleString()}
                        </p>
                      </div>
                      <div className="ml-4">
                        {file.verified ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </div>
                  ))}
                  {selectedReport.wipingDetails.filesWiped.length > 20 && (
                    <div className="p-3 text-center text-sm text-gray-500">
                      ... and {selectedReport.wipingDetails.filesWiped.length - 20} more files
                    </div>
                  )}
                </div>
              </div>

              {/* Compliance */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">NIST Compliance</h3>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-semibold text-green-800">
                      {selectedReport.compliance.standard} Compliant
                    </span>
                  </div>
                  <ul className="text-sm text-green-700 space-y-1">
                    {selectedReport.compliance.details.map((detail, index) => (
                      <li key={index}>• {detail}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Verification */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Verification</h3>
                <div className={`rounded-lg p-4 ${
                  selectedReport.verification.successful 
                    ? 'bg-green-50 border border-green-200' 
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center mb-2">
                    {selectedReport.verification.successful ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                    )}
                    <span className={`font-semibold ${
                      selectedReport.verification.successful ? 'text-green-800' : 'text-red-800'
                    }`}>
                      Verification {selectedReport.verification.successful ? 'Passed' : 'Failed'}
                    </span>
                  </div>
                  <p className={`text-sm ${
                    selectedReport.verification.successful ? 'text-green-700' : 'text-red-700'
                  }`}>
                    Method: {selectedReport.verification.method}
                  </p>
                  <p className={`text-sm ${
                    selectedReport.verification.successful ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {selectedReport.verification.details}
                  </p>
                </div>
              </div>

              {/* Digital Signature */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Digital Integrity</h3>
                <div className="bg-gray-50 rounded-lg p-4 font-mono text-xs">
                  <div className="mb-2">
                    <span className="text-gray-500">SHA-256 Hash:</span>
                    <p className="break-all">{selectedReport.integrity.reportHash}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Digital Signature:</span>
                    <p className="break-all">{selectedReport.integrity.signature}</p>
                  </div>
                </div>
              </div>

              {/* Download Actions */}
              <div className="flex justify-center space-x-4 pt-4 border-t">
                <button
                  onClick={() => downloadReport(selectedReport.reportId, 'pdf')}
                  className="flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download PDF
                </button>
                <button
                  onClick={() => downloadReport(selectedReport.reportId, 'json')}
                  className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Download JSON
                </button>
                <button
                  onClick={() => verifyReportIntegrity(selectedReport.reportId)}
                  className="flex items-center px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  Verify Integrity
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;