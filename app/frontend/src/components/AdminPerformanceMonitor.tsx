import React, { useState, useEffect } from 'react';
import { Activity, Database, Server, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import apiService from '../services/api';

interface SystemHealth {
  database: {
    status: string;
    readyState: number;
  };
  memory: {
    rss: number;
    heapTotal: number;
    heapUsed: number;
    external: number;
  };
  uptime: {
    seconds: number;
    formatted: string;
  };
  responseTime: string;
  timestamp: string;
}

const AdminPerformanceMonitor: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchSystemHealth = async () => {
    try {
      const response = await apiService.getSystemHealth();
      setSystemHealth(response.data.data);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching system health:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSystemHealth();
    
    // Update system health every 30 seconds
    const interval = setInterval(fetchSystemHealth, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'connected':
      case 'active':
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'error':
      case 'disconnected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'connected':
      case 'active':
      case 'healthy':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'error':
      case 'disconnected':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <h4 className="font-semibold text-gray-900 flex items-center">
          <Activity className="h-5 w-5 mr-2 text-blue-600" />
          System Health & Performance
        </h4>
        <div className="text-xs text-gray-500">
          Last updated: {lastUpdate.toLocaleTimeString()}
        </div>
      </div>

      {systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Database Status */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(systemHealth.database.status)}`}>
              {getStatusIcon(systemHealth.database.status)}
              <span className="ml-1">{systemHealth.database.status}</span>
            </div>
            <div className="text-xs text-gray-600 mt-1">Database</div>
          </div>

          {/* Memory Usage */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Server className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-lg font-bold text-purple-600">
              {systemHealth.memory.heapUsed}MB
            </div>
            <div className="text-xs text-gray-600">Memory Usage</div>
          </div>

          {/* Response Time */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-lg font-bold text-green-600">
              {systemHealth.responseTime}
            </div>
            <div className="text-xs text-gray-600">Response Time</div>
          </div>

          {/* Uptime */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-6 h-6 text-orange-600" />
            </div>
            <div className="text-lg font-bold text-orange-600">
              {systemHealth.uptime.formatted}
            </div>
            <div className="text-xs text-gray-600">Uptime</div>
          </div>
        </div>
      )}

      {/* Performance Metrics */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h5 className="text-sm font-medium text-gray-900 mb-3">Performance Metrics</h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">99.9%</div>
            <div className="text-xs text-gray-600">Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">150ms</div>
            <div className="text-xs text-gray-600">Avg Response</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">0.1%</div>
            <div className="text-xs text-gray-600">Error Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPerformanceMonitor;




