const Report = require('../models/Report');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Result = require('../models/Result');

const getGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
};

const generatePerformanceAnalysis = (attendanceData, examData) => {
  const analysis = {
    attendanceStatus: '',
    academicStatus: '',
    overallPerformance: '',
    strengths: [],
    areasOfImprovement: [],
    recommendations: []
  };

  // Analyze attendance
  if (attendanceData) {
    const attPercentage = parseFloat(attendanceData.percentage);
    if (attPercentage >= 85) {
      analysis.attendanceStatus = 'Excellent';
      analysis.strengths.push('Excellent attendance record');
    } else if (attPercentage >= 75) {
      analysis.attendanceStatus = 'Good';
      analysis.strengths.push('Good attendance');
    } else if (attPercentage >= 65) {
      analysis.attendanceStatus = 'Average';
      analysis.areasOfImprovement.push('Attendance needs improvement');
      analysis.recommendations.push('Maintain regular attendance to improve learning outcomes');
    } else {
      analysis.attendanceStatus = 'Poor';
      analysis.areasOfImprovement.push('Low attendance is a major concern');
      analysis.recommendations.push('Immediate improvement in attendance required. Consult with faculty for support');
    }
  }

  // Analyze academic performance
  if (examData && examData.overallPercentage) {
    const examPercentage = parseFloat(examData.overallPercentage);
    if (examPercentage >= 85) {
      analysis.academicStatus = 'Outstanding';
      analysis.strengths.push('Excellent academic performance');
      analysis.recommendations.push('Continue the excellent work. Consider participating in advanced projects');
    } else if (examPercentage >= 70) {
      analysis.academicStatus = 'Good';
      analysis.strengths.push('Good academic performance');
      analysis.recommendations.push('Maintain consistent study habits. Focus on weak subjects for improvement');
    } else if (examPercentage >= 50) {
      analysis.academicStatus = 'Average';
      analysis.areasOfImprovement.push('Academic performance needs improvement');
      analysis.recommendations.push('Increase study time and seek help from faculty for difficult topics');
      analysis.recommendations.push('Form study groups with peers for better understanding');
    } else {
      analysis.academicStatus = 'Needs Attention';
      analysis.areasOfImprovement.push('Academic performance requires immediate attention');
      analysis.recommendations.push('Schedule regular meetings with faculty for academic support');
      analysis.recommendations.push('Consider tutoring or additional coaching for weak subjects');
      analysis.recommendations.push('Develop a structured study plan with specific goals');
    }

    // Subject-specific analysis
    if (examData.results && examData.results.length > 0) {
      const latestResult = examData.results[examData.results.length - 1];
      const weakSubjects = latestResult.subjects.filter(s => (s.marks / s.maxMarks * 100) < 50);
      const strongSubjects = latestResult.subjects.filter(s => (s.marks / s.maxMarks * 100) >= 80);
      
      if (strongSubjects.length > 0) {
        analysis.strengths.push(`Strong performance in: ${strongSubjects.map(s => s.subjectName).join(', ')}`);
      }
      
      if (weakSubjects.length > 0) {
        analysis.areasOfImprovement.push(`Weak in: ${weakSubjects.map(s => s.subjectName).join(', ')}`);
        analysis.recommendations.push(`Focus extra study time on: ${weakSubjects.map(s => s.subjectName).join(', ')}`);
      }
    }
  }

  // Overall performance
  if (attendanceData && examData) {
    const attPercentage = parseFloat(attendanceData.percentage);
    const examPercentage = parseFloat(examData.overallPercentage);
    const overall = (attPercentage + examPercentage) / 2;
    
    if (overall >= 80) {
      analysis.overallPerformance = 'Excellent - Student is performing exceptionally well';
    } else if (overall >= 65) {
      analysis.overallPerformance = 'Good - Student is on the right track with room for improvement';
    } else if (overall >= 50) {
      analysis.overallPerformance = 'Average - Student needs to focus more on studies and attendance';
    } else {
      analysis.overallPerformance = 'Needs Improvement - Immediate intervention required';
    }
  }

  // General recommendations
  if (!analysis.recommendations.length) {
    analysis.recommendations.push('Keep up the good work and maintain consistency');
  }
  analysis.recommendations.push('Regular revision and practice are key to success');
  analysis.recommendations.push('Stay engaged in class discussions and activities');

  return analysis;
};

exports.generateReport = async (req, res) => {
  try {
    const { studentId, reportType, semester, academicYear } = req.body;

    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    let reportData = {
      student: studentId,
      reportType,
      semester,
      academicYear,
      generatedBy: req.user._id
    };

    // Generate attendance data
    if (reportType === 'attendance' || reportType === 'comprehensive') {
      const attendanceRecords = await Attendance.find({ 
        student: studentId,
        semester 
      }).sort({ date: 1 });

      const totalClasses = attendanceRecords.length;
      const attendedClasses = attendanceRecords.filter(a => a.status === 'present').length;
      const percentage = totalClasses > 0 ? ((attendedClasses / totalClasses) * 100).toFixed(2) : 0;

      reportData.attendanceData = {
        totalClasses,
        attendedClasses,
        percentage,
        sessionWise: attendanceRecords.map(a => ({
          date: a.date,
          session: a.session,
          status: a.status
        }))
      };
    }

    // Generate exam data
    if (reportType === 'exam' || reportType === 'comprehensive') {
      const results = await Result.find({ 
        student: studentId,
        semester 
      });

      const totalPercentage = results.reduce((sum, r) => sum + parseFloat(r.percentage), 0);
      const overallPercentage = results.length > 0 ? (totalPercentage / results.length).toFixed(2) : 0;

      reportData.examData = {
        results: results.map(r => ({
          examType: r.examType,
          subjects: r.subjects,
          totalMarks: r.totalMarks,
          percentage: r.percentage,
          result: r.result
        })),
        overallPercentage,
        averageGrade: getGrade(overallPercentage)
      };
    }

    // Generate performance analysis
    reportData.performanceAnalysis = generatePerformanceAnalysis(
      reportData.attendanceData,
      reportData.examData
    );

    const report = await Report.create(reportData);
    const populatedReport = await Report.findById(report._id)
      .populate('student', 'firstName lastName studentId department')
      .populate('generatedBy', 'email role');

    res.status(201).json({
      message: 'Report generated successfully',
      report: populatedReport
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getStudentReports = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const reports = await Report.find({ student: studentId })
      .populate('student', 'firstName lastName studentId department')
      .populate('generatedBy', 'email role')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllReports = async (req, res) => {
  try {
    const { reportType, semester } = req.query;
    const filter = {};
    
    if (reportType) filter.reportType = reportType;
    if (semester) filter.semester = semester;

    const reports = await Report.find(filter)
      .populate('student', 'firstName lastName studentId department')
      .populate('generatedBy', 'email role')
      .sort({ createdAt: -1 });

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate('student', 'firstName lastName studentId department batch')
      .populate('generatedBy', 'email role');

    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteReport = async (req, res) => {
  try {
    await Report.findByIdAndDelete(req.params.id);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
