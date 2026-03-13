import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, TrendingUp, Clock, BookOpen, User, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { studentsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const Students = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentDetails, setStudentDetails] = useState({});
  const [clearCountLoadingId, setClearCountLoadingId] = useState('');
  const [blockReasonDrafts, setBlockReasonDrafts] = useState({});
  const [blockReasonOpenId, setBlockReasonOpenId] = useState('');
  const [blockLoadingId, setBlockLoadingId] = useState('');
  const [nextStudentId, setNextStudentId] = useState('');
  const [formData, setFormData] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phone: '',
    dateOfBirth: '',
    department: '',
    semester: '',
    batch: '',
    bio: {
      fullName: '',
      registrationNumber: '',
      fatherName: '',
      motherName: '',
      guardianContact: '',
      emergencyContact: '',
      mailBlockReason: ''
    },
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: ''
    }
  });

  useEffect(() => {
    fetchStudents();
  }, []);

  const isManagement = user?.role === 'management';
  const isFaculty = user?.role === 'faculty';
  const facultyDepartment = user?.profile?.department || '';
  const canManageStudentRecords = ['admin', 'management', 'hod', 'faculty'].includes(user?.role);

  const normalizeExamEntries = (rawExams = [], rawResults = []) => {
    const examsFromExamModule = (Array.isArray(rawExams) ? rawExams : []).map((exam) => ({
      examName: exam.examName || exam.examType || '-',
      subject: exam.subject || exam.subjectName || '-',
      examDate: exam.examDate || exam.createdAt || null,
      marksObtained: Number(exam.marksObtained ?? exam.obtainedMarks ?? exam.marks ?? 0),
      totalMarks: Number(exam.totalMarks ?? exam.maxMarks ?? 100),
      grade: exam.grade || null
    }));

    const examsFromResultsModule = (Array.isArray(rawResults) ? rawResults : []).flatMap((result) => {
      const subjects = Array.isArray(result.subjects) ? result.subjects : [];
      return subjects.map((subject) => ({
        examName: result.examType || result.examName || '-',
        subject: subject.subjectName || subject.subject || '-',
        examDate: result.createdAt || result.updatedAt || null,
        marksObtained: Number(subject.marks ?? subject.marksObtained ?? subject.obtainedMarks ?? 0),
        totalMarks: Number(subject.maxMarks ?? result.maxMarks ?? 100),
        grade: subject.grade || null
      }));
    });

    return [...examsFromExamModule, ...examsFromResultsModule];
  };

  const fetchStudentDetails = async (studentId) => {
    try {
      const [attendanceRes, examsRes, resultsRes] = await Promise.allSettled([
        axios.get(`/api/attendance/student/${studentId}`),
        axios.get(`/api/exams/student/${studentId}/results`),
        axios.get(`/api/results/student/${studentId}`)
      ]);

      const attendanceData = attendanceRes.status === 'fulfilled'
        ? (attendanceRes.value.data?.attendance || [])
        : [];
      const examsSource = examsRes.status === 'fulfilled' ? examsRes.value.data : [];
      const resultsSource = resultsRes.status === 'fulfilled' ? resultsRes.value.data : [];
      const examsData = normalizeExamEntries(examsSource, resultsSource);
      
      setStudentDetails(prev => ({
        ...prev,
        [studentId]: {
          attendance: attendanceData,
          exams: examsData
        }
      }));
    } catch (error) {
      setStudentDetails(prev => ({
        ...prev,
        [studentId]: {
          attendance: [],
          exams: []
        }
      }));
    }
  };

  const calculateAttendance = (studentId) => {
    const details = studentDetails[studentId];
    if (!details?.attendance) return { percentage: 0, present: 0, total: 0 };
    
    const attendanceArray = Array.isArray(details.attendance) ? details.attendance : [];
    
    if (attendanceArray.length === 0) return { percentage: 0, present: 0, total: 0 };
    
    const present = attendanceArray.filter(a => a.status === 'present' || a.status === 'P').length;
    const total = attendanceArray.length;
    const percentage = Math.round((present / total) * 100);
    
    return { percentage, present, total };
  };

  const calculateAverageMarks = (studentId) => {
    const details = studentDetails[studentId];
    if (!details?.exams) return { average: 0, total: 0 };
    
    const examsArray = Array.isArray(details.exams) ? details.exams : [];
    
    if (examsArray.length === 0) return { average: 0, total: 0 };
    
    const totalMarks = examsArray.reduce((sum, exam) => sum + Number(exam.marksObtained ?? exam.obtainedMarks ?? exam.marks ?? 0), 0);
    const totalMaxMarks = examsArray.reduce((sum, exam) => sum + Number(exam.totalMarks ?? exam.maxMarks ?? 100), 0);
    const average = totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(1) : 0;
    
    return { average, total: examsArray.length };
  };

  const handleStudentClick = async (student) => {
    if (selectedStudent?._id === student._id) {
      setSelectedStudent(null);
    } else {
      setSelectedStudent(student);
      await fetchStudentDetails(student._id);
    }
  };

  // Auto-refresh student details every 30 seconds if a student is selected
  useEffect(() => {
    if (!selectedStudent) return;
    
    const interval = setInterval(() => {
      fetchStudentDetails(selectedStudent._id);
    }, 30000);

    return () => clearInterval(interval);
  }, [selectedStudent]);

  // Department code mapping
  const deptCodes = {
    'Computer Science': 'CS',
    'Electronics': 'EE',
    'Mechanical': 'ME',
    'Civil': 'CE'
  };

  // Function to generate next student ID
  const generateNextStudentId = (studentsList) => {
    if (!studentsList || studentsList.length === 0) {
      return 'STU001';
    }
    
    // Extract numeric parts from student IDs and find the maximum
    const numericIds = studentsList
      .map(s => {
        const match = s.studentId.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));
    
    const maxId = Math.max(...numericIds, 0);
    const nextId = maxId + 1;
    
    // Format with leading zeros (STU001, STU002, etc.)
    return `STU${nextId.toString().padStart(3, '0')}`;
  };

  // Function to generate registration number based on department
  const generateRegistrationNumber = (studentsList, department) => {
    const deptCode = deptCodes[department] || 'CS';
    const yearPrefix = '7172';
    
    if (!studentsList || studentsList.length === 0) {
      return `${yearPrefix}${deptCode}001`;
    }
    
    // Filter students by department and extract numeric parts
    const deptStudents = studentsList.filter(s => {
      const code = deptCodes[s.department];
      return code === deptCode;
    });
    
    const numericRegs = deptStudents
      .map(s => {
        const match = s.bio?.registrationNumber?.match(/(\d+)$/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(n => !isNaN(n));
    
    const maxReg = numericRegs.length > 0 ? Math.max(...numericRegs) : 0;
    const nextReg = maxReg + 1;
    
    // Format: 7172CS001, 7172EE001, etc.
    return `${yearPrefix}${deptCode}${nextReg.toString().padStart(3, '0')}`;
  };

  const fetchStudents = async () => {
    try {
      const response = await studentsAPI.getAll();
      setStudents(response.data);
      // Generate next student ID based on existing students
      setNextStudentId(generateNextStudentId(response.data));
    } catch (error) {
      toast.error('Failed to fetch students');
    } finally {
      setLoading(false);
    }
  };

  const refreshSelectedStudent = async (studentId) => {
    try {
      const response = await studentsAPI.getById(studentId);
      setSelectedStudent(response.data);
    } catch (error) {
      // Keep existing selected student state if refresh fails
    }
  };

  const handleBlockMail = async (studentId) => {
    if (blockReasonOpenId !== studentId) {
      setBlockReasonOpenId(studentId);
      return;
    }

    const reason = String(blockReasonDrafts[studentId] || '').trim();
    if (!reason) {
      toast.error('Block reason is required');
      return;
    }

    try {
      setBlockLoadingId(studentId);
      await studentsAPI.blockMail(studentId, { reason });
      toast.success('Student email blocked successfully');
      setBlockReasonDrafts((prev) => ({ ...prev, [studentId]: '' }));
      setBlockReasonOpenId('');
      await fetchStudents();
      await refreshSelectedStudent(studentId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to block student email');
    } finally {
      setBlockLoadingId('');
    }
  };

  const handleApproveUnblock = async (studentId) => {
    try {
      await studentsAPI.approveUnblock(studentId);
      toast.success('Unblock approved by faculty');
      await fetchStudents();
      await refreshSelectedStudent(studentId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve unblock');
    }
  };

  const handleUnblockMail = async (studentId) => {
    try {
      await studentsAPI.unblockMail(studentId);
      toast.success('Student email unblocked successfully');
      await fetchStudents();
      await refreshSelectedStudent(studentId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unblock student email');
    }
  };

  const handleClearMailBlockCount = async (studentId) => {
    if (!window.confirm('Clear mail block count for this student?')) return;

    try {
      setClearCountLoadingId(studentId);
      await studentsAPI.clearMailBlockCount(studentId);
      toast.success('Mail block count cleared successfully');
      await fetchStudents();
      await refreshSelectedStudent(studentId);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to clear mail block count');
    } finally {
      setClearCountLoadingId('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingStudent) {
        await studentsAPI.update(editingStudent._id, formData);
        toast.success('Student updated successfully');
      } else {
        await studentsAPI.create(formData);
        toast.success('Student created successfully');
      }
      
      fetchStudents();
      resetForm();
      setShowModal(false);
      // Regenerate next student ID for the next new student
      setTimeout(() => {
        setNextStudentId(generateNextStudentId(students));
      }, 100);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await studentsAPI.delete(id);
        toast.success('Student deleted successfully');
        fetchStudents();
      } catch (error) {
        toast.error('Failed to delete student');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      studentId: '',
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      phone: '',
      dateOfBirth: '',
      department: '',
      semester: '',
      batch: '',
      bio: {
        fullName: '',
        registrationNumber: '',
        fatherName: '',
        motherName: '',
        guardianContact: '',
        emergencyContact: '',
        mailBlockReason: ''
      },
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      }
    });
    setEditingStudent(null);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      password: '',
      phone: student.phone,
      dateOfBirth: student.dateOfBirth?.split('T')[0] || '',
      department: student.department,
      semester: student.semester,
      batch: student.batch || '',
      bio: student.bio || {
        fullName: '',
        registrationNumber: '',
        fatherName: '',
        motherName: '',
        guardianContact: '',
        emergencyContact: '',
        mailBlockReason: ''
      },
      address: student.address || {
        street: '',
        city: '',
        state: '',
        zipCode: ''
      }
    });
    setShowModal(true);
  };

  const filteredStudents = students.filter((student) => {
    if (isFaculty && student.department !== facultyDepartment) return false;

    const query = searchTerm.toLowerCase().trim();
    if (!query) return true;

    const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
    const registrationNumber = (student.bio?.registrationNumber || '').toLowerCase();
    const studentId = (student.studentId || '').toLowerCase();

    return (
      fullName.includes(query) ||
      registrationNumber.includes(query) ||
      studentId.includes(query)
    );
  });

  const canManageStudent = (student) => {
    if (!canManageStudentRecords) return false;
    if (!isFaculty) return true;
    return student.department === facultyDepartment;
  };

  const getAllBlockReasons = (student) => {
    const history = Array.isArray(student?.user?.emailBlockHistory) ? student.user.emailBlockHistory : [];
    if (history.length === 0) return [];
    return [...history]
      .reverse()
      .map((entry, idx) => ({
        id: `${entry.blockedAt || idx}-${idx}`,
        text: entry.reason,
        date: entry.blockedAt ? new Date(entry.blockedAt).toLocaleDateString() : '',
        facultyApprovedByName: entry.facultyApprovedByName || '',
        facultyApprovedByFacultyId: entry.facultyApprovedByFacultyId || ''
      }));
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
        <h1 className="text-2xl font-bold text-gray-900">Students Management</h1>
        {canManageStudentRecords && (
          <button
            onClick={() => {
              resetForm();
              // Auto-generate student ID and registration number for new student
              const newStudentId = generateNextStudentId(students);
              const currentDept = isFaculty
                ? (facultyDepartment || formData.department || 'Computer Science')
                : (formData.department || 'Computer Science');
              const newRegNumber = generateRegistrationNumber(students, currentDept);
              setFormData(prev => ({ 
                ...prev, 
                studentId: newStudentId,
                department: currentDept,
                bio: {
                  ...prev.bio,
                  fullName: '',
                  registrationNumber: newRegNumber
                }
              }));
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Student
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          placeholder="Search students..."
          className="input-field pl-10"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Students Table */}
      <div className="card">
        <div className="space-y-3 p-4">
          {filteredStudents.map((student, index) => (
            <div
              key={student._id}
              style={{ animationDelay: `${index * 45}ms` }}
              className="list-item-animate bg-white border rounded-lg overflow-hidden"
            >
              <div className="p-4">
                <div className="mb-2 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-semibold text-gray-900 truncate">
                      {student.firstName} {student.lastName}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{student.email}</p>
                    {student.bio?.registrationNumber && (
                      <p className="text-xs text-gray-400 mt-1">Reg: {student.bio.registrationNumber}</p>
                    )}
                    {student.bio?.mailBlockReason && (
                      <p className="mt-2 text-xs text-red-600 line-clamp-2">
                        Block reason: {student.bio.mailBlockReason}
                      </p>
                    )}
                  </div>
                  <div className="ml-0 flex flex-wrap gap-2 lg:ml-2 lg:justify-end">
                    <button
                      onClick={() => handleStudentClick(student)}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      {selectedStudent?._id === student._id ? 'Hide Details' : 'View Details'}
                    </button>
                    {isManagement && !student.user?.isEmailBlocked && (
                      <button
                        onClick={() => handleBlockMail(student._id)}
                        className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                      >
                        {blockReasonOpenId === student._id ? 'Confirm Block' : 'Block Mail'}
                      </button>
                    )}
                    {isFaculty && student.user?.isEmailBlocked && !student.user?.unblockApprovedByFaculty && (
                      <button
                        onClick={() => handleApproveUnblock(student._id)}
                        className="px-3 py-1 text-sm bg-amber-600 text-white rounded hover:bg-amber-700"
                      >
                        Approve Unblock
                      </button>
                    )}
                    {isManagement && student.user?.isEmailBlocked && (
                      <button
                        onClick={() => handleUnblockMail(student._id)}
                        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        Unblock Mail
                      </button>
                    )}
                    {canManageStudentRecords && (
                      <>
                        <button
                          onClick={() => openEditModal(student)}
                          disabled={!canManageStudent(student)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded"
                          title={!canManageStudent(student) ? 'You can manage only your department students' : ''}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student._id)}
                          disabled={!canManageStudent(student)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded"
                          title={!canManageStudent(student) ? 'You can manage only your department students' : ''}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 md:grid-cols-4">
                  <div>
                    <span className="text-gray-500">ID:</span>
                    <span className="ml-1 font-medium">{student.studentId}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Dept:</span>
                    <span className="ml-1 font-medium">{student.department}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Sem:</span>
                    <span className="ml-1 font-medium">{student.semester}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <span className="ml-1 font-medium">{student.phone}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Mail Blocks:</span>
                    <span className="ml-1 font-medium">{student.user?.emailBlockCount || 0}</span>
                  </div>
                </div>
                {isManagement && !student.user?.isEmailBlocked && blockReasonOpenId === student._id && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50/60 p-3">
                    <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-red-700">
                      Mail block reason
                    </label>
                    <div className="flex flex-col gap-2 md:flex-row">
                      <textarea
                        rows="2"
                        value={blockReasonDrafts[student._id] || ''}
                        onChange={(e) => setBlockReasonDrafts((prev) => ({ ...prev, [student._id]: e.target.value }))}
                        className="input-field min-h-[72px] resize-none border-red-200 bg-white text-sm focus:ring-red-400"
                        placeholder="Type the reason for blocking this student's mail"
                      />
                      <button
                        type="button"
                        onClick={() => handleBlockMail(student._id)}
                        disabled={blockLoadingId === student._id}
                        className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 md:self-start"
                      >
                        {blockLoadingId === student._id ? 'Blocking...' : 'Block Mail'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setBlockReasonOpenId('')}
                        className="px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 md:self-start"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {selectedStudent?._id === student._id && (
                <div className="border-t bg-gradient-to-r from-blue-50 to-indigo-50 p-4">
                  <div className="space-y-4">
                        {/* Priority Cards: Bio, Marks, Attendance */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                          <div className="bg-white rounded-lg p-3 shadow-sm border border-purple-200">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-5 w-5 text-purple-600" />
                              <div>
                                <p className="text-xs text-gray-500">Bio</p>
                                <p className="text-sm font-bold text-gray-900 truncate">
                                  {student.bio?.fullName || `${student.firstName} ${student.lastName}`}
                                </p>
                                <p className="text-xs text-gray-400 truncate">
                                  {student.bio?.registrationNumber || 'Reg N/A'}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm border border-blue-200">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-5 w-5 text-blue-600" />
                              <div>
                                <p className="text-xs text-gray-500">Avg Marks</p>
                                <p className="text-lg font-bold text-gray-900">{calculateAverageMarks(student._id).average}%</p>
                                <p className="text-xs text-gray-400">{calculateAverageMarks(student._id).total} exams</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm border border-green-200">
                            <div className="flex items-center gap-2">
                              <Clock className="h-5 w-5 text-green-600" />
                              <div>
                                <p className="text-xs text-gray-500">Attendance</p>
                                <p className="text-lg font-bold text-gray-900">{calculateAttendance(student._id).percentage}%</p>
                                <p className="text-xs text-gray-400">{calculateAttendance(student._id).present}/{calculateAttendance(student._id).total} classes</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white rounded-lg p-3 shadow-sm border border-indigo-200">
                            <div className="flex items-center gap-2">
                              <BookOpen className="h-5 w-5 text-indigo-600" />
                              <div>
                                <p className="text-xs text-gray-500">Semester</p>
                                <p className="text-lg font-bold text-gray-900">{student.semester || 'N/A'}</p>
                                <p className="text-xs text-gray-400">{student.batch || 'Batch N/A'}</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Marks Card */}
                        {studentDetails[student._id]?.exams && studentDetails[student._id].exams.length > 0 && (
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-200">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-blue-600" />
                                Exam Results
                              </h4>
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                Average: {calculateAverageMarks(student._id).average}%
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                              {studentDetails[student._id].exams.map((exam, idx) => {
                                const marks = Number(exam.marksObtained ?? exam.obtainedMarks ?? exam.marks ?? 0);
                                const maxMarks = Number(exam.totalMarks ?? exam.maxMarks ?? 100);
                                const percentage = maxMarks > 0 ? ((marks / maxMarks) * 100).toFixed(1) : '0.0';
                                return (
                                  <div key={idx} className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg p-3 border border-gray-200">
                                    <div className="flex justify-between items-start mb-2">
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm truncate">{exam.subject || exam.subjectName || '-'}</p>
                                        <p className="text-xs text-gray-500">{exam.examName || exam.examType}</p>
                                      </div>
                                      <span className={`px-2 py-1 rounded text-xs font-bold flex-shrink-0 ml-2 ${
                                        percentage >= 75 ? 'bg-green-100 text-green-800' :
                                        percentage >= 60 ? 'bg-blue-100 text-blue-800' :
                                        percentage >= 40 ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-red-100 text-red-800'
                                      }`}>
                                        {exam.grade || percentage + '%'}
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="text-gray-600">Marks: <span className="font-bold text-gray-900">{marks}/{maxMarks}</span></span>
                                      <span className="text-xs text-gray-400">{new Date(exam.examDate).toLocaleDateString()}</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Bio Details */}
                        <div className="bg-white rounded-lg p-4 shadow-sm border">
                          <h4 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-2">
                            <User className="h-4 w-4 text-indigo-600" />
                            Personal Information
                          </h4>
                          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 md:grid-cols-4">
                            <div><span className="text-gray-500">Full Name:</span> <span className="font-medium">{student.bio?.fullName || 'N/A'}</span></div>
                            <div><span className="text-gray-500">Registration:</span> <span className="font-medium">{student.bio?.registrationNumber || 'N/A'}</span></div>
                            <div><span className="text-gray-500">DOB:</span> <span className="font-medium">{student.dateOfBirth ? new Date(student.dateOfBirth).toLocaleDateString() : 'N/A'}</span></div>
                            <div><span className="text-gray-500">Phone:</span> <span className="font-medium">{student.phone || 'N/A'}</span></div>
                            <div><span className="text-gray-500">Mail Block Count:</span> <span className="font-medium">{student.user?.emailBlockCount || 0}</span></div>
                            <div><span className="text-gray-500">Father:</span> <span className="font-medium">{student.bio?.fatherName || 'N/A'}</span></div>
                            <div><span className="text-gray-500">Mother:</span> <span className="font-medium">{student.bio?.motherName || 'N/A'}</span></div>
                            <div><span className="text-gray-500">Guardian:</span> <span className="font-medium">{student.bio?.guardianContact || 'N/A'}</span></div>
                            <div><span className="text-gray-500">Emergency:</span> <span className="font-medium">{student.bio?.emergencyContact || 'N/A'}</span></div>
                            <div className="col-span-2"><span className="text-gray-500">Address:</span> <span className="font-medium">{student.address?.street}, {student.address?.city}, {student.address?.state} - {student.address?.zipCode}</span></div>
                          </div>
                        </div>

                        {/* Attendance Summary */}
                        {studentDetails[student._id]?.attendance && studentDetails[student._id].attendance.length > 0 && (
                          <div className="bg-white rounded-lg p-4 shadow-sm border border-green-200">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                                <Clock className="h-4 w-4 text-green-600" />
                                Recent Attendance
                              </h4>
                              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                {calculateAttendance(student._id).percentage}% Present
                              </span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                              {studentDetails[student._id].attendance.slice(0, 10).map((att, idx) => (
                                <div key={idx} className="flex items-center gap-2 text-xs bg-gray-50 rounded p-2">
                                  {att.status === 'present' || att.status === 'P' ? (
                                    <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <span className="text-gray-900 font-medium truncate block">{att.fn}</span>
                                    <span className="text-gray-400 text-xs">{new Date(att.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Block Details */}
                        <div className="bg-white rounded-lg p-4 shadow-sm border border-red-200">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
                              <ShieldAlert className="h-4 w-4 text-red-600" />
                              Mail Block Details
                            </h4>
                            {isManagement && (
                              <button
                                type="button"
                                onClick={() => handleClearMailBlockCount(student._id)}
                                disabled={clearCountLoadingId === student._id || (student.user?.emailBlockCount || 0) === 0}
                                className="px-2 py-1 text-xs rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                              >
                                {clearCountLoadingId === student._id ? 'Clearing...' : 'Clear Count'}
                              </button>
                            )}
                          </div>
                          <div className="text-sm space-y-1">
                            <p className="text-gray-700">
                              <span className="font-medium">Block Count:</span> {student.user?.emailBlockCount || 0}
                            </p>
                            <div className="text-gray-700">
                              <span className="font-medium">All Past Reasons:</span>
                              {getAllBlockReasons(student).length > 0 ? (
                                <div className="mt-2 space-y-1">
                                  {getAllBlockReasons(student).map((item, idx) => (
                                    <p key={item.id} className="text-xs text-gray-600">
                                      {idx + 1}. {item.text}{item.date ? ` (${item.date})` : ''}{item.facultyApprovedByName ? ` | Approved by ${item.facultyApprovedByName} (${item.facultyApprovedByFacultyId || 'ID N/A'})` : ''}
                                    </p>
                                  ))}
                                </div>
                              ) : (
                                <p className="mt-1 text-xs text-gray-500">No past reasons</p>
                              )}
                            </div>
                          </div>
                        </div>

                  </div>
                </div>
              )}
            </div>
          ))}
          {filteredStudents.length === 0 && (
            <div className="text-center py-8 text-gray-500">No students match the selected filters.</div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-backdrop-animate fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative min-h-screen flex items-center justify-center p-4">
            <div className="modal-panel-animate relative bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
              {/* Header */}
              <div className="bg-primary-600 px-6 py-4 flex justify-between items-center">
                <h3 className="text-xl font-bold text-white">
                  {editingStudent ? 'Edit Student' : 'Add New Student'}
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white hover:text-gray-200 text-2xl font-bold"
                >
                  ×
                </button>
              </div>
              
              {/* Form Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Basic Info Row 1 */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Student ID</label>
                      <input
                        type="text"
                        className="input-field text-sm"
                        value={formData.studentId}
                        onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                      <input
                        type="text"
                        className="input-field text-sm"
                        value={formData.firstName}
                        onChange={(e) => {
                          const newFirstName = e.target.value;
                          setFormData({
                            ...formData,
                            firstName: newFirstName,
                            bio: {
                              ...formData.bio,
                              fullName: `${newFirstName} ${formData.lastName}`.trim()
                            }
                          });
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        className="input-field text-sm"
                        value={formData.lastName}
                        onChange={(e) => {
                          const newLastName = e.target.value;
                          setFormData({
                            ...formData,
                            lastName: newLastName,
                            bio: {
                              ...formData.bio,
                              fullName: `${formData.firstName} ${newLastName}`.trim()
                            }
                          });
                        }}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        className="input-field text-sm"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                      />
                    </div>
                  </div>

                  {/* Password for new student */}
                  {!editingStudent && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Password</label>
                        <input
                          type="password"
                          className="input-field text-sm"
                          value={formData.password}
                          onChange={(e) => setFormData({...formData, password: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          className="input-field text-sm"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          maxLength="10"
                          pattern="[0-9]{10}"
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Password and Phone Row for edit */}
                  {editingStudent && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                        <input
                          type="tel"
                          className="input-field text-sm"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          maxLength="10"
                          pattern="[0-9]{10}"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Date of Birth</label>
                        <input
                          type="date"
                          className="input-field text-sm"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                        <select
                          className="input-field text-sm"
                          value={formData.department}
                          onChange={(e) => {
                            const newDept = e.target.value;
                            const newRegNumber = newDept ? generateRegistrationNumber(students, newDept) : '';
                            setFormData({
                              ...formData, 
                              department: newDept,
                              bio: {
                                ...formData.bio,
                                registrationNumber: newRegNumber
                              }
                            });
                          }}
                          disabled={isFaculty}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Computer Science">CS</option>
                          <option value="Electronics">EE</option>
                          <option value="Mechanical">ME</option>
                          <option value="Civil">CE</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Semester</label>
                        <select
                          className="input-field text-sm"
                          value={formData.semester}
                          onChange={(e) => setFormData({...formData, semester: e.target.value})}
                          required
                        >
                          <option value="">Select</option>
                          {[1,2,3,4,5,6,7,8].map(sem => (
                            <option key={sem} value={sem}>{sem}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Department and Semester for new student */}
                  {!editingStudent && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                        <select
                          className="input-field text-sm"
                          value={formData.department}
                          onChange={(e) => {
                            const newDept = e.target.value;
                            const newRegNumber = newDept ? generateRegistrationNumber(students, newDept) : '';
                            setFormData({
                              ...formData, 
                              department: newDept,
                              bio: {
                                ...formData.bio,
                                registrationNumber: newRegNumber
                              }
                            });
                          }}
                          disabled={isFaculty}
                          required
                        >
                          <option value="">Select</option>
                          <option value="Computer Science">CS</option>
                          <option value="Electronics">EE</option>
                          <option value="Mechanical">ME</option>
                          <option value="Civil">CE</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Semester</label>
                        <select
                          className="input-field text-sm"
                          value={formData.semester}
                          onChange={(e) => setFormData({...formData, semester: e.target.value})}
                          required
                        >
                          <option value="">Select</option>
                          {[1,2,3,4,5,6,7,8].map(sem => (
                            <option key={sem} value={sem}>{sem}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Batch</label>
                        <select
                          className="input-field text-sm"
                          value={formData.batch}
                          onChange={(e) => setFormData({...formData, batch: e.target.value})}
                          required
                        >
                          <option value="">Select</option>
                          <option value="2023-2027">2023-27</option>
                          <option value="2024-2028">2024-28</option>
                          <option value="2025-2029">2025-29</option>
                          <option value="2026-2030">2026-30</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">DOB</label>
                        <input
                          type="date"
                          className="input-field text-sm"
                          value={formData.dateOfBirth}
                          onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Bio Details */}
                  <div className="border-t pt-3">
                    <h4 className="font-semibold text-gray-700 text-sm mb-2">Bio Details</h4>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                      <input type="text" placeholder="Full Name" className="input-field text-sm" value={formData.bio.fullName} onChange={(e) => setFormData({...formData, bio: {...formData.bio, fullName: e.target.value}})} />
                      <input type="text" placeholder="Reg. Number" className="input-field text-sm" value={formData.bio.registrationNumber} onChange={(e) => setFormData({...formData, bio: {...formData.bio, registrationNumber: e.target.value}})} />
                      <input type="text" placeholder="Father's Name" className="input-field text-sm" value={formData.bio.fatherName} onChange={(e) => setFormData({...formData, bio: {...formData.bio, fatherName: e.target.value}})} />
                      <input type="text" placeholder="Mother's Name" className="input-field text-sm" value={formData.bio.motherName} onChange={(e) => setFormData({...formData, bio: {...formData.bio, motherName: e.target.value}})} />
                      <input type="text" placeholder="Guardian Contact" className="input-field text-sm" maxLength="10" value={formData.bio.guardianContact} onChange={(e) => setFormData({...formData, bio: {...formData.bio, guardianContact: e.target.value}})} />
                      <input type="text" placeholder="Emergency Contact" className="input-field text-sm" maxLength="10" value={formData.bio.emergencyContact} onChange={(e) => setFormData({...formData, bio: {...formData.bio, emergencyContact: e.target.value}})} />
                      <input type="text" placeholder="Mail Block Reason" className="input-field text-sm md:col-span-3" value={formData.bio.mailBlockReason || ''} onChange={(e) => setFormData({...formData, bio: {...formData.bio, mailBlockReason: e.target.value}})} />
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t">
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm font-medium"
                    >
                      Cancel
                    </button>
                    <button type="submit" className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium">
                      {editingStudent ? 'Update' : 'Create'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
