import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Calendar, 
  FileText, 
  Users, 
  Settings, 
  Clock,
  User,
  X,
  Stethoscope,
  Shield,
  BarChart3,
  UserCheck,
  BookOpen,
  LogOut
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['patient', 'doctor', 'admin'],
    },
    {
      name: 'Book Appointment',
      href: '/book-appointment',
      icon: Calendar,
      roles: ['patient'],
    },
    {
      name: 'My Appointments',
      href: '/appointments',
      icon: Calendar,
      roles: ['patient', 'doctor', 'admin'],
    },
    {
      name: 'Medical Records',
      href: '/medical-records',
      icon: FileText,
      roles: ['patient', 'doctor', 'admin'],
    },
    {
      name: 'Doctor Dashboard',
      href: '/doctor-dashboard',
      icon: Stethoscope,
      roles: ['doctor'],
    },
    {
      name: 'Manage Records',
      href: '/medical-records-management',
      icon: BookOpen,
      roles: ['doctor'],
    },
    {
      name: 'My Availability',
      href: '/availability-management',
      icon: Clock,
      roles: ['doctor'],
    },
    {
      name: 'Admin Dashboard',
      href: '/admin-dashboard',
      icon: Shield,
      roles: ['admin'],
    },
    {
      name: 'User Management',
      href: '/users',
      icon: Users,
      roles: ['admin'],
    },
    {
      name: 'Monitoring & Reports',
      href: '/monitoring-dashboard',
      icon: BarChart3,
      roles: ['admin'],
    },
    {
      name: 'Testing Suite',
      href: '/testing',
      icon: UserCheck,
      roles: ['patient'],
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: User,
      roles: ['patient', 'doctor', 'admin'],
    },
  ];

  const filteredNavigation = navigation.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-white to-gray-50 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-cyan-600">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 bg-white rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-blue-600 font-bold text-sm">MA</span>
              </div>
            </div>
            <div className="ml-3">
              <h1 className="text-lg font-semibold text-white">
                MediAccessHub
              </h1>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-white hover:text-gray-200 hover:bg-blue-700 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="mt-8 px-4">
          <ul className="space-y-2">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <NavLink
                    to={item.href}
                    className={({ isActive }) =>
                      `group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-gray-900'
                      }`
                    }
                    onClick={onClose}
                  >
                    <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                    {item.name}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User info and logout at bottom */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-gray-200 bg-white">
          <div className="p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center shadow-sm">
                <User className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate capitalize">
                  {user?.role}
                </p>
              </div>
            </div>
            
            {/* Logout button */}
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;

