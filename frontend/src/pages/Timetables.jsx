import { useState, useEffect } from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';
import { timetablesAPI, facultyAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Timetables = () => {
  const { user } = useAuth();
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [filterDept, setFilterDept] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [facultyList, setFacultyList] = useState([]);
  const [formData, setFormData] = useState({
    department: '',
    semester: '',
    academicYear: '2024-25',
    schedule: []
  });

  const isStudent = user?.role === 'student';
  const isFaculty = user?.role === 'faculty';
  const canManageTimetables = ['admin', 'management'].includes(user?.role);
  const canViewFacultyList = ['admin', 'management', 'hod'].includes(user?.role);

  const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil'];
  const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    { start: '09:00', end: '10:00' }, { start: '10:00', end: '11:00' },
    { start: '11:15', end: '12:15' }, { start: '12:15', end: '13:15' },
    { start: '14:00', end: '15:00' }, { start: '15:00', end: '16:00' },
    { start: '16:15', end: '17:15' }
  ];

  const subjectsByDeptSemester = {
    'Computer Science': {
      1: ['C Programming', 'Mathematics I', 'Physics', 'English I', 'Basic Electrical', 'Engineering Graphics'],
      2: ['C++ Programming', 'Mathematics II', 'Chemistry', 'English II', 'Digital Logic', 'Workshop Practice'],
      3: ['Data Structures', 'Discrete Mathematics', 'OOP', 'Computer Organization', 'Data Communication', 'Environmental Science'],
      4: ['Algorithms', 'Operating Systems', 'Database Systems', 'Microprocessors', 'Computer Networks', 'Mathematics III'],
      5: ['Software Engineering', 'Theory of Computation', 'AI', 'Web Development', 'Computer Graphics', 'Professional Ethics'],
      6: ['Machine Learning', 'Compiler Design', 'Distributed Systems', 'Cloud Computing', 'Mobile Computing', 'Cyber Security'],
      7: ['Big Data Analytics', 'Internet of Things', 'Blockchain', 'Deep Learning', 'Project Management', 'Cloud Infrastructure'],
      8: ['Project Work', 'Seminar', 'Industry Internship', 'Technical Elective I', 'Technical Elective II', 'Research Methodology']
    },
    'Electronics': {
      1: ['C Programming', 'Mathematics I', 'Physics', 'English I', 'Basic Electrical', 'Engineering Graphics'],
      2: ['C++ Programming', 'Mathematics II', 'Chemistry', 'English II', 'Digital Logic', 'Workshop Practice'],
      3: ['Electronic Devices', 'Circuit Theory', 'Digital Electronics', 'Signals & Systems', 'EM Fields', 'Mathematics III'],
      4: ['Linear IC', 'Microcontrollers', 'DSP', 'VLSI Design', 'Control Systems', 'Communication Theory'],
      5: ['Embedded Systems', 'Power Electronics', 'Antenna & Propagation', 'Microwave Engineering', 'Digital Image Processing', 'Professional Ethics'],
      6: ['Wireless Communication', 'IoT & Sensors', 'FPGA Design', 'Robotics & Automation', 'Renewable Energy', 'Advanced Signal Processing'],
      7: ['Advanced Embedded Systems', 'Biomedical Instrumentation', 'VLSI Testing', 'Optoelectronics', 'Project Management', 'Industry Internship'],
      8: ['Project Work', 'Seminar', 'Advanced Communication', 'Industry Internship', 'Technical Elective I', 'Technical Elective II']
    },
    'Mechanical': {
      1: ['C Programming', 'Mathematics I', 'Physics', 'English I', 'Basic Electrical', 'Engineering Graphics'],
      2: ['C++ Programming', 'Mathematics II', 'Chemistry', 'English II', 'Workshop Practice', 'Engineering Mechanics'],
      3: ['Thermodynamics', 'Fluid Mechanics', 'Engineering Math III', 'Strength of Materials', 'Manufacturing Tech I', 'Machine Drawing'],
      4: ['Kinematics of Machinery', 'Heat Transfer', 'Manufacturing Tech II', 'Theory of Machines', 'Material Science', 'Industrial Engineering'],
      5: ['Design of Machine Elements', 'Refrigeration & AC', 'CAD/CAM', 'Finite Element Analysis', 'Automobile Engineering', 'Professional Ethics'],
      6: ['Gas Dynamics', 'Power Plant Engineering', 'Mechatronics', 'Renewable Energy', 'CFD', 'Quality Control'],
      7: ['Advanced Manufacturing', 'Robotics', 'Product Design', 'Thermal Engineering', 'Project Management', 'Industry Internship'],
      8: ['Project Work', 'Seminar', 'Advanced Materials', 'Industry Internship', 'Technical Elective I', 'Technical Elective II']
    },
    'Civil': {
      1: ['C Programming', 'Mathematics I', 'Physics', 'English I', 'Basic Electrical', 'Engineering Graphics'],
      2: ['C++ Programming', 'Mathematics II', 'Chemistry', 'English II', 'Workshop Practice', 'Building Materials'],
      3: ['Surveying I', 'Strength of Materials', 'Fluid Mechanics I', 'Engineering Math III', 'Building Construction', 'Theory of Structures'],
      4: ['Surveying II', 'Structural Analysis', 'Fluid Mechanics II', 'Concrete Technology', 'Highway Engineering', 'Environmental Engineering I'],
      5: ['Steel Structures', 'Foundation Engineering', 'Environmental Engineering II', 'Water Resources', 'Concrete Structures', 'Professional Ethics'],
      6: ['Bridge Engineering', 'Earthquake Engineering', 'Advanced Concrete Design', 'Urban Transportation', 'Geotechnical Engineering', 'Irrigation Engineering'],
      7: ['Advanced Structural Design', 'Construction Management', 'Environmental Impact Assessment', 'Remote Sensing & GIS', 'Project Management', 'Industry Internship'],
      8: ['Project Work', 'Seminar', 'Advanced Foundation', 'Industry Internship', 'Technical Elective I', 'Technical Elective II']
    }
  };

  const normalizeValue = (value) => String(value || '').trim().toLowerCase();
  const normalizeSubjectName = (value) =>
    normalizeValue(value)
      .replace(/\b(lab|laboratory|tutorial|theory|practical)\b/g, '')
      .replace(/[^a-z0-9\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const getSubjectsForDeptSemester = (dept, semester) => {
    return subjectsByDeptSemester[dept]?.[semester] || [];
  };

  const initializeSchedule = () => {
    return days.map((day) => ({
      day,
      periods: timeSlots.map((slot) => ({
        startTime: slot.start,
        endTime: slot.end,
        subject: '',
        room: '',
        type: 'lecture',
        faculty: ''
      }))
    }));
  };

  const getFacultyOptionsForPeriod = (subject) => {
    const normalizedSubject = normalizeSubjectName(subject);

    if (!normalizedSubject) return facultyList;

    return facultyList.filter((faculty) => {
      const rawSubjects = Array.isArray(faculty.subjects) ? faculty.subjects : [];
      if (rawSubjects.length === 0) return true;

      const parsedSubjects = rawSubjects
        .flatMap((item) => String(item || '').split(/[;,|]/))
        .map((item) => normalizeSubjectName(item))
        .filter(Boolean);

      return parsedSubjects.some((facultySubject) =>
        facultySubject === normalizedSubject ||
        facultySubject.includes(normalizedSubject) ||
        normalizedSubject.includes(facultySubject)
      );
    });
  };

  const filterTimetablesForFaculty = (rawTimetables) => {
    const facultySubjects = Array.isArray(user?.profile?.subjects)
      ? user.profile.subjects.map(normalizeValue).filter(Boolean)
      : [];
    const facultySubjectSet = new Set(facultySubjects);
    const facultyProfileId = String(user?.profile?._id || '');

    return rawTimetables
      .map((timetable) => {
        const schedule = (timetable.schedule || []).map((day) => {
          const periods = (day.periods || []).map((period) => {
            const subjectMatch =
              facultySubjectSet.size === 0 || facultySubjectSet.has(normalizeValue(period.subject));
            const periodFacultyId = String(period?.faculty?._id || period?.faculty || '');
            const facultyMatch = facultyProfileId && periodFacultyId === facultyProfileId;

            if (subjectMatch || facultyMatch) {
              return period;
            }

            return {
              ...period,
              subject: '',
              room: '',
              faculty: null
            };
          });

          return { ...day, periods };
        });

        return { ...timetable, schedule };
      })
      .filter((timetable) =>
        (timetable.schedule || []).some((day) =>
          (day.periods || []).some((period) => period.subject)
        )
      );
  };

  const sanitizeScheduleForSubmit = (schedule) => {
    return (schedule || [])
      .map((day) => {
        const periods = (day.periods || [])
          .map((period) => ({
            ...period,
            subject: String(period.subject || '').trim(),
            room: String(period.room || '').trim(),
            faculty: period.faculty || undefined
          }))
          .filter((period) => period.subject && period.room);

        return { ...day, periods };
      })
      .filter((day) => day.periods.length > 0);
  };

  const fetchTimetables = async () => {
    try {
      const params = {};

      if (isStudent && user?.profile) {
        params.department = user.profile.department;
        params.semester = user.profile.semester;
      } else if (isFaculty && user?.profile) {
        if (filterDept) params.department = filterDept;
        if (filterSemester) params.semester = Number(filterSemester);
      } else {
        if (filterDept) params.department = filterDept;
        if (filterSemester) params.semester = Number(filterSemester);
      }

      const response = await timetablesAPI.getAll(params);
      const scopedTimetables = isFaculty ? filterTimetablesForFaculty(response.data) : response.data;

      setTimetables(scopedTimetables);

      if ((isStudent || isFaculty) && scopedTimetables.length > 0) {
        setSelectedTimetable(scopedTimetables[0]);
      } else if (scopedTimetables.length === 0) {
        setSelectedTimetable(null);
      }
    } catch (error) {
      toast.error('Failed to fetch timetables');
    } finally {
      setLoading(false);
    }
  };

  const fetchFaculty = async () => {
    if (!canViewFacultyList) return;

    try {
      const response = await facultyAPI.getAll();
      setFacultyList(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch faculty list');
    }
  };

  useEffect(() => {
    fetchTimetables();
  }, [filterDept, filterSemester, user?.role, user?.profile?._id, user?.profile?.department, user?.profile?.semester]);

  useEffect(() => {
    if (showModal && canManageTimetables) {
      fetchFaculty();
    }
  }, [showModal]);

  const handleScheduleChange = (dayIndex, periodIndex, field, value) => {
    const newSchedule = [...formData.schedule];
    newSchedule[dayIndex].periods[periodIndex][field] = value;
    setFormData({ ...formData, schedule: newSchedule });
  };

  const handleCreateTimetable = async (e) => {
    e.preventDefault();

    const sanitizedSchedule = sanitizeScheduleForSubmit(formData.schedule);
    if (sanitizedSchedule.length === 0) {
      toast.error('Please add at least one valid period with subject and room');
      return;
    }

    try {
      await timetablesAPI.create({
        ...formData,
        semester: Number(formData.semester),
        schedule: sanitizedSchedule
      });
      toast.success('Timetable created successfully');
      setShowModal(false);
      setFormData({ department: '', semester: '', academicYear: '2024-25', schedule: [] });
      fetchTimetables();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create timetable');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this timetable?')) {
      try {
        await timetablesAPI.delete(id);
        toast.success('Timetable deleted successfully');
        fetchTimetables();
      } catch (error) {
        toast.error('Failed to delete timetable');
      }
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'lecture': return 'bg-blue-100 text-blue-800';
      case 'lab': return 'bg-green-100 text-green-800';
      case 'tutorial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          {isStudent ? 'My Timetable' : isFaculty ? 'My Teaching Timetables' : 'Timetable Management'}
        </h1>
        {canManageTimetables && (
          <button
            onClick={() => {
              setFormData({ department: '', semester: '', academicYear: '2024-25', schedule: initializeSchedule() });
              setShowModal(true);
            }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-4 w-4" /> Create Timetable
          </button>
        )}
      </div>

      {canManageTimetables && (
        <div className="card">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department:</label>
              <select className="input-field" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                <option value="">All Departments</option>
                {departments.map((department) => <option key={department} value={department}>{department}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester:</label>
              <select className="input-field" value={filterSemester} onChange={(e) => setFilterSemester(e.target.value)}>
                <option value="">All Semesters</option>
                {semesters.map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {isStudent && (
        <div className="card bg-blue-50 border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-800"><strong>Your Department:</strong> {user.profile?.department || 'Not assigned'}</p>
              <p className="text-sm text-blue-800"><strong>Your Semester:</strong> {user.profile?.semester || 'Not assigned'}</p>
            </div>
            <Clock className="h-8 w-8 text-blue-600" />
          </div>
        </div>
      )}

      {isFaculty && (
        <div className="card bg-green-50 border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-green-800"><strong>Your Department:</strong> {user.profile?.department || 'Not assigned'}</p>
              <p className="text-sm text-green-800">
                <strong>Your Subjects:</strong> {(user.profile?.subjects || []).join(', ') || 'Not assigned'}
              </p>
            </div>
            <Clock className="h-8 w-8 text-green-600" />
          </div>
        </div>
      )}

      {!isStudent && !selectedTimetable && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {timetables.map((timetable) => (
            <div key={timetable._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">{timetable.department}</h3>
                  <p className="text-sm text-gray-600">Semester {timetable.semester}</p>
                  <p className="text-xs text-gray-500">{timetable.academicYear}</p>
                </div>
                {canManageTimetables && (
                  <button onClick={() => handleDelete(timetable._id)} className="text-red-600 hover:text-red-900">
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button onClick={() => setSelectedTimetable(timetable)} className="w-full btn-primary text-sm">
                View Timetable
              </button>
            </div>
          ))}
          {timetables.length === 0 && <div className="col-span-full text-center py-8 text-gray-500">No timetables found.</div>}
        </div>
      )}

      {selectedTimetable && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {selectedTimetable.department} - Semester {selectedTimetable.semester}
            </h2>
            {!isStudent && (
              <button onClick={() => setSelectedTimetable(null)} className="btn-secondary">
                Back
              </button>
            )}
          </div>
          <div className="card overflow-hidden">
            <table className="w-full table-fixed text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2 font-medium text-gray-900 w-20">Time</th>
                  {days.map((day) => (
                    <th key={day} className="text-left py-2 px-2 font-medium text-gray-900">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 font-medium text-gray-700 align-top">{slot.start}-{slot.end}</td>
                    {days.map((day) => {
                      const daySchedule = selectedTimetable.schedule?.find((item) => item.day === day);
                      const period = daySchedule?.periods?.find(
                        (item) => item.startTime === slot.start && item.endTime === slot.end
                      );
                      return (
                        <td key={day} className="py-2 px-2 align-top">
                          {period?.subject ? (
                            <div className="space-y-1">
                              <div className={`inline-block max-w-full px-2 py-1 rounded text-[11px] font-medium break-words ${getTypeColor(period.type)}`}>
                                {period.subject}
                              </div>
                              <div className="text-[11px] text-gray-600 break-words">{period.room}</div>
                              <div className="text-[11px] text-gray-500 capitalize">{period.type}</div>
                              {period?.faculty?.firstName && (
                                <div className="text-[11px] text-gray-500 break-words">
                                  {period.faculty.firstName} {period.faculty.lastName}
                                </div>
                              )}
                            </div>
                          ) : <div className="text-gray-400 text-sm">-</div>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card">
            <h3 className="font-medium text-gray-900 mb-3">Legend</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-blue-100 rounded"></div><span className="text-sm text-gray-700">Lecture</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-green-100 rounded"></div><span className="text-sm text-gray-700">Lab</span></div>
              <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-100 rounded"></div><span className="text-sm text-gray-700">Tutorial</span></div>
            </div>
          </div>
        </div>
      )}

      {timetables.length === 0 && (isStudent || isFaculty) && (
        <div className="card text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Timetable Available</h3>
          <p className="text-gray-600">
            {isStudent
              ? 'No timetable for your department and semester yet.'
              : 'No timetable available for your department subjects yet.'}
          </p>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-6 border w-full max-w-4xl shadow-lg rounded-md bg-white my-8">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Create New Timetable</h3>
            <form onSubmit={handleCreateTimetable} className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <select
                    className="input-field"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value, schedule: initializeSchedule() })}
                    required
                  >
                    <option value="">Select</option>
                    {departments.map((department) => <option key={department} value={department}>{department}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
                  <select
                    className="input-field"
                    value={formData.semester}
                    onChange={(e) => setFormData({ ...formData, semester: Number(e.target.value) || '' })}
                    required
                  >
                    <option value="">Select</option>
                    {semesters.map((semester) => <option key={semester} value={semester}>Semester {semester}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year</label>
                  <select className="input-field" value={formData.academicYear} onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}>
                    <option value="2024-25">2024-25</option>
                    <option value="2025-26">2025-26</option>
                  </select>
                </div>
              </div>
              {formData.department && formData.semester && (
                <div className="max-h-[50vh] overflow-y-auto border rounded-lg">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left py-2 px-3 font-medium text-gray-700 text-sm">Time</th>
                        {days.map((day) => <th key={day} className="text-left py-2 px-2 font-medium text-gray-700 text-sm">{day}</th>)}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSlots.map((slot, slotIndex) => (
                        <tr key={slotIndex} className="border-t">
                          <td className="py-2 px-3 text-sm font-medium text-gray-700 whitespace-nowrap">{slot.start}-{slot.end}</td>
                          {days.map((day, dayIndex) => {
                            const daySchedule = formData.schedule?.find((item) => item.day === day);
                            const period = daySchedule?.periods?.[slotIndex];
                            const facultyOptions = getFacultyOptionsForPeriod(period?.subject);
                            return (
                              <td key={day} className="py-2 px-2">
                                <div className="space-y-1">
                                  <select
                                    className="input-field text-xs py-1"
                                    value={period?.subject || ''}
                                    onChange={(e) => handleScheduleChange(dayIndex, slotIndex, 'subject', e.target.value)}
                                  >
                                    <option value="">-</option>
                                    {getSubjectsForDeptSemester(formData.department, formData.semester).map((subject) => (
                                      <option key={subject} value={subject}>{subject}</option>
                                    ))}
                                  </select>
                                  <select
                                    className="input-field text-xs py-1"
                                    value={period?.faculty || ''}
                                    onChange={(e) => handleScheduleChange(dayIndex, slotIndex, 'faculty', e.target.value)}
                                  >
                                    <option value="">Select Faculty</option>
                                    {facultyOptions.map((faculty) => (
                                      <option key={faculty._id} value={faculty._id}>
                                        {faculty.firstName} {faculty.lastName} ({faculty.department})
                                      </option>
                                    ))}
                                  </select>
                                  <input
                                    type="text"
                                    placeholder="Room"
                                    className="input-field text-xs py-1"
                                    value={period?.room || ''}
                                    onChange={(e) => handleScheduleChange(dayIndex, slotIndex, 'room', e.target.value)}
                                  />
                                  <select
                                    className="input-field text-xs py-1"
                                    value={period?.type || 'lecture'}
                                    onChange={(e) => handleScheduleChange(dayIndex, slotIndex, 'type', e.target.value)}
                                  >
                                    <option value="lecture">Lecture</option>
                                    <option value="lab">Lab</option>
                                    <option value="tutorial">Tutorial</option>
                                  </select>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
                <button type="submit" className="btn-primary">Create Timetable</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Timetables;
