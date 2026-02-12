const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Notification = require('../models/Notification');
const Timetable = require('../models/Timetable');

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB Connected for seeding');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

const seedData = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Student.deleteMany({});
    await Faculty.deleteMany({});
    await Notification.deleteMany({});
    await Timetable.deleteMany({});

    // Create Admin User
    const adminUser = await User.create({
      email: 'admin@college.edu',
      password: 'admin123',
      role: 'admin'
    });

    // Create Accountant User
    const accountantUser = await User.create({
      email: 'accountant@college.edu',
      password: 'accountant123',
      role: 'accountant'
    });

    // Create Admission Office User
    const admissionUser = await User.create({
      email: 'admission@college.edu',
      password: 'admission123',
      role: 'admission'
    });

    // Create Faculty
    const faculty1 = await Faculty.create({
      facultyId: 'FAC001',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@college.edu',
      phone: '1234567890',
      department: 'Computer Science',
      designation: 'Professor',
      qualification: 'PhD in Computer Science',
      experience: 10,
      subjects: ['Data Structures', 'Algorithms', 'Database Systems']
    });

    // Create Students
    const student1 = await Student.create({
      studentId: 'STU001',
      fn: 'FN001',
      firstName: 'Alice',
      lastName: 'Johnson',
      email: 'alice.johnson@student.college.edu',
      phone: '9876543210',
      dateOfBirth: new Date('2002-05-15'),
      address: {
        street: '123 Main St',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62701'
      },
      department: 'Computer Science',
      semester: 3,
      batch: '2022-2026'
    });

    const student2 = await Student.create({
      studentId: 'STU002',
      fn: 'FN002',
      firstName: 'Bob',
      lastName: 'Wilson',
      email: 'bob.wilson@student.college.edu',
      phone: '9876543211',
      dateOfBirth: new Date('2001-08-22'),
      address: {
        street: '456 Oak Ave',
        city: 'Springfield',
        state: 'IL',
        zipCode: '62702'
      },
      department: 'Computer Science',
      semester: 3,
      batch: '2022-2026'
    });

    // Create Sample Notification
    await Notification.create({
      title: 'Welcome to College ERP System',
      message: 'This is a sample notification for all users.',
      type: 'general',
      targetAudience: 'all',
      createdBy: adminUser._id
    });

    // Create Sample Timetables for Computer Science
    const sampleSchedule = [
      {
        day: 'Monday',
        periods: [
          { startTime: '09:00', endTime: '10:00', subject: 'Data Structures', room: 'CS-101', type: 'lecture' },
          { startTime: '10:00', endTime: '11:00', subject: 'Algorithms', room: 'CS-102', type: 'lecture' },
          { startTime: '11:15', endTime: '12:15', subject: 'Database Systems', room: 'CS-103', type: 'lecture' },
          { startTime: '14:00', endTime: '15:00', subject: 'Data Structures Lab', room: 'CS-Lab1', type: 'lab' }
        ]
      },
      {
        day: 'Tuesday',
        periods: [
          { startTime: '09:00', endTime: '10:00', subject: 'Operating Systems', room: 'CS-101', type: 'lecture' },
          { startTime: '10:00', endTime: '11:00', subject: 'Computer Networks', room: 'CS-102', type: 'lecture' },
          { startTime: '11:15', endTime: '12:15', subject: 'Software Engineering', room: 'CS-103', type: 'lecture' },
          { startTime: '14:00', endTime: '16:00', subject: 'Database Lab', room: 'CS-Lab2', type: 'lab' }
        ]
      },
      {
        day: 'Wednesday',
        periods: [
          { startTime: '09:00', endTime: '10:00', subject: 'Web Development', room: 'CS-101', type: 'lecture' },
          { startTime: '10:00', endTime: '11:00', subject: 'Machine Learning', room: 'CS-102', type: 'lecture' },
          { startTime: '11:15', endTime: '12:15', subject: 'Algorithms', room: 'CS-103', type: 'lecture' },
          { startTime: '14:00', endTime: '15:00', subject: 'Tutorial', room: 'CS-104', type: 'tutorial' }
        ]
      },
      {
        day: 'Thursday',
        periods: [
          { startTime: '09:00', endTime: '10:00', subject: 'Artificial Intelligence', room: 'CS-101', type: 'lecture' },
          { startTime: '10:00', endTime: '11:00', subject: 'Computer Graphics', room: 'CS-102', type: 'lecture' },
          { startTime: '11:15', endTime: '12:15', subject: 'Operating Systems', room: 'CS-103', type: 'lecture' },
          { startTime: '14:00', endTime: '16:00', subject: 'Web Development Lab', room: 'CS-Lab1', type: 'lab' }
        ]
      },
      {
        day: 'Friday',
        periods: [
          { startTime: '09:00', endTime: '10:00', subject: 'Software Engineering', room: 'CS-101', type: 'lecture' },
          { startTime: '10:00', endTime: '11:00', subject: 'Database Systems', room: 'CS-102', type: 'lecture' },
          { startTime: '11:15', endTime: '12:15', subject: 'Computer Networks', room: 'CS-103', type: 'lecture' },
          { startTime: '14:00', endTime: '15:00', subject: 'Project Work', room: 'CS-104', type: 'tutorial' }
        ]
      }
    ];

    // Create timetables for semesters 1-8
    for (let semester = 1; semester <= 8; semester++) {
      await Timetable.create({
        department: 'Computer Science',
        semester: semester,
        academicYear: '2024-25',
        schedule: sampleSchedule
      });
    }

    console.log('Sample data seeded successfully!');
    console.log('\nLogin Credentials:');
    console.log('Admin: admin@college.edu / admin123');
    console.log('Accountant: accountant@college.edu / accountant123');
    console.log('Admission Office: admission@college.edu / admission123');
    console.log('\nNote: Faculty and Student accounts must be created by Admin through the system.');

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    mongoose.connection.close();
  }
};

connectDB().then(() => {
  seedData();
});