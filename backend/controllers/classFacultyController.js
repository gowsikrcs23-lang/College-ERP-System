const ClassFacultyAssignment = require('../models/ClassFacultyAssignment');
const Faculty = require('../models/Faculty');

exports.getClassFacultyAssignments = async (req, res) => {
  try {
    const { department, semester } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = parseInt(semester, 10);

    const assignments = await ClassFacultyAssignment.find(filter)
      .populate('faculty', 'firstName lastName facultyId department')
      .sort({ department: 1, semester: 1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.setClassFacultyAssignment = async (req, res) => {
  try {
    const { department, semester, facultyId } = req.body;

    if (!department || !semester || !facultyId) {
      return res.status(400).json({ message: 'Department, semester, and faculty are required.' });
    }

    const faculty = await Faculty.findById(facultyId).select('department');
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found.' });
    }

    if (faculty.department !== department) {
      return res.status(400).json({ message: 'Selected faculty does not belong to this department.' });
    }

    const assignment = await ClassFacultyAssignment.findOneAndUpdate(
      { department, semester: parseInt(semester, 10) },
      { faculty: facultyId },
      { new: true, upsert: true }
    ).populate('faculty', 'firstName lastName facultyId department');

    res.json({ message: 'Class faculty assigned successfully', assignment });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Class faculty already assigned for this department and semester.' });
    }
    res.status(500).json({ message: error.message });
  }
};
