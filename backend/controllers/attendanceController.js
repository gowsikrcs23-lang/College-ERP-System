const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const AttendanceRequest = require('../models/AttendanceRequest');
const ClassFacultyAssignment = require('../models/ClassFacultyAssignment');
const Faculty = require('../models/Faculty');

const ATTENDED_STATUSES = new Set(['present', 'od', 'late']);
const STAFF_ROLES = new Set(['admin', 'management', 'hod', 'faculty', 'accountant', 'admission']);

const getAssignedFacultyId = async ({ department, semester }) => {
  if (!department || !semester) return null;
  const assignment = await ClassFacultyAssignment.findOne({
    department,
    semester: parseInt(semester, 10)
  }).lean();

  return assignment?.faculty || null;
};

const markAttendance = async (req, res) => {
  try {
    const { students, fn, session, date, semester, department } = req.body;
    if (!STAFF_ROLES.has(req.user.role)) {
      return res.status(403).json({ message: 'Only staff can submit attendance.' });
    }

    if (!students?.length) {
      return res.status(400).json({ message: 'No students provided for attendance.' });
    }

    const semesterValue = parseInt(semester, 10);
    const assignedFaculty = await getAssignedFacultyId({ department, semester: semesterValue });
    if (!assignedFaculty) {
      return res.status(400).json({ message: 'No class faculty assigned for this department and semester.' });
    }

    const attendanceDate = new Date(date);
    const existingAttendance = await Attendance.findOne({
      department,
      semester: semesterValue,
      session,
      date: attendanceDate
    }).lean();

    if (existingAttendance) {
      return res.status(400).json({ message: 'Attendance already marked for this class and date.' });
    }

    const existingRequest = await AttendanceRequest.findOne({
      department,
      semester: semesterValue,
      session,
      date: attendanceDate,
      assignedFaculty,
      status: 'pending'
    }).lean();

    if (existingRequest) {
      return res.status(400).json({ message: 'Attendance request already pending for this class and date.' });
    }

    const isAssignedFaculty = req.user.role === 'faculty' && String(req.user.profile) === String(assignedFaculty);
    let requesterName = req.user?.email || '';
    let requesterFacultyId = '';
    if (req.user.role === 'faculty') {
      const requesterFaculty = await Faculty.findById(req.user.profile).select('firstName lastName facultyId');
      if (requesterFaculty) {
        requesterName = `${requesterFaculty.firstName} ${requesterFaculty.lastName}`.trim();
        requesterFacultyId = requesterFaculty.facultyId || '';
      }
    }

    if (isAssignedFaculty) {
      const attendanceRecords = students.map(student => ({
        student: student.studentId,
        fn,
        session,
        faculty: assignedFaculty,
        requestedBy: req.user._id,
        requestedByName: requesterName,
        requestedByFacultyId: requesterFacultyId,
        date,
        status: student.status,
        semester: semesterValue,
        department
      }));

      await Attendance.insertMany(attendanceRecords);

      return res.status(201).json({
        message: 'Attendance marked successfully',
        count: attendanceRecords.length
      });
    }

    const attendanceRequest = await AttendanceRequest.create({
      department,
      semester: semesterValue,
      session,
      date: attendanceDate,
      students: students.map(student => ({
        student: student.studentId,
        status: student.status
      })),
      requestedBy: req.user._id,
      requestedByName: requesterName,
      requestedByFacultyId: requesterFacultyId,
      assignedFaculty
    });

    res.status(201).json({
      message: 'Attendance request sent for faculty approval',
      requestId: attendanceRequest._id
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Attendance already marked or pending for this class and date.' 
      });
    }
    res.status(500).json({ message: error.message });
  }
};

const getAttendanceByStudent = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { fn, session, semester } = req.query;

    const filter = { student: studentId };
    if (fn) filter.fn = fn;
    if (session) filter.session = session;
    if (semester) filter.semester = semester;

    const attendance = await Attendance.find(filter)
      .populate('faculty', 'firstName lastName')
      .sort({ date: -1 });

    const totalClasses = attendance.length;
    const presentClasses = attendance.filter(a => ATTENDED_STATUSES.has(a.status)).length;
    const attendancePercentage = totalClasses > 0 ? (presentClasses / totalClasses) * 100 : 0;

    res.json({
      attendance,
      summary: {
        totalClasses,
        presentClasses,
        absentClasses: totalClasses - presentClasses,
        attendancePercentage: Math.round(attendancePercentage * 100) / 100
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAttendanceByClass = async (req, res) => {
  try {
    const { department, semester, fn, session, date } = req.query;

    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = parseInt(semester, 10);
    if (fn) filter.fn = fn;
    if (session) filter.session = session;
    if (date) filter.date = new Date(date);

    const attendance = await Attendance.find(filter)
      .populate('student', 'firstName lastName studentId fn')
      .populate('faculty', 'firstName lastName')
      .populate('requestedBy', 'email role')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAttendanceStats = async (req, res) => {
  try {
    const { department, semester } = req.query;
    
    const matchFilter = {};
    if (department) matchFilter.department = department;
    if (semester) matchFilter.semester = parseInt(semester);

    const stats = await Attendance.aggregate([
      { $match: matchFilter },
      {
        $lookup: {
          from: 'students',
          localField: 'student',
          foreignField: '_id',
          as: 'studentInfo'
        }
      },
      { $unwind: '$studentInfo' },
      {
        $group: {
          _id: {
            student: '$student',
            fn: '$studentInfo.fn',
            name: { $concat: ['$studentInfo.firstName', ' ', '$studentInfo.lastName'] },
            department: '$studentInfo.department'
          },
          totalClasses: { $sum: 1 },
          presentClasses: {
            $sum: { $cond: [{ $in: ['$status', ['present', 'od', 'late']] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          studentId: '$_id.student',
          fn: '$_id.fn',
          name: '$_id.name',
          department: '$_id.department',
          totalClasses: 1,
          presentClasses: 1,
          absentClasses: { $subtract: ['$totalClasses', '$presentClasses'] },
          attendancePercentage: {
            $round: [{
              $multiply: [
                { $divide: ['$presentClasses', '$totalClasses'] },
                100
              ]
            }, 2]
          }
        }
      },
      { $sort: { department: 1, name: 1, fn: 1 } }
    ]);

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const attendanceRecord = await Attendance.findById(id);
    if (!attendanceRecord) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (!STAFF_ROLES.has(req.user.role)) {
      return res.status(403).json({ message: 'Only staff can update attendance records.' });
    }

    const attendance = await Attendance.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('student', 'firstName lastName studentId fn');

    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    res.json({
      message: 'Attendance updated successfully',
      attendance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    
    const attendanceRecord = await Attendance.findById(id);
    if (!attendanceRecord) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }

    if (!STAFF_ROLES.has(req.user.role)) {
      return res.status(403).json({ message: 'Only staff can delete attendance records.' });
    }

    const attendance = await Attendance.findByIdAndDelete(id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.json({ message: 'Attendance deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAttendanceRequests = async (req, res) => {
  try {
    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can view attendance requests.' });
    }

    const { status } = req.query;
    const filter = { assignedFaculty: req.user.profile };
    if (status) filter.status = status;

    const requests = await AttendanceRequest.find(filter)
      .populate('requestedBy', 'email role')
      .populate('students.student', 'firstName lastName studentId fn')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveAttendanceRequest = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can approve attendance requests.' });
    }

    const request = await AttendanceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Attendance request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Attendance request already ${request.status}.` });
    }

    if (String(request.assignedFaculty) !== String(req.user.profile)) {
      return res.status(403).json({ message: 'This request is not assigned to you.' });
    }

    const facultyProfile = await Faculty.findById(req.user.profile).select('firstName lastName facultyId');

    const studentIds = request.students.map((entry) => entry.student);
    const studentRecords = await Student.find({ _id: { $in: studentIds } }).select('fn');
    const fnMap = new Map(studentRecords.map((student) => [String(student._id), student.fn]));

    const attendanceRecords = request.students.map((entry) => ({
      student: entry.student,
      fn: fnMap.get(String(entry.student)) || 'FN001',
      session: request.session,
      faculty: request.assignedFaculty,
      requestedBy: request.requestedBy,
      requestedByName: request.requestedByName || '',
      requestedByFacultyId: request.requestedByFacultyId || '',
      date: request.date,
      status: entry.status,
      semester: request.semester,
      department: request.department
    }));

    await Attendance.insertMany(attendanceRecords);

    request.status = 'approved';
    request.approvedBy = req.user._id;
    request.approvedAt = new Date();
    request.approvedByName = facultyProfile
      ? `${facultyProfile.firstName} ${facultyProfile.lastName}`.trim()
      : '';
    request.approvedByFacultyId = facultyProfile?.facultyId || '';
    await request.save();

    res.json({ message: 'Attendance request approved and marked.', count: attendanceRecords.length });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Attendance already marked for this class and date.' });
    }
    res.status(500).json({ message: error.message });
  }
};

const rejectAttendanceRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (req.user.role !== 'faculty') {
      return res.status(403).json({ message: 'Only faculty can reject attendance requests.' });
    }

    const request = await AttendanceRequest.findById(id);
    if (!request) {
      return res.status(404).json({ message: 'Attendance request not found' });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({ message: `Attendance request already ${request.status}.` });
    }

    if (String(request.assignedFaculty) !== String(req.user.profile)) {
      return res.status(403).json({ message: 'This request is not assigned to you.' });
    }

    const facultyProfile = await Faculty.findById(req.user.profile).select('firstName lastName facultyId');

    request.status = 'rejected';
    request.rejectedBy = req.user._id;
    request.rejectedAt = new Date();
    request.rejectionReason = reason || '';
    request.rejectedByName = facultyProfile
      ? `${facultyProfile.firstName} ${facultyProfile.lastName}`.trim()
      : '';
    request.rejectedByFacultyId = facultyProfile?.facultyId || '';
    await request.save();

    res.json({ message: 'Attendance request rejected.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getMyAttendanceRequests = async (req, res) => {
  try {
    if (!STAFF_ROLES.has(req.user.role)) {
      return res.status(403).json({ message: 'Only staff can view attendance requests.' });
    }

    const { status } = req.query;
    const filter = { requestedBy: req.user._id };
    if (status) filter.status = status;

    const requests = await AttendanceRequest.find(filter)
      .populate('assignedFaculty', 'firstName lastName facultyId')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  markAttendance,
  getAttendanceByStudent,
  getAttendanceByClass,
  getAttendanceStats,
  updateAttendance,
  deleteAttendance,
  getAttendanceRequests,
  approveAttendanceRequest,
  rejectAttendanceRequest,
  getMyAttendanceRequests
};
