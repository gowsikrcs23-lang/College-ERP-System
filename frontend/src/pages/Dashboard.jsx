import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Users, GraduationCap, Calendar, FileText, DollarSign, Bell } from 'lucide-react';
import { studentsAPI, facultyAPI, notificationsAPI } from '../utils/api';
import AttendanceStats from '../components/AttendanceStats';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0,
    notifications: 0
  });
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [notificationsRes] = await Promise.all([
        notificationsAPI.getAll()
      ]);

      if (user?.role === 'admin') {
        const [studentsRes, facultyRes] = await Promise.all([
          studentsAPI.getAll(),
          facultyAPI.getAll()
        ]);
        
        setStats({
          students: studentsRes.data.length,
          faculty: facultyRes.data.length,
          notifications: notificationsRes.data.length
        });
      }

      setNotifications(notificationsRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWelcomeMessage = () => {
    const name = user?.profile?.firstName || user?.email;
    const role = user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1);
    return `Welcome back, ${name}! (${role})`;
  };

  const getStatsCards = () => {
    if (user?.role === 'admin') {
      return [
        { name: 'Total Students', value: stats.students, icon: Users, color: 'bg-blue-500' },
        { name: 'Total Faculty', value: stats.faculty, icon: GraduationCap, color: 'bg-green-500' },
        { name: 'Notifications', value: stats.notifications, icon: Bell, color: 'bg-yellow-500' }
      ];
    }

    return [
      { name: 'Notifications', value: stats.notifications, icon: Bell, color: 'bg-yellow-500' }
    ];
  };

  const getQuickActions = () => {
    if (user?.role === 'admin') {
      return [
        { name: 'Manage Students', href: '/students', icon: Users },
        { name: 'Manage Faculty', href: '/faculty', icon: GraduationCap },
        { name: 'View Attendance', href: '/attendance', icon: Calendar },
        { name: 'Manage Fees', href: '/fees', icon: DollarSign }
      ];
    }

    if (user?.role === 'faculty') {
      return [
        { name: 'Mark Attendance', href: '/attendance', icon: Calendar },
        { name: 'Manage Exams', href: '/exams', icon: FileText },
        { name: 'View Timetable', href: '/timetables', icon: Calendar }
      ];
    }

    if (user?.role === 'student') {
      return [
        { name: 'View Attendance', href: '/attendance', icon: Calendar },
        { name: 'Check Results', href: '/results', icon: FileText },
        { name: 'Fee Status', href: '/fees', icon: DollarSign }
      ];
    }

    if (user?.role === 'accountant') {
      return [
        { name: 'Manage Fees', href: '/fees', icon: DollarSign }
      ];
    }

    return [];
  };

  const shouldShowAttendanceStats = () => {
    return user?.role === 'admin' || user?.role === 'faculty';
  };

  const getAttendanceStatsProps = () => {
    if (user?.role === 'faculty') {
      return {
        department: user?.profile?.department,
        semester: null // Faculty can see all semesters in their department
      };
    }
    return {
      department: null, // Admin can see all departments
      semester: null
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statsCards = getStatsCards();
  const quickActions = getQuickActions();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{getWelcomeMessage()}</h1>
        <p className="text-gray-600">Here's what's happening in your college today.</p>
      </div>

      {/* Stats Cards */}
      {statsCards.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {statsCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.name} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`p-3 rounded-xl ${stat.color} shadow-sm`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">{stat.name}</dt>
                      <dd className="text-2xl font-bold text-gray-900">{stat.value}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Attendance Statistics */}
      {shouldShowAttendanceStats() && (
        <div className="card">
          <AttendanceStats {...getAttendanceStatsProps()} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <a
                  key={action.name}
                  href={action.href}
                  className="flex items-center p-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 border border-transparent hover:border-primary-200"
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {action.name}
                </a>
              );
            })}
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Notifications</h3>
          <div className="space-y-3">
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <div key={notification._id} className="border-l-4 border-primary-500 bg-primary-50 pl-4 pr-3 py-3 rounded-r-lg">
                  <h4 className="text-sm font-semibold text-gray-900">{notification.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notification.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No notifications available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;