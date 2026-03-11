const ExamSchedule = require('../models/ExamSchedule');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

const createExamSchedule = async (req, res) => {
  try {
    const payload = { ...req.body };
    payload.scheduleFor = payload.scheduleFor || 'all_departments';
    if (payload.scheduleFor === 'all') payload.scheduleFor = 'all_departments';

    if (payload.scheduleFor === 'specific') {
      if (!payload.targetStudent) {
        return res.status(400).json({ message: 'Please select a target student' });
      }
      const student = await Student.findById(payload.targetStudent).select('department semester');
      if (!student) {
        return res.status(404).json({ message: 'Target student not found' });
      }
      payload.department = student.department;
      payload.semester = student.semester;
    } else if (payload.scheduleFor === 'all_departments') {
      payload.department = 'All Departments';
      payload.semester = 0;
      payload.targetStudent = null;
    } else {
      payload.targetStudent = null;
    }

    const schedule = await ExamSchedule.create(payload);
    res.status(201).json({
      message: 'Exam schedule created successfully',
      schedule
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllExamSchedules = async (req, res) => {
  try {
    const { department, semester, examType, scheduleFor, targetStudent } = req.query;
    const filter = {};

    if (req.user.role === 'student') {
      const student = await Student.findById(req.user.profile).select('department semester');
      if (!student) {
        return res.json([]);
      }
      filter.$or = [
        { scheduleFor: 'all_departments' },
        { scheduleFor: 'all', department: student.department, semester: student.semester },
        { scheduleFor: 'specific', targetStudent: student._id }
      ];
    } else if (req.user.role === 'faculty') {
      const faculty = await Faculty.findById(req.user.profile).select('department');
      if (!faculty) {
        return res.json([]);
      }
      filter.$or = [
        { scheduleFor: 'all_departments' },
        { scheduleFor: 'all', department: faculty.department },
        { department: faculty.department }
      ];
    } else {
      if (department) filter.department = department;
      if (semester) filter.semester = parseInt(semester, 10);
      if (scheduleFor) filter.scheduleFor = scheduleFor;
      if (targetStudent) filter.targetStudent = targetStudent;
    }

    if (examType) filter.examType = examType;

    const schedules = await ExamSchedule.find(filter)
      .populate('targetStudent', 'firstName lastName studentId department semester')
      .sort({ createdAt: -1 });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getExamScheduleById = async (req, res) => {
  try {
    const schedule = await ExamSchedule.findById(req.params.id)
      .populate('targetStudent', 'firstName lastName studentId department semester');
    if (!schedule) {
      return res.status(404).json({ message: 'Exam schedule not found' });
    }
    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateExamSchedule = async (req, res) => {
  try {
    const payload = { ...req.body };
    payload.scheduleFor = payload.scheduleFor || 'all_departments';
    if (payload.scheduleFor === 'all') payload.scheduleFor = 'all_departments';

    if (payload.scheduleFor === 'specific') {
      if (!payload.targetStudent) {
        return res.status(400).json({ message: 'Please select a target student' });
      }
      const student = await Student.findById(payload.targetStudent).select('department semester');
      if (!student) {
        return res.status(404).json({ message: 'Target student not found' });
      }
      payload.department = student.department;
      payload.semester = student.semester;
    } else if (payload.scheduleFor === 'all_departments') {
      payload.department = 'All Departments';
      payload.semester = 0;
      payload.targetStudent = null;
    } else {
      payload.targetStudent = null;
    }

    const schedule = await ExamSchedule.findByIdAndUpdate(
      req.params.id,
      payload,
      { new: true, runValidators: true }
    );
    
    if (!schedule) {
      return res.status(404).json({ message: 'Exam schedule not found' });
    }
    
    res.json({
      message: 'Exam schedule updated successfully',
      schedule
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteExamSchedule = async (req, res) => {
  try {
    const schedule = await ExamSchedule.findByIdAndDelete(req.params.id);
    
    if (!schedule) {
      return res.status(404).json({ message: 'Exam schedule not found' });
    }
    
    res.json({ message: 'Exam schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createExamSchedule,
  getAllExamSchedules,
  getExamScheduleById,
  updateExamSchedule,
  deleteExamSchedule
};
