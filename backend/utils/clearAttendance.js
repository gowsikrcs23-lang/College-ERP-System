const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI);

const clearAttendanceData = async () => {
  try {
    console.log('Connecting to database...');
    
    // Clear attendance collection
    const result = await mongoose.connection.db.collection('attendances').deleteMany({});
    
    console.log(`✅ Cleared ${result.deletedCount} attendance records`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing attendance data:', error);
    process.exit(1);
  }
};

clearAttendanceData();