const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const addAdmissionUser = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');
    
    // Check if admission user already exists
    const existingUser = await User.findOne({ email: 'admission@college.edu' });
    
    if (existingUser) {
      console.log('ℹ️  Admission user already exists');
      process.exit(0);
    }
    
    // Create Admission Office User
    await User.create({
      email: 'admission@college.edu',
      password: 'admission123',
      role: 'admission'
    });
    
    console.log('✅ Admission user created successfully!');
    console.log('\nLogin Credentials:');
    console.log('Admission Office: admission@college.edu / admission123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

addAdmissionUser();