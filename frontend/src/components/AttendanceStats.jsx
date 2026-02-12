import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../utils/api';
import { Users, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

const AttendanceStats = ({ department, semester }) => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAttendanceStats();
  }, [department, semester]);

  const fetchAttendanceStats = async () => {
    try {
      setLoading(true);
      const params = {};
      if (department) params.department = department;
      if (semester) params.semester = semester;
      
      const response = await attendanceAPI.getStats(params);
      setStats(response.data);
    } catch (error) {
      setError('Failed to fetch attendance statistics');
      console.error('Error fetching attendance stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 75) return 'text-green-600 bg-green-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getAttendanceIcon = (percentage) => {
    if (percentage >= 75) return <TrendingUp className="w-5 h-5" />;
    return <TrendingDown className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-8 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (stats.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No attendance data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Attendance Overview</h3>
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{stats.length} Students</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((student) => (
          <div key={student.studentId} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="font-semibold text-gray-900">{student.name}</h4>
                <p className="text-sm text-gray-600">FN: {student.fn}</p>
              </div>
              <div className={`p-2 rounded-full ${getAttendanceColor(student.attendancePercentage)}`}>
                {getAttendanceIcon(student.attendancePercentage)}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Attendance</span>
                <span className={`text-lg font-bold ${getAttendanceColor(student.attendancePercentage).split(' ')[0]}`}>
                  {student.attendancePercentage}%
                </span>
              </div>

              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    student.attendancePercentage >= 75 
                      ? 'bg-green-500' 
                      : student.attendancePercentage >= 60 
                      ? 'bg-yellow-500' 
                      : 'bg-red-500'
                  }`}
                  style={{ width: `${student.attendancePercentage}%` }}
                ></div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Present</p>
                  <p className="font-semibold text-green-600">{student.presentClasses}</p>
                </div>
                <div>
                  <p className="text-gray-600">Absent</p>
                  <p className="font-semibold text-red-600">{student.absentClasses}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total Classes</span>
                  <span className="font-semibold">{student.totalClasses}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttendanceStats;