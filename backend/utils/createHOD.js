const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('../models/User');

const createHOD = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if HOD already exists
    const existingHOD = await User.findOne({ email: 'hod@college.edu' });
    if (existingHOD) {
      console.log('HOD user already exists');
      process.exit(0);
    }

    // Create HOD user
    const hashedPassword = await bcrypt.hash('hod123', 12);
    const hod = await User.create({
      email: 'hod@college.edu',
      password: hashedPassword,
      role: 'hod',
      isActive: true
    });

    console.log('HOD user created successfully');
    console.log('Email: hod@college.edu');
    console.log('Password: hod123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating HOD:', error);
    process.exit(1);
  }
};

createHOD();
