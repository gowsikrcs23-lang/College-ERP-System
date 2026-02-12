import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Clock } from 'lucide-react';
import { timetablesAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const Timetables = () => {
  const { user } = useAuth();
  const [timetables, setTimetables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedTimetable, setSelectedTimetable] = useState(null);
  const [formData, setFormData] = useState({
    department: 'Computer Science',
    semester: '',
    academicYear: '2024-25',
    schedule: []
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlots = [
    { start: '09:00', end: '10:00' },
    { start: '10:00', end: '11:00' },
    { start: '11:15', end: '12:15' },
    { start: '12:15', end: '13:15' },
    { start: '14:00', end: '15:00' },
    { start: '15:00', end: '16:00' },
    { start: '16:15', end: '17:15' }
  ];

  const subjects = [
    'Data Structures',
    'Algorithms',
    'Database Systems',
    'Operating Systems',
    'Computer Networks',
    'Software Engineering',
    'Web Development',
    'Machine Learning',
    'Artificial Intelligence',
    'Computer Graphics'
  ];

  useEffect(() => {
    fetchTimetables();
  }, []);

  const fetchTimetables = async () => {
    try {
      const params = { department: 'Computer Science' };
      
      // If student, only fetch their semester
      if (user?.role === 'student' && user?.profile?.semester) {
        params.semester = user.profile.semester;
      }
      
      const response = await timetablesAPI.getAll(params);
      setTimetables(response.data);
      
      // Auto-select student's semester
      if (user?.role === 'student' && response.data.length > 0) {
        setSelectedTimetable(response.data[0]);
      }
    } catch (error) {
      toast.error('Failed to fetch timetables');
    } finally {
      setLoading(false);
    }
  };

  const createSampleTimetable = async () => {
    const sampleSchedule = [
      {
        day: 'Monday',
        periods: [
          { startTime: '09:00', endTime: '10:00', subject: 'Data Structures', room: 'CS-101', type: 'lecture' },
          { startTime: '10:00', endTime: '11:00', subject: 'Algorithms', room: 'CS-102', type: 'lecture' },
          { startTime: '11:15', endTime: '12:15', subject: 'Database Systems', room: 'CS-103', type: 'lecture' },
          { startTime: '14:00', endTime: '15:00', subject: 'Data Structures Lab', room: 'CS-Lab1', type: 'lab' }
        ]
      },
      {
        day: 'Tuesday',
        periods: [
          { startTime: '09:00', endTime: '10:00', subject: 'Operating Systems', room: 'CS-101', type: 'lecture' },
          { startTime: '10:00', endTime: '11:00', subject: 'Computer Networks', room: 'CS-102', type: 'lecture' },
          { startTime: '11:15', endTime: '12:15', subject: 'Software Engineering', room: 'CS-103', type: 'lecture' },
          { startTime: '14:00', endTime: '16:00', subject: 'Database Lab', room: 'CS-Lab2', type: 'lab' }
        ]
      },
      {
        day: 'Wednesday',
        periods: [
          { startTime: '09:00', endTime: '10:00', subject: 'Web Development', room: 'CS-101', type: 'lecture' },
          { startTime: '10:00', endTime: '11:00', subject: 'Machine Learning', room: 'CS-102', type: 'lecture' },
          { startTime: '11:15', endTime: '12:15', subject: 'Algorithms', room: 'CS-103', type: 'lecture' },
          { startTime: '14:00', endTime: '15:00', subject: 'Tutorial', room: 'CS-104', type: 'tutorial' }
        ]
      },
      {
        day: 'Thursday',
        periods: [
          { startTime: '09:00', endTime: '10:00', subject: 'Artificial Intelligence', room: 'CS-101', type: 'lecture' },
          { startTime: '10:00', endTime: '11:00', subject: 'Computer Graphics', room: 'CS-102', type: 'lecture' },
          { startTime: '11:15', endTime: '12:15', subject: 'Operating Systems', room: 'CS-103', type: 'lecture' },
          { startTime: '14:00', endTime: '16:00', subject: 'Web Development Lab', room: 'CS-Lab1', type: 'lab' }
        ]
      },
      {
        day: 'Friday',
        periods: [
          { startTime: '09:00', endTime: '10:00', subject: 'Software Engineering', room: 'CS-101', type: 'lecture' },
          { startTime: '10:00', endTime: '11:00', subject: 'Database Systems', room: 'CS-102', type: 'lecture' },
          { startTime: '11:15', endTime: '12:15', subject: 'Computer Networks', room: 'CS-103', type: 'lecture' },
          { startTime: '14:00', endTime: '15:00', subject: 'Project Work', room: 'CS-104', type: 'tutorial' }
        ]
      }
    ];

    try {
      for (let semester = 1; semester <= 8; semester++) {
        await timetablesAPI.create({
          department: 'Computer Science',
          semester: semester,
          academicYear: '2024-25',
          schedule: sampleSchedule
        });
      }
      toast.success('Sample timetables created successfully');
      fetchTimetables();
    } catch (error) {
      toast.error('Failed to create sample timetables');
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
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Timetables - Computer Science</h1>
        {user?.role === 'admin' && (
          <div className="flex space-x-2">
            <button
              onClick={createSampleTimetable}
              className="btn-secondary flex items-center gap-2"
            >
              <Clock className="h-4 w-4" />
              Create Sample Timetables
            </button>
          </div>
        )}
      </div>

      {/* Semester Filter - Only show for admin and faculty */}
      {user?.role !== 'student' && (
        <div className="card">
          <div className="flex items-center space-x-4">
            <label className="text-sm font-medium text-gray-700">Select Semester:</label>
            <select
              className="input-field max-w-xs"
              value={selectedTimetable?.semester || ''}
              onChange={(e) => {
                const semester = parseInt(e.target.value);
                const timetable = timetables.find(t => t.semester === semester);
                setSelectedTimetable(timetable);
              }}
            >
              <option value="">All Semesters</option>
              {[1,2,3,4,5,6,7,8].map(sem => (
                <option key={sem} value={sem}>Semester {sem}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Timetables List - Only show for admin and faculty */}
      {!selectedTimetable && user?.role !== 'student' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {timetables.map((timetable) => (
            <div key={timetable._id} className="card hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-gray-900">Semester {timetable.semester}</h3>
                  <p className="text-sm text-gray-600">{timetable.academicYear}</p>
                </div>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => handleDelete(timetable._id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedTimetable(timetable)}
                className="w-full btn-primary text-sm"
              >
                View Timetable
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Selected Timetable View */}
      {selectedTimetable && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {user?.role === 'student' ? `My Timetable - Semester ${selectedTimetable.semester}` : `Semester ${selectedTimetable.semester} - ${selectedTimetable.academicYear}`}
            </h2>
            {user?.role !== 'student' && (
              <button
                onClick={() => setSelectedTimetable(null)}
                className="btn-secondary"
              >
                Back to All Timetables
              </button>
            )}
          </div>

          <div className="card overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Time</th>
                  {days.map(day => (
                    <th key={day} className="text-left py-3 px-4 font-medium text-gray-900 min-w-[150px]">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {timeSlots.map((slot, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-700">
                      {slot.start} - {slot.end}
                    </td>
                    {days.map(day => {
                      const daySchedule = selectedTimetable.schedule.find(s => s.day === day);
                      const period = daySchedule?.periods.find(p => 
                        p.startTime === slot.start && p.endTime === slot.end
                      );
                      
                      return (
                        <td key={day} className="py-3 px-4">
                          {period ? (
                            <div className="space-y-1">
                              <div className={`inline-block px-2 py-1 rounded text-xs font-medium ${getTypeColor(period.type)}`}>
                                {period.subject}
                              </div>
                              <div className="text-xs text-gray-600">
                                {period.room}
                              </div>
                              <div className="text-xs text-gray-500 capitalize">
                                {period.type}
                              </div>
                            </div>
                          ) : (
                            <div className="text-gray-400 text-sm">-</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="card">
            <h3 className="font-medium text-gray-900 mb-3">Legend</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 rounded"></div>
                <span className="text-sm text-gray-700">Lecture</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-100 rounded"></div>
                <span className="text-sm text-gray-700">Lab</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-yellow-100 rounded"></div>
                <span className="text-sm text-gray-700">Tutorial</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {timetables.length === 0 && (
        <div className="card text-center py-12">
          <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Timetables Found</h3>
          <p className="text-gray-600 mb-4">
            No timetables have been created for Computer Science department yet.
          </p>
          {user?.role === 'admin' && (
            <button
              onClick={createSampleTimetable}
              className="btn-primary"
            >
              Create Sample Timetables
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Timetables;