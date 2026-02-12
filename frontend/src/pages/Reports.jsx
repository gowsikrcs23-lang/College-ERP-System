import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FileText, Download, Eye, Trash2 } from 'lucide-react';

const Reports = () => {
  const { user } = useAuth();

  if (user?.role === 'faculty') {
    return <FacultyReportsView />;
  }

  if (user?.role === 'admin' || user?.role === 'hod') {
    return <AdminHODReportsView />;
  }

  if (user?.role === 'student') {
    return <StudentReportsView />;
  }

  return null;
};

const FacultyReportsView = () => {
  const [students, setStudents] = useState([]);
  const [reports, setReports] = useState([]);
  const [showModal, setShowModal] = useState(false);
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

  const fetchReports = async () => {
    try {
      const response = await axios.get('/api/reports');
      setReports(response.data);
    } catch (error) {
      toast.error('Failed to fetch reports');
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post('/api/reports/generate', formData);
      toast.success('Report generated successfully');
      setShowModal(false);
      resetForm();
      fetchReports();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
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
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h2>
        <div className="space-y-3">
          {reports.map((report) => (
            <div key={report._id} className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold text-gray-900">{report.student?.firstName} {report.student?.lastName}</h3>
                <p className="text-sm text-gray-600">{report.reportType} - Semester {report.semester} ({report.academicYear})</p>
                <p className="text-xs text-gray-500">Generated on {new Date(report.createdAt).toLocaleDateString()}</p>
              </div>
              <a href={`/reports/${report._id}`} className="text-primary-600 hover:text-primary-800">
                <Eye className="h-5 w-5" />
              </a>
            </div>
          ))}
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

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get('/api/reports');
      setReports(response.data);
    } catch (error) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this report?')) return;
    try {
      await axios.delete(`/api/reports/${id}`);
      toast.success('Report deleted successfully');
      fetchReports();
    } catch (error) {
      toast.error('Failed to delete report');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent"></div></div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">View Reports</h1>

      <div className="card">
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

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get(`/api/reports/student/${user.profile._id}`);
      setReports(response.data);
    } catch (error) {
      toast.error('Failed to fetch reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-500 border-t-transparent"></div></div>;
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
                    <div key={index} className="mb-2 p-3 bg-gray-50 rounded">
                      <p className="font-semibold text-sm">{result.examType}</p>
                      <p className="text-sm text-gray-600">Percentage: {result.percentage}% - {result.result}</p>
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
