const ExamSchedule = require('../models/ExamSchedule');

const createExamSchedule = async (req, res) => {
  try {
    const schedule = await ExamSchedule.create(req.body);
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
    const { department, semester, examType } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = parseInt(semester);
    if (examType) filter.examType = examType;

    const schedules = await ExamSchedule.find(filter).sort({ createdAt: -1 });
    res.json(schedules);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getExamScheduleById = async (req, res) => {
  try {
    const schedule = await ExamSchedule.findById(req.params.id);
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
    const schedule = await ExamSchedule.findByIdAndUpdate(
      req.params.id,
      req.body,
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