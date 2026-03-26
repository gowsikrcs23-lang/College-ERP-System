import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, Edit, Trash2, Download, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { exportToCsv } from '../utils/csv';

const Admissions = () => {
  const { user } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingApp, setEditingApp] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [studentData, setStudentData] = useState({
    email: '',
    password: '',
    studentId: ''
  });

  useEffect(() => {
    fetchApplications();
  }, [filter]);

  const fetchApplications = async () => {
    try {
      const params = filter !== 'all' ? { status: filter } : {};
      const response = await axios.get('/api/admissions', { params });
      setApplications(response.data);
    } catch (error) {
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await axios.put(`/api/admissions/${id}/status`, { status });
      toast.success(`Application ${status}`);
      fetchApplications();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleApprove = async () => {
    if (!studentData.studentId || !studentData.password) {
      toast.error('Please provide Student ID and Password');
      return;
    }

    try {
      await axios.put(`/api/admissions/${editingApp._id}/approve`, studentData);
      toast.success('Application approved and student account created');
      setShowEditModal(false);
      fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve application');
    }
  };

  const handleDelete = async (id, applicantName) => {
    const confirmed = window.confirm(`Delete the application for ${applicantName}?`);
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      await axios.delete(`/api/admissions/${id}`);
      toast.success('Application deleted');
      fetchApplications();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete application');
    } finally {
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    };
    return styles[status] || styles.pending;
  };

  const filteredApplications = applications.filter((app) => {
    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;
    const fullName = `${app.firstName || ''} ${app.lastName || ''}`.toLowerCase();
    return (
      fullName.includes(query) ||
      (app.email || '').toLowerCase().includes(query) ||
      (app.phone || '').toLowerCase().includes(query) ||
      (app.department || '').toLowerCase().includes(query)
    );
  });

  const handleExportAdmissions = () => {
    if (filteredApplications.length === 0) {
      toast.error('No applications to export');
      return;
    }

    const rows = filteredApplications.map((app) => ({
      name: `${app.firstName || ''} ${app.lastName || ''}`.trim(),
      email: app.email || '',
      phone: app.phone || '',
      department: app.department || '',
      previousPercentage: app.previousPercentage ?? '',
      status: app.status || '',
      appliedOn: app.applicationDate ? new Date(app.applicationDate).toLocaleDateString() : ''
    }));

    exportToCsv('admissions_export.csv', rows, [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'department', label: 'Department' },
      { key: 'previousPercentage', label: 'Previous %' },
      { key: 'status', label: 'Status' },
      { key: 'appliedOn', label: 'Applied On' }
    ]);
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admission Applications</h1>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${filter === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg ${filter === 'pending' ? 'bg-yellow-500 text-white' : 'bg-gray-100'}`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`px-4 py-2 rounded-lg ${filter === 'approved' ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('rejected')}
            className={`px-4 py-2 rounded-lg ${filter === 'rejected' ? 'bg-red-500 text-white' : 'bg-gray-100'}`}
          >
            Rejected
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search name, email, phone, department..."
            className="input-field pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          type="button"
          onClick={handleExportAdmissions}
          className="btn-secondary flex items-center justify-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {filteredApplications.map((app) => (
          <div key={app._id} className="card">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {app.firstName} {app.lastName}
                </h3>
                <p className="text-sm text-gray-600">{app.email} | {app.phone}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(app.status)}`}>
                {app.status}
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <p className="text-xs text-gray-600">Department</p>
                <p className="font-medium">{app.department}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">DOB</p>
                <p className="font-medium">{new Date(app.dateOfBirth).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Previous %</p>
                <p className="font-medium">{app.previousPercentage}%</p>
              </div>
              <div>
                <p className="text-xs text-gray-600">Applied On</p>
                <p className="font-medium">{new Date(app.applicationDate).toLocaleDateString()}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-600">Guardian</p>
                  <p className="font-medium">{app.guardianName} ({app.guardianRelation})</p>
                  <p className="text-sm text-gray-600">{app.guardianPhone}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Previous School</p>
                  <p className="font-medium">{app.previousSchool}</p>
                </div>
              </div>

              {['admission', 'admin', 'management'].includes(user?.role) && (
                <div className="flex flex-wrap gap-2 mb-4">
                  <button
                    onClick={() => handleDelete(app._id, `${app.firstName} ${app.lastName}`)}
                    disabled={deletingId === app._id}
                    className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    {deletingId === app._id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              )}

              {app.status === 'pending' && user?.role === 'admission' && (
                <div className="flex space-x-2">
                  <button
                    onClick={() => updateStatus(app._id, 'approved')}
                    className="flex items-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                  <button
                    onClick={() => updateStatus(app._id, 'rejected')}
                    className="flex items-center px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                </div>
              )}
              
              {app.status === 'approved' && user?.role === 'management' && !app.studentCreated && (
                <button
                  onClick={() => {
                    setEditingApp(app);
                    setStudentData({ email: app.email, password: '', studentId: '' });
                    setShowEditModal(true);
                  }}
                  className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Create Student Account
                </button>
              )}
            </div>
          </div>
        ))}

        {filteredApplications.length === 0 && (
          <div className="text-center py-12">
            <Clock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No applications found</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-4 text-white">
              <h3 className="text-xl font-bold">Create Student Account</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Applicant: {editingApp.firstName} {editingApp.lastName}</p>
                <p className="text-sm text-gray-600">Department: {editingApp.department}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID *</label>
                <input
                  type="text"
                  className="input-field"
                  value={studentData.studentId}
                  onChange={(e) => setStudentData({...studentData, studentId: e.target.value})}
                  placeholder="Enter Student ID"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  className="input-field"
                  value={studentData.email}
                  onChange={(e) => setStudentData({...studentData, email: e.target.value})}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  className="input-field"
                  value={studentData.password}
                  onChange={(e) => setStudentData({...studentData, password: e.target.value})}
                  placeholder="Enter password for student"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApprove}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  Create Student Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admissions;
