import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Menu, 
  X, 
  Home, 
  Users, 
  GraduationCap, 
  Calendar, 
  FileText, 
  DollarSign, 
  Clock, 
  Bell,
  ClipboardList,
  BookOpen,
  LogOut 
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: Home },
      { name: 'Notifications', href: '/notifications', icon: Bell }
    ];

    if (user?.role === 'admin') {
      return [
        ...baseItems,
        { name: 'Students', href: '/students', icon: Users },
        { name: 'Faculty', href: '/faculty', icon: GraduationCap },
        { name: 'Admissions', href: '/admissions', icon: ClipboardList },
        { name: 'Attendance', href: '/attendance', icon: Calendar },
        { name: 'Exam Schedule', href: '/exam-schedule', icon: BookOpen },
        { name: 'Results', href: '/results', icon: FileText },
        { name: 'Fees', href: '/fees', icon: DollarSign },
        { name: 'Timetables', href: '/timetables', icon: Clock }
      ];
    }

    if (user?.role === 'hod') {
      return [
        ...baseItems,
        { name: 'Students', href: '/students', icon: Users },
        { name: 'Faculty', href: '/faculty', icon: GraduationCap },
        { name: 'Attendance', href: '/attendance', icon: Calendar },
        { name: 'Exam Schedule', href: '/exam-schedule', icon: BookOpen },
        { name: 'Results', href: '/results', icon: FileText },
        { name: 'Reports', href: '/reports', icon: FileText },
        { name: 'Fees', href: '/fees', icon: DollarSign },
        { name: 'Timetables', href: '/timetables', icon: Clock }
      ];
    }

    if (user?.role === 'faculty') {
      return [
        ...baseItems,
        { name: 'Attendance', href: '/attendance', icon: Calendar },
        { name: 'Exam Schedule', href: '/exam-schedule', icon: BookOpen },
        { name: 'Results', href: '/results', icon: FileText },
        { name: 'Reports', href: '/reports', icon: FileText },
        { name: 'Fees', href: '/fees', icon: DollarSign },
        { name: 'Exams', href: '/exams', icon: FileText },
        { name: 'Timetables', href: '/timetables', icon: Clock }
      ];
    }

    if (user?.role === 'student') {
      return [
        ...baseItems,
        { name: 'My Profile', href: '/profile', icon: Users },
        { name: 'Attendance', href: '/attendance', icon: Calendar },
        { name: 'Exam Schedule', href: '/exam-schedule', icon: BookOpen },
        { name: 'Results', href: '/results', icon: FileText },
        { name: 'Reports', href: '/reports', icon: FileText },
        { name: 'Fees', href: '/fees', icon: DollarSign },
        { name: 'Timetables', href: '/timetables', icon: Clock }
      ];
    }

    if (user?.role === 'admission') {
      return [
        ...baseItems,
        { name: 'Admissions', href: '/admissions', icon: ClipboardList },
        { name: 'Exam Schedule', href: '/exam-schedule', icon: BookOpen }
      ];
    }

    if (user?.role === 'accountant') {
      return [
        ...baseItems,
        { name: 'Fees', href: '/fees', icon: DollarSign }
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50" onClick={() => setSidebarOpen(false)}></div>
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white shadow-xl">
          <div className="flex h-16 items-center justify-between px-6 bg-gradient-to-r from-primary-600 to-primary-700">
            <h1 className="text-xl font-bold text-white">College ERP</h1>
            <button onClick={() => setSidebarOpen(false)} className="text-white hover:text-gray-200">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    location.pathname === item.href
                      ? 'bg-primary-50 text-primary-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 shadow-sm">
          <div className="flex h-16 items-center px-6 bg-gradient-to-r from-primary-600 to-primary-700">
            <h1 className="text-xl font-bold text-white">College ERP</h1>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                    location.pathname === item.href
                      ? 'bg-primary-50 text-primary-700 shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-primary-600'
                  }`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-700 lg:hidden hover:text-primary-600 transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
            <div className="flex flex-1"></div>
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <div className="flex items-center gap-x-3">
                <span className="text-sm font-medium text-gray-700">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </span>
                <span className="px-2.5 py-1 text-xs font-medium text-primary-700 bg-primary-50 rounded-full">
                  {user?.role}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-x-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 hover:text-primary-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;