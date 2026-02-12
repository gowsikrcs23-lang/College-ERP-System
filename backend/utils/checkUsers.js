const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

dotenv.config();

const checkUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');
    
    const users = await User.find({});
    console.log(`\nTotal users: ${users.length}`);
    
    if (users.length > 0) {
      console.log('\nUsers in database:');
      users.forEach(user => {
        console.log(`- Email: ${user.email} | Role: ${user.role} | Active: ${user.isActive}`);
      });
    } else {
      console.log('\n⚠️  No users found in database!');
      console.log('Run: npm run seed');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

checkUsers();