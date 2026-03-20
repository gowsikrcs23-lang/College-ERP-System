import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentsAPI } from '../utils/api';
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
  ClipboardList,
  BookOpen,
  Bell,
  LogOut,
  ShieldCheck
} from 'lucide-react';

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mailUnblockCount, setMailUnblockCount] = useState(0);

  useEffect(() => {
    const loadMailUnblockCount = async () => {
      if (!user?.role || !['management', 'faculty'].includes(user.role)) {
        setMailUnblockCount(0);
        return;
      }
      try {
        const response = await studentsAPI.getAll();
        const allStudents = Array.isArray(response.data) ? response.data : [];
        const blockedStudents = allStudents.filter((student) => student.user?.isEmailBlocked);

        if (user.role === 'faculty') {
          const department = user?.profile?.department;
          const pendingFaculty = blockedStudents.filter(
            (student) =>
              !student.user?.unblockApprovedByFaculty &&
              (!department || student.department === department)
          );
          setMailUnblockCount(pendingFaculty.length);
          return;
        }

        setMailUnblockCount(blockedStudents.length);
      } catch (error) {
        setMailUnblockCount(0);
      }
    };

    loadMailUnblockCount();
  }, [user?.role, user?.profile?.department]);

  const mailUnblockBadge = useMemo(() => {
    return mailUnblockCount > 99 ? '99+' : String(mailUnblockCount);
  }, [mailUnblockCount]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getNavItems = () => {
    const baseItems = [
      { name: 'Dashboard', href: '/dashboard', icon: Home }
    ];

    if (user?.role === 'admin' || user?.role === 'management') {
      return [
        ...baseItems,
        { name: 'Students', href: '/students', icon: Users },
        { name: 'Faculty', href: '/faculty', icon: GraduationCap },
        { name: 'Admissions', href: '/admissions', icon: ClipboardList },
        { name: 'Attendance', href: '/attendance', icon: Calendar },
        { name: 'Exam Schedule', href: '/exam-schedule', icon: BookOpen },
        { name: 'Results', href: '/results', icon: FileText },
        ...(user?.role === 'management'
          ? [{ name: 'Mail Unblock', href: '/mail-unblock', icon: ShieldCheck, badgeCount: mailUnblockCount }]
          : []),
        { name: 'Fees', href: '/fees', icon: DollarSign },
        { name: 'Notifications', href: '/notifications', icon: Bell },
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
        { name: 'Mail Unblock', href: '/mail-unblock', icon: ShieldCheck, badgeCount: mailUnblockCount },
        { name: 'Reports', href: '/reports', icon: FileText },
        { name: 'Fees', href: '/fees', icon: DollarSign },
        { name: 'Notifications', href: '/notifications', icon: Bell },
        { name: 'Timetables', href: '/timetables', icon: Clock }
      ];
    }

    if (user?.role === 'faculty') {
      return [
        ...baseItems,
        { name: 'Students', href: '/students', icon: Users },
        { name: 'Attendance', href: '/attendance', icon: Calendar },
        { name: 'Exam Schedule', href: '/exam-schedule', icon: BookOpen },
        { name: 'Results', href: '/results', icon: FileText },
        { name: 'Reports', href: '/reports', icon: FileText },
        { name: 'Mail Unblock', href: '/mail-unblock', icon: ShieldCheck, badgeCount: mailUnblockCount },
        { name: 'Fees', href: '/fees', icon: DollarSign },
        { name: 'Exams', href: '/exams', icon: FileText },
        { name: 'Notifications', href: '/notifications', icon: Bell },
        { name: 'Timetables', href: '/timetables', icon: Clock }
      ];
    }

    if (user?.role === 'student') {
      return [
        ...baseItems,
        { name: 'My Profile', href: '/profile', icon: Users },
        { name: 'Mail Block', href: '/student-mail-block', icon: ShieldCheck },
        { name: 'Attendance', href: '/attendance', icon: Calendar },
        { name: 'Exam Schedule', href: '/exam-schedule', icon: BookOpen },
        { name: 'Results', href: '/results', icon: FileText },
        { name: 'Reports', href: '/reports', icon: FileText },
        { name: 'Fees', href: '/fees', icon: DollarSign },
        { name: 'Notifications', href: '/notifications', icon: Bell },
        { name: 'Timetables', href: '/timetables', icon: Clock }
      ];
    }

    if (user?.role === 'admission') {
      return [
        ...baseItems,
        { name: 'Admissions', href: '/admissions', icon: ClipboardList },
        { name: 'Notifications', href: '/notifications', icon: Bell },
        { name: 'Exam Schedule', href: '/exam-schedule', icon: BookOpen }
      ];
    }

    if (user?.role === 'accountant') {
      return [
        ...baseItems,
        { name: 'Fees', href: '/fees', icon: DollarSign },
        { name: 'Notifications', href: '/notifications', icon: Bell }
      ];
    }

    return baseItems;
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-transparent">
      {/* Mobile sidebar */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50" onClick={() => setSidebarOpen(false)}></div>
        <div className="shell-sidebar fixed inset-y-0 left-0 flex w-64 flex-col shadow-xl">
          <div className="shell-sidebar__brand flex h-16 items-center justify-between px-6">
            <h1 className="text-xl font-bold text-white">College ERP</h1>
            <button onClick={() => setSidebarOpen(false)} className="text-white hover:text-gray-200">
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  style={{ animationDelay: `${index * 70}ms` }}
                  className={`shell-nav-link nav-item-animate group flex items-center px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    location.pathname === item.href
                      ? 'shell-nav-link--active'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="nav-item-animate__icon mr-3 h-5 w-5" />
                  {item.name}
                  {item.badgeCount > 0 && (
                    <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      {item.badgeCount > 99 ? '99+' : item.badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="shell-sidebar flex flex-col flex-grow shadow-sm">
          <div className="shell-sidebar__brand flex h-16 items-center px-6">
            <h1 className="text-xl font-bold text-white">College ERP</h1>
          </div>
          <nav className="flex-1 space-y-1 px-3 py-4">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  style={{ animationDelay: `${index * 70}ms` }}
                  className={`shell-nav-link nav-item-animate group flex items-center px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                    location.pathname === item.href
                      ? 'shell-nav-link--active'
                      : 'text-gray-700 hover:text-primary-600'
                  }`}
                >
                  <Icon className="nav-item-animate__icon mr-3 h-5 w-5" />
                  {item.name}
                  {item.badgeCount > 0 && (
                    <span className="ml-auto rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                      {item.badgeCount > 99 ? '99+' : item.badgeCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="shell-topbar topbar-animate sticky top-0 z-40 flex min-h-16 shrink-0 items-center gap-x-4 px-4 py-2 sm:gap-x-6 sm:px-6 lg:px-8">
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
              <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-x-3">
                <span className="hidden text-sm font-medium text-gray-700 sm:inline">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </span>
                <span className="shell-role-chip px-2.5 py-1 text-xs font-medium">
                  {user?.role}
                </span>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-x-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:text-primary-600"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="py-8">
          <div key={location.pathname} className="shell-page page-animate mx-auto max-w-7xl px-4 pt-5 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
