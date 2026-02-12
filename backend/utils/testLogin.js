const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const testLogin = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database\n');
    
    const email = 'admin@college.edu';
    const password = 'admin123';
    
    console.log(`Testing login for: ${email}`);
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found');
      process.exit(1);
    }
    
    console.log('✅ User found');
    console.log(`   Role: ${user.role}`);
    console.log(`   Active: ${user.isActive}`);
    
    const isPasswordValid = await user.comparePassword(password);
    
    if (isPasswordValid) {
      console.log('✅ Password is correct');
      console.log('\n✅ Login should work!');
      console.log('\nMake sure backend server is running on port 6000');
      console.log('Run: npm run dev');
    } else {
      console.log('❌ Password is incorrect');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

testLogin();