const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

const register = async (req, res) => {
  try {
    const { email, password, role, profileData } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    let profile;
    if (role === 'student') {
      profile = await Student.create(profileData);
    } else if (role === 'faculty') {
      profile = await Faculty.create(profileData);
    }

    const user = await User.create({
      email,
      password,
      role,
      profile: profile?._id
    });

    if (profile) {
      profile.user = user._id;
      await profile.save();
    }

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !await user.comparePassword(password)) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    // Get profile based on role
    let profile = null;
    if (user.role === 'student' && user.profile) {
      profile = await Student.findById(user.profile);
    } else if (user.role === 'faculty' && user.profile) {
      profile = await Faculty.findById(user.profile);
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: profile
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    // Get profile based on role
    let profile = null;
    if (user.role === 'student' && user.profile) {
      profile = await Student.findById(user.profile);
    } else if (user.role === 'faculty' && user.profile) {
      profile = await Faculty.findById(user.profile);
    }
    
    res.json({
      ...user.toObject(),
      profile: profile
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { register, login, getProfile };