const Fee = require('../models/Fee');

const createFeeRecord = async (req, res) => {
  try {
    const tuitionFee = parseFloat(req.body.tuitionFee) || 0;
    const libraryFee = parseFloat(req.body.libraryFee) || 0;
    const labFee = parseFloat(req.body.labFee) || 0;
    const otherFees = parseFloat(req.body.otherFees) || 0;
    const totalAmount = tuitionFee + libraryFee + labFee + otherFees;
    
    const feeData = {
      ...req.body,
      tuitionFee,
      libraryFee,
      labFee,
      otherFees,
      totalAmount,
      dueAmount: totalAmount
    };

    const fee = await Fee.create(feeData);
    res.status(201).json({
      message: 'Fee record created successfully',
      fee
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllFees = async (req, res) => {
  try {
    const { status, semester } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (semester) filter.semester = semester;

    const fees = await Fee.find(filter)
      .populate('student', 'firstName lastName studentId department')
      .sort({ createdAt: -1 });

    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStudentFees = async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const fees = await Fee.find({ student: studentId })
      .populate('student', 'firstName lastName studentId')
      .sort({ semester: -1 });

    res.json(fees);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const makePayment = async (req, res) => {
  try {
    const { feeId } = req.params;
    const { amount, paymentMethod, transactionId } = req.body;
    const paymentAmount = parseFloat(amount);

    const fee = await Fee.findById(feeId);
    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    if (paymentAmount > fee.dueAmount) {
      return res.status(400).json({ message: 'Payment amount exceeds due amount' });
    }

    fee.payments.push({
      amount: paymentAmount,
      paymentDate: new Date(),
      paymentMethod,
      transactionId
    });

    fee.paidAmount = parseFloat(fee.paidAmount) + paymentAmount;
    fee.dueAmount = parseFloat(fee.dueAmount) - paymentAmount;

    if (fee.dueAmount === 0) {
      fee.status = 'paid';
    } else if (fee.paidAmount > 0) {
      fee.status = 'partial';
    }

    await fee.save();

    res.json({
      message: 'Payment recorded successfully',
      fee: await Fee.findById(feeId).populate('student', 'firstName lastName studentId')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getFeeById = async (req, res) => {
  try {
    const fee = await Fee.findById(req.params.id)
      .populate('student', 'firstName lastName studentId department');

    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    res.json(fee);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateFeeStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const fee = await Fee.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    ).populate('student', 'firstName lastName studentId');

    if (!fee) {
      return res.status(404).json({ message: 'Fee record not found' });
    }

    res.json({
      message: 'Fee status updated successfully',
      fee
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createFeeRecord,
  getAllFees,
  getStudentFees,
  makePayment,
  getFeeById,
  updateFeeStatus
};