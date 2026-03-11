const Faculty = require('../models/Faculty');
const User = require('../models/User');

const getAllFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.find().populate('user', 'email isActive');
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFacultyById = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id).populate('user', 'email isActive');
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }
    res.json(faculty);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createFaculty = async (req, res) => {
  try {
    const { email, password, ...facultyData } = req.body;

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists. Please use a different email.' });
    }

    const user = await User.create({
      email,
      password,
      role: 'faculty'
    });

    let facultyId = facultyData.facultyId;
    if (!facultyId) {
      const lastFaculty = await Faculty.findOne({})
        .sort({ createdAt: -1, _id: -1 })
        .select('facultyId');
      const lastNumber = lastFaculty?.facultyId
        ? parseInt(String(lastFaculty.facultyId).replace(/\D/g, ''), 10)
        : 0;
      const nextNumber = Number.isNaN(lastNumber) ? 1 : lastNumber + 1;
      facultyId = `FAC${String(nextNumber).padStart(3, '0')}`;
    }

    const faculty = await Faculty.create({
      ...facultyData,
      facultyId,
      email,
      user: user._id
    });

    user.profile = faculty._id;
    await user.save();

    res.status(201).json({
      message: 'Faculty created successfully',
      faculty: await Faculty.findById(faculty._id).populate('user', 'email isActive')
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already exists. Please use a different email.' });
    }
    res.status(500).json({ message: error.message });
  }
};

const updateFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('user', 'email isActive');

    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    res.json({
      message: 'Faculty updated successfully',
      faculty
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ message: 'Faculty not found' });
    }

    await User.findByIdAndDelete(faculty.user);
    await Faculty.findByIdAndDelete(req.params.id);

    res.json({ message: 'Faculty deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty
};
