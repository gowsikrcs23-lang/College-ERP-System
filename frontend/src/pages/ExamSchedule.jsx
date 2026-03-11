import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Calendar, Clock, MapPin, Plus, Edit, Trash2, BookOpen, Filter, X } from 'lucide-react';

const departmentSubjects = {
  'Computer Science': {
    1: ['Programming Fundamentals', 'Mathematics I', 'Physics', 'English', 'Engineering Drawing'],
    2: ['Data Structures', 'Mathematics II', 'Chemistry', 'Communication Skills', 'Environmental Science'],
    3: ['Object Oriented Programming', 'Database Management Systems', 'Computer Organization', 'Discrete Mathematics', 'Operating Systems'],
    4: ['Design and Analysis of Algorithms', 'Computer Networks', 'Software Engineering', 'Theory of Computation', 'Web Technologies'],
    5: ['Machine Learning', 'Compiler Design', 'Computer Graphics', 'Artificial Intelligence', 'Mobile Computing'],
    6: ['Cloud Computing', 'Big Data Analytics', 'Cyber Security', 'Internet of Things', 'Blockchain Technology'],
    7: ['Deep Learning', 'Natural Language Processing', 'Distributed Systems', 'Advanced Databases', 'Project I'],
    8: ['Advanced AI', 'Quantum Computing', 'DevOps', 'Capstone Project', 'Internship']
  },
  'Electronics': {
    1: ['Basic Electronics', 'Mathematics I', 'Physics', 'English', 'Engineering Drawing'],
    2: ['Circuit Theory', 'Mathematics II', 'Chemistry', 'Communication Skills', 'Electronic Devices'],
    3: ['Analog Electronics', 'Digital Electronics', 'Signals and Systems', 'Electromagnetic Theory', 'Network Analysis'],
    4: ['Microprocessors', 'Control Systems', 'Communication Systems', 'VLSI Design', 'Power Electronics'],
    5: ['Embedded Systems', 'Digital Signal Processing', 'Wireless Communication', 'Optical Communication', 'Antenna Theory'],
    6: ['Microcontrollers', 'Robotics', 'FPGA Design', 'Satellite Communication', 'Biomedical Electronics'],
    7: ['IoT Systems', 'Advanced Communication', 'Nanoelectronics', 'RF Design', 'Project I'],
    8: ['MEMS', '5G Technology', 'Advanced VLSI', 'Capstone Project', 'Internship']
  },
  'Mechanical': {
    1: ['Engineering Mechanics', 'Mathematics I', 'Physics', 'English', 'Engineering Drawing'],
    2: ['Strength of Materials', 'Mathematics II', 'Chemistry', 'Communication Skills', 'Manufacturing Processes'],
    3: ['Thermodynamics', 'Fluid Mechanics', 'Machine Drawing', 'Material Science', 'Kinematics of Machines'],
    4: ['Heat Transfer', 'Dynamics of Machines', 'Manufacturing Technology', 'Metrology', 'Automobile Engineering'],
    5: ['Design of Machine Elements', 'CAD/CAM', 'Industrial Engineering', 'Refrigeration and AC', 'Finite Element Analysis'],
    6: ['Mechatronics', 'Robotics', 'CNC Machines', 'Power Plant Engineering', 'Composite Materials'],
    7: ['Advanced Manufacturing', 'Renewable Energy', 'Computational Fluid Dynamics', 'Vibration Analysis', 'Project I'],
    8: ['Additive Manufacturing', 'Smart Materials', 'Advanced Thermodynamics', 'Capstone Project', 'Internship']
  },
  'Civil': {
    1: ['Engineering Mechanics', 'Mathematics I', 'Physics', 'English', 'Engineering Drawing'],
    2: ['Strength of Materials', 'Mathematics II', 'Chemistry', 'Communication Skills', 'Surveying'],
    3: ['Structural Analysis', 'Fluid Mechanics', 'Concrete Technology', 'Geotechnical Engineering', 'Building Materials'],
    4: ['Design of Concrete Structures', 'Transportation Engineering', 'Hydraulics', 'Environmental Engineering', 'Estimation and Costing'],
    5: ['Design of Steel Structures', 'Foundation Engineering', 'Water Resources Engineering', 'Construction Management', 'Advanced Surveying'],
    6: ['Earthquake Engineering', 'Bridge Engineering', 'Pavement Design', 'Waste Water Engineering', 'GIS and Remote Sensing'],
    7: ['Advanced Structural Design', 'Traffic Engineering', 'Coastal Engineering', 'Green Building', 'Project I'],
    8: ['Smart Cities', 'Sustainable Construction', 'Advanced Geotechnics', 'Capstone Project', 'Internship']
  }
};

const ExamSchedule = () => {
  const { user } = useAuth();
  const [schedules, setSchedules] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [filterDept, setFilterDept] = useState('');
  const [filterSem, setFilterSem] = useState('');
  const [formData, setFormData] = useState({
    scheduleFor: 'all_departments',
    targetStudent: '',
    department: '',
    semester: '',
    examType: 'midterm',
    academicYear: '2024-25',
    exams: []
  });
  const [examEntry, setExamEntry] = useState({
    department: '',
    semester: '',
    subject: '',
    date: '',
    startTime: '',
    endTime: '',
    room: ''
  });

  useEffect(() => {
    fetchSchedules();
    if (user?.role === 'management') {
      fetchStudents();
    }
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('/api/students');
      setStudents(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch students');
    }
  };

  const fetchSchedules = async () => {
    try {
      const params = {};
      if (user?.role === 'student' && user?.profile) {
        if (user.profile.department) params.department = user.profile.department;
        if (user.profile.semester) params.semester = user.profile.semester;
      } else if (user?.role === 'faculty' && user?.profile) {
        if (user.profile.department) params.department = user.profile.department;
      }
      
      const response = await axios.get('/api/exam-schedules', { params });
      setSchedules(response.data);
    } catch (error) {
      console.error('Error fetching schedules:', error);
      toast.error('Failed to fetch exam schedules');
    } finally {
      setLoading(false);
    }
  };

  const handleAddExam = () => {
    const sourceDepartment = formData.scheduleFor === 'all_departments' ? examEntry.department : formData.department;
    const sourceSemester = formData.scheduleFor === 'all_departments' ? examEntry.semester : formData.semester;

    if (!sourceDepartment || !sourceSemester) {
      toast.error('Please select department and semester for this exam');
      return;
    }

    if (!examEntry.subject || !examEntry.date || !examEntry.startTime || !examEntry.endTime || !examEntry.room) {
      toast.error('Please fill all exam details');
      return;
    }
    
    setFormData({
      ...formData,
      exams: [
        ...formData.exams,
        {
          ...examEntry,
          department: sourceDepartment,
          semester: Number(sourceSemester)
        }
      ]
    });
    
    setExamEntry({
      department: formData.scheduleFor === 'all_departments' ? '' : formData.department,
      semester: formData.scheduleFor === 'all_departments' ? '' : formData.semester,
      subject: '',
      date: '',
      startTime: '',
      endTime: '',
      room: ''
    });
  };

  const handleRemoveExam = (index) => {
    setFormData({
      ...formData,
      exams: formData.exams.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.scheduleFor === 'specific' && !formData.targetStudent) {
      toast.error('Please select a student for specific schedule');
      return;
    }

    if (formData.exams.length === 0) {
      toast.error('Please add at least one exam');
      return;
    }
    
    try {
      if (editingSchedule) {
        await axios.put(`/api/exam-schedules/${editingSchedule._id}`, formData);
        toast.success('Exam schedule updated successfully');
      } else {
        await axios.post('/api/exam-schedules', formData);
        toast.success('Exam schedule created successfully');
      }
      
      fetchSchedules();
      resetForm();
      setShowModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this exam schedule?')) return;
    
    try {
      await axios.delete(`/api/exam-schedules/${id}`);
      toast.success('Exam schedule deleted successfully');
      fetchSchedules();
    } catch (error) {
      toast.error('Failed to delete exam schedule');
    }
  };

  const resetForm = () => {
    setFormData({
      scheduleFor: 'all_departments',
      targetStudent: '',
      department: '',
      semester: '',
      examType: 'midterm',
      academicYear: '2024-25',
      exams: []
    });
    setExamEntry({
      department: '',
      semester: '',
      subject: '',
      date: '',
      startTime: '',
      endTime: '',
      room: ''
    });
    setEditingSchedule(null);
  };

  const openEditModal = (schedule) => {
    setEditingSchedule(schedule);
    setFormData({
      scheduleFor: schedule.scheduleFor || 'all_departments',
      targetStudent: schedule.targetStudent?._id || schedule.targetStudent || '',
      department: schedule.department,
      semester: schedule.semester,
      examType: schedule.examType,
      academicYear: schedule.academicYear,
      exams: schedule.exams
    });
    setShowModal(true);
  };

  const getExamTypeColor = (type) => {
    const colors = {
      'Periodical Test 1': 'bg-blue-100 text-blue-800 border-blue-200',
      'Periodical Test 2': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'Periodical Test 3': 'bg-purple-100 text-purple-800 border-purple-200',
      'Mid-Term': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'End Semester': 'bg-red-100 text-red-800 border-red-200',
      'midterm': 'bg-yellow-100 text-yellow-800 border-yellow-200',
      'final': 'bg-red-100 text-red-800 border-red-200',
      'internal': 'bg-green-100 text-green-800 border-green-200'
    };
    return colors[type] || 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const filteredSchedules = schedules.filter(schedule => {
    if (filterDept && schedule.department !== filterDept) return false;
    if (filterSem && schedule.semester !== parseInt(filterSem)) return false;
    return true;
  });

  const selectedStudent = students.find(s => s._id === formData.targetStudent);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold mb-2">Examination Schedule</h1>
            <p className="text-blue-100">Academic Year 2024-25</p>
          </div>
          {user?.role === 'management' && (
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-md"
            >
              <Plus className="h-5 w-5" />
              Create Schedule
            </button>
          )}
        </div>
      </div>

      {/* Info Banner for non-admin */}
      {user?.role !== 'management' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-500 rounded-lg p-4 shadow-sm">
          <div className="flex items-center">
            <BookOpen className="h-5 w-5 text-blue-600 mr-3" />
            <p className="text-sm text-blue-900 font-medium">
              View-only access: You can view examination schedules but cannot create or modify them.
            </p>
          </div>
        </div>
      )}

      {/* Filters */}
      {user?.role === 'management' && schedules.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gray-500" />
            <select
              className="input-field flex-1"
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
            >
              <option value="">All Departments</option>
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
            </select>
            <select
              className="input-field flex-1"
              value={filterSem}
              onChange={(e) => setFilterSem(e.target.value)}
            >
              <option value="">All Semesters</option>
              {[1,2,3,4,5,6,7,8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
            {(filterDept || filterSem) && (
              <button
                onClick={() => {
                  setFilterDept('');
                  setFilterSem('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Schedules */}
      {filteredSchedules.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 text-center py-16">
          <div className="bg-gray-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-10 h-10 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Exam Schedules Found</h3>
          <p className="text-gray-600 mb-4">
            {user?.role === 'management' 
              ? 'Create your first exam schedule to get started' 
              : 'No exam schedules have been published yet'}
          </p>
          {user?.role === 'student' && (
            <p className="text-sm text-gray-500">
              Department: {user?.profile?.department || 'Not set'} | Semester: {user?.profile?.semester || 'Not set'}
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {filteredSchedules.map((schedule) => (
            <div key={schedule._id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              {/* Schedule Header */}
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        {schedule.department}
                      </h3>
                      {schedule.scheduleFor !== 'all_departments' && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                          Semester {schedule.semester}
                        </span>
                      )}
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full border ${getExamTypeColor(schedule.examType)}`}>
                        {schedule.examType.charAt(0).toUpperCase() + schedule.examType.slice(1)} Exam
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Academic Year: {schedule.academicYear}
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      {schedule.scheduleFor === 'specific' && schedule.targetStudent
                        ? `For: ${schedule.targetStudent.firstName} ${schedule.targetStudent.lastName} (${schedule.targetStudent.studentId})`
                        : 'For: All Departments'}
                    </p>
                  </div>
                  {user?.role === 'management' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditModal(schedule)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Schedule"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(schedule._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Schedule"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Exams Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Time
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Venue
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {schedule.exams.map((exam, index) => (
                      <tr key={index} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <div className="flex items-center">
                              <div className="w-2 h-2 bg-blue-500 rounded-full mr-3"></div>
                              <span className="text-sm font-medium text-gray-900">{exam.subject}</span>
                            </div>
                            {exam.department && exam.semester && (
                              <p className="text-xs text-gray-500 mt-1">{exam.department} • Sem {exam.semester}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-700">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            {new Date(exam.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              year: 'numeric', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-700">
                            <Clock className="h-4 w-4 mr-2 text-gray-400" />
                            {exam.startTime} - {exam.endTime}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center text-sm text-gray-700">
                            <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                            {exam.room}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <p className="text-xs text-gray-600">
                  Total Exams: <span className="font-semibold">{schedule.exams.length}</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4 text-white">
              <h3 className="text-xl font-bold">
                {editingSchedule ? 'Edit Exam Schedule' : 'Create New Exam Schedule'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Schedule For *</label>
                  <select
                    className="input-field"
                    value={formData.scheduleFor}
                    onChange={(e) => setFormData({
                      ...formData,
                      scheduleFor: e.target.value,
                      targetStudent: e.target.value === 'all_departments' ? '' : formData.targetStudent,
                      department: e.target.value === 'all_departments' ? '' : formData.department,
                      semester: e.target.value === 'all_departments' ? '' : formData.semester
                    })}
                    required
                  >
                    <option value="all_departments">All Departments</option>
                    <option value="specific">Specific Student</option>
                  </select>
                </div>

                {formData.scheduleFor === 'specific' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Student *</label>
                    <select
                      className="input-field"
                      value={formData.targetStudent}
                      onChange={(e) => {
                        const student = students.find(s => s._id === e.target.value);
                        setFormData({
                          ...formData,
                          targetStudent: e.target.value,
                          department: student?.department || '',
                          semester: student?.semester || ''
                        });
                      }}
                      required
                    >
                      <option value="">Select Student</option>
                      {students.map(student => (
                        <option key={student._id} value={student._id}>
                          {student.firstName} {student.lastName} ({student.studentId})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div></div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Department *</label>
                  <select
                    className="input-field"
                    value={formData.department}
                    onChange={(e) => setFormData({...formData, department: e.target.value})}
                    required={formData.scheduleFor !== 'all_departments'}
                    disabled={formData.scheduleFor === 'specific' || formData.scheduleFor === 'all_departments'}
                  >
                    <option value="">Select Department</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Mechanical">Mechanical</option>
                    <option value="Civil">Civil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Semester *</label>
                  <select
                    className="input-field"
                    value={formData.semester}
                    onChange={(e) => setFormData({...formData, semester: e.target.value})}
                    required={formData.scheduleFor !== 'all_departments'}
                    disabled={formData.scheduleFor === 'specific' || formData.scheduleFor === 'all_departments'}
                  >
                    <option value="">Select Semester</option>
                    {[1,2,3,4,5,6,7,8].map(sem => (
                      <option key={sem} value={sem}>Semester {sem}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type *</label>
                  <select
                    className="input-field"
                    value={formData.examType}
                    onChange={(e) => setFormData({...formData, examType: e.target.value})}
                    required
                  >
                    <option value="Periodical Test 1">Periodical Test 1</option>
                    <option value="Periodical Test 2">Periodical Test 2</option>
                    <option value="Periodical Test 3">Periodical Test 3</option>
                    <option value="Mid-Term">Mid-Term</option>
                    <option value="End Semester">End Semester</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Academic Year *</label>
                  <input
                    type="text"
                    placeholder="e.g., 2024-25"
                    className="input-field"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({...formData, academicYear: e.target.value})}
                    required
                  />
                </div>
              </div>

              {formData.scheduleFor === 'specific' && selectedStudent && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
                  Target student department/semester: {selectedStudent.department} / Semester {selectedStudent.semester}
                </div>
              )}

              {/* Add Exams Section */}
              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4 flex items-center">
                  <Plus className="h-5 w-5 mr-2" />
                  Add Examination Details
                </h4>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-7 gap-3">
                    {formData.scheduleFor === 'all_departments' ? (
                      <>
                        <select
                          className="input-field"
                          value={examEntry.department}
                          onChange={(e) => setExamEntry({...examEntry, department: e.target.value, semester: '', subject: ''})}
                        >
                          <option value="">Select Department</option>
                          <option value="Computer Science">Computer Science</option>
                          <option value="Electronics">Electronics</option>
                          <option value="Mechanical">Mechanical</option>
                          <option value="Civil">Civil</option>
                        </select>
                        <select
                          className="input-field"
                          value={examEntry.semester}
                          onChange={(e) => setExamEntry({...examEntry, semester: e.target.value, subject: ''})}
                          disabled={!examEntry.department}
                        >
                          <option value="">Select Semester</option>
                          {[1,2,3,4,5,6,7,8].map(sem => (
                            <option key={sem} value={sem}>Sem {sem}</option>
                          ))}
                        </select>
                      </>
                    ) : (
                      <>
                        <input
                          className="input-field bg-gray-100"
                          value={formData.department || ''}
                          readOnly
                        />
                        <input
                          className="input-field bg-gray-100"
                          value={formData.semester ? `Semester ${formData.semester}` : ''}
                          readOnly
                        />
                      </>
                    )}
                    <select
                      className="input-field"
                      value={examEntry.subject}
                      onChange={(e) => setExamEntry({...examEntry, subject: e.target.value})}
                      disabled={!(
                        (formData.scheduleFor === 'all_departments' ? examEntry.department : formData.department) &&
                        (formData.scheduleFor === 'all_departments' ? examEntry.semester : formData.semester)
                      )}
                    >
                      <option value="">Select Subject</option>
                      {(formData.scheduleFor === 'all_departments'
                        ? departmentSubjects[examEntry.department]?.[examEntry.semester]
                        : departmentSubjects[formData.department]?.[formData.semester]
                      )?.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                    <input
                      type="date"
                      className="input-field"
                      value={examEntry.date}
                      onChange={(e) => setExamEntry({...examEntry, date: e.target.value})}
                    />
                    <input
                      type="time"
                      className="input-field"
                      value={examEntry.startTime}
                      onChange={(e) => setExamEntry({...examEntry, startTime: e.target.value})}
                    />
                    <input
                      type="time"
                      className="input-field"
                      value={examEntry.endTime}
                      onChange={(e) => setExamEntry({...examEntry, endTime: e.target.value})}
                    />
                    <input
                      type="text"
                      placeholder="Room No."
                      className="input-field"
                      value={examEntry.room}
                      onChange={(e) => setExamEntry({...examEntry, room: e.target.value})}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddExam}
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Add to Schedule
                  </button>
                </div>
              </div>

              {/* Added Exams List */}
              {formData.exams.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-3 border-b">
                    <h4 className="font-semibold text-gray-900">
                      Scheduled Exams ({formData.exams.length})
                    </h4>
                  </div>
                  <div className="divide-y max-h-60 overflow-y-auto">
                    {formData.exams.map((exam, index) => (
                      <div key={index} className="flex justify-between items-center p-4 hover:bg-gray-50">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{exam.subject}</p>
                          <p className="text-sm text-gray-600">
                            {exam.department && exam.semester ? `${exam.department} • Sem ${exam.semester} • ` : ''}
                            {new Date(exam.date).toLocaleDateString()} • {exam.startTime} - {exam.endTime} • {exam.room}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveExam(index)}
                          className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Actions */}
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingSchedule ? 'Update Schedule' : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamSchedule;
