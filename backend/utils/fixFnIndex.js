const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const fixFnIndex = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to database');
    
    // Drop the old fn_1 index
    try {
      await mongoose.connection.db.collection('students').dropIndex('fn_1');
      console.log('✅ Dropped old fn_1 index');
    } catch (error) {
      console.log('ℹ️  Index fn_1 not found or already dropped');
    }
    
    // Create new sparse unique index
    await mongoose.connection.db.collection('students').createIndex(
      { fn: 1 }, 
      { unique: true, sparse: true }
    );
    console.log('✅ Created new sparse unique index on fn');
    
    console.log('✅ Database fixed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixFnIndex();