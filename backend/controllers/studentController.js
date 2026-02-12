const Student = require('../models/Student');
const User = require('../models/User');

const getAllStudents = async (req, res) => {
  try {
    const students = await Student.find().populate('user', 'email isActive');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('user', 'email isActive');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json(student);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createStudent = async (req, res) => {
  try {
    const { email, password, ...studentData } = req.body;

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
      student: await Student.findById(student._id).populate('user', 'email isActive')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateStudent = async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'email isActive');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    res.json({
      message: 'Student updated successfully',
      student
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    await User.findByIdAndDelete(student.user);
    await Student.findByIdAndDelete(req.params.id);

    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStudentsByDepartment = async (req, res) => {
  try {
    const { department } = req.params;
    const students = await Student.find({ department }).populate('user', 'email isActive');
    res.json(students);
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
  getStudentsByDepartment
};