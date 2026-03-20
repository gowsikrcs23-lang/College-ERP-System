import { useState, useEffect } from 'react';
import { Plus, Bell, Send, Trash2, Users, GraduationCap } from 'lucide-react';
import { notificationsAPI, studentsAPI, facultyAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({ type: '', targetAudience: '' });
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: '',
    targetAudience: '',
    department: '',
    semester: '',
    expiryDate: ''
  });
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [facultyLoading, setFacultyLoading] = useState(false);
  const [facultySearch, setFacultySearch] = useState('');
  const [selectedFaculty, setSelectedFaculty] = useState([]);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [selectedAudiences, setSelectedAudiences] = useState([]);
  const titleSuggestions = [
    'Important Announcement',
    'Exam Schedule Update',
    'Fee Payment Reminder',
    'Attendance Alert',
    'Campus Event Notice',
    'Class Rescheduled',
    'Meeting Invitation',
    'Results Published',
    'Holiday Circular',
    'Deadline Reminder'
  ];
  const messageSuggestions = [
    'Please note the updated schedule and plan accordingly.',
    'This is a friendly reminder to complete the pending requirement before the deadline.',
    'Attendance will be reviewed this week. Ensure you meet the minimum requirement.',
    'Results have been published. Check the portal for details.',
    'A meeting has been scheduled. Your presence is required.',
    'Fee payment is due soon. Kindly complete payment at the earliest.',
    'Classes have been rescheduled. Refer to the updated timetable.',
    'Campus will remain closed due to a holiday. Stay tuned for updates.',
    'An important notice has been issued. Please read carefully.',
    'Students are requested to submit the required documents.'
  ];
  const titleMessageMap = {
    'Important Announcement': 'An important notice has been issued. Please read carefully.',
    'Exam Schedule Update': 'Please note the updated schedule and plan accordingly.',
    'Fee Payment Reminder': 'Fee payment is due soon. Kindly complete payment at the earliest.',
    'Attendance Alert': 'Attendance will be reviewed this week. Ensure you meet the minimum requirement.',
    'Campus Event Notice': 'A campus event has been scheduled. Participation details will be shared soon.',
    'Class Rescheduled': 'Classes have been rescheduled. Refer to the updated timetable.',
    'Meeting Invitation': 'A meeting has been scheduled. Your presence is required.',
    'Results Published': 'Results have been published. Check the portal for details.',
    'Holiday Circular': 'Campus will remain closed due to a holiday. Stay tuned for updates.',
    'Deadline Reminder': 'This is a friendly reminder to complete the pending requirement before the deadline.'
  };
  const departmentOptions = ['Computer Science', 'Electronics', 'Mechanical', 'Civil'];

  const getSeenNotificationStorageKey = () => {
    const identity = user?._id || user?.email || 'anonymous';
    return `dashboard-seen-notification-${identity}`;
  };

  const [seenNotificationId, setSeenNotificationId] = useState(null);

  // Notification types based on role
  const notificationTypes = {
    management: ['general', 'college', 'academic', 'fee', 'exam', 'attendance', 'meeting', 'announcement', 'staff', 'admission'],
    admin: ['general', 'college', 'academic', 'fee', 'exam', 'attendance', 'meeting', 'announcement', 'staff', 'admission'],
    faculty: ['general', 'college', 'academic', 'exam', 'attendance', 'meeting', 'announcement'],
    accountant: ['fee', 'payment', 'financial', 'reminder'],
    admission: ['admission', 'general', 'college', 'announcement'],
    hod: ['general', 'college', 'academic', 'exam', 'attendance', 'meeting', 'announcement', 'staff']
  };

  // Target audiences based on role - each role can only send to their group
  const targetAudiences = {
    management: ['all', 'students', 'faculty', 'admission', 'accountant', 'department'],
    admin: ['all', 'students', 'faculty', 'admission', 'accountant', 'department'],
    faculty: ['students', 'faculty', 'department'],
    accountant: ['accountant', 'students'],
    admission: ['admission', 'students'],
    hod: ['all', 'students', 'faculty', 'department']
  };

  // Only management can create notifications
  const canCreateNotification = () => {
    return user?.role === 'management';
  };

  // Get allowed notification types for current user
  const getAllowedTypes = () => {
    return notificationTypes[user?.role] || [];
  };

  // Get allowed target audiences for current user
  const getAllowedAudiences = () => {
    return targetAudiences[user?.role] || [];
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (!showModal || formData.targetAudience !== 'students' || students.length > 0) return;
    const fetchStudents = async () => {
      try {
        setStudentsLoading(true);
        const response = await studentsAPI.getAll();
        setStudents(response.data || []);
      } catch (error) {
        toast.error('Failed to load students');
      } finally {
        setStudentsLoading(false);
      }
    };
    fetchStudents();
  }, [showModal, formData.targetAudience, students.length]);

  useEffect(() => {
    if (!showModal || formData.targetAudience !== 'faculty' || faculty.length > 0) return;
    const fetchFaculty = async () => {
      try {
        setFacultyLoading(true);
        const response = await facultyAPI.getAll();
        setFaculty(response.data || []);
      } catch (error) {
        toast.error('Failed to load faculty');
      } finally {
        setFacultyLoading(false);
      }
    };
    fetchFaculty();
  }, [showModal, formData.targetAudience, faculty.length]);

  useEffect(() => {
    const storedId = localStorage.getItem(getSeenNotificationStorageKey());
    setSeenNotificationId(storedId);
  }, [user?._id, user?.email]);

  const fetchNotifications = async (filterParams = {}) => {
    try {
      const response = await notificationsAPI.getAll(filterParams);
      // Handle both array and paginated response
      const fetchedNotifications = response.data.notifications || response.data;
      const uniqueNotifications = Array.isArray(fetchedNotifications)
        ? Array.from(new Map(fetchedNotifications.map((n) => [n?._id, n])).values())
        : [];
      setNotifications(uniqueNotifications);
    } catch (error) {
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAllAsSeen = () => {
    if (notifications.length === 0) return;
    const latestId = notifications[0]._id;
    localStorage.setItem(getSeenNotificationStorageKey(), latestId);
    setSeenNotificationId(latestId);
    toast.success('Marked all as seen');
  };

  const isNotificationNew = (notificationId) => {
    if (!seenNotificationId) return true;
    const latestIndex = notifications.findIndex((n) => n._id === seenNotificationId);
    const currentIndex = notifications.findIndex((n) => n._id === notificationId);
    if (latestIndex === -1 || currentIndex === -1) return true;
    return currentIndex <= latestIndex;
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchNotifications(newFilters);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const basePayload = { ...formData };
      let audiencesToSend = selectedAudiences.length > 0
        ? selectedAudiences
        : [formData.targetAudience];
      if (audiencesToSend.includes('all')) {
        audiencesToSend = ['all'];
      }

      const payloads = audiencesToSend.flatMap((audience) => {
        const audiencePayload = { ...basePayload, targetAudience: audience };

        if (audience === 'all') {
          return [{
            ...audiencePayload,
            department: '',
            semester: '',
            targetStudent: '',
            targetFaculty: ''
          }];
        }

        if (audience === 'students') {
          const payloadGroup = [];
          if (selectedStudents.length > 0) {
            payloadGroup.push(...selectedStudents.map((studentId) => ({
              ...audiencePayload,
              targetStudent: studentId,
              department: '',
              semester: ''
            })));
          }
          if (selectedDepartments.length > 0) {
            payloadGroup.push(...selectedDepartments.map((department) => ({
              ...audiencePayload,
              department
            })));
          }
          return payloadGroup.length > 0 ? payloadGroup : [audiencePayload];
        }

        if (audience === 'faculty') {
          const payloadGroup = [];
          if (selectedFaculty.length > 0) {
            payloadGroup.push(...selectedFaculty.map((facultyId) => ({
              ...audiencePayload,
              targetFaculty: facultyId,
              department: ''
            })));
          }
          if (selectedDepartments.length > 0) {
            payloadGroup.push(...selectedDepartments.map((department) => ({
              ...audiencePayload,
              department
            })));
          }
          return payloadGroup.length > 0 ? payloadGroup : [audiencePayload];
        }

        if (audience === 'department') {
          if (selectedDepartments.length > 0) {
            return selectedDepartments.map((department) => ({
              ...audiencePayload,
              department
            }));
          }
          return [audiencePayload];
        }

        return [audiencePayload];
      });

      await Promise.all(payloads.map((payload) => notificationsAPI.create(payload)));
      toast.success('Notification sent successfully');
      fetchNotifications(filters);
      resetForm();
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send notification');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this notification?')) {
      try {
        await notificationsAPI.delete(id);
        toast.success('Notification deleted successfully');
        fetchNotifications(filters);
      } catch (error) {
        toast.error('Failed to delete notification');
      }
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm('Are you sure you want to delete ALL notifications? This action cannot be undone!')) {
      try {
        const response = await axios.delete('/api/notifications/delete/all', { params: filters });
        toast.success(`Deleted ${response.data.deletedCount} notifications successfully`);
        fetchNotifications(filters);
      } catch (error) {
        toast.error('Failed to delete notifications');
      }
    }
  };

  const handleDeleteByCreator = async (creatorId) => {
    if (window.confirm('Are you sure you want to delete ALL notifications by this creator? This action cannot be undone!')) {
      try {
        const response = await axios.delete(`/api/notifications/creator/${creatorId}/delete`, { params: filters });
        toast.success(`Deleted ${response.data.deletedCount} notifications`);
        fetchNotifications(filters);
      } catch (error) {
        toast.error('Failed to delete notifications');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: '',
      targetAudience: '',
      department: '',
      semester: '',
      expiryDate: ''
    });
    setSelectedStudents([]);
    setSelectedFaculty([]);
    setSelectedDepartments([]);
    setSelectedAudiences([]);
    setStudentSearch('');
    setFacultySearch('');
  };

  const getTypeColor = (type) => {
    const colors = {
      general: 'bg-blue-100 text-blue-800',
      academic: 'bg-green-100 text-green-800',
      fee: 'bg-yellow-100 text-yellow-800',
      exam: 'bg-red-100 text-red-800',
      attendance: 'bg-purple-100 text-purple-800',
      meeting: 'bg-indigo-100 text-indigo-800',
      announcement: 'bg-gray-100 text-gray-800',
      assignment: 'bg-orange-100 text-orange-800',
      payment: 'bg-pink-100 text-pink-800',
      financial: 'bg-teal-100 text-teal-800',
      reminder: 'bg-amber-100 text-amber-800',
      staff: 'bg-cyan-100 text-cyan-800',
      admission: 'bg-lime-100 text-lime-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getAudienceIcon = (audience) => {
    switch (audience) {
      case 'students': return <GraduationCap className="h-4 w-4" />;
      case 'faculty': return <Users className="h-4 w-4" />;
      case 'staff': return <Users className="h-4 w-4" />;
      case 'admission': return <Users className="h-4 w-4" />;
      case 'accountant': return <Users className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const canDeleteNotification = () => {
    return user?.role === 'management';
  };

  const canDeleteAll = () => {
    return user?.role === 'management';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-full space-y-6 overflow-x-hidden">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <div className="flex flex-col gap-2 sm:flex-row">
          {notifications.length > 0 && (
            <button onClick={markAllAsSeen} className="btn-secondary flex w-full items-center justify-center gap-2 sm:w-auto">
              <Bell className="h-4 w-4" />
              Mark All Seen
            </button>
          )}
          {canDeleteAll() && notifications.length > 0 && (
            <button onClick={handleDeleteAll} className="btn-danger flex w-full items-center justify-center gap-2 sm:w-auto">
              <Trash2 className="h-4 w-4" />
              Delete All
            </button>
          )}
          {canCreateNotification() && (
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="btn-primary flex w-full items-center justify-center gap-2 sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              Send Notification
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex flex-col gap-4 sm:flex-row">
          <select className="input-field min-w-0" value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}>
            <option value="">All Types</option>
            <option value="general">General</option>
            <option value="college">College</option>
            <option value="academic">Academic</option>
            <option value="fee">Fee</option>
            <option value="exam">Exam</option>
            <option value="attendance">Attendance</option>
            <option value="meeting">Meeting</option>
            <option value="announcement">Announcement</option>
            <option value="staff">Staff</option>
          </select>
          <select className="input-field min-w-0" value={filters.targetAudience} onChange={(e) => handleFilterChange('targetAudience', e.target.value)}>
            <option value="">All Audiences</option>
            <option value="all">All</option>
            <option value="students">Students</option>
            <option value="faculty">Faculty</option>
            <option value="staff">Staff</option>
            <option value="admission">Admission</option>
            <option value="accountant">Accountant</option>
            <option value="department">Department</option>
          </select>
          {(user?.role === 'management' || user?.role === 'admin') && (
            <select className="input-field min-w-0" value={filters.department} onChange={(e) => handleFilterChange('department', e.target.value)}>
              <option value="">All Departments</option>
              {departmentOptions.map((department) => (
                <option key={department} value={department}>{department}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div key={notification._id} className="card max-w-full overflow-hidden">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
                    <h3 className="break-words text-lg font-medium text-gray-900">{notification.title}</h3>
                    {isNotificationNew(notification._id) && (
                      <span className="inline-flex w-fit max-w-full break-words rounded-full bg-emerald-100 px-2 py-1 text-xs font-semibold text-emerald-700">
                        New
                      </span>
                    )}
                    <span className={`inline-flex w-fit max-w-full break-words px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(notification.type)}`}>
                      {notification.type}
                    </span>
                    <div className="flex min-w-0 items-center gap-1 text-sm text-gray-500">
                      {getAudienceIcon(notification.targetAudience)}
                      <span className="break-words capitalize">{notification.targetAudience}</span>
                    </div>
                  </div>
                  <p className="mb-3 break-words text-gray-700">{notification.message}</p>
                  <div className="flex min-w-0 flex-col gap-2 text-sm text-gray-500 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                    <span>Created: {new Date(notification.createdAt).toLocaleDateString()}</span>
                    {notification.createdBy && (
                      <span className="break-all">By: {notification.createdBy.email}</span>
                    )}
                    {notification.department && <span className="break-words">Department: {notification.department}</span>}
                    {notification.semester && <span>Semester: {notification.semester}</span>}
                    {notification.expiryDate && (
                      <span>Expires: {new Date(notification.expiryDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                {canDeleteNotification(notification) && (
                  <div className="flex shrink-0 gap-2 self-end sm:ml-4 sm:self-start">
                    <button
                      onClick={() => handleDeleteByCreator(notification.createdBy?._id)}
                      className="text-orange-600 hover:text-orange-900"
                      title="Delete all by this creator"
                    >
                      <Users className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(notification._id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="card text-center py-12">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Notifications</h3>
            <p className="text-gray-600">No notifications have been sent yet.</p>
          </div>
        )}
      </div>

      {/* Create Notification Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-6 mx-auto w-[calc(100%-1rem)] max-w-md overflow-hidden rounded-md border bg-white p-4 shadow-lg sm:top-20 sm:w-[calc(100%-2rem)] sm:p-5">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Send Notification</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Notification Title"
                className="input-field"
                value={formData.title}
                onChange={(e) => {
                  const nextTitle = e.target.value;
                  setFormData({
                    ...formData,
                    title: nextTitle,
                    message: titleMessageMap[nextTitle] || formData.message
                  });
                }}
                required
                list="notification-title-suggestions"
              />
              <datalist id="notification-title-suggestions">
                {titleSuggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion} />
                ))}
              </datalist>

              <textarea
                placeholder="Message"
                className="input-field h-24 resize-none"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                required
              />
              <select
                className="input-field"
                value=""
                onChange={(e) => {
                  if (!e.target.value) return;
                  setFormData({ ...formData, message: e.target.value });
                }}
              >
                <option value="">Message ideas (select to fill)</option>
                {messageSuggestions.map((suggestion) => (
                  <option key={suggestion} value={suggestion}>{suggestion}</option>
                ))}
              </select>

              <select
                className="input-field"
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                required
              >
                <option value="">Select Type</option>
                {notificationTypes[user?.role]?.map(type => (
                  <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                ))}
              </select>

              <select
                className="input-field"
                value={formData.targetAudience}
                onChange={(e) => {
                  const nextAudience = e.target.value;
                  setSelectedStudents([]);
                  setSelectedFaculty([]);
                  setSelectedDepartments([]);
                  setSelectedAudiences([]);
                  setStudentSearch('');
                  setFacultySearch('');
                  setFormData({
                    ...formData,
                    targetAudience: nextAudience,
                    department: '',
                    semester: nextAudience === 'students' ? formData.semester : ''
                  });
                }}
                required
              >
                <option value="">Select Audience</option>
                {targetAudiences[user?.role]?.map(audience => (
                  <option key={audience} value={audience}>{audience.charAt(0).toUpperCase() + audience.slice(1)}</option>
                ))}
              </select>
              <div className="space-y-2 rounded-lg border border-gray-200 p-3">
                <p className="text-sm font-medium text-gray-700">Send to multiple audiences</p>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {targetAudiences[user?.role]?.map((audience) => {
                    const isSelected = selectedAudiences.includes(audience);
                    return (
                      <label key={audience} className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary-600"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedAudiences((current) =>
                              current.includes(audience)
                                ? current.filter((item) => item !== audience)
                                : [...current, audience]
                            );
                          }}
                        />
                        {audience.charAt(0).toUpperCase() + audience.slice(1)}
                      </label>
                    );
                  })}
                </div>
                {selectedAudiences.length > 0 && (
                  <p className="text-xs text-gray-500">Multiple audiences selected. The single audience dropdown will be ignored.</p>
                )}
              </div>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-primary-600"
                  checked={selectedAudiences.length > 0
                    ? selectedAudiences.includes('all')
                    : formData.targetAudience === 'all'}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setSelectedStudents([]);
                    setSelectedFaculty([]);
                    setSelectedDepartments([]);
                    setStudentSearch('');
                    setFacultySearch('');
                    if (selectedAudiences.length > 0) {
                      setSelectedAudiences((current) =>
                        checked
                          ? Array.from(new Set([...current, 'all']))
                          : current.filter((item) => item !== 'all')
                      );
                    } else {
                      setFormData({
                        ...formData,
                        targetAudience: checked ? 'all' : '',
                        department: '',
                        semester: ''
                      });
                    }
                  }}
                />
                Send to all
              </label>

              {(formData.targetAudience === 'students' || formData.targetAudience === 'department') && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Departments (multi-select)</p>
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary-600"
                      checked={selectedDepartments.length === departmentOptions.length && departmentOptions.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedDepartments([...departmentOptions]);
                        } else {
                          setSelectedDepartments([]);
                        }
                      }}
                    />
                    Select all departments
                  </label>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {departmentOptions.map((department) => {
                      const isSelected = selectedDepartments.includes(department);
                      return (
                        <label
                          key={department}
                          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                            isSelected ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-primary-600"
                            checked={isSelected}
                            onChange={() => {
                              setSelectedDepartments((current) =>
                                current.includes(department)
                                  ? current.filter((item) => item !== department)
                                  : [...current, department]
                              );
                            }}
                          />
                          {department}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {formData.targetAudience === 'students' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Select Students (multi-select)</p>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Search by name, ID, department, semester"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary-600"
                      checked={students.length > 0 && selectedStudents.length === students.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedStudents(students.map((student) => student._id));
                        } else {
                          setSelectedStudents([]);
                        }
                      }}
                    />
                    Select all students
                  </label>
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                    {studentsLoading && (
                      <p className="text-sm text-gray-500">Loading students...</p>
                    )}
                    {!studentsLoading && students.length === 0 && (
                      <p className="text-sm text-gray-500">No students found.</p>
                    )}
                    {!studentsLoading && students.length > 0 && (
                      students
                        .filter((student) => {
                          const query = studentSearch.trim().toLowerCase();
                          if (!query) return true;
                          const name = `${student.firstName} ${student.lastName}`.toLowerCase();
                          const id = String(student.studentId || '').toLowerCase();
                          const dept = String(student.department || '').toLowerCase();
                          const sem = String(student.semester || '').toLowerCase();
                          return name.includes(query) || id.includes(query) || dept.includes(query) || sem.includes(query);
                        })
                        .map((student) => {
                          const isSelected = selectedStudents.includes(student._id);
                          return (
                            <label key={student._id} className="flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                className="h-4 w-4 accent-primary-600"
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedStudents((current) =>
                                    current.includes(student._id)
                                      ? current.filter((item) => item !== student._id)
                                      : [...current, student._id]
                                  );
                                }}
                              />
                              <span className="flex-1">
                                {student.firstName} {student.lastName} ({student.studentId}) - {student.department} Sem {student.semester}
                              </span>
                            </label>
                          );
                        })
                    )}
                  </div>
                  {(selectedStudents.length > 0 || selectedDepartments.length > 0) && (
                    <p className="text-xs text-gray-500">You can send to specific students and departments together.</p>
                  )}
                </div>
              )}

              {formData.targetAudience === 'faculty' && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Select Faculty (multi-select)</p>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Search by name, ID, department"
                    value={facultySearch}
                    onChange={(e) => setFacultySearch(e.target.value)}
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input
                      type="checkbox"
                      className="h-4 w-4 accent-primary-600"
                      checked={faculty.length > 0 && selectedFaculty.length === faculty.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFaculty(faculty.map((member) => member._id));
                        } else {
                          setSelectedFaculty([]);
                        }
                      }}
                    />
                    Select all faculty
                  </label>
                  <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                    {facultyLoading && (
                      <p className="text-sm text-gray-500">Loading faculty...</p>
                    )}
                    {!facultyLoading && faculty.length === 0 && (
                      <p className="text-sm text-gray-500">No faculty found.</p>
                    )}
                    {!facultyLoading && faculty.length > 0 && (
                      faculty
                        .filter((member) => {
                          const query = facultySearch.trim().toLowerCase();
                          if (!query) return true;
                          const name = `${member.firstName} ${member.lastName}`.toLowerCase();
                          const id = String(member.facultyId || '').toLowerCase();
                          const dept = String(member.department || '').toLowerCase();
                          return name.includes(query) || id.includes(query) || dept.includes(query);
                        })
                        .map((member) => {
                          const isSelected = selectedFaculty.includes(member._id);
                          return (
                            <label key={member._id} className="flex items-center gap-2 text-sm text-gray-700">
                              <input
                                type="checkbox"
                                className="h-4 w-4 accent-primary-600"
                                checked={isSelected}
                                onChange={() => {
                                  setSelectedFaculty((current) =>
                                    current.includes(member._id)
                                      ? current.filter((item) => item !== member._id)
                                      : [...current, member._id]
                                  );
                                }}
                              />
                              <span className="flex-1">
                                {member.firstName} {member.lastName} ({member.facultyId}) - {member.department}
                              </span>
                            </label>
                          );
                        })
                    )}
                  </div>
                  {(selectedFaculty.length > 0 || selectedDepartments.length > 0) && (
                    <p className="text-xs text-gray-500">You can send to specific faculty and departments together.</p>
                  )}
                </div>
              )}

              {formData.targetAudience === 'students' && selectedStudents.length === 0 && (
                <select
                  className="input-field"
                  value={formData.semester}
                  onChange={(e) => setFormData({...formData, semester: e.target.value})}
                >
                  <option value="">All Semesters</option>
                  {[1,2,3,4,5,6,7,8].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              )}

              <input
                type="date"
                placeholder="Expiry Date (Optional)"
                className="input-field"
                value={formData.expiryDate}
                onChange={(e) => setFormData({...formData, expiryDate: e.target.value})}
              />

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end sm:space-x-0">
                <button
                  type="button"
                  onClick={() => {
                    resetForm();
                    setShowModal(false);
                  }}
                  className="btn-secondary w-full sm:w-auto"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex w-full items-center justify-center gap-2 sm:w-auto">
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications;
