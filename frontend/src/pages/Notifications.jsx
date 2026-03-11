import { useState, useEffect } from 'react';
import { Plus, Bell, Send, Trash2, Users, GraduationCap } from 'lucide-react';
import { notificationsAPI } from '../utils/api';
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

  const getSeenNotificationStorageKey = () => {
    const identity = user?._id || user?.email || 'anonymous';
    return `dashboard-seen-notification-${identity}`;
  };

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

  // Check if user can create notification
  const canCreateNotification = () => {
    return user?.role && user.role !== 'student';
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

  const fetchNotifications = async (filterParams = {}) => {
    try {
      const response = await notificationsAPI.getAll(filterParams);
      // Handle both array and paginated response
      const fetchedNotifications = response.data.notifications || response.data;
      setNotifications(fetchedNotifications);

      if ((!filterParams.type && !filterParams.targetAudience) && fetchedNotifications.length > 0) {
        localStorage.setItem(getSeenNotificationStorageKey(), fetchedNotifications[0]._id);
      }
    } catch (error) {
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchNotifications(newFilters);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await notificationsAPI.create(formData);
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
    return user?.role && user.role !== 'student';
  };

  const canDeleteAll = () => {
    return user?.role && user.role !== 'student';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
        <div className="flex gap-2">
          {canDeleteAll() && notifications.length > 0 && (
            <button onClick={handleDeleteAll} className="btn-danger flex items-center gap-2">
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
              className="btn-primary flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Send Notification
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex gap-4">
          <select className="input-field" value={filters.type} onChange={(e) => handleFilterChange('type', e.target.value)}>
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
          <select className="input-field" value={filters.targetAudience} onChange={(e) => handleFilterChange('targetAudience', e.target.value)}>
            <option value="">All Audiences</option>
            <option value="all">All</option>
            <option value="students">Students</option>
            <option value="faculty">Faculty</option>
            <option value="staff">Staff</option>
            <option value="admission">Admission</option>
            <option value="accountant">Accountant</option>
            <option value="department">Department</option>
          </select>
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-4">
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div key={notification._id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{notification.title}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeColor(notification.type)}`}>
                      {notification.type}
                    </span>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      {getAudienceIcon(notification.targetAudience)}
                      <span className="capitalize">{notification.targetAudience}</span>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-3">{notification.message}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>Created: {new Date(notification.createdAt).toLocaleDateString()}</span>
                    {notification.createdBy && (
                      <span>By: {notification.createdBy.email}</span>
                    )}
                    {notification.department && <span>Department: {notification.department}</span>}
                    {notification.semester && <span>Semester: {notification.semester}</span>}
                    {notification.expiryDate && (
                      <span>Expires: {new Date(notification.expiryDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                {canDeleteNotification(notification) && (
                  <div className="flex gap-2 ml-4">
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
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Send Notification</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                placeholder="Notification Title"
                className="input-field"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                required
              />

              <textarea
                placeholder="Message"
                className="input-field h-24 resize-none"
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                required
              />

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
                onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
                required
              >
                <option value="">Select Audience</option>
                {targetAudiences[user?.role]?.map(audience => (
                  <option key={audience} value={audience}>{audience.charAt(0).toUpperCase() + audience.slice(1)}</option>
                ))}
              </select>

              {(formData.targetAudience === 'students' || formData.targetAudience === 'department') && (
                <select
                  className="input-field"
                  value={formData.department}
                  onChange={(e) => setFormData({...formData, department: e.target.value})}
                  required
                >
                  <option value="">Select Department</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                </select>
              )}

              {formData.targetAudience === 'students' && formData.department && (
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

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary flex items-center gap-2">
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
