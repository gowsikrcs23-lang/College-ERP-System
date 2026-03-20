import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Users, GraduationCap, Calendar, FileText, DollarSign, Home, Bell, ChevronRight, User, ShieldAlert } from 'lucide-react';
import { studentsAPI, facultyAPI, notificationsAPI, classFacultyAPI } from '../utils/api';
import AttendanceStats from '../components/AttendanceStats';

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    students: 0,
    faculty: 0
  });
  const [latestNotification, setLatestNotification] = useState(null);
  const [isLatestNotificationSeen, setIsLatestNotificationSeen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [studentProfile, setStudentProfile] = useState(null);
  const [studentClassFaculty, setStudentClassFaculty] = useState(null);

  const getSeenNotificationStorageKey = () => {
    const identity = user?._id || user?.email || 'anonymous';
    return `dashboard-seen-notification-${identity}`;
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const latestNotificationPromise = notificationsAPI.getAll({ limit: 1, skip: 0 });

      if (user?.role === 'admin' || user?.role === 'management') {
        const [studentsRes, facultyRes, latestNotificationRes] = await Promise.all([
          studentsAPI.getAll(),
          facultyAPI.getAll(),
          latestNotificationPromise
        ]);
        
        setStats({
          students: studentsRes.data.length,
          faculty: facultyRes.data.length
        });

        const notifications = latestNotificationRes.data?.notifications || latestNotificationRes.data || [];
        const newestNotification = notifications[0] || null;
        setLatestNotification(newestNotification);
        setIsLatestNotificationSeen(
          newestNotification ? localStorage.getItem(getSeenNotificationStorageKey()) === newestNotification._id : false
        );
        return;
      }

      if (user?.role === 'student') {
        const studentId = user?.profile?._id || user?.profile;
        const [studentRes, latestNotificationRes] = await Promise.all([
          studentId ? studentsAPI.getById(studentId) : Promise.resolve({ data: null }),
          latestNotificationPromise
        ]);

        const studentData = studentRes?.data || null;
        setStudentProfile(studentData);

        if (studentData?.department && studentData?.semester) {
          try {
            const classFacultyRes = await classFacultyAPI.getAll({
              department: studentData.department,
              semester: studentData.semester
            });
            const assignment = Array.isArray(classFacultyRes.data) ? classFacultyRes.data[0] : null;
            setStudentClassFaculty(assignment?.faculty || null);
          } catch (err) {
            setStudentClassFaculty(null);
          }
        } else {
          setStudentClassFaculty(null);
        }

        const notifications = latestNotificationRes.data?.notifications || latestNotificationRes.data || [];
        const newestNotification = notifications[0] || null;
        setLatestNotification(newestNotification);
        setIsLatestNotificationSeen(
          newestNotification ? localStorage.getItem(getSeenNotificationStorageKey()) === newestNotification._id : false
        );
        return;
      }

      const latestNotificationRes = await latestNotificationPromise;
      const notifications = latestNotificationRes.data?.notifications || latestNotificationRes.data || [];
      const newestNotification = notifications[0] || null;
      setLatestNotification(newestNotification);
      setIsLatestNotificationSeen(
        newestNotification ? localStorage.getItem(getSeenNotificationStorageKey()) === newestNotification._id : false
      );
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
    if (user?.role === 'admin' || user?.role === 'management') {
      return [
        { name: 'Total Students', value: stats.students, icon: Users, color: 'bg-blue-500' },
        { name: 'Total Faculty', value: stats.faculty, icon: GraduationCap, color: 'bg-green-500' }
      ];
    }
    return [];
  };

  const getQuickActions = () => {
    if (user?.role === 'admin' || user?.role === 'management') {
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
        { name: 'Fee Status', href: '/fees', icon: DollarSign },
        { name: 'My Profile', href: '/profile', icon: User },
        { name: 'Mail Block', href: '/student-mail-block', icon: ShieldAlert }
      ];
    }

    if (user?.role === 'accountant') {
      return [
        { name: 'Manage Fees', href: '/fees', icon: DollarSign }
      ];
    }

    if (user?.role === 'hod') {
      return [
        { name: 'Manage Students', href: '/students', icon: Users },
        { name: 'Manage Faculty', href: '/faculty', icon: GraduationCap },
        { name: 'View Attendance', href: '/attendance', icon: Calendar }
      ];
    }

    return [
      { name: 'Dashboard', href: '/dashboard', icon: Home }
    ];
  };

  const shouldShowAttendanceStats = () => {
    return user?.role === 'admin' || user?.role === 'management' || user?.role === 'faculty';
  };

  const getAttendanceStatsProps = () => {
    if (user?.role === 'faculty') {
      return {
        department: user?.profile?.department,
        semester: null
      };
    }
    return {
      department: null,
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

      {latestNotification && (
        <div className="dashboard-alert-card relative overflow-hidden rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-orange-50 to-red-50 p-5 shadow-sm">
          <div className="dashboard-alert-glow"></div>
          <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex items-center gap-2">
                <span className={`${isLatestNotificationSeen ? '' : 'dashboard-alert-icon'} flex h-10 w-10 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm`}>
                  <Bell className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">Latest Notification</p>
                  <p className="text-sm text-amber-900">{latestNotification.type}</p>
                </div>
              </div>
              <h2 className="text-lg font-bold text-gray-900">{latestNotification.title}</h2>
              <p className="mt-2 max-w-3xl text-sm text-gray-700">{latestNotification.message}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-600">
                <span>Created: {new Date(latestNotification.createdAt).toLocaleDateString()}</span>
                {latestNotification.targetAudience && (
                  <span className="capitalize">Audience: {latestNotification.targetAudience}</span>
                )}
                {latestNotification.department && <span>Department: {latestNotification.department}</span>}
                {latestNotification.semester && <span>Semester: {latestNotification.semester}</span>}
              </div>
            </div>

            <Link
              to="/notifications"
              className="inline-flex items-center gap-2 self-start rounded-lg bg-white/90 px-4 py-2 text-sm font-medium text-amber-900 shadow-sm ring-1 ring-amber-200 transition hover:bg-white"
            >
              View all
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}

      {user?.role === 'student' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Student Snapshot</p>
                <h2 className="text-lg font-bold text-slate-900">Your current academic view</h2>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                {studentProfile?.department || 'Department N/A'}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-blue-600 font-semibold">Student ID</p>
                <p className="mt-2 text-lg font-bold text-blue-950">{studentProfile?.studentId || 'N/A'}</p>
                <p className="text-xs text-blue-700">Registration: {studentProfile?.bio?.registrationNumber || 'N/A'}</p>
              </div>
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-indigo-600 font-semibold">Semester</p>
                <p className="mt-2 text-lg font-bold text-indigo-950">
                  {studentProfile?.semester ? `Semester ${studentProfile.semester}` : 'N/A'}
                </p>
                <p className="text-xs text-indigo-700">Batch: {studentProfile?.batch || 'N/A'}</p>
              </div>
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-emerald-600 font-semibold">Class Faculty</p>
                <p className="mt-2 text-lg font-bold text-emerald-950">
                  {studentClassFaculty
                    ? `${studentClassFaculty.firstName} ${studentClassFaculty.lastName}`
                    : 'Not assigned'}
                </p>
                <p className="text-xs text-emerald-700">
                  {studentClassFaculty?.facultyId ? `ID: ${studentClassFaculty.facultyId}` : 'Faculty ID N/A'}
                </p>
              </div>
              <div className="rounded-xl border border-rose-100 bg-rose-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-rose-600 font-semibold">Mail Blocks</p>
                <p className="mt-2 text-lg font-bold text-rose-950">
                  {studentProfile?.user?.emailBlockCount || 0}
                </p>
                <p className="text-xs text-rose-700">
                  Status: {studentProfile?.user?.isEmailBlocked ? 'Blocked' : 'Active'}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">Today</p>
            <h3 className="mt-1 text-lg font-bold text-slate-900">Your next steps</h3>
            <div className="mt-4 space-y-3 text-sm text-slate-600">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                Review your attendance and submit any pending requests.
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                Check results and download reports if available.
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                Verify fee status to avoid late notifications.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      {statsCards.length > 0 && (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {statsCards.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.name}
                style={{ animationDelay: `${index * 100}ms` }}
                className="surface-animate bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow duration-200"
              >
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

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Quick Actions */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 gap-2">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <a
                  key={action.name}
                  href={action.href}
                  style={{ animationDelay: `${index * 80}ms` }}
                  className="list-item-animate flex items-center p-3 text-sm font-medium text-gray-700 rounded-lg hover:bg-primary-50 hover:text-primary-700 transition-all duration-200 border border-transparent hover:border-primary-200"
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {action.name}
                </a>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
