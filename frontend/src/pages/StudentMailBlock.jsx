import { useEffect, useState } from 'react';
import { AlertTriangle, BadgeCheck, Hash, ShieldAlert, UserCheck2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';

const StudentMailBlock = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentMailBlock = async () => {
      try {
        const response = await axios.get(`/api/students/${user.profile._id}`);
        setStudent(response.data);
      } catch (error) {
        toast.error('Failed to fetch mail block details');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentMailBlock();
  }, [user.profile._id]);

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

  const getMailBlockHistory = (studentData) => {
    const history = Array.isArray(studentData?.user?.emailBlockHistory)
      ? [...studentData.user.emailBlockHistory]
      : [];

    return history.reverse().map((entry, index) => ({
      id: `${entry.blockedAt || index}-${index}`,
      reason: entry.reason || 'N/A',
      blockedAt: entry.blockedAt ? new Date(entry.blockedAt).toLocaleDateString() : 'N/A',
      approvedBy: entry.facultyApprovedByName || '',
      approvedByFacultyId: entry.facultyApprovedByFacultyId || '',
      approvedAt: entry.facultyApprovedAt ? new Date(entry.facultyApprovedAt).toLocaleDateString() : '',
      unblockedAt: entry.unblockedAt ? new Date(entry.unblockedAt).toLocaleDateString() : ''
    }));
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
        <p className="text-gray-600">Mail block details not found</p>
      </div>
    );
  }

  const latestApproval = getLatestApprovalDetails(student);
  const mailBlockHistory = getMailBlockHistory(student);
  const currentReason = student.bio?.mailBlockReason || student.user?.emailBlockReason || 'N/A';
  const isBlocked = Boolean(student.user?.isEmailBlocked);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(248,113,113,0.18),_transparent_28%),linear-gradient(135deg,_#fff7ed_0%,_#ffffff_46%,_#f8fafc_100%)] p-6 shadow-sm">
        <div className="absolute right-0 top-0 h-40 w-40 -translate-y-10 translate-x-10 rounded-full bg-red-100/60 blur-3xl" aria-hidden="true"></div>
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-red-700">
              <ShieldAlert className="h-3.5 w-3.5" />
              Student Mail Control
            </div>
            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">Mail Block Overview</h1>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              A dedicated view for your mail restriction record, current reason, faculty approval, and full block history.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-2xl border border-red-200 bg-white/90 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-red-600">Status</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{isBlocked ? 'Blocked' : 'Active'}</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-white/90 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-600">Count</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{student.user?.emailBlockCount || 0}</p>
            </div>
            <div className="rounded-2xl border border-blue-200 bg-white/90 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-blue-600">Student ID</p>
              <p className="mt-2 text-lg font-bold text-slate-950">{student.studentId}</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-white/90 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-600">Faculty</p>
              <p className="mt-2 text-sm font-bold text-slate-950 break-words">
                {latestApproval.facultyId || 'Pending'}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.25fr_0.95fr]">
        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-red-100 p-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Current Reason</p>
              <h2 className="text-lg font-bold text-slate-950">Why the mail was restricted</h2>
            </div>
          </div>
          <div className="mt-5 rounded-[1.25rem] border border-red-100 bg-gradient-to-br from-red-50 to-orange-50 p-5">
            <p className="text-base font-semibold leading-7 text-slate-900 break-words">{currentReason}</p>
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-100 p-3">
              <UserCheck2 className="h-5 w-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Faculty Approval</p>
              <h2 className="text-lg font-bold text-slate-950">Approved by</h2>
            </div>
          </div>
          <div className="mt-5 rounded-[1.25rem] border border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50 p-5">
            <p className="text-lg font-bold text-slate-950 break-words">
              {latestApproval.facultyName || 'Pending / N/A'}
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-sm font-medium text-emerald-800">
              <Hash className="h-4 w-4" />
              {latestApproval.facultyId || 'ID N/A'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-[1.4rem] border border-red-200 bg-red-50 p-5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-red-600" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-red-700">Mail Status</p>
          </div>
          <p className="mt-3 text-2xl font-black text-red-950">{isBlocked ? 'Blocked' : 'Active'}</p>
        </div>
        <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-4 w-4 text-amber-600" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">Block Count</p>
          </div>
          <p className="mt-3 text-2xl font-black text-amber-950">{student.user?.emailBlockCount || 0}</p>
        </div>
        <div className="rounded-[1.4rem] border border-sky-200 bg-sky-50 p-5">
          <div className="flex items-center gap-2">
            <Hash className="h-4 w-4 text-sky-600" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">Student</p>
          </div>
          <p className="mt-3 text-lg font-black text-sky-950">{student.firstName} {student.lastName}</p>
          <p className="mt-1 text-sm font-medium text-sky-800">{student.studentId}</p>
        </div>
      </div>

      <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">History</p>
            <h2 className="text-xl font-bold text-slate-950">Mail Block Timeline</h2>
          </div>
          <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            {mailBlockHistory.length} record{mailBlockHistory.length === 1 ? '' : 's'}
          </div>
        </div>
        {mailBlockHistory.length > 0 ? (
          <div className="space-y-4">
            {mailBlockHistory.map((entry, index) => (
              <div key={entry.id} className="relative overflow-hidden rounded-[1.25rem] border border-slate-200 bg-[linear-gradient(135deg,_#ffffff_0%,_#f8fafc_100%)] p-5">
                <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-red-400 via-amber-400 to-emerald-400" aria-hidden="true"></div>
                <div className="pl-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-bold text-white">
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-950">Mail Block Entry {index + 1}</p>
                        <p className="text-xs text-slate-500">Blocked on {entry.blockedAt}</p>
                      </div>
                    </div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                      {entry.unblockedAt || 'Still blocked / N/A'}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-red-100 bg-red-50/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-700">Reason</p>
                      <p className="mt-2 text-sm font-medium leading-6 text-slate-900 break-words">{entry.reason}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700">Approved By Faculty</p>
                      <p className="mt-2 text-sm font-semibold text-slate-900 break-words">
                        {entry.approvedBy
                          ? `${entry.approvedBy} (${entry.approvedByFacultyId || 'ID N/A'})`
                          : 'Pending / N/A'}
                      </p>
                      <p className="mt-2 text-xs text-slate-500">Approved At: {entry.approvedAt || 'Pending / N/A'}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.25rem] border border-dashed border-slate-300 bg-slate-50 p-8 text-sm text-slate-500">
            No mail block history available.
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentMailBlock;
