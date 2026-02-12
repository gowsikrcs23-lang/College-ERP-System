const Timetable = require('../models/Timetable');

const createTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.create(req.body);
    res.status(201).json({
      message: 'Timetable created successfully',
      timetable
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTimetables = async (req, res) => {
  try {
    const { department, semester } = req.query;
    const filter = {};
    
    if (department) filter.department = department;
    if (semester) filter.semester = semester;

    const timetables = await Timetable.find(filter)
      .populate('schedule.periods.faculty', 'firstName lastName');

    res.json(timetables);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getTimetableById = async (req, res) => {
  try {
    const timetable = await Timetable.findById(req.params.id)
      .populate('schedule.periods.faculty', 'firstName lastName');

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    res.json(timetable);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('schedule.periods.faculty', 'firstName lastName');

    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    res.json({
      message: 'Timetable updated successfully',
      timetable
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findByIdAndDelete(req.params.id);
    
    if (!timetable) {
      return res.status(404).json({ message: 'Timetable not found' });
    }

    res.json({ message: 'Timetable deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTimetable,
  getTimetables,
  getTimetableById,
  updateTimetable,
  deleteTimetable
};