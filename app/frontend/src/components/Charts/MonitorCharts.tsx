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
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface AppointmentTrendsChartProps {
  appointmentsByDate: Array<{
    date: string;
    count: number;
  }>;
  appointmentTrends: {
    thisWeek: number;
    lastWeek: number;
    trend: 'up' | 'down' | 'stable';
  };
}

const COLORS = ['#FF8042', '#00C49F', '#0088FE', '#FFBB28'];

export const AppointmentTrendsChart: React.FC<AppointmentTrendsChartProps> = ({ 
  appointmentsByDate, 
  appointmentTrends 
}) => {
  // Prepare last 7 days data
  const last7Days = appointmentsByDate.slice(-7);
  
  // Prepare weekly comparison data
  const weeklyData = [
    { name: 'Last Week', appointments: appointmentTrends.lastWeek, fill: '#FF8042' },
    { name: 'This Week', appointments: appointmentTrends.thisWeek, fill: '#00C49F' }
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium text-gray-900">Appointment Trends</h3>
        <p className="text-sm text-gray-500 mt-1">Weekly comparison and 7-day history</p>
      </div>
      <div className="card-body">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Weekly Comparison */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Weekly Comparison</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="appointments" fill="#8884d8">
                  {weeklyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div className="mt-4 text-center">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                appointmentTrends.trend === 'up' ? 'bg-green-100 text-green-800' :
                appointmentTrends.trend === 'down' ? 'bg-red-100 text-red-800' :
                'bg-gray-100 text-gray-800'
              }`}>
                {appointmentTrends.trend === 'up' ? '↑ Increasing' :
                 appointmentTrends.trend === 'down' ? '↓ Decreasing' :
                 '→ Stable'}
              </span>
            </div>
          </div>

          {/* Last 7 Days Line Chart */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-4">Last 7 Days</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={last7Days}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#0088FE" 
                  strokeWidth={2}
                  name="Appointments"
                  dot={{ fill: '#0088FE', r: 5 }}
                  activeDot={{ r: 7 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export const LoginByRoleChart: React.FC<{ loginsByRole: { patients: number; doctors: number; admins: number } }> = ({ 
  loginsByRole 
}) => {
  const data = [
    { name: 'Patients', value: loginsByRole.patients, color: '#0088FE' },
    { name: 'Doctors', value: loginsByRole.doctors, color: '#00C49F' },
    { name: 'Admins', value: loginsByRole.admins, color: '#FFBB28' }
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium text-gray-900">Login Activity by Role</h3>
        <p className="text-sm text-gray-500 mt-1">Distribution of logins across user roles</p>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const UserCountsChart: React.FC<{ 
  userCountsByRole: { patients: number; doctors: number; admins: number; monitors: number } 
}> = ({ userCountsByRole }) => {
  const data = [
    { name: 'Patients', count: userCountsByRole.patients, fill: '#0088FE' },
    { name: 'Doctors', count: userCountsByRole.doctors, fill: '#00C49F' },
    { name: 'Admins', count: userCountsByRole.admins, fill: '#FFBB28' },
    { name: 'Monitors', count: userCountsByRole.monitors, fill: '#FF8042' }
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium text-gray-900">Registered Users by Role</h3>
        <p className="text-sm text-gray-500 mt-1">Total registered users in the system</p>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" name="User Count">
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export const DoctorAppointmentsChart: React.FC<{ 
  appointmentsByDoctor: Array<{
    doctorName: string;
    doctorId: string;
    totalAppointments: number;
    todayAppointments: number;
    pendingAppointments: number;
    completedAppointments: number;
  }> 
}> = ({ appointmentsByDoctor }) => {
  // Take top 5 doctors
  const topDoctors = appointmentsByDoctor.slice(0, 5);

  return (
    <div className="card">
      <div className="card-header">
        <h3 className="text-lg font-medium text-gray-900">Top Doctors by Appointments</h3>
        <p className="text-sm text-gray-500 mt-1">Appointment breakdown by status</p>
      </div>
      <div className="card-body">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={topDoctors}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="doctorName" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="completedAppointments" fill="#00C49F" name="Completed" stackId="a" />
            <Bar dataKey="pendingAppointments" fill="#FFBB28" name="Pending" stackId="a" />
            <Bar dataKey="todayAppointments" fill="#0088FE" name="Today" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default {
  AppointmentTrendsChart,
  LoginByRoleChart,
  UserCountsChart,
  DoctorAppointmentsChart
};

