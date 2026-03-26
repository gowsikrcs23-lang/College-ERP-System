import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Upload, FileText, Award, Trash2, Users } from 'lucide-react';
import { formatSemester, toRoman } from '../utils/semester';

const Results = () => {
  const { user } = useAuth();

  if (user?.role === 'admin' || user?.role === 'management') {
    return <AdminResultsView />;
  }

  if (user?.role === 'faculty') {
    return <FacultyResultsView />;
  }

  if (user?.role === 'student') {
    return <StudentResultsView />;
  }

  return null;
};

const AdminResultsView = () => {
  const [students, setStudents] = useState([]);
  const [formData, setFormData] = useState({
    department: '',
    semester: '',
    batch: '',
    examType: ''
  });
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const subjectsByDepartmentSemester = {
    'Computer Science': {
      1: ['Mathematics I', 'Physics', 'Chemistry', 'Programming in C', 'Engineering Graphics'],
      2: ['Mathematics II', 'Data Structures', 'Digital Electronics', 'Object Oriented Programming', 'Discrete Mathematics'],
      3: ['Database Management', 'Computer Organization', 'Operating Systems', 'Software Engineering', 'Web Technologies'],
      4: ['Computer Networks', 'Design and Analysis of Algorithms', 'Microprocessors', 'Theory of Computation', 'Java Programming'],
      5: ['Compiler Design', 'Artificial Intelligence', 'Computer Graphics', 'Mobile Computing', 'Cloud Computing'],
      6: ['Machine Learning', 'Information Security', 'Big Data Analytics', 'IoT', 'Blockchain'],
      7: ['Deep Learning', 'Natural Language Processing', 'Cyber Security', 'DevOps', 'Project I'],
      8: ['Advanced AI', 'Quantum Computing', 'Edge Computing', 'Capstone Project', 'Internship']
    },
    'Electronics': {
      1: ['Mathematics I', 'Physics', 'Chemistry', 'Basic Electrical Engineering', 'Engineering Graphics'],
      2: ['Mathematics II', 'Electronic Devices', 'Digital Circuits', 'Network Theory', 'Circuit Analysis'],
      3: ['Analog Circuits', 'Signals and Systems', 'Electromagnetic Theory', 'Microprocessors', 'Control Systems'],
      4: ['Digital Signal Processing', 'Communication Systems', 'VLSI Design', 'Instrumentation', 'Embedded Systems'],
      5: ['Wireless Communication', 'Microwave Engineering', 'Image Processing', 'FPGA Design', 'Optical Communication'],
      6: ['Advanced Embedded Systems', 'Digital Image Processing', 'RF Circuit Design', 'Antenna Theory', 'IoT'],
      7: ['Advanced Communication Systems', 'VLSI Testing', 'Research Project I', 'Elective I', 'Elective II'],
      8: ['Capstone Project', 'Internship', 'Advanced Topics', 'Seminar', 'Technical Writing']
    },
    'Mechanical': {
      1: ['Mathematics I', 'Physics', 'Chemistry', 'Engineering Mechanics', 'Engineering Graphics'],
      2: ['Mathematics II', 'Thermodynamics', 'Fluid Mechanics', 'Material Science', 'Machine Drawing'],
      3: ['Kinematics of Machinery', 'Strength of Materials', 'Manufacturing Processes', 'Thermal Engineering', 'CAD/CAM'],
      4: ['Dynamics of Machinery', 'Design of Machine Elements', 'Heat Transfer', 'Manufacturing Technology', 'Finite Element Analysis'],
      5: ['Automobile Engineering', 'Refrigeration and Air Conditioning', 'Machine Design', 'Industrial Engineering', 'Mechatronics'],
      6: ['Power Plant Engineering', 'Finite Element Methods', 'Robotics', 'Computational Fluid Dynamics', 'Advanced Manufacturing'],
      7: ['Advanced Thermal Engineering', 'Product Design', 'Research Project I', 'Elective I', 'Elective II'],
      8: ['Capstone Project', 'Internship', 'Industrial Training', 'Seminar', 'Technical Writing']
    },
    'Civil': {
      1: ['Mathematics I', 'Physics', 'Chemistry', 'Engineering Mechanics', 'Engineering Graphics'],
      2: ['Mathematics II', 'Surveying', 'Building Materials', 'Strength of Materials', 'Fluid Mechanics'],
      3: ['Structural Analysis', 'Concrete Technology', 'Geotechnical Engineering', 'Hydraulics', 'Building Construction'],
      4: ['Steel Structures', 'Foundation Engineering', 'Transportation Engineering', 'Water Supply Engineering', 'Concrete Structures'],
      5: ['Steel Design', 'Environmental Engineering', 'Highway Engineering', 'Irrigation Engineering', 'Advanced Surveying'],
      6: ['Bridge Engineering', 'Groundwater Hydrology', 'Urban Planning', 'Earthquake Engineering', 'Construction Management'],
      7: ['Advanced Structural Design', 'Environmental Impact Assessment', 'Research Project I', 'Elective I', 'Elective II'],
      8: ['Capstone Project', 'Internship', 'Industrial Training', 'Seminar', 'Technical Writing']
    }
  };

  useEffect(() => {
    if (formData.department && formData.semester && formData.batch) {
      fetchStudents();
    }
  }, [formData.department, formData.semester, formData.batch]);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(`/api/students/department/${formData.department}`);
      const filtered = response.data.filter(s => s.semester === parseInt(formData.semester) && s.batch === formData.batch);
      setStudents(filtered);
      
      const subjects = subjectsByDepartmentSemester[formData.department]?.[formData.semester] || [];
      const initialResults = filtered.map(student => ({
        studentId: student._id,
        studentName: `${student.firstName} ${student.lastName}`,
        subjects: subjects.map(sub => ({ subjectName: sub, marks: '', maxMarks: 100, grade: '' }))
      }));
      setResults(initialResults);
    } catch (error) {
      toast.error('Failed to fetch students');
    }
  };

  const handleMarksChange = (studentIndex, subjectIndex, marks) => {
    const newResults = [...results];
    newResults[studentIndex].subjects[subjectIndex].marks = marks;
    
    const maxMarks = newResults[studentIndex].subjects[subjectIndex].maxMarks;
    const percentage = (marks / maxMarks) * 100;
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';
    else if (percentage >= 50) grade = 'D';
    
    newResults[studentIndex].subjects[subjectIndex].grade = grade;
    setResults(newResults);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.examType) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      setLoading(true);
      const resultsData = results.map((r) => buildResultPayload(r));

      await axios.post('/api/results/upload', {
        ...formData,
        semester: parseInt(formData.semester),
        results: resultsData
      });

      toast.success('Results uploaded successfully');
      setFormData({ department: '', semester: '', batch: '', examType: '' });
      setStudents([]);
      setResults([]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload results');
    } finally {
      setLoading(false);
    }
  };

  const buildResultPayload = (studentResult) => {
    const totalMarks = studentResult.subjects.reduce((sum, s) => sum + (parseFloat(s.marks) || 0), 0);
    const maxTotalMarks = studentResult.subjects.reduce((sum, s) => sum + s.maxMarks, 0);
    const percentage = maxTotalMarks > 0 ? (totalMarks / maxTotalMarks) * 100 : 0;
    const result = percentage >= 50 ? 'Pass' : 'Fail';

    return {
      studentId: studentResult.studentId,
      subjects: studentResult.subjects,
      totalMarks,
      maxTotalMarks,
      percentage: percentage.toFixed(2),
      result
    };
  };

  const handlePublishSingleStudent = async (studentResult) => {
    if (!formData.examType) {
      toast.error('Please select exam type before publishing');
      return;
    }

    try {
      setLoading(true);
      const resultData = buildResultPayload(studentResult);
      await axios.post('/api/results/upload', {
        ...formData,
        semester: parseInt(formData.semester),
        results: [resultData]
      });
      toast.success(`Published result for ${studentResult.studentName}`);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to publish student result');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Manage Results</h1>
        <Upload className="h-6 w-6 text-blue-600" />
      </div>

      <ViewResultsSection showDelete={true} />

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload New Results</h2>
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
                <option key={sem} value={sem}>Semester {toRoman(sem)}</option>
              ))}
            </select>

            <select
              className="input-field"
              value={formData.batch}
              onChange={(e) => setFormData({...formData, batch: e.target.value})}
              required
            >
              <option value="">Select Batch</option>
              <option value="2020-2024">2020-2024</option>
              <option value="2021-2025">2021-2025</option>
              <option value="2022-2026">2022-2026</option>
              <option value="2023-2027">2023-2027</option>
              <option value="2024-2028">2024-2028</option>
            </select>

            <select
              className="input-field"
              value={formData.examType}
              onChange={(e) => setFormData({...formData, examType: e.target.value})}
              required
            >
              <option value="">Select Exam Type</option>
              <option value="Periodical Test 1">Periodical Test 1</option>
              <option value="Periodical Test 2">Periodical Test 2</option>
              <option value="Periodical Test 3">Periodical Test 3</option>
              <option value="Mid-Term">Mid-Term</option>
              <option value="End Semester">End Semester</option>
            </select>
          </div>

          {students.length > 0 && (
            <div className="mt-6 space-y-4">
              {results.map((result, studentIndex) => (
                <div key={result.studentId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3 gap-3">
                    <h3 className="font-semibold text-gray-900">{result.studentName}</h3>
                    <button
                      type="button"
                      disabled={loading || !formData.examType}
                      onClick={() => handlePublishSingleStudent(result)}
                      className="px-3 py-1.5 rounded-md text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Publish Student Result
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {result.subjects.map((subject, subjectIndex) => (
                      <div key={subjectIndex} className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600 flex-1">{subject.subjectName}</span>
                        <input
                          type="number"
                          placeholder="Marks"
                          className="input-field w-20"
                          value={subject.marks}
                          onChange={(e) => handleMarksChange(studentIndex, subjectIndex, e.target.value)}
                          min="0"
                          max={subject.maxMarks}
                        />
                        <span className="text-sm font-medium text-gray-700 w-8">{subject.grade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="flex justify-end">
                <button type="submit" disabled={loading} className="btn-primary">
                  {loading ? 'Uploading...' : 'Upload Results'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

const FacultyResultsView = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">View Results</h1>
        <FileText className="h-6 w-6 text-blue-600" />
      </div>
      <ViewResultsSection showDelete={false} />
    </div>
  );
};

const ViewResultsSection = ({ showDelete }) => {
  const [filters, setFilters] = useState({ department: '', semester: '', batch: '' });
  const [allResults, setAllResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expandedResult, setExpandedResult] = useState(null);

  const fetchAllResults = async () => {
    if (!filters.department || !filters.semester || !filters.batch) return;
    
    try {
      setLoading(true);
      const response = await axios.get('/api/results', { params: filters });
      setAllResults(response.data);
    } catch (error) {
      toast.error('Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this result?')) return;
    
    try {
      await axios.delete(`/api/results/${id}`);
      toast.success('Result deleted successfully');
      fetchAllResults();
    } catch (error) {
      toast.error('Failed to delete result');
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('Are you sure you want to delete ALL results for this filter? This action cannot be undone!')) return;
    
    try {
      const response = await axios.delete('/api/results/delete/all', { params: filters });
      toast.success(`Deleted ${response.data.deletedCount} results successfully`);
      fetchAllResults();
    } catch (error) {
      toast.error('Failed to delete results');
    }
  };

  const handleDeleteStudentResults = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete ALL results for this student? This action cannot be undone!')) return;
    
    try {
      const response = await axios.delete(`/api/results/student/${studentId}/delete`, { params: filters });
      toast.success(`Deleted ${response.data.deletedCount} results for this student`);
      fetchAllResults();
    } catch (error) {
      toast.error('Failed to delete student results');
    }
  };

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">View Published Results</h2>
        {showDelete && allResults.length > 0 && (
          <button onClick={handleDeleteAll} className="btn-danger flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Delete All Results
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <select className="input-field" value={filters.department} onChange={(e) => setFilters({...filters, department: e.target.value})}>
          <option value="">Select Department</option>
          <option value="Computer Science">Computer Science</option>
          <option value="Electronics">Electronics</option>
          <option value="Mechanical">Mechanical</option>
          <option value="Civil">Civil</option>
        </select>
        <select className="input-field" value={filters.semester} onChange={(e) => setFilters({...filters, semester: e.target.value})}>
          <option value="">Select Semester</option>
          {[1,2,3,4,5,6,7,8].map(sem => <option key={sem} value={sem}>Semester {toRoman(sem)}</option>)}
        </select>
        <select className="input-field" value={filters.batch} onChange={(e) => setFilters({...filters, batch: e.target.value})}>
          <option value="">Select Batch</option>
          <option value="2020-2024">2020-2024</option>
          <option value="2021-2025">2021-2025</option>
          <option value="2022-2026">2022-2026</option>
          <option value="2023-2027">2023-2027</option>
          <option value="2024-2028">2024-2028</option>
        </select>
      </div>
      <button onClick={fetchAllResults} className="btn-primary mb-4">Search Results</button>
      
      {loading ? (
        <div className="text-center py-8">Loading...</div>
      ) : allResults.length > 0 ? (
        <div className="space-y-4">
          {allResults.map((result) => (
            <div key={result._id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{result.student?.firstName} {result.student?.lastName} ({result.student?.studentId})</h3>
                  <p className="text-sm text-gray-600">{result.examType} | Batch {result.batch} | Semester {formatSemester(result.semester)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 text-sm font-semibold rounded-full ${result.result === 'Pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {result.percentage}% - {result.result}
                  </span>
                  <button onClick={() => setExpandedResult(expandedResult === result._id ? null : result._id)} className="text-primary-600 hover:text-primary-800 text-sm font-medium">
                    {expandedResult === result._id ? 'Hide Details' : 'View Details'}
                  </button>
                  {showDelete && (
                    <>
                      <button onClick={() => handleDeleteStudentResults(result.student._id)} className="text-orange-600 hover:text-orange-800" title="Delete all results for this student">
                        <Users className="h-5 w-5" />
                      </button>
                      <button onClick={() => handleDelete(result._id)} className="text-red-600 hover:text-red-800">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              {expandedResult === result._id && (
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Max Marks</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.subjects.map((subject, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{subject.subjectName}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{subject.marks}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{subject.maxMarks}</td>
                          <td className="px-4 py-2 text-sm">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${subject.grade === 'F' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                              {subject.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-semibold">
                        <td className="px-4 py-2 text-sm text-gray-900">Total</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{result.totalMarks}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{result.maxTotalMarks}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{result.percentage}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No results found</p>
      )}
    </div>
  );
};

const StudentResultsView = () => {
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const response = await axios.get(`/api/results/student/${user.profile._id}`);
      setResults(response.data);
    } catch (error) {
      toast.error('Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Results</h1>
        <Award className="h-6 w-6 text-blue-600" />
      </div>

      {results.length === 0 ? (
        <div className="card text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No results published yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((result) => (
            <div key={result._id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{result.examType}</h3>
                  <p className="text-sm text-gray-600">Batch {result.batch} | Semester {formatSemester(result.semester)}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600">{result.percentage}%</p>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                    result.result === 'Pass' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {result.result}
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Marks</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Max Marks</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {result.subjects.map((subject, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm text-gray-900">{subject.subjectName}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{subject.marks}</td>
                        <td className="px-4 py-2 text-sm text-gray-900">{subject.maxMarks}</td>
                        <td className="px-4 py-2 text-sm">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${
                            subject.grade === 'F' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {subject.grade}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-gray-50 font-semibold">
                      <td className="px-4 py-2 text-sm text-gray-900">Total</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{result.totalMarks}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{result.maxTotalMarks}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{result.percentage}%</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Results;
