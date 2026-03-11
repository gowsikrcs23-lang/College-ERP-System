const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Timetable = require('../models/Timetable');
const Faculty = require('../models/Faculty');

dotenv.config();

const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil'];
const semesters = [1, 2, 3, 4, 5, 6, 7, 8];
const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const timeSlots = [
  { start: '09:00', end: '10:00' },
  { start: '10:00', end: '11:00' },
  { start: '11:15', end: '12:15' },
  { start: '12:15', end: '13:15' },
  { start: '14:00', end: '15:00' },
  { start: '15:00', end: '16:00' },
  { start: '16:15', end: '17:15' }
];

const subjectsByDeptSemester = {
  'Computer Science': {
    1: ['C Programming', 'Mathematics I', 'Physics', 'English I', 'Basic Electrical', 'Engineering Graphics'],
    2: ['C++ Programming', 'Mathematics II', 'Chemistry', 'English II', 'Digital Logic', 'Workshop Practice'],
    3: ['Data Structures', 'Discrete Mathematics', 'OOP', 'Computer Organization', 'Data Communication', 'Environmental Science'],
    4: ['Algorithms', 'Operating Systems', 'Database Systems', 'Microprocessors', 'Computer Networks', 'Mathematics III'],
    5: ['Software Engineering', 'Theory of Computation', 'AI', 'Web Development', 'Computer Graphics', 'Professional Ethics'],
    6: ['Machine Learning', 'Compiler Design', 'Distributed Systems', 'Cloud Computing', 'Mobile Computing', 'Cyber Security'],
    7: ['Big Data Analytics', 'Internet of Things', 'Blockchain', 'Deep Learning', 'Project Management', 'Cloud Infrastructure'],
    8: ['Project Work', 'Seminar', 'Industry Internship', 'Technical Elective I', 'Technical Elective II', 'Research Methodology']
  },
  Electronics: {
    1: ['C Programming', 'Mathematics I', 'Physics', 'English I', 'Basic Electrical', 'Engineering Graphics'],
    2: ['C++ Programming', 'Mathematics II', 'Chemistry', 'English II', 'Digital Logic', 'Workshop Practice'],
    3: ['Electronic Devices', 'Circuit Theory', 'Digital Electronics', 'Signals & Systems', 'EM Fields', 'Mathematics III'],
    4: ['Linear IC', 'Microcontrollers', 'DSP', 'VLSI Design', 'Control Systems', 'Communication Theory'],
    5: ['Embedded Systems', 'Power Electronics', 'Antenna & Propagation', 'Microwave Engineering', 'Digital Image Processing', 'Professional Ethics'],
    6: ['Wireless Communication', 'IoT & Sensors', 'FPGA Design', 'Robotics & Automation', 'Renewable Energy', 'Advanced Signal Processing'],
    7: ['Advanced Embedded Systems', 'Biomedical Instrumentation', 'VLSI Testing', 'Optoelectronics', 'Project Management', 'Industry Internship'],
    8: ['Project Work', 'Seminar', 'Advanced Communication', 'Industry Internship', 'Technical Elective I', 'Technical Elective II']
  },
  Mechanical: {
    1: ['C Programming', 'Mathematics I', 'Physics', 'English I', 'Basic Electrical', 'Engineering Graphics'],
    2: ['C++ Programming', 'Mathematics II', 'Chemistry', 'English II', 'Workshop Practice', 'Engineering Mechanics'],
    3: ['Thermodynamics', 'Fluid Mechanics', 'Engineering Math III', 'Strength of Materials', 'Manufacturing Tech I', 'Machine Drawing'],
    4: ['Kinematics of Machinery', 'Heat Transfer', 'Manufacturing Tech II', 'Theory of Machines', 'Material Science', 'Industrial Engineering'],
    5: ['Design of Machine Elements', 'Refrigeration & AC', 'CAD/CAM', 'Finite Element Analysis', 'Automobile Engineering', 'Professional Ethics'],
    6: ['Gas Dynamics', 'Power Plant Engineering', 'Mechatronics', 'Renewable Energy', 'CFD', 'Quality Control'],
    7: ['Advanced Manufacturing', 'Robotics', 'Product Design', 'Thermal Engineering', 'Project Management', 'Industry Internship'],
    8: ['Project Work', 'Seminar', 'Advanced Materials', 'Industry Internship', 'Technical Elective I', 'Technical Elective II']
  },
  Civil: {
    1: ['C Programming', 'Mathematics I', 'Physics', 'English I', 'Basic Electrical', 'Engineering Graphics'],
    2: ['C++ Programming', 'Mathematics II', 'Chemistry', 'English II', 'Workshop Practice', 'Building Materials'],
    3: ['Surveying I', 'Strength of Materials', 'Fluid Mechanics I', 'Engineering Math III', 'Building Construction', 'Theory of Structures'],
    4: ['Surveying II', 'Structural Analysis', 'Fluid Mechanics II', 'Concrete Technology', 'Highway Engineering', 'Environmental Engineering I'],
    5: ['Steel Structures', 'Foundation Engineering', 'Environmental Engineering II', 'Water Resources', 'Concrete Structures', 'Professional Ethics'],
    6: ['Bridge Engineering', 'Earthquake Engineering', 'Advanced Concrete Design', 'Urban Transportation', 'Geotechnical Engineering', 'Irrigation Engineering'],
    7: ['Advanced Structural Design', 'Construction Management', 'Environmental Impact Assessment', 'Remote Sensing & GIS', 'Project Management', 'Industry Internship'],
    8: ['Project Work', 'Seminar', 'Advanced Foundation', 'Industry Internship', 'Technical Elective I', 'Technical Elective II']
  }
};

const normalizeSubject = (value) => {
  return String(value || '')
    .toLowerCase()
    .replace(/\b(lab|laboratory|tutorial|theory|practical|seminar|project work|industry internship)\b/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const subjectMatches = (faculty, subject) => {
  const normalized = normalizeSubject(subject);
  return Array.isArray(faculty.subjects) && faculty.subjects.some((s) => {
    const fs = normalizeSubject(s);
    return fs && (fs === normalized || fs.includes(normalized) || normalized.includes(fs));
  });
};

const createFacultyPicker = (facultyPool) => {
  const rrCounters = new Map();
  let globalCounter = 0;

  const pickFromGroup = (key, group) => {
    if (!group || group.length === 0) return null;
    const current = rrCounters.get(key) || 0;
    rrCounters.set(key, current + 1);
    return group[current % group.length];
  };

  return (_department, subject) => {
    const subjectOnly = facultyPool.filter((f) => subjectMatches(f, subject));

    return (
      pickFromGroup(`s:${normalizeSubject(subject)}`, subjectOnly) ||
      facultyPool[globalCounter++ % facultyPool.length]
    );
  };
};

const getRoomCode = (department, semester, slotIndex) => {
  const codeMap = {
    'Computer Science': 'CS',
    Electronics: 'EE',
    Mechanical: 'ME',
    Civil: 'CE'
  };
  const deptCode = codeMap[department] || 'GEN';
  return `${deptCode}-${semester}0${slotIndex + 1}`;
};

const buildSchedule = (department, semester, pickFaculty) => {
  const subjects = subjectsByDeptSemester[department][semester];

  return days.map((day, dayIndex) => {
    const periods = timeSlots.map((slot, slotIndex) => {
      const subjectIndex = (dayIndex * 2 + slotIndex) % subjects.length;
      const baseSubject = subjects[subjectIndex];
      const type = slotIndex % 5 === 4 ? 'lab' : (slotIndex % 5 === 3 ? 'tutorial' : 'lecture');
      const subject =
        type === 'lab' ? `${baseSubject} Lab` :
        type === 'tutorial' ? `${baseSubject} Tutorial` :
        baseSubject;

      const faculty = pickFaculty(department, baseSubject);

      return {
        startTime: slot.start,
        endTime: slot.end,
        subject,
        faculty: faculty._id,
        room: getRoomCode(department, semester, slotIndex),
        type
      };
    });

    return { day, periods };
  });
};

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected');

    const allFaculty = await Faculty.find().sort({ createdAt: 1 });
    if (allFaculty.length === 0) {
      console.log('No faculty found. Please create faculty first.');
      process.exit(1);
    }

    const facultyPool = allFaculty.slice(0, 8);
    const pickFaculty = createFacultyPicker(facultyPool);
    console.log(`Using ${facultyPool.length} faculty for assignment (max 8).`);

    let upsertCount = 0;
    for (const department of departments) {
      for (const semester of semesters) {
        const schedule = buildSchedule(department, semester, pickFaculty);
        await Timetable.findOneAndUpdate(
          { department, semester, academicYear: '2024-25' },
          { department, semester, academicYear: '2024-25', schedule },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        upsertCount += 1;
      }
    }

    console.log(`Timetables generated/updated: ${upsertCount}`);
    console.log('Done.');
  } catch (error) {
    console.error('Error generating timetables:', error.message);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

run();
