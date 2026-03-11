import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FileText, Download, Eye, Trash2, Users } from 'lucide-react';

const Reports = () => {
  const { user } = useAuth();

  // Faculty/Staff can create and view all reports
  if (user?.role === 'faculty') {
    return <FacultyReportsView />;
  }

  // Admin, Management, HOD can view all reports
  if (user?.role === 'admin' || user?.role === 'management' || user?.role === 'hod') {
    return <AdminHODReportsView />;
  }

  // Students can only view their own reports
  if (user?.role === 'student') {
    return <StudentReportsView />;
  }

  // Accountant and Admission roles can view all reports
  if (user?.role === 'accountant' || user?.role === 'admission') {
    return <AdminHODReportsView />;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
      <p className="text-gray-600 mt-2">You don't have permission to view this page.</p>
    </div>
  );
};

const FacultyReportsView = () => {
  const [students, setStudents] = useState([]);
  const [reports, setReports] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({ reportType: '', semester: '' });
  const [formData, setFormData] = useState({
    studentId: '',
    reportType: 'comprehensive',
    semester: '',
    academicYear: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchReports();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/students');
      setStudents(response.data);
    } catch (error) {
      toast.error('Failed to fetch students');
    }
  };

  const fetchReports = async (filterParams = {}) => {
    try {
      const response = await axios.get('/api/reports', { params: filterParams });
      setReports(response.data);
    } catch (error) {
      toast.error('Failed to fetch reports');
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchReports(newFilters);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/reports/generate', formData);
      toast.success('Report generated successfully');
      setShowModal(false);
      resetForm();
      fetchReports(filters);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await axios.delete(`/api/reports/${id}`);
      toast.success('Report deleted successfully');
      fetchReports(filters);
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL reports? This action cannot be undone!')) return;
    try {
      const response = await axios.delete('/api/reports/delete/all', { params: filters });
      toast.success(`Deleted ${response.data.deletedCount} reports successfully`);
      fetchReports(filters);
    } catch (error) {
      toast.error('Failed to delete reports');
    }
  };

  const handleDeleteStudentReports = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete ALL reports for this student? This action cannot be undone!')) return;
    try {
      const response = await axios.delete(`/api/reports/student/${studentId}/delete`, { params: filters });
      toast.success(`Deleted ${response.data.deletedCount} reports for this student`);
      fetchReports(filters);
    } catch (error) {
      toast.error('Failed to delete student reports');
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      reportType: 'comprehensive',
      semester: '',
      academicYear: ''
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Generate Reports</h1>
        <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Generate Report
        </button>
      </div>

      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-900">All Reports</h2>
          {reports.length > 0 && (
            <button onClick={handleDeleteAll} className="btn-danger flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Delete All
            </button>
          )}
        </div>
        
        <div className="flex gap-4 mb-4">
          <select className="input-field" value={filters.reportType} onChange={(e) => handleFilterChange('reportType', e.target.value)}>
            <option value="">All Report Types</option>
            <option value="comprehensive">Comprehensive</option>
            <option value="attendance">Attendance</option>
            <option value="exam">Exam</option>
          </select>
          <select className="input-field" value={filters.semester} onChange={(e) => handleFilterChange('semester', e.target.value)}>
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          {reports.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No reports generated yet</p>
          ) : (
            reports.map((report) => (
              <div key={report._id} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">{report.student?.firstName} {report.student?.lastName} ({report.student?.studentId})</h3>
                  <p className="text-sm text-gray-600">{report.reportType} - Semester {report.semester} ({report.academicYear})</p>
                  <p className="text-xs text-gray-500">Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <a href={`/reports/${report._id}`} className="text-primary-600 hover:text-primary-800">
                    <Eye className="h-5 w-5" />
                  </a>
                  <button onClick={() => handleDeleteStudentReports(report.student._id)} className="text-orange-600 hover:text-orange-800" title="Delete all reports for this student">
                    <Users className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleDelete(report._id)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Generate Report</h3>
            <form onSubmit={handleGenerate} className="space-y-4">
              <select className="input-field" value={formData.studentId} onChange={(e) => setFormData({...formData, studentId: e.target.value})} required>
                <option value="">Select Student</option>
                {students.map(s => (
                  <option key={s._id} value={s._id}>{s.firstName} {s.lastName} ({s.studentId})</option>
                ))}
              </select>
              <select className="input-field" value={formData.reportType} onChange={(e) => setFormData({...formData, reportType: e.target.value})} required>
                <option value="comprehensive">Comprehensive Report</option>
                <option value="attendance">Attendance Only</option>
                <option value="exam">Exam Results Only</option>
              </select>
              <select className="input-field" value={formData.semester} onChange={(e) => setFormData({...formData, semester: e.target.value})} required>
                <option value="">Select Semester</option>
                {[1,2,3,4,5,6,7,8].map(sem => <option key={sem} value={sem}>{sem}</option>)}
              </select>
              <select className="input-field" value={formData.academicYear} onChange={(e) => setFormData({...formData, academicYear: e.target.value})} required>
                <option value="">Academic Year</option>
                <option value="2023-24">2023-24</option>
                <option value="2024-25">2024-25</option>
                <option value="2025-26">2025-26</option>
              </select>
              <div className="flex justify-end space-x-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Generating...' : 'Generate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const AdminHODReportsView = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ reportType: '', semester: '' });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async (filterParams = {}) => {
    try {
      const response = await axios.get('/api/reports', { params: filterParams });
      setReports(response.data);
    } catch (error) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchReports(newFilters);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await axios.delete(`/api/reports/${id}`);
      toast.success('Report deleted successfully');
      fetchReports(filters);
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL reports? This action cannot be undone!')) return;
    try {
      const response = await axios.delete('/api/reports/delete/all', { params: filters });
      toast.success(`Deleted ${response.data.deletedCount} reports successfully`);
      fetchReports(filters);
    } catch (error) {
      toast.error('Failed to delete reports');
    }
  };

  const handleDeleteStudentReports = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete ALL reports for this student? This action cannot be undone!')) return;
    try {
      const response = await axios.delete(`/api/reports/student/${studentId}/delete`, { params: filters });
      toast.success(`Deleted ${response.data.deletedCount} reports for this student`);
      fetchReports(filters);
    } catch (error) {
      toast.error('Failed to delete student reports');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">View Reports</h1>
        {reports.length > 0 && (
          <button onClick={handleDeleteAll} className="btn-danger flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Delete All Reports
          </button>
        )}
      </div>

      <div className="card">
        <div className="flex gap-4 mb-4">
          <select className="input-field" value={filters.reportType} onChange={(e) => handleFilterChange('reportType', e.target.value)}>
            <option value="">All Report Types</option>
            <option value="comprehensive">Comprehensive</option>
            <option value="attendance">Attendance</option>
            <option value="exam">Exam</option>
          </select>
          <select className="input-field" value={filters.semester} onChange={(e) => handleFilterChange('semester', e.target.value)}>
            <option value="">All Semesters</option>
            {[1,2,3,4,5,6,7,8].map(sem => <option key={sem} value={sem}>Semester {sem}</option>)}
          </select>
        </div>
        <div className="space-y-3">
          {reports.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No reports generated yet</p>
          ) : (
            reports.map((report) => (
              <div key={report._id} className="flex justify-between items-center p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">{report.student?.firstName} {report.student?.lastName} ({report.student?.studentId})</h3>
                  <p className="text-sm text-gray-600">{report.reportType} - Semester {report.semester} ({report.academicYear})</p>
                  <p className="text-xs text-gray-500">Generated by {report.generatedBy?.email} on {new Date(report.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex gap-2">
                  <a href={`/reports/${report._id}`} className="text-primary-600 hover:text-primary-800">
                    <Eye className="h-5 w-5" />
                  </a>
                  <button onClick={() => handleDeleteStudentReports(report.student._id)} className="text-orange-600 hover:text-orange-800" title="Delete all reports for this student">
                    <Users className="h-5 w-5" />
                  </button>
                  <button onClick={() => handleDelete(report._id)} className="text-red-600 hover:text-red-800">
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

const StudentReportsView = () => {
  const { user } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.profile?._id) {
      fetchReports();
    } else {
      setLoading(false);
      setError('Profile not found. Please login again.');
    }
  }, [user]);

  const fetchReports = async () => {
    if (!user?.profile?._id) {
      setError('Student profile not found');
      setLoading(false);
      return;
    }
    
    try {
      const studentId = user.profile._id;
      console.log('Fetching reports for student:', studentId);
      const response = await axios.get(`/api/reports/student/${studentId}`);
      console.log('Reports response:', response.data);
      setReports(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching reports:', err);
      setError(err.response?.data?.message || 'Failed to fetch reports');
      toast.error(err.response?.data?.message || 'Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent"></div></div>;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>
        <div className="card text-center py-12">
          <FileText className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <p className="text-gray-500 mt-2">Please contact your administrator if this persists.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">My Reports</h1>

      {reports.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No reports available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report._id} className="card">
              {/* Student Details Section */}
              {report.student && (
                <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-blue-50 rounded-lg border border-primary-100">
                  <h2 className="text-xl font-bold text-gray-900 mb-3">Student Details</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Student Name</p>
                      <p className="font-semibold text-gray-900">{report.student.firstName} {report.student.lastName}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Student ID</p>
                      <p className="font-semibold text-gray-900">{report.student.studentId || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Department</p>
                      <p className="font-semibold text-gray-900">{report.student.department || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Batch</p>
                      <p className="font-semibold text-gray-900">{report.student.batch || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Email</p>
                      <p className="font-semibold text-gray-900">{report.student.email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Phone</p>
                      <p className="font-semibold text-gray-900">{report.student.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Date of Birth</p>
                      <p className="font-semibold text-gray-900">{report.student.dateOfBirth ? new Date(report.student.dateOfBirth).toLocaleDateString() : 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Current Semester</p>
                      <p className="font-semibold text-gray-900">{report.semester || 'N/A'}</p>
                    </div>
                  </div>
                  
                  {/* Additional Bio Information */}
                  {report.student.bio && (
                    <div className="mt-4 pt-4 border-t border-primary-200">
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">Additional Information</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {report.student.bio.fullName && (
                          <div>
                            <p className="text-xs text-gray-500">Full Name</p>
                            <p className="text-sm font-medium">{report.student.bio.fullName}</p>
                          </div>
                        )}
                        {report.student.bio.registrationNumber && (
                          <div>
                            <p className="text-xs text-gray-500">Registration No.</p>
                            <p className="text-sm font-medium">{report.student.bio.registrationNumber}</p>
                          </div>
                        )}
                        {report.student.bio.fatherName && (
                          <div>
                            <p className="text-xs text-gray-500">Father's Name</p>
                            <p className="text-sm font-medium">{report.student.bio.fatherName}</p>
                          </div>
                        )}
                        {report.student.bio.motherName && (
                          <div>
                            <p className="text-xs text-gray-500">Mother's Name</p>
                            <p className="text-sm font-medium">{report.student.bio.motherName}</p>
                          </div>
                        )}
                        {report.student.bio.guardianContact && (
                          <div>
                            <p className="text-xs text-gray-500">Guardian Contact</p>
                            <p className="text-sm font-medium">{report.student.bio.guardianContact}</p>
                          </div>
                        )}
                        {report.student.bio.emergencyContact && (
                          <div>
                            <p className="text-xs text-gray-500">Emergency Contact</p>
                            <p className="text-sm font-medium">{report.student.bio.emergencyContact}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{report.reportType.toUpperCase()} Report</h3>
                  <p className="text-sm text-gray-600">Semester {report.semester} - {report.academicYear}</p>
                </div>
                <span className="text-xs text-gray-500">{new Date(report.createdAt).toLocaleDateString()}</span>
              </div>

              {report.attendanceData && (
                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Attendance Summary</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Classes</p>
                      <p className="text-lg font-semibold">{report.attendanceData.totalClasses}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Attended</p>
                      <p className="text-lg font-semibold text-green-600">{report.attendanceData.attendedClasses}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Percentage</p>
                      <p className="text-lg font-semibold text-primary-600">{report.attendanceData.percentage}%</p>
                    </div>
                  </div>
                </div>
              )}

              {report.examData && report.examData.results.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Exam Results</h4>
                  <div className="mb-3 p-3 bg-primary-50 rounded">
                    <p className="text-sm font-semibold">Overall Performance: {report.examData.overallPercentage}% ({report.examData.averageGrade})</p>
                  </div>
                  {report.examData.results.map((result, index) => (
                    <div key={index} className="mb-4 p-3 bg-gray-50 rounded">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-semibold text-md">{result.examType}</p>
                        <span className={`px-2 py-1 rounded text-xs ${result.result === 'Pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {result.result}
                        </span>
                      </div>
                      
                      {/* Detailed Marks Table */}
                      <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-2 text-gray-600">Subject</th>
                              <th className="text-center py-2 px-2 text-gray-600">Marks Obtained</th>
                              <th className="text-center py-2 px-2 text-gray-600">Max Marks</th>
                              <th className="text-center py-2 px-2 text-gray-600">Percentage</th>
                              <th className="text-center py-2 px-2 text-gray-600">Grade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {result.subjects && result.subjects.map((subject, subIndex) => {
                              const subjectPercentage = ((subject.marks / subject.maxMarks) * 100).toFixed(1);
                              return (
                                <tr key={subIndex} className="border-b border-gray-200">
                                  <td className="py-2 px-2 font-medium">{subject.subjectName}</td>
                                  <td className="text-center py-2 px-2">
                                    <span className={`font-semibold ${subjectPercentage >= 50 ? 'text-green-600' : 'text-red-600'}`}>
                                      {subject.marks}
                                    </span>
                                  </td>
                                  <td className="text-center py-2 px-2">{subject.maxMarks}</td>
                                  <td className="text-center py-2 px-2">{subjectPercentage}%</td>
                                  <td className="text-center py-2 px-2">
                                    <span className={`px-2 py-1 rounded text-xs ${
                                      subject.grade === 'A+' || subject.grade === 'A' ? 'bg-green-100 text-green-800' :
                                      subject.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                                      subject.grade === 'C' ? 'bg-yellow-100 text-yellow-800' :
                                      'bg-red-100 text-red-800'
                                    }`}>
                                      {subject.grade || '-'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                          <tfoot>
                            <tr className="bg-gray-100">
                              <td className="py-2 px-2 font-semibold">Total</td>
                              <td className="text-center py-2 px-2 font-semibold">{result.totalMarks}</td>
                              <td className="text-center py-2 px-2">{result.maxTotalMarks || (result.subjects?.reduce((sum, s) => sum + s.maxMarks, 0))}</td>
                              <td className="text-center py-2 px-2 font-semibold">{result.percentage}%</td>
                              <td className="text-center py-2 px-2 font-semibold">{report.examData.averageGrade}</td>
                            </tr>
                          </tfoot>
                        </table>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {report.performanceAnalysis && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-semibold text-gray-900 mb-3">Performance Analysis</h4>
                  
                  <div className="mb-3">
                    <p className="text-sm font-semibold text-gray-700">Overall: <span className="text-primary-600">{report.performanceAnalysis.overallPerformance}</span></p>
                  </div>

                  {report.performanceAnalysis.strengths.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-green-700 mb-1">Strengths:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {report.performanceAnalysis.strengths.map((strength, i) => (
                          <li key={i}>{strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {report.performanceAnalysis.areasOfImprovement.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm font-semibold text-orange-700 mb-1">Areas of Improvement:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {report.performanceAnalysis.areasOfImprovement.map((area, i) => (
                          <li key={i}>{area}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {report.performanceAnalysis.recommendations.length > 0 && (
                    <div>
                      <p className="text-sm font-semibold text-blue-700 mb-1">Recommendations:</p>
                      <ul className="list-disc list-inside text-sm text-gray-600">
                        {report.performanceAnalysis.recommendations.map((rec, i) => (
                          <li key={i}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Reports;
