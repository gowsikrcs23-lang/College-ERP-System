import { useState, useEffect } from 'react';
import { Calendar, Users, Check, X, Clock, Search } from 'lucide-react';
import { attendanceAPI, studentsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Attendance = () => {
  const { user } = useAuth();

  if (user?.role === 'student') {
    return <StudentAttendanceView />;
  }

  if (user?.role === 'faculty') {
    return <FacultyAttendanceView />;
  }

  if (user?.role === 'admin' || user?.role === 'management') {
    return <AdminAttendanceView />;
  }

  return null;
};

// Faculty Attendance View
const FacultyAttendanceView = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [loading, setLoading] = useState(false);
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
    }
  }, [formData.department, formData.semester]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await studentsAPI.getByDepartment(formData.department);
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

      await attendanceAPI.mark({
        students: attendanceRecords,
        fn: students[0]?.fn || 'FN001',
        session: formData.session,
        date: formData.date,
        semester: parseInt(formData.semester),
        department: formData.department
      });

      toast.success('Attendance marked successfully');
      fetchAttendanceHistory();
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
      toast.error('Failed to update attendance');
    }
  };

  const handleDeleteAttendance = async (id) => {
    if (!confirm('Are you sure you want to delete this attendance record?')) return;
    
    try {
      await attendanceAPI.delete(id);
      toast.success('Attendance deleted');
      fetchAttendanceHistory();
    } catch (error) {
      toast.error('Failed to delete attendance');
    }
  };

  const stats = {
    total: students.length,
    present: Object.values(attendanceData).filter(s => s === 'present').length,
    absent: Object.values(attendanceData).filter(s => s === 'absent').length
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Mark Attendance</h1>

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
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
            </select>

            <select
              className="input-field"
              value={formData.semester}
              onChange={(e) => setFormData({...formData, semester: e.target.value})}
              required
            >
              <option value="">Select Semester</option>
              {[1,2,3,4,5,6,7,8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
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

          {students.length > 0 && (
            <>
              <div className="grid grid-cols-3 gap-4 mt-6">
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
                    <span className="text-sm font-medium text-green-600">Present</span>
                  </div>
                  <p className="text-2xl font-bold text-green-900">{stats.present}</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marked At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendanceHistory.map((record) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {new Date(record.updatedAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                      <button
                        onClick={() => handleUpdateAttendance(record._id, record.status === 'present' ? 'absent' : 'present')}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Toggle
                      </button>
                      <button
                        onClick={() => handleDeleteAttendance(record._id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
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
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {record.status}
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
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          record.status === 'present' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {record.status}
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