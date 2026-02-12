const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const updateDatabase = async () => {
  try {
    console.log('Connecting to database...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Clear old attendance data
    const attendanceResult = await mongoose.connection.db.collection('attendances').deleteMany({});
    console.log(`✅ Cleared ${attendanceResult.deletedCount} old attendance records`);
    
    // Drop the old index if it exists
    try {
      await mongoose.connection.db.collection('attendances').dropIndex('student_1_subject_1_date_1');
      console.log('✅ Dropped old attendance index');
    } catch (error) {
      console.log('ℹ️  Old index not found or already dropped');
    }
    
    console.log('✅ Database updated successfully!');
    console.log('ℹ️  You can now restart your server and use the new attendance system');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating database:', error);
    process.exit(1);
  }
};

updateDatabase();