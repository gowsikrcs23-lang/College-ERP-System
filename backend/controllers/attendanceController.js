const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

const markAttendance = async (req, res) => {
  try {
    const { students, fn, session, date, semester, department } = req.body;
    const faculty = req.user.profile;

    const attendanceRecords = students.map(student => ({
      student: student.studentId,
      fn,
      session,
      faculty,
      date,
      status: student.status,
      semester,
      department
    }));

    await Attendance.insertMany(attendanceRecords);

    res.status(201).json({
      message: 'Attendance marked successfully',
      count: attendanceRecords.length
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Attendance already marked for this date, fn and session' 
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
    const presentClasses = attendance.filter(a => a.status === 'present').length;
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
    if (semester) filter.semester = semester;
    if (fn) filter.fn = fn;
    if (session) filter.session = session;
    if (date) filter.date = new Date(date);

    const attendance = await Attendance.find(filter)
      .populate('student', 'firstName lastName studentId fn')
      .populate('faculty', 'firstName lastName')
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
            name: { $concat: ['$studentInfo.firstName', ' ', '$studentInfo.lastName'] }
          },
          totalClasses: { $sum: 1 },
          presentClasses: {
            $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          studentId: '$_id.student',
          fn: '$_id.fn',
          name: '$_id.name',
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
      { $sort: { fn: 1 } }
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
    
    const attendance = await Attendance.findByIdAndDelete(id);
    
    if (!attendance) {
      return res.status(404).json({ message: 'Attendance record not found' });
    }
    
    res.json({ message: 'Attendance deleted successfully' });
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
  deleteAttendance
};