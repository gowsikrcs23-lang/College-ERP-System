import { useEffect, useMemo, useState } from 'react';
import { ShieldCheck, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import { studentsAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const MailUnblock = () => {
  const { user } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState('');
  const [studentMetrics, setStudentMetrics] = useState({});

  const isManagement = user?.role === 'management';
  const isFaculty = user?.role === 'faculty';

  const normalizeExamEntries = (rawExams = [], rawResults = []) => {
    const examsFromExamModule = (Array.isArray(rawExams) ? rawExams : []).map((exam) => ({
      marksObtained: Number(exam.marksObtained ?? exam.obtainedMarks ?? exam.marks ?? 0),
      totalMarks: Number(exam.totalMarks ?? exam.maxMarks ?? 100)
    }));

    const examsFromResultsModule = (Array.isArray(rawResults) ? rawResults : []).flatMap((result) => {
      const subjects = Array.isArray(result.subjects) ? result.subjects : [];
      return subjects.map((subject) => ({
        marksObtained: Number(subject.marks ?? subject.marksObtained ?? subject.obtainedMarks ?? 0),
        totalMarks: Number(subject.maxMarks ?? result.maxMarks ?? 100)
      }));
    });

    return [...examsFromExamModule, ...examsFromResultsModule];
  };

  const fetchStudentMetrics = async (studentId) => {
    const [attendanceRes, examsRes, resultsRes] = await Promise.allSettled([
      axios.get(`/api/attendance/student/${studentId}`),
      axios.get(`/api/exams/student/${studentId}/results`),
      axios.get(`/api/results/student/${studentId}`)
    ]);

    const attendanceData = attendanceRes.status === 'fulfilled'
      ? (attendanceRes.value.data?.attendance || [])
      : [];
    const examsData = normalizeExamEntries(
      examsRes.status === 'fulfilled' ? examsRes.value.data : [],
      resultsRes.status === 'fulfilled' ? resultsRes.value.data : []
    );

    const present = attendanceData.filter((a) => a.status === 'present' || a.status === 'P').length;
    const attendancePercentage = attendanceData.length > 0
      ? Math.round((present / attendanceData.length) * 100)
      : 0;

    const totalMarks = examsData.reduce((sum, exam) => sum + exam.marksObtained, 0);
    const totalMaxMarks = examsData.reduce((sum, exam) => sum + exam.totalMarks, 0);
    const averageMarks = totalMaxMarks > 0 ? ((totalMarks / totalMaxMarks) * 100).toFixed(1) : '0.0';

    return {
      attendancePercentage,
      averageMarks
    };
  };

  const fetchBlockedStudents = async () => {
    try {
      setLoading(true);
      const response = await studentsAPI.getAll();
      const allStudents = Array.isArray(response.data) ? response.data : [];
      const blockedStudents = allStudents.filter((student) => student.user?.isEmailBlocked);
      setStudents(blockedStudents);

      const metricsEntries = await Promise.all(
        blockedStudents.map(async (student) => {
          try {
            const metrics = await fetchStudentMetrics(student._id);
            return [student._id, metrics];
          } catch (error) {
            return [student._id, { attendancePercentage: 0, averageMarks: '0.0' }];
          }
        })
      );
      setStudentMetrics(Object.fromEntries(metricsEntries));
    } catch (error) {
      toast.error('Failed to fetch blocked students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedStudents();
  }, []);

  const visibleStudents = useMemo(() => {
    const query = searchTerm.toLowerCase().trim();
    const scopedStudents = isFaculty
      ? students.filter((student) => student.department === user?.profile?.department)
      : students;

    if (!query) return scopedStudents;

    return scopedStudents.filter((student) => {
      const fullName = `${student.firstName || ''} ${student.lastName || ''}`.toLowerCase();
      const regNo = (student.bio?.registrationNumber || '').toLowerCase();
      const studentId = (student.studentId || '').toLowerCase();
      return fullName.includes(query) || regNo.includes(query) || studentId.includes(query);
    });
  }, [students, searchTerm, isFaculty, user?.profile?.department]);

  const getAllBlockReasons = (student) => {
    const history = Array.isArray(student?.user?.emailBlockHistory) ? student.user.emailBlockHistory : [];
    if (history.length === 0) return [];
    return [...history]
      .reverse()
      .map((entry, idx) => ({
        id: `${entry.blockedAt || idx}-${idx}`,
        text: entry.reason,
        date: entry.blockedAt ? new Date(entry.blockedAt).toLocaleDateString() : ''
      }));
  };

  const handleApprove = async (studentId) => {
    try {
      setActionLoadingId(studentId);
      await studentsAPI.approveUnblock(studentId);
      toast.success('Unblock approved');
      await fetchBlockedStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve unblock');
    } finally {
      setActionLoadingId('');
    }
  };

  const handleUnblock = async (studentId) => {
    try {
      setActionLoadingId(studentId);
      await studentsAPI.unblockMail(studentId);
      toast.success('Mail unblocked successfully');
      await fetchBlockedStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to unblock mail');
    } finally {
      setActionLoadingId('');
    }
  };

  const handleClearCount = async (studentId) => {
    if (!window.confirm('Clear mail block count for this student?')) return;

    try {
      setActionLoadingId(studentId);
      await studentsAPI.clearMailBlockCount(studentId);
      toast.success('Mail block count cleared successfully');
      await fetchBlockedStudents();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to clear mail block count');
    } finally {
      setActionLoadingId('');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mail Unblock</h1>
        <ShieldCheck className="h-6 w-6 text-primary-600" />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
        <input
          type="text"
          className="input-field pl-10"
          placeholder="Search by name, reg no, or student ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="card">
        <div className="space-y-3 p-4">
          {visibleStudents.map((student) => (
            <div key={student._id} className="border rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="font-semibold text-gray-900">
                  {student.firstName} {student.lastName} ({student.studentId})
                </p>
                <p className="text-sm text-gray-600">
                  Reg No: {student.bio?.registrationNumber || 'N/A'} | Dept: {student.department}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Block Count: {student.user?.emailBlockCount || 0} | Faculty Approval: {student.user?.unblockApprovedByFaculty ? 'Approved' : 'Pending'}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Attendance: {studentMetrics[student._id]?.attendancePercentage ?? 0}% | Avg Marks: {studentMetrics[student._id]?.averageMarks ?? '0.0'}%
                </p>
                <div className="mt-2">
                  <p className="text-xs font-medium text-gray-600">All Past Reasons:</p>
                  {getAllBlockReasons(student).length > 0 ? (
                    <div className="mt-1 space-y-1">
                      {getAllBlockReasons(student).map((item, idx) => (
                        <p key={item.id} className="text-xs text-gray-500">
                          {idx + 1}. {item.text}{item.date ? ` (${item.date})` : ''}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-gray-500">No past reasons</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isFaculty && !student.user?.unblockApprovedByFaculty && (
                  <button
                    type="button"
                    disabled={actionLoadingId === student._id}
                    onClick={() => handleApprove(student._id)}
                    className="px-3 py-1.5 text-sm rounded bg-amber-600 text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    Approve Unblock
                  </button>
                )}

                {isManagement && (
                  <button
                    type="button"
                    disabled={actionLoadingId === student._id || (student.user?.emailBlockCount || 0) === 0}
                    onClick={() => handleClearCount(student._id)}
                    className="px-3 py-1.5 text-sm rounded bg-red-100 text-red-700 hover:bg-red-200 disabled:opacity-50"
                  >
                    Clear Count
                  </button>
                )}

                {isManagement && (
                  <button
                    type="button"
                    disabled={actionLoadingId === student._id || !student.user?.unblockApprovedByFaculty}
                    onClick={() => handleUnblock(student._id)}
                    className="px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                    title={!student.user?.unblockApprovedByFaculty ? 'Faculty approval required' : ''}
                  >
                    Unblock Mail
                  </button>
                )}
              </div>
            </div>
          ))}

          {visibleStudents.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No blocked students found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MailUnblock;
