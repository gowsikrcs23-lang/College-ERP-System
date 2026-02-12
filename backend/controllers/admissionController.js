const AdmissionApplication = require('../models/AdmissionApplication');
const Student = require('../models/Student');
const User = require('../models/User');

const submitApplication = async (req, res) => {
  try {
    const application = await AdmissionApplication.create(req.body);
    res.status(201).json({
      message: 'Application submitted successfully',
      application
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    res.status(500).json({ message: error.message });
  }
};

const getAllApplications = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const applications = await AdmissionApplication.find(filter).sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateApplicationStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const application = await AdmissionApplication.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
    
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }
    
    res.json({
      message: 'Application status updated',
      application
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const approveApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { studentId, email, password } = req.body;
    
    const application = await AdmissionApplication.findById(id);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    const user = await User.create({
      email,
      password,
      role: 'student'
    });

    const student = await Student.create({
      studentId,
      firstName: application.firstName,
      lastName: application.lastName,
      email,
      phone: application.phone,
      dateOfBirth: application.dateOfBirth,
      address: application.address,
      department: application.department,
      semester: 1,
      user: user._id
    });

    user.profile = student._id;
    await user.save();

    application.status = 'approved';
    await application.save();
    
    res.json({
      message: 'Application approved and student account created',
      student
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitApplication,
  getAllApplications,
  updateApplicationStatus,
  approveApplication
};