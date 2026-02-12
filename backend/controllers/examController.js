const Exam = require('../models/Exam');

const createExam = async (req, res) => {
  try {
    const examData = {
      ...req.body,
      faculty: req.user.profile
    };

    const exam = await Exam.create(examData);
    res.status(201).json({
      message: 'Exam created successfully',
      exam
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllExams = async (req, res) => {
  try {
    const { department, semester } = req.query;
    const filter = {};
    
    if (department) filter.department = department;
    if (semester) filter.semester = semester;

    const exams = await Exam.find(filter)
      .populate('faculty', 'firstName lastName')
      .sort({ examDate: -1 });

    res.json(exams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('faculty', 'firstName lastName')
      .populate('results.student', 'firstName lastName studentId');

    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    res.json(exam);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addResults = async (req, res) => {
  try {
    const { examId } = req.params;
    const { results } = req.body;

    const exam = await Exam.findById(examId);
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }

    // Calculate grades based on marks
    const resultsWithGrades = results.map(result => {
      const percentage = (result.marksObtained / exam.totalMarks) * 100;
      let grade;
      
      if (percentage >= 90) grade = 'A+';
      else if (percentage >= 80) grade = 'A';
      else if (percentage >= 70) grade = 'B+';
      else if (percentage >= 60) grade = 'B';
      else if (percentage >= 50) grade = 'C+';
      else if (percentage >= 40) grade = 'C';
      else if (percentage >= 35) grade = 'D';
      else grade = 'F';

      return { ...result, grade };
    });

    exam.results = resultsWithGrades;
    await exam.save();

    res.json({
      message: 'Results added successfully',
      exam: await Exam.findById(examId).populate('results.student', 'firstName lastName studentId')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStudentResults = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { semester } = req.query;

    const filter = { 'results.student': studentId };
    if (semester) filter.semester = semester;

    const exams = await Exam.find(filter)
      .populate('faculty', 'firstName lastName')
      .select('examName subject examDate totalMarks results.$');

    const results = exams.map(exam => ({
      examName: exam.examName,
      subject: exam.subject,
      examDate: exam.examDate,
      totalMarks: exam.totalMarks,
      marksObtained: exam.results[0].marksObtained,
      grade: exam.results[0].grade,
      faculty: exam.faculty
    }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createExam,
  getAllExams,
  getExamById,
  addResults,
  getStudentResults
};