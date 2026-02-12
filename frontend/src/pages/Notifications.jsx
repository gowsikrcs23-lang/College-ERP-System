import { useState, useEffect } from 'react';
import { Plus, Bell, Send, Trash2, Users, GraduationCap } from 'lucide-react';
import { notificationsAPI, studentsAPI, facultyAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [students, setStudents] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    type: '',
    targetAudience: '',
    department: '',
    semester: '',
    expiryDate: ''
  });

  const notificationTypes = {
    admin: ['general', 'academic', 'fee', 'exam', 'attendance', 'meeting', 'announcement'],
    faculty: ['attendance', 'academic', 'exam', 'meeting', 'assignment'],
    accountant: ['fee', 'payment', 'financial', 'reminder']
  };

  const targetAudiences = {
    admin: ['all', 'students', 'faculty', 'department'],
    faculty: ['students', 'department'],
    accountant: ['students', 'faculty']
  };

  useEffect(() => {
    fetchNotifications();
    if (user?.role === 'admin' || user?.role === 'accountant') {
      fetchStudents();
      fetchFaculty();
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await notificationsAPI.getAll();
      setNotifications(response.data);
    } catch (error) {
      toast.error('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await studentsAPI.getAll();
      setStudents(response.data);
    } catch (error) {
      console.error('Failed to fetch students');
    }
  };

  const fetchFaculty = async () => {
    try {
      const response = await facultyAPI.getAll();
      setFaculty(response.data);
    } catch (error) {
      console.error('Failed to fetch faculty');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await notificationsAPI.create(formData);
      toast.success('Notification sent successfully');
      fetchNotifications();
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
        fetchNotifications();
      } catch (error) {
        toast.error('Failed to delete notification');
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
      reminder: 'bg-amber-100 text-amber-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  const getAudienceIcon = (audience) => {
    switch (audience) {
      case 'students': return <GraduationCap className="h-4 w-4" />;
      case 'faculty': return <Users className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const canCreateNotification = () => {
    return ['admin', 'faculty', 'accountant'].includes(user?.role);
  };

  const canDeleteNotification = (notification) => {
    return user?.role === 'admin' || notification.createdBy === user?.id;
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
                    {notification.department && <span>Department: {notification.department}</span>}
                    {notification.semester && <span>Semester: {notification.semester}</span>}
                    {notification.expiryDate && (
                      <span>Expires: {new Date(notification.expiryDate).toLocaleDateString()}</span>
                    )}
                  </div>
                </div>
                {canDeleteNotification(notification) && (
                  <button
                    onClick={() => handleDelete(notification._id)}
                    className="text-red-600 hover:text-red-900 ml-4"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
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

              {(formData.targetAudience === 'department' || formData.targetAudience === 'students') && (
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