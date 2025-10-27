import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import apiService from '../services/api';
import { 
  Settings, 
  Database, 
  RefreshCw, 
  FileText, 
  HardDrive, 
  Activity, 
  XCircle,
  Clock,
  Server,
  Shield,
  Trash2,
  Filter,
  Calendar
} from 'lucide-react';
import { toast } from 'react-toastify';

interface SystemInfo {
  version: string;
  environment: string;
  database: string;
  uptime: number;
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  platform: string;
  nodeVersion: string;
  lastBackup: string;
  totalUsers: number;
  totalAppointments: number;
  totalSchedules: number;
  totalRecords: number;
}

interface SystemLog {
  id: number;
  timestamp: string;
  level: string;
  message: string;
  userId?: string;
  ip?: string;
  details?: string;
}

const SystemSettingsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [systemInfo, setSystemInfo] = useState<SystemInfo | null>(null);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [logLevel, setLogLevel] = useState('');
  const [logLimit, setLogLimit] = useState(100);

  useEffect(() => {
    if (user?.role === 'admin') {
      loadSystemData();
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSystemData = async () => {
    try {
      setIsLoading(true);
      const [infoResponse, logsResponse] = await Promise.all([
        apiService.getSystemInfo(),
        apiService.getSystemLogs(logLevel, logLimit)
      ]);

      setSystemInfo(infoResponse.data.data);
      setSystemLogs(logsResponse.data.data.logs);
    } catch (error) {
      console.error('Failed to load system data:', error);
      toast.error('Failed to load system data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async (dataType: string, format: string = 'json') => {
    try {
      setIsExporting(true);
      const response = await apiService.exportSystemData(dataType, format);
      
      // Create download link
      const blob = new Blob([JSON.stringify(response.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${dataType}-export-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`${dataType} exported successfully`);
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Export failed');
    } finally {
      setIsExporting(false);
    }
  };

  const handleClearCache = async () => {
    try {
      await apiService.clearSystemCache();
      toast.success('System cache cleared successfully');
      loadSystemData(); // Reload data to reflect changes
    } catch (error) {
      console.error('Cache clear failed:', error);
      toast.error('Failed to clear cache');
    }
  };

  const handleSystemBackup = async () => {
    try {
      setIsBackingUp(true);
      await apiService.performSystemBackup();
      toast.success('System backup initiated successfully');
    } catch (error) {
      console.error('Backup failed:', error);
      toast.error('Backup failed');
    } finally {
      setIsBackingUp(false);
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatMemory = (bytes: number) => {
    return (bytes / 1024 / 1024).toFixed(2) + ' MB';
  };

  const getLogLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You need admin privileges to access system settings.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Settings className="h-6 w-6 mr-3 text-primary-600" />
                System Settings
              </h1>
              <p className="text-gray-600 mt-1">Manage system configuration and maintenance</p>
            </div>
            <button
              onClick={loadSystemData}
              className="btn-outline flex items-center"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: Activity },
              { id: 'data-management', label: 'Data Management', icon: Database },
              { id: 'system-logs', label: 'System Logs', icon: FileText },
              { id: 'maintenance', label: 'Maintenance', icon: HardDrive },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4 mr-2" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && systemInfo && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Server className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">System Uptime</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatUptime(systemInfo.uptime)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Database className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-semibold text-gray-900">{systemInfo.totalUsers}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Appointments</p>
                    <p className="text-2xl font-semibold text-gray-900">{systemInfo.totalAppointments}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Shield className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Version</p>
                    <p className="text-2xl font-semibold text-gray-900">{systemInfo.version}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">System Information</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Environment:</span>
                    <span className="font-medium">{systemInfo.environment}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Database:</span>
                    <span className="font-medium">{systemInfo.database}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Platform:</span>
                    <span className="font-medium">{systemInfo.platform}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Node Version:</span>
                    <span className="font-medium">{systemInfo.nodeVersion}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Last Backup:</span>
                    <span className="font-medium">{new Date(systemInfo.lastBackup).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Memory Usage</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">RSS:</span>
                    <span className="font-medium">{formatMemory(systemInfo.memory.rss)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Heap Total:</span>
                    <span className="font-medium">{formatMemory(systemInfo.memory.heapTotal)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Heap Used:</span>
                    <span className="font-medium">{formatMemory(systemInfo.memory.heapUsed)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">External:</span>
                    <span className="font-medium">{formatMemory(systemInfo.memory.external)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Management Tab */}
        {activeTab === 'data-management' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Data Export</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { type: 'users', label: 'Users', icon: Database },
                  { type: 'appointments', label: 'Appointments', icon: Calendar },
                  { type: 'schedules', label: 'Schedules', icon: Clock },
                  { type: 'medical-records', label: 'Medical Records', icon: FileText },
                  { type: 'system-log', label: 'System Logs', icon: Activity },
                ].map((item) => (
                  <div key={item.type} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <item.icon className="h-5 w-5 text-gray-600 mr-2" />
                      <h4 className="font-medium text-gray-900">{item.label}</h4>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleExportData(item.type, 'json')}
                        disabled={isExporting}
                        className="btn-outline text-xs flex-1"
                      >
                        {isExporting ? 'Exporting...' : 'JSON'}
                      </button>
                      <button
                        onClick={() => handleExportData(item.type, 'csv')}
                        disabled={isExporting}
                        className="btn-outline text-xs flex-1"
                      >
                        {isExporting ? 'Exporting...' : 'CSV'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* System Logs Tab */}
        {activeTab === 'system-logs' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">System Logs</h3>
                <div className="flex space-x-2">
                  <select
                    value={logLevel}
                    onChange={(e) => setLogLevel(e.target.value)}
                    className="border border-gray-300 rounded px-3 py-1 text-sm"
                  >
                    <option value="">All Levels</option>
                    <option value="error">Error</option>
                    <option value="warn">Warning</option>
                    <option value="info">Info</option>
                  </select>
                  <select
                    value={logLimit}
                    onChange={(e) => setLogLimit(parseInt(e.target.value))}
                    className="border border-gray-300 rounded px-3 py-1 text-sm"
                  >
                    <option value={50}>50 logs</option>
                    <option value={100}>100 logs</option>
                    <option value={200}>200 logs</option>
                  </select>
                  <button
                    onClick={loadSystemData}
                    className="btn-outline text-sm"
                  >
                    <Filter className="h-4 w-4 mr-1" />
                    Filter
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Level</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Message</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Details</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {systemLogs.map((log) => (
                      <tr key={log.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getLogLevelColor(log.level)}`}>
                            {log.level.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{log.message}</td>
                        <td className="px-6 py-4 text-sm text-gray-500">{log.details || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Maintenance Tab */}
        {activeTab === 'maintenance' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">System Maintenance</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <Trash2 className="h-5 w-5 text-orange-600 mr-2" />
                    <h4 className="font-medium text-gray-900">Clear System Cache</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Clear all cached data to free up memory and ensure fresh data.</p>
                  <button
                    onClick={handleClearCache}
                    className="btn-outline w-full"
                  >
                    Clear Cache
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <HardDrive className="h-5 w-5 text-blue-600 mr-2" />
                    <h4 className="font-medium text-gray-900">System Backup</h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Create a full backup of the system database and configuration.</p>
                  <button
                    onClick={handleSystemBackup}
                    disabled={isBackingUp}
                    className="btn-primary w-full"
                  >
                    {isBackingUp ? 'Backing up...' : 'Create Backup'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemSettingsPage;
