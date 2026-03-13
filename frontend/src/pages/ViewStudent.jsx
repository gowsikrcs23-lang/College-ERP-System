import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentsAPI, attendanceAPI } from '../utils/api';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  User, Mail, Phone, Calendar, MapPin, BookOpen, GraduationCap, 
  FileText, TrendingUp, Clock, ArrowLeft, Edit 
} from 'lucide-react';

const ViewStudent = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [results, setResults] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');

  const getLatestApprovalDetails = (studentData) => {
    const history = Array.isArray(studentData?.user?.emailBlockHistory)
      ? [...studentData.user.emailBlockHistory]
      : [];

    const latestApprovedEntry = history.reverse().find(
      (entry) => entry?.facultyApprovedByName || entry?.facultyApprovedByFacultyId
    );

    return {
      facultyName: latestApprovedEntry?.facultyApprovedByName || '',
      facultyId: latestApprovedEntry?.facultyApprovedByFacultyId || ''
    };
  };

  useEffect(() => {
    fetchStudentData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStudentData();
    }, 30000);

    return () => clearInterval(interval);
  }, [id]);

  const fetchStudentData = async () => {
    try {
      const studentRes = await studentsAPI.getById(id);
      setStudent(studentRes.data);

      // Fetch exams data
      try {
        const examsRes = await axios.get(`/api/exams/student/${id}/results`);
        const examData = Array.isArray(examsRes.data) ? examsRes.data : [];
        setResults(examData);
      } catch (err) {
        setResults([]);
      }

      // Fetch attendance data
      try {
        const attendanceRes = await axios.get(`/api/attendance/student/${id}`);
        const attendanceData = attendanceRes.data?.attendance || [];
        setAttendance(attendanceData);
      } catch (err) {
        setAttendance([]);
      }

      // Fetch fees data
      try {
        const feesRes = await axios.get(`/api/fees/student/${id}`);
        setFees(feesRes.data || []);
      } catch (err) {
        setFees([]);
      }
    } catch (error) {
      if (loading) toast.error('Failed to fetch student data');
    } finally {
      if (loading) setLoading(false);
    }
  };

  const calculateAttendancePercentage = () => {
    if (!attendance || attendance.length === 0) return 0;
    const present = attendance.filter(a => a.status === 'present' || a.status === 'P').length;
    return Math.round((present / attendance.length) * 100);
  };

  const calculateAverageMarks = () => {
    if (!results || results.length === 0) return 0;
    const totalMarks = results.reduce((sum, r) => sum + (r.marksObtained || r.obtainedMarks || r.marks || 0), 0);
    const totalMaxMarks = results.reduce((sum, r) => sum + (r.totalMarks || r.maxMarks || 100), 0);
    return totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(1) : 0;
  };

  const getNormalizedExamType = (result) => {
    const examLabel = String(result?.examName || result?.examType || '').toLowerCase().trim();
    if (examLabel.includes('periodical test 1') || examLabel.includes('periodical 1') || examLabel.includes('pt1')) {
      return 'Periodical Test 1';
    }
    if (examLabel.includes('periodical test 2') || examLabel.includes('periodical 2') || examLabel.includes('pt2')) {
      return 'Periodical Test 2';
    }
    return result?.examName || result?.examType || 'Other Exams';
  };

  const getMarksValue = (result) => Number(result?.marksObtained ?? result?.obtainedMarks ?? result?.marks ?? 0);

  const getMaxMarksValue = (result) => Number(result?.totalMarks ?? result?.maxMarks ?? 100);

  const getMarksSummary = () => {
    const groupedResults = {
      'Periodical Test 1': [],
      'Periodical Test 2': [],
      'Other Exams': []
    };

    results.forEach((result) => {
      const normalizedType = getNormalizedExamType(result);
      if (normalizedType === 'Periodical Test 1' || normalizedType === 'Periodical Test 2') {
        groupedResults[normalizedType].push(result);
      } else {
        groupedResults['Other Exams'].push(result);
      }
    });

    const periodicalResults = [
      ...groupedResults['Periodical Test 1'],
      ...groupedResults['Periodical Test 2']
    ];

    const totalMarks = periodicalResults.reduce((sum, result) => sum + getMarksValue(result), 0);
    const totalMaxMarks = periodicalResults.reduce((sum, result) => sum + getMaxMarksValue(result), 0);
    const combinedAverage = totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(1) : '0.0';

    const subjectAverages = Object.values(periodicalResults.reduce((acc, result) => {
      const subjectName = result.subject || result.subjectName || '-';
      if (!acc[subjectName]) {
        acc[subjectName] = { subject: subjectName, marks: 0, maxMarks: 0 };
      }
      acc[subjectName].marks += getMarksValue(result);
      acc[subjectName].maxMarks += getMaxMarksValue(result);
      return acc;
    }, {})).map((entry) => ({
      ...entry,
      average: entry.maxMarks > 0 ? ((entry.marks / entry.maxMarks) * 100).toFixed(1) : '0.0'
    })).sort((a, b) => a.subject.localeCompare(b.subject));

    return {
      groupedResults,
      combinedAverage,
      subjectAverages
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Student not found</p>
        <button onClick={() => navigate('/students')} className="btn-primary mt-4">
          Back to Students
        </button>
      </div>
    );
  }

  const marksSummary = getMarksSummary();
  const latestApproval = getLatestApprovalDetails(student);
  const getExamAverage = (examResults) => {
    if (!examResults.length) return '0.0';
    const totalMarks = examResults.reduce((sum, result) => sum + getMarksValue(result), 0);
    const totalMaxMarks = examResults.reduce((sum, result) => sum + getMaxMarksValue(result), 0);
    return totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(1) : '0.0';
  };

  const renderResultCard = (result, index) => {
    const marks = getMarksValue(result);
    const maxMarks = getMaxMarksValue(result);
    const percentage = maxMarks > 0 ? ((marks / maxMarks) * 100).toFixed(1) : '0.0';
    let grade = 'F';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B+';
    else if (percentage >= 60) grade = 'B';
    else if (percentage >= 50) grade = 'C';
    else if (percentage >= 40) grade = 'D';

    return (
      <div key={`${result.subject || 'subject'}-${index}`} className="bg-gray-50 rounded-lg p-3 md:p-4 border border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-2 mb-2">
          <div className="min-w-0">
            <h4 className="font-semibold text-gray-900 break-words">{result.subject || result.subjectName || '-'}</h4>
            <p className="text-sm text-gray-500">{result.examName || result.examType || '-'}</p>
          </div>
          <span className={`px-3 py-1 text-sm font-medium rounded-full flex-shrink-0 ${
            grade === 'A+' || grade === 'A' ? 'bg-green-100 text-green-800' :
            grade === 'B+' || grade === 'B' ? 'bg-blue-100 text-blue-800' :
            grade === 'C' || grade === 'D' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {grade}
          </span>
        </div>
        <div className="grid grid-cols-3 gap-2 md:gap-4 text-sm">
          <div>
            <p className="text-gray-500">Marks</p>
            <p className="font-semibold text-gray-900">{marks}/{maxMarks}</p>
          </div>
          <div>
            <p className="text-gray-500">Percentage</p>
            <p className="font-semibold text-gray-900">{percentage}%</p>
          </div>
          <div>
            <p className="text-gray-500">Date</p>
            <p className="font-semibold text-gray-900">{result.examDate ? new Date(result.examDate).toLocaleDateString() : '-'}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={() => navigate('/students')}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Students
        </button>
        <button
          onClick={() => {
            setLoading(true);
            fetchStudentData();
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <Clock className="h-4 w-4" />
          Refresh Data
        </button>
      </div>

      {/* Student Info Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-4 md:p-6 text-white">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 md:w-24 md:h-24 bg-white/20 rounded-full flex items-center justify-center text-white text-xl md:text-3xl font-bold flex-shrink-0">
              {student.firstName?.charAt(0)}{student.lastName?.charAt(0)}
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-3xl font-bold mb-1 truncate">
                {student.firstName} {student.lastName}
              </h1>
              <p className="text-blue-100 text-sm truncate">ID: {student.studentId}</p>
              {student.bio?.registrationNumber && (
                <p className="text-blue-100 text-sm truncate">Reg: {student.bio.registrationNumber}</p>
              )}
              {student.bio?.mailBlockReason && (
                <p className="mt-1 text-sm text-red-100 break-words">Block Reason: {student.bio.mailBlockReason}</p>
              )}
            </div>
          </div>
          <div className="text-left md:text-right">
            <span className="px-3 py-1 bg-white/20 rounded-full text-xs md:text-sm font-medium">
              {student.department}
            </span>
            <p className="text-blue-100 mt-2 text-sm">Semester {student.semester}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white rounded-lg shadow-sm border p-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <p className="text-xs text-gray-500">Avg Marks</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{calculateAverageMarks()}%</p>
            <p className="text-xs text-gray-400">{results.length} exams</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-4 w-4 text-green-600" />
              </div>
              <p className="text-xs text-gray-500">Attendance</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{calculateAttendancePercentage()}%</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-xs text-gray-500">Exams</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{results.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-3">
          <div className="flex flex-col">
            <div className="flex items-center gap-2 mb-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Calendar className="h-4 w-4 text-orange-600" />
              </div>
              <p className="text-xs text-gray-500">Classes</p>
            </div>
            <p className="text-xl font-bold text-gray-900">{attendance.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="-mb-px flex space-x-4 md:space-x-8 min-w-max">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Personal Details
          </button>
          <button
            onClick={() => setActiveTab('marks')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'marks'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Marks & Results
          </button>
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'attendance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Attendance
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'details' && (
        <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
          <div className="p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <User className="h-5 w-5 mr-2 text-blue-600" />
                  Personal Information
                </h3>
                
                <div className="flex items-start">
                  <Mail className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium text-gray-900 break-words">{student.email}</p>
                    {student.bio?.mailBlockReason && (
                      <p className="mt-1 text-xs text-red-600 break-words">Block Reason: {student.bio.mailBlockReason}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-start">
                  <Phone className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-medium text-gray-900">{student.phone}</p>
                  </div>
                </div>

                {student.dateOfBirth && (
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-600">Date of Birth</p>
                      <p className="font-medium text-gray-900">
                        {new Date(student.dateOfBirth).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {student.address && (student.address.street || student.address.city) && (
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-gray-400 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-gray-600">Address</p>
                      <p className="font-medium text-gray-900 break-words">
                        {student.address.street && `${student.address.street}, `}
                        {student.address.city && `${student.address.city}, `}
                        {student.address.state && `${student.address.state} `}
                        {student.address.zipCode}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Academic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <GraduationCap className="h-5 w-5 mr-2 text-blue-600" />
                  Academic Information
                </h3>

                <div className="flex items-start">
                  <BookOpen className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Department</p>
                    <p className="font-medium text-gray-900">{student.department}</p>
                  </div>
                </div>

                <div className="flex items-start">
                  <BookOpen className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Semester</p>
                    <p className="font-medium text-gray-900">Semester {student.semester}</p>
                  </div>
                </div>

                {student.batch && (
                  <div className="flex items-start">
                    <Calendar className="h-5 w-5 text-gray-400 mr-3 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600">Batch</p>
                      <p className="font-medium text-gray-900">{student.batch}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Bio Section */}
          {student.bio && Object.values(student.bio).some(val => val) && (
            <div className="px-4 md:px-6 py-4 bg-gray-50 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Bio Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {student.bio.fullName && (
                  <div className="min-w-0">
                    <p className="text-sm text-gray-600">Full Name</p>
                    <p className="font-medium text-gray-900 break-words">{student.bio.fullName}</p>
                  </div>
                )}
                {student.bio.registrationNumber && (
                  <div className="min-w-0">
                    <p className="text-sm text-gray-600">Registration Number</p>
                    <p className="font-medium text-gray-900 break-words">{student.bio.registrationNumber}</p>
                  </div>
                )}
                {student.bio.fatherName && (
                  <div className="min-w-0">
                    <p className="text-sm text-gray-600">Father's Name</p>
                    <p className="font-medium text-gray-900 break-words">{student.bio.fatherName}</p>
                  </div>
                )}
                {student.bio.motherName && (
                  <div className="min-w-0">
                    <p className="text-sm text-gray-600">Mother's Name</p>
                    <p className="font-medium text-gray-900 break-words">{student.bio.motherName}</p>
                  </div>
                )}
                {student.bio.guardianContact && (
                  <div className="min-w-0">
                    <p className="text-sm text-gray-600">Guardian Contact</p>
                    <p className="font-medium text-gray-900">{student.bio.guardianContact}</p>
                  </div>
                )}
                {student.bio.emergencyContact && (
                  <div className="min-w-0">
                    <p className="text-sm text-gray-600">Emergency Contact</p>
                    <p className="font-medium text-gray-900">{student.bio.emergencyContact}</p>
                  </div>
                )}
                {student.bio.mailBlockReason && (
                  <div className="min-w-0 md:col-span-2">
                    <p className="text-sm text-gray-600">Mail Block Reason</p>
                    <p className="font-medium text-gray-900 break-words">{student.bio.mailBlockReason}</p>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm text-gray-600">Mail Block Count</p>
                  <p className="font-medium text-gray-900">{student.user?.emailBlockCount || 0}</p>
                </div>
                <div className="min-w-0 md:col-span-2">
                  <p className="text-sm text-gray-600">Approved By Faculty</p>
                  <p className="font-medium text-gray-900 break-words">
                    {latestApproval.facultyName
                      ? `${latestApproval.facultyName} (${latestApproval.facultyId || 'ID N/A'})`
                      : 'Pending / N/A'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'marks' && (
        <div className="bg-white rounded-xl shadow-sm border">
          {results && results.length > 0 ? (
            <div className="p-4">
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                    <p className="text-sm font-medium text-blue-700">Periodical Test 1</p>
                    <p className="mt-2 text-2xl font-bold text-blue-950">{getExamAverage(marksSummary.groupedResults['Periodical Test 1'])}%</p>
                    <p className="text-xs text-blue-700 mt-1">{marksSummary.groupedResults['Periodical Test 1'].length} entries</p>
                  </div>
                  <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                    <p className="text-sm font-medium text-indigo-700">Periodical Test 2</p>
                    <p className="mt-2 text-2xl font-bold text-indigo-950">{getExamAverage(marksSummary.groupedResults['Periodical Test 2'])}%</p>
                    <p className="text-xs text-indigo-700 mt-1">{marksSummary.groupedResults['Periodical Test 2'].length} entries</p>
                  </div>
                  <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                    <p className="text-sm font-medium text-emerald-700">Average of PT1 + PT2</p>
                    <p className="mt-2 text-2xl font-bold text-emerald-950">{marksSummary.combinedAverage}%</p>
                    <p className="text-xs text-emerald-700 mt-1">{marksSummary.subjectAverages.length} subjects averaged</p>
                  </div>
                </div>

                {marksSummary.subjectAverages.length > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-semibold text-gray-900">Subject-wise Average</h3>
                      <span className="text-xs text-gray-500">Based on Periodical Test 1 and 2</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {marksSummary.subjectAverages.map((subject) => (
                        <div key={subject.subject} className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                          <p className="text-sm font-medium text-amber-700">{subject.subject}</p>
                          <p className="mt-2 text-2xl font-bold text-amber-950">{subject.average}%</p>
                          <p className="text-xs text-amber-700 mt-1">{subject.marks}/{subject.maxMarks}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-gray-200 p-4">
                    <p className="text-sm text-gray-500">No Periodical Test 1 or 2 marks found.</p>
                  </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {['Periodical Test 1', 'Periodical Test 2'].map((examType) => (
                    <div key={examType} className="rounded-xl border border-gray-200 p-4">
                      <div className="flex items-center justify-between gap-2 mb-3">
                        <h3 className="text-base font-semibold text-gray-900">{examType}</h3>
                        <span className="text-xs text-gray-500">
                          Average: {getExamAverage(marksSummary.groupedResults[examType])}%
                        </span>
                      </div>
                      {marksSummary.groupedResults[examType].length > 0 ? (
                        <div className="space-y-3">
                          {marksSummary.groupedResults[examType].map((result, index) => renderResultCard(result, index))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">No marks found for {examType}.</p>
                      )}
                    </div>
                  ))}
                </div>

                {marksSummary.groupedResults['Other Exams'].length > 0 && (
                  <div className="rounded-xl border border-gray-200 p-4">
                    <h3 className="text-base font-semibold text-gray-900 mb-3">Other Exams</h3>
                    <div className="space-y-3">
                      {marksSummary.groupedResults['Other Exams'].map((result, index) => renderResultCard(result, index))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No exam results found for this student</p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'attendance' && (
        <div className="bg-white rounded-xl shadow-sm border">
          {attendance && attendance.length > 0 ? (
            <div className="p-4">
              <div className="space-y-2">
                {attendance.map((record, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 rounded-lg p-3 border border-gray-200 gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{record.fn || record.subject || '-'}</p>
                      <p className="text-sm text-gray-500">{record.date ? new Date(record.date).toLocaleDateString() : '-'} • {record.session || ''}</p>
                    </div>
                    <span className={`px-3 py-1 text-xs font-medium rounded-full flex-shrink-0 ${
                      record.status === 'present' || record.status === 'P' ? 'bg-green-100 text-green-800' :
                      record.status === 'absent' || record.status === 'A' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {record.status === 'P' ? 'Present' : record.status === 'A' ? 'Absent' : record.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center">
              <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No attendance records found for this student</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ViewStudent;

