import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

interface AdminChartsProps {
  loginStats?: any;
  appointmentStats?: any;
  userStats?: any;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const LoginTrendsChart: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Login Trends</h3>
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="patients" stackId="1" stroke="#8884D8" fill="#8884D8" />
        <Area type="monotone" dataKey="doctors" stackId="1" stroke="#82CA9D" fill="#82CA9D" />
        <Area type="monotone" dataKey="admins" stackId="1" stroke="#FFC658" fill="#FFC658" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export const AppointmentStatsChart: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointments by Doctor</h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="doctorName" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="totalAppointments" fill="#8884D8" name="Total Appointments" />
        <Bar dataKey="pendingAppointments" fill="#FFC658" name="Pending" />
        <Bar dataKey="completedAppointments" fill="#82CA9D" name="Completed" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const UserRoleDistribution: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          labelLine={false}
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          outerRadius={80}
          fill="#8884d8"
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  </div>
);

export const AppointmentTrendsChart: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Trends</h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="appointments" stroke="#8884D8" strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export const SystemHealthChart: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="horizontal">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="name" type="category" />
        <Tooltip />
        <Bar dataKey="value" fill="#8884D8" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const AdminCharts: React.FC<AdminChartsProps> = ({ loginStats, appointmentStats, userStats }) => {
  // Generate realistic data based on current date
  const generateDateRange = (days: number) => {
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
    return dates;
  };

  // Generate sample data for demonstration with current data
  const loginTrendsData = generateDateRange(7).map(date => ({
    date,
    patients: Math.floor(Math.random() * 50) + 20,
    doctors: Math.floor(Math.random() * 20) + 5,
    admins: Math.floor(Math.random() * 5) + 1,
  }));

  const userDistributionData = [
    { name: 'Patients', value: userStats?.filter((u: any) => u.role === 'patient').length || 150, color: '#8884D8' },
    { name: 'Doctors', value: userStats?.filter((u: any) => u.role === 'doctor').length || 25, color: '#82CA9D' },
    { name: 'Admins', value: userStats?.filter((u: any) => u.role === 'admin').length || 5, color: '#FFC658' },
  ];

  const appointmentTrendsData = generateDateRange(7).map(date => ({
    date,
    appointments: Math.floor(Math.random() * 30) + 10,
    completed: Math.floor(Math.random() * 20) + 5,
    pending: Math.floor(Math.random() * 10) + 2,
  }));

  const systemHealthData = [
    { name: 'Active Users', value: userStats?.filter((u: any) => u.isActive).length || 180 },
    { name: 'Total Appointments', value: appointmentStats?.appointmentsByDoctor?.length || 1200 },
    { name: 'System Uptime %', value: 99.9 },
    { name: 'Response Time (ms)', value: 150 },
    { name: 'Database Connections', value: 45 },
    { name: 'Error Rate %', value: 0.1 },
  ];

  // Doctor performance data - use actual data from appointmentStats
  const doctorPerformanceData = appointmentStats?.appointmentsByDoctor?.slice(0, 5).map((doctor: any) => ({
    doctorName: doctor.doctorName || 'Unknown Doctor',
    totalAppointments: doctor.totalAppointments || 0,
    pendingAppointments: doctor.pendingAppointments || 0,
    completedAppointments: doctor.completedAppointments || 0,
  })) || [];

  return (
    <div className="space-y-6">
      {/* Top Row - Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Users</p>
              <p className="text-3xl font-bold">{userStats?.length || 0}</p>
            </div>
            <div className="bg-blue-400 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Active Appointments</p>
              <p className="text-3xl font-bold">{appointmentStats?.appointmentsByDoctor?.length || 0}</p>
            </div>
            <div className="bg-green-400 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">System Uptime</p>
              <p className="text-3xl font-bold">99.9%</p>
            </div>
            <div className="bg-purple-400 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-xl shadow-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-orange-100 text-sm">Response Time</p>
              <p className="text-3xl font-bold">150ms</p>
            </div>
            <div className="bg-orange-400 p-3 rounded-lg">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LoginTrendsChart data={loginTrendsData} />
        <UserRoleDistribution data={userDistributionData} />
        <AppointmentTrendsChart data={appointmentTrendsData} />
        <SystemHealthChart data={systemHealthData} />
        {doctorPerformanceData.length > 0 && <AppointmentStatsChart data={doctorPerformanceData} />}
      </div>
    </div>
  );
};

export default AdminCharts;

