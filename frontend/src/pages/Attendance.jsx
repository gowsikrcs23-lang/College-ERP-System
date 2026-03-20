import { useState, useEffect } from 'react';
import { Users, Check, X, Clock } from 'lucide-react';
import { attendanceAPI, studentsAPI, facultyAPI, classFacultyAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const formatAttendanceStatus = (status) => {
  if (!status) return 'Unknown';
  const normalized = status.toLowerCase();
  if (normalized === 'od') return 'OD';
  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
};

const getAttendanceBadgeClass = (status) => {
  const normalized = (status || '').toLowerCase();
  if (normalized === 'present') return 'bg-green-100 text-green-800';
  if (normalized === 'absent') return 'bg-red-100 text-red-800';
  if (normalized === 'od') return 'bg-amber-100 text-amber-800';
  if (normalized === 'late') return 'bg-yellow-100 text-yellow-800';
  return 'bg-gray-100 text-gray-800';
};

const Attendance = () => {
  const { user } = useAuth();

  if (user?.role === 'student') {
    return <StudentAttendanceView />;
  }

  return <StaffAttendancePage />;
};

// Staff Attendance Page (request + approvals + admin view)
const StaffAttendancePage = () => {
  const { user } = useAuth();
  const isAdminView = user?.role === 'admin' || user?.role === 'management';

  return (
    <div className="space-y-10">
      <StaffAttendanceView />
      {isAdminView && <AdminAttendanceView />}
    </div>
  );
};

// Staff Attendance View
const StaffAttendanceView = () => {
  const { user } = useAuth();
  const isFaculty = user?.role === 'faculty';
  const canAssignClassFaculty = ['admin', 'management', 'hod'].includes(user?.role);
  const [students, setStudents] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [requestLoading, setRequestLoading] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestError, setRequestError] = useState('');
  const [myRequests, setMyRequests] = useState([]);
  const [myRequestsLoading, setMyRequestsLoading] = useState(false);
  const [myRequestsError, setMyRequestsError] = useState('');
  const [facultyList, setFacultyList] = useState([]);
  const [classFacultyId, setClassFacultyId] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [formData, setFormData] = useState({
    department: user?.profile?.department || '',
    semester: '',
    session: 'morning',
    date: new Date().toISOString().split('T')[0]
  });
  const [attendanceData, setAttendanceData] = useState({});

  useEffect(() => {
    if (formData.department && formData.semester) {
      fetchStudents();
      fetchAttendanceHistory();
      fetchClassFaculty();
    }
  }, [formData.department, formData.semester]);

  useEffect(() => {
    if (canAssignClassFaculty) {
      fetchFacultyList();
    }
  }, [canAssignClassFaculty]);

  useEffect(() => {
    if (!canAssignClassFaculty || !formData.department || classFacultyId) return;
    const deptFaculty = facultyList.filter((faculty) => faculty.department === formData.department);
    if (deptFaculty.length === 1) {
      setClassFacultyId(deptFaculty[0]._id);
    }
  }, [canAssignClassFaculty, formData.department, facultyList, classFacultyId]);

  useEffect(() => {
    if (isFaculty) {
      fetchPendingRequests();
    }
  }, [isFaculty]);

  useEffect(() => {
    fetchMyRequests();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentsAPI.getByDepartment(formData.department, { scope: 'attendance' });
      const filteredStudents = response.data.filter(
        student => student.semester === parseInt(formData.semester)
      );
      setStudents(filteredStudents);
      
      const initialAttendance = {};
      filteredStudents.forEach(student => {
        initialAttendance[student._id] = 'present';
      });
      setAttendanceData(initialAttendance);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRequests = async () => {
    try {
      setRequestLoading(true);
      setRequestError('');
      const response = await attendanceAPI.getRequests({ status: 'pending' });
      setPendingRequests(response.data || []);
    } catch (error) {
      const status = error.response?.status;
      if (status === 403 || status === 404) {
        setRequestError('Attendance requests are not available.');
      } else {
        setRequestError('Failed to fetch attendance requests.');
      }
    } finally {
      setRequestLoading(false);
    }
  };

  const fetchMyRequests = async () => {
    try {
      setMyRequestsLoading(true);
      setMyRequestsError('');
      const response = await attendanceAPI.getMyRequests();
      setMyRequests(response.data || []);
    } catch (error) {
      const status = error.response?.status;
      if (status === 403 || status === 404) {
        setMyRequestsError('Attendance requests are not available.');
      } else {
        setMyRequestsError('Failed to fetch your attendance requests.');
      }
    } finally {
      setMyRequestsLoading(false);
    }
  };

  const fetchAttendanceHistory = async () => {
    if (!formData.department || !formData.semester) return;
    
    try {
      const response = await attendanceAPI.getByClass({
        department: formData.department,
        semester: formData.semester
      });
      setAttendanceHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch attendance history');
    }
  };

  const fetchFacultyList = async () => {
    try {
      const response = await facultyAPI.getAll();
      setFacultyList(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch faculty list');
    }
  };

  const fetchClassFaculty = async () => {
    try {
      const response = await classFacultyAPI.getAll({
        department: formData.department,
        semester: formData.semester
      });
      const assignment = Array.isArray(response.data) ? response.data[0] : null;
      setClassFacultyId(assignment?.faculty?._id || assignment?.faculty || '');
    } catch (error) {
      setClassFacultyId('');
    }
  };

  const handleAssignClassFaculty = async () => {
    if (!classFacultyId) {
      toast.error('Please select a class faculty');
      return;
    }

    try {
      setAssigning(true);
      const response = await classFacultyAPI.setAssignment({
        department: formData.department,
        semester: formData.semester,
        facultyId: classFacultyId
      });
      toast.success(response.data?.message || 'Class faculty assigned');
      fetchClassFaculty();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign class faculty');
    } finally {
      setAssigning(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (students.length === 0) {
      toast.error('Please select department and semester');
      return;
    }

    try {
      setLoading(true);
      const attendanceRecords = students.map(student => ({
        studentId: student._id,
        status: attendanceData[student._id] || 'present'
      }));

      const response = await attendanceAPI.mark({
        students: attendanceRecords,
        fn: students[0]?.fn || 'FN001',
        session: formData.session,
        date: formData.date,
        semester: parseInt(formData.semester),
        department: formData.department
      });

      toast.success(response.data?.message || 'Attendance submitted');
      fetchAttendanceHistory();
      fetchMyRequests();
      if (isFaculty) {
        fetchPendingRequests();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to mark attendance');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleUpdateAttendance = async (id, newStatus) => {
    try {
      await attendanceAPI.update(id, { status: newStatus });
      toast.success('Attendance updated');
      fetchAttendanceHistory();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update attendance');
    }
  };

  const handleDeleteAttendance = async (id) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) return;
    
    try {
      await attendanceAPI.delete(id);
      toast.success('Attendance deleted');
      fetchAttendanceHistory();
      if (isFaculty) {
        fetchPendingRequests();
      }
    } catch (error) {
      toast.error('Failed to delete attendance');
    }
  };

  const handleApproveRequest = async (requestId) => {
    try {
      await attendanceAPI.approveRequest(requestId);
      toast.success('Attendance request approved');
      fetchPendingRequests();
      fetchAttendanceHistory();
      fetchMyRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve request');
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      await attendanceAPI.rejectRequest(requestId, {});
      toast.success('Attendance request rejected');
      fetchPendingRequests();
      fetchMyRequests();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject request');
    }
  };

  const stats = {
    total: students.length,
    present: Object.values(attendanceData).filter(s => ['present', 'od', 'late'].includes(s)).length,
    absent: Object.values(attendanceData).filter(s => s === 'absent').length,
    od: Object.values(attendanceData).filter(s => s === 'od').length
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Submit Attendance</h1>

      <div className="card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <select
              className="input-field"
              value={formData.department}
              onChange={(e) => setFormData({...formData, department: e.target.value})}
              required
            >
              <option value="">Select Department</option>
              <option value="Computer Science">Dept: Computer Science (CSE)</option>
              <option value="Electronics">Dept: Electronics (ECE)</option>
              <option value="Mechanical">Dept: Mechanical (MECH)</option>
              <option value="Civil">Dept: Civil (CIV)</option>
            </select>

            <select
              className="input-field"
              value={formData.semester}
              onChange={(e) => setFormData({...formData, semester: e.target.value})}
              required
            >
              <option value="">Select Semester</option>
              {[1,2,3,4,5,6,7,8].map(sem => (
                <option key={sem} value={sem}>Sem {sem} (S{sem})</option>
              ))}
            </select>

            <select
              className="input-field"
              value={formData.session}
              onChange={(e) => setFormData({...formData, session: e.target.value})}
              required
            >
              <option value="morning">Morning (8:45 AM - 12:20 PM)</option>
              <option value="afternoon">Afternoon (1:25 PM - 4:25 PM)</option>
            </select>

            <input
              type="date"
              className="input-field"
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              required
            />
          </div>

          {canAssignClassFaculty && formData.department && formData.semester && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Class Faculty Assignment</h3>
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <select
                  className="input-field md:flex-1"
                  value={classFacultyId}
                  onChange={(e) => setClassFacultyId(e.target.value)}
                >
                  <option value="">Select Class Faculty</option>
                  {facultyList
                    .filter((faculty) => !formData.department || faculty.department === formData.department)
                    .map((faculty) => (
                      <option key={faculty._id} value={faculty._id}>
                        {faculty.firstName} {faculty.lastName} ({faculty.facultyId}) - {faculty.department}
                      </option>
                    ))}
                </select>
                <button
                  type="button"
                  onClick={handleAssignClassFaculty}
                  disabled={assigning}
                  className="btn-primary md:w-auto"
                >
                  {assigning ? 'Saving...' : 'Save Class Faculty'}
                </button>
              </div>
            </div>
          )}

          {students.length > 0 && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-600">Total</span>
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Check className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-600">Present (incl. OD)</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{stats.present}</p>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-amber-600 mr-2" />
                    <span className="text-sm font-medium text-amber-600">OD</span>
                  </div>
                  <p className="text-2xl font-bold text-amber-900">{stats.od}</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <div className="flex items-center">
                    <X className="h-5 w-5 text-red-600 mr-2" />
                    <span className="text-sm font-medium text-red-600">Absent</span>
                  </div>
                  <p className="text-2xl font-bold text-red-900">{stats.absent}</p>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-md font-medium text-gray-900 mb-3">Students</h4>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {students.map((student) => (
                    <div key={student._id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-sm text-gray-500">FN: {student.fn}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleAttendanceChange(student._id, 'present')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            attendanceData[student._id] === 'present'
                              ? 'bg-green-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttendanceChange(student._id, 'od')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            attendanceData[student._id] === 'od'
                              ? 'bg-amber-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          OD
                        </button>
                        <button
                          type="button"
                          onClick={() => handleAttendanceChange(student._id, 'absent')}
                          className={`px-4 py-2 rounded-lg text-sm font-medium ${
                            attendanceData[student._id] === 'absent'
                              ? 'bg-red-500 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          Absent
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Marking...' : 'Mark Attendance'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>

      {/* My Attendance Requests */}
      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">My Attendance Requests</h3>
        {myRequestsLoading ? (
          <p className="text-sm text-gray-500">Loading your requests...</p>
        ) : myRequestsError ? (
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <p className="text-sm text-gray-500">{myRequestsError}</p>
            <button
              type="button"
              onClick={fetchMyRequests}
              className="px-3 py-1.5 text-sm rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Retry
            </button>
          </div>
        ) : myRequests.length === 0 ? (
          <p className="text-sm text-gray-500">No attendance requests sent yet.</p>
        ) : (
          <div className="space-y-3">
            {myRequests.map((request) => (
              <div key={request._id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500">
                    {new Date(request.date).toLocaleDateString()} | {request.session} | {request.department} - Sem {request.semester}
                  </p>
                  <p className="text-sm text-gray-700">
                    Class Faculty: {request.assignedFaculty?.firstName ? `${request.assignedFaculty.firstName} ${request.assignedFaculty.lastName}` : 'Assigned'}
                    {request.assignedFaculty?.facultyId ? ` (${request.assignedFaculty.facultyId})` : ''}
                  </p>
                  {request.status === 'approved' && (
                    <p className="text-sm text-green-700">
                      Approved by {request.approvedByName || 'Faculty'}{request.approvedByFacultyId ? ` (${request.approvedByFacultyId})` : ''} on {request.approvedAt ? new Date(request.approvedAt).toLocaleString() : '-'}
                    </p>
                  )}
                  {request.status === 'rejected' && (
                    <p className="text-sm text-red-700">
                      Rejected by {request.rejectedByName || 'Faculty'}{request.rejectedByFacultyId ? ` (${request.rejectedByFacultyId})` : ''} on {request.rejectedAt ? new Date(request.rejectedAt).toLocaleString() : '-'}
                    </p>
                  )}
                </div>
                <div>
                  <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                    request.status === 'approved'
                      ? 'bg-green-100 text-green-800'
                      : request.status === 'rejected'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {request.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pending Requests (Faculty) */}
      {isFaculty && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Attendance Requests</h3>
          {requestLoading ? (
            <p className="text-sm text-gray-500">Loading requests...</p>
          ) : requestError ? (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <p className="text-sm text-gray-500">{requestError}</p>
              <button
                type="button"
                onClick={fetchPendingRequests}
                className="px-3 py-1.5 text-sm rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Retry
              </button>
            </div>
          ) : pendingRequests.length === 0 ? (
            <p className="text-sm text-gray-500">No pending requests.</p>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map((request) => (
                <div key={request._id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-500">
                      {new Date(request.date).toLocaleDateString()} | {request.session} | {request.department} - Sem {request.semester}
                    </p>
                    <p className="text-sm text-gray-700">
                      Requested By: {request.requestedBy?.email || 'Staff'} ({request.requestedBy?.role || 'staff'})
                    </p>
                    <p className="text-sm text-gray-500">Students: {request.students?.length || 0}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleApproveRequest(request._id)}
                      className="px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectRequest(request._id)}
                      className="px-3 py-1.5 text-sm rounded bg-red-600 text-white hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Attendance History */}
      {formData.department && formData.semester && attendanceHistory.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance History</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marked By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Requested By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marked At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Update</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceHistory.map((record) => {
                  const canUpdateRecord = user?.role && user.role !== 'student';
                  return (
                  <tr key={record._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(record.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.student?.firstName} {record.student?.lastName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {record.session}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.faculty ? `${record.faculty.firstName} ${record.faculty.lastName}` : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {record.requestedByName
                        || record.requestedBy?.email
                        || (record.faculty ? `${record.faculty.firstName} ${record.faculty.lastName} (Self)` : 'N/A')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(record.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAttendanceBadgeClass(record.status)}`}>
                        {formatAttendanceStatus(record.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      {canUpdateRecord ? (
                        <>
                          <select
                            className="border border-gray-300 rounded-md px-2 py-1 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={(record.status || '').toLowerCase()}
                            onChange={(e) => handleUpdateAttendance(record._id, e.target.value)}
                            aria-label="Update attendance status"
                          >
                            <option value="present">Present</option>
                            <option value="absent">Absent</option>
                            <option value="od">OD (On Duty)</option>
                          </select>
                          <button
                            onClick={() => handleDeleteAttendance(record._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Delete
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-500">Only class faculty can update</span>
                      )}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

// Student Attendance View
const StudentAttendanceView = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await attendanceAPI.getByStudent(user.profile._id);
      setAttendance(response.data.attendance);
      setSummary(response.data.summary);
    } catch (error) {
      toast.error('Failed to fetch attendance');
    } finally {
      setLoading(false);
    }
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
      <h1 className="text-2xl font-bold text-gray-900">My Attendance</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600">Total Classes</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{summary?.totalClasses || 0}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600">Present</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{summary?.presentClasses || 0}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600">Absent</h3>
          <p className="text-3xl font-bold text-red-600 mt-2">{summary?.absentClasses || 0}</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-600">Attendance %</h3>
          <p className={`text-3xl font-bold mt-2 ${
            summary?.attendancePercentage >= 75 ? 'text-green-600' : 'text-red-600'
          }`}>
            {summary?.attendancePercentage || 0}%
          </p>
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Records</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marked At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marked By</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {attendance.map((record) => (
                <tr key={record._id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {record.session}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {record.session === 'morning' ? '8:45 AM - 12:20 PM' : '1:25 PM - 4:25 PM'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(record.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAttendanceBadgeClass(record.status)}`}>
                      {formatAttendanceStatus(record.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.faculty ? `${record.faculty.firstName} ${record.faculty.lastName}` : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Admin Attendance View
const AdminAttendanceView = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [students, setStudents] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchAllStudents();
  }, []);

  const fetchAllStudents = async () => {
    try {
      setLoading(true);
      const response = await studentsAPI.getAll();
      setAllStudents(response.data);
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const searchStudents = () => {
    if (!searchQuery) {
      setStudents([]);
      return;
    }
    
    const filtered = allStudents.filter(s => 
      s.fn?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.studentId?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setStudents(filtered);
  };

  useEffect(() => {
    searchStudents();
  }, [searchQuery, allStudents]);

  const viewStudentAttendance = async (student) => {
    setSelectedStudent(student);
    try {
      const response = await attendanceAPI.getByStudent(student._id);
      setAttendance(response.data.attendance);
      setSummary(response.data.summary);
    } catch (error) {
      toast.error('Failed to fetch attendance');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Student Attendance</h1>

      <div className="card">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Search Student</h3>
        <div className="flex space-x-4">
          <input
            type="text"
            className="input-field flex-1"
            placeholder="Search by FN, Name, or Student ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {students.length > 0 && (
          <div className="mt-4 space-y-2">
            {students.map(student => (
              <div
                key={student._id}
                onClick={() => viewStudentAttendance(student)}
                className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <p className="font-medium">{student.firstName} {student.lastName}</p>
                <p className="text-sm text-gray-600">FN: {student.fn} | {student.department} | Sem {student.semester}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedStudent && (
        <>
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              {selectedStudent.firstName} {selectedStudent.lastName} - Attendance Summary
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-blue-600">Total Classes</h4>
                <p className="text-2xl font-bold text-blue-900">{summary?.totalClasses || 0}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-green-600">Present</h4>
                <p className="text-2xl font-bold text-green-900">{summary?.presentClasses || 0}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-red-600">Absent</h4>
                <p className="text-2xl font-bold text-red-900">{summary?.absentClasses || 0}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-purple-600">Percentage</h4>
                <p className={`text-2xl font-bold ${
                  summary?.attendancePercentage >= 75 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {summary?.attendancePercentage || 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Attendance Records</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Session</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marked At</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attendance.map((record) => (
                    <tr key={record._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(record.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {record.session}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {record.session === 'morning' ? '8:45 AM - 12:20 PM' : '1:25 PM - 4:25 PM'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(record.updatedAt).toLocaleString()}
                      </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getAttendanceBadgeClass(record.status)}`}>
                      {formatAttendanceStatus(record.status)}
                    </span>
                  </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Attendance;
