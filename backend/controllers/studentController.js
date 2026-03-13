const Student = require('../models/Student');
const User = require('../models/User');
const Faculty = require('../models/Faculty');

const studentUserProjection = 'email isActive isEmailBlocked emailBlockCount emailBlockedAt emailBlockReason emailBlockHistory unblockApprovedByFaculty unblockApprovedAt';

const getFacultyDepartment = async (req) => {
  if (req.user?.role !== 'faculty') return null;

  const facultyProfile = await Faculty.findById(req.user.profile).select('department');
  if (!facultyProfile) {
    const error = new Error('Faculty profile not found');
    error.statusCode = 403;
    throw error;
  }

  return facultyProfile.department;
};

const getAllStudents = async (req, res) => {
  try {
    const facultyDepartment = await getFacultyDepartment(req);
    const query = facultyDepartment ? { department: facultyDepartment } : {};
    const students = await Student.find(query).populate('user', studentUserProjection);
    res.json(students);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('user', studentUserProjection);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    const facultyDepartment = await getFacultyDepartment(req);
    if (facultyDepartment && student.department !== facultyDepartment) {
      return res.status(403).json({ message: 'You can access only students from your department' });
    }
    res.json(student);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const createStudent = async (req, res) => {
  try {
    const { email, password, ...studentData } = req.body;
    const facultyDepartment = await getFacultyDepartment(req);

    if (facultyDepartment && studentData.department !== facultyDepartment) {
      return res.status(403).json({ message: 'You can create students only in your department' });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists. Please use a different email.' });
    }

    const user = await User.create({
      email,
      password,
      role: 'student'
    });

    const student = await Student.create({
      ...studentData,
      email,
      user: user._id
    });

    user.profile = student._id;
    await user.save();

    res.status(201).json({
      message: 'Student created successfully',
      student: await Student.findById(student._id).populate('user', studentUserProjection)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists. Please use a different email.' });
    }
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const existingStudent = await Student.findById(req.params.id);
    if (!existingStudent) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const facultyDepartment = await getFacultyDepartment(req);
    if (facultyDepartment) {
      if (existingStudent.department !== facultyDepartment) {
        return res.status(403).json({ message: 'You can update only students from your department' });
      }

      if (req.body.department && req.body.department !== facultyDepartment) {
        return res.status(403).json({ message: 'You cannot move students to another department' });
      }
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', studentUserProjection);

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      message: 'Student updated successfully',
      student
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const facultyDepartment = await getFacultyDepartment(req);
    if (facultyDepartment && student.department !== facultyDepartment) {
      return res.status(403).json({ message: 'You can delete only students from your department' });
    }

    await User.findByIdAndDelete(student.user);
    await Student.findByIdAndDelete(req.params.id);

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const getStudentsByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const facultyDepartment = await getFacultyDepartment(req);
    if (facultyDepartment && facultyDepartment !== department) {
      return res.status(403).json({ message: 'You can access only your department students' });
    }
    const students = await Student.find({ department }).populate('user', studentUserProjection);
    res.json(students);
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const blockStudentMail = async (req, res) => {
  try {
    const reason = String(req.body?.reason || '').trim();
    if (!reason) {
      return res.status(400).json({ message: 'Block reason is required' });
    }

    const student = await Student.findById(req.params.id).populate('user');
    if (!student || !student.user) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const user = student.user;
    if (user.isEmailBlocked) {
      return res.status(400).json({ message: 'Student email is already blocked' });
    }

    user.isEmailBlocked = true;
    user.emailBlockCount = (user.emailBlockCount || 0) + 1;
    user.emailBlockedAt = new Date();
    user.emailBlockReason = reason;
    user.emailBlockedBy = req.user.id;
    user.emailBlockHistory = Array.isArray(user.emailBlockHistory) ? user.emailBlockHistory : [];
    user.emailBlockHistory.push({
      reason,
      blockedAt: new Date(),
      blockedBy: req.user.id
    });
    user.unblockApprovedByFaculty = false;
    user.unblockApprovedAt = null;
    user.unblockApprovedBy = null;
    student.bio = student.bio || {};
    student.bio.mailBlockReason = reason;
    await user.save();
    await student.save();

    const updatedStudent = await Student.findById(req.params.id).populate('user', studentUserProjection);
    res.json({
      message: 'Student email blocked successfully',
      student: updatedStudent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveStudentMailUnblock = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('user');
    if (!student || !student.user) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.user.isEmailBlocked) {
      return res.status(400).json({ message: 'Student email is not blocked' });
    }

    const facultyProfile = await Faculty.findById(req.user.profile);
    if (!facultyProfile) {
      return res.status(403).json({ message: 'Faculty profile not found' });
    }

    if (facultyProfile.department !== student.department) {
      return res.status(403).json({ message: 'You can approve only students from your department' });
    }

    student.user.unblockApprovedByFaculty = true;
    student.user.unblockApprovedAt = new Date();
    student.user.unblockApprovedBy = req.user.id;
    if (Array.isArray(student.user.emailBlockHistory) && student.user.emailBlockHistory.length > 0) {
      const latest = student.user.emailBlockHistory[student.user.emailBlockHistory.length - 1];
      if (latest && !latest.unblockedAt) {
        latest.facultyApprovedAt = new Date();
        latest.facultyApprovedBy = req.user.id;
        latest.facultyApprovedByName = `${facultyProfile.firstName} ${facultyProfile.lastName}`.trim();
        latest.facultyApprovedByFacultyId = facultyProfile.facultyId;
      }
    }
    await student.user.save();

    const updatedStudent = await Student.findById(req.params.id).populate('user', studentUserProjection);
    res.json({
      message: 'Unblock approved by faculty',
      student: updatedStudent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const unblockStudentMail = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('user');
    if (!student || !student.user) {
      return res.status(404).json({ message: 'Student not found' });
    }

    if (!student.user.isEmailBlocked) {
      return res.status(400).json({ message: 'Student email is not blocked' });
    }

    if (!student.user.unblockApprovedByFaculty) {
      return res.status(400).json({ message: 'Faculty approval is required before unblocking' });
    }

    student.user.isEmailBlocked = false;
    student.user.emailBlockedAt = null;
    student.user.emailBlockReason = null;
    student.user.emailBlockedBy = null;
    student.user.unblockApprovedByFaculty = false;
    student.user.unblockApprovedAt = null;
    student.user.unblockApprovedBy = null;
    student.bio = student.bio || {};
    student.bio.mailBlockReason = '';
    if (Array.isArray(student.user.emailBlockHistory) && student.user.emailBlockHistory.length > 0) {
      const latest = student.user.emailBlockHistory[student.user.emailBlockHistory.length - 1];
      if (latest && !latest.unblockedAt) {
        latest.unblockedAt = new Date();
        latest.unblockedBy = req.user.id;
      }
    }
    await student.user.save();
    await student.save();

    const updatedStudent = await Student.findById(req.params.id).populate('user', studentUserProjection);
    res.json({
      message: 'Student email unblocked successfully',
      student: updatedStudent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const clearStudentMailBlockCount = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('user');
    if (!student || !student.user) {
      return res.status(404).json({ message: 'Student not found' });
    }

    student.user.emailBlockCount = 0;
    await student.user.save();

    const updatedStudent = await Student.findById(req.params.id).populate('user', studentUserProjection);
    res.json({
      message: 'Mail block count cleared successfully',
      student: updatedStudent
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  getStudentsByDepartment,
  blockStudentMail,
  approveStudentMailUnblock,
  unblockStudentMail,
  clearStudentMailBlockCount
};
