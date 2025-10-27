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

interface DoctorChartsProps {
  appointments?: any[];
  medicalRecords?: any[];
  availability?: any[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export const AppointmentStatusChart: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Appointment Status</h3>
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

export const WeeklyAppointmentsChart: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Weekly Appointments</h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="day" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="appointments" fill="#8884D8" name="Appointments" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const PatientAgeDistribution: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Patient Age Distribution</h3>
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="ageGroup" />
        <YAxis />
        <Tooltip />
        <Area type="monotone" dataKey="patients" stroke="#8884D8" fill="#8884D8" />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

export const MonthlyTrendsChart: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="month" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="appointments" stroke="#8884D8" strokeWidth={2} name="Appointments" />
        <Line type="monotone" dataKey="records" stroke="#82CA9D" strokeWidth={2} name="Medical Records" />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export const AvailabilityChart: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Availability Schedule</h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="horizontal">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" />
        <YAxis dataKey="day" type="category" />
        <Tooltip />
        <Bar dataKey="hours" fill="#8884D8" name="Available Hours" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export const TopPatientsChart: React.FC<{ data: any[] }> = ({ data }) => (
  <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Patients by Appointments</h3>
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="patient" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="appointments" fill="#8884D8" name="Appointments" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

const DoctorCharts: React.FC<DoctorChartsProps> = ({ appointments, medicalRecords, availability }) => {
  // Sample data for demonstration
  const appointmentStatusData = [
    { name: 'Pending', value: 15 },
    { name: 'Confirmed', value: 25 },
    { name: 'Completed', value: 40 },
    { name: 'Cancelled', value: 5 },
  ];

  const weeklyAppointmentsData = [
    { day: 'Mon', appointments: 8 },
    { day: 'Tue', appointments: 12 },
    { day: 'Wed', appointments: 10 },
    { day: 'Thu', appointments: 15 },
    { day: 'Fri', appointments: 11 },
    { day: 'Sat', appointments: 6 },
    { day: 'Sun', appointments: 3 },
  ];

  const patientAgeData = [
    { ageGroup: '0-18', patients: 5 },
    { ageGroup: '19-35', patients: 15 },
    { ageGroup: '36-50', patients: 20 },
    { ageGroup: '51-65', patients: 25 },
    { ageGroup: '65+', patients: 10 },
  ];

  const monthlyTrendsData = [
    { month: 'Jan', appointments: 45, records: 38 },
    { month: 'Feb', appointments: 52, records: 42 },
    { month: 'Mar', appointments: 48, records: 45 },
    { month: 'Apr', appointments: 61, records: 50 },
    { month: 'May', appointments: 55, records: 48 },
    { month: 'Jun', appointments: 58, records: 52 },
  ];

  const availabilityData = [
    { day: 'Monday', hours: 8 },
    { day: 'Tuesday', hours: 8 },
    { day: 'Wednesday', hours: 6 },
    { day: 'Thursday', hours: 8 },
    { day: 'Friday', hours: 7 },
    { day: 'Saturday', hours: 4 },
    { day: 'Sunday', hours: 0 },
  ];

  const topPatientsData = [
    { patient: 'John Smith', appointments: 12 },
    { patient: 'Sarah Johnson', appointments: 10 },
    { patient: 'Mike Brown', appointments: 8 },
    { patient: 'Emily Davis', appointments: 7 },
    { patient: 'David Wilson', appointments: 6 },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <AppointmentStatusChart data={appointmentStatusData} />
      <WeeklyAppointmentsChart data={weeklyAppointmentsData} />
      <PatientAgeDistribution data={patientAgeData} />
      <MonthlyTrendsChart data={monthlyTrendsData} />
      <AvailabilityChart data={availabilityData} />
      <TopPatientsChart data={topPatientsData} />
    </div>
  );
};

export default DoctorCharts;





