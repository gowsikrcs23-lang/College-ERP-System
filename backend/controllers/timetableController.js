const Timetable = require('../models/Timetable');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

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
    const { department, semester, subject } = req.query;
    const filter = {};

    if (req.user.role === 'student') {
      const studentProfile = await Student.findById(req.user.profile).select('department semester');
      if (!studentProfile) {
        return res.status(404).json({ message: 'Student profile not found' });
      }
      filter.department = studentProfile.department;
      filter.semester = studentProfile.semester;
    } else if (req.user.role === 'faculty') {
      const facultyProfile = await Faculty.findById(req.user.profile).select('department');
      if (!facultyProfile) {
        return res.status(404).json({ message: 'Faculty profile not found' });
      }
      // Faculty can teach across departments; apply optional filters only.
      if (department) filter.department = department;
      if (semester) filter.semester = Number(semester);
    } else {
      if (department) filter.department = department;
      if (semester) filter.semester = Number(semester);
    }

    let timetables = await Timetable.find(filter)
      .populate('schedule.periods.faculty', 'firstName lastName');

    if (subject) {
      const normalizedSubject = String(subject).trim().toLowerCase();
      timetables = timetables.filter((tt) =>
        (tt.schedule || []).some((day) =>
          (day.periods || []).some((period) =>
            String(period.subject || '').trim().toLowerCase() === normalizedSubject
          )
        )
      );
    }

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
