const Notification = require('../models/Notification');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');

const normalizeNotificationPayload = async (req) => {
  const payload = { ...req.body };

  if (payload.semester === '' || payload.semester === undefined) {
    delete payload.semester;
  } else if (payload.semester !== null) {
    payload.semester = Number(payload.semester);
  }

  if (payload.expiryDate === '') {
    delete payload.expiryDate;
  }

  if (typeof payload.department === 'string') {
    payload.department = payload.department.trim();
    if (!payload.department) {
      delete payload.department;
    }
  }

  if (req.user.role === 'faculty' || req.user.role === 'hod') {
    const facultyProfile = await Faculty.findById(req.user.profile).select('department').lean();

    if (!facultyProfile?.department) {
      const error = new Error('Faculty profile not found');
      error.statusCode = 403;
      throw error;
    }

    if (payload.targetAudience === 'students' || payload.targetAudience === 'department') {
      payload.department = facultyProfile.department;
    }
  }

  if (payload.targetAudience !== 'students') {
    delete payload.semester;
  }

  if (payload.targetAudience !== 'students' && payload.targetAudience !== 'department') {
    delete payload.department;
  }

  return payload;
};

const createNotification = async (req, res) => {
  try {
    const payload = await normalizeNotificationPayload(req);

    const notification = await Notification.create({
      ...payload,
      createdBy: req.user.id
    });

    res.status(201).json({
      message: 'Notification created successfully',
      notification
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const getNotifications = async (req, res) => {
  try {
    const { type, targetAudience, department, limit = 50, skip = 0 } = req.query;
    const filter = { isActive: true };
    const userRole = req.user.role;
    
    if (type) filter.type = type;

    // Only show non-expired notifications - optimized query
    const now = new Date();
    filter.$and = [{
      $or: [
        { expiryDate: { $exists: false } },
        { expiryDate: { $gte: now } }
      ]
    }];

    const audienceFilters = [];

    if (userRole === 'student') {
      const studentProfile = await Student.findById(req.user.profile).select('department semester').lean();
      if (!studentProfile) {
        return res.status(404).json({ message: 'Student profile not found' });
      }

      audienceFilters.push({ targetAudience: 'all' });
      audienceFilters.push({
        targetAudience: 'students',
        $and: [
          {
            $or: studentProfile?.department
              ? [
                  { department: { $exists: false } },
                  { department: null },
                  { department: '' },
                  { department: studentProfile.department }
                ]
              : [
                  { department: { $exists: false } },
                  { department: null },
                  { department: '' }
                ]
          },
          {
            $or: studentProfile?.semester
              ? [
                  { semester: { $exists: false } },
                  { semester: null },
                  { semester: studentProfile.semester }
                ]
              : [
                  { semester: { $exists: false } },
                  { semester: null }
                ]
          }
        ]
      });

      if (studentProfile?.department) {
        audienceFilters.push({
          targetAudience: 'department',
          department: studentProfile.department
        });
      }
    } else if (userRole === 'faculty' || userRole === 'hod') {
      const facultyProfile = await Faculty.findById(req.user.profile).select('department').lean();
      if (!facultyProfile) {
        return res.status(404).json({ message: 'Faculty profile not found' });
      }

      audienceFilters.push({ targetAudience: 'all' });
      audienceFilters.push({
        targetAudience: 'faculty',
        $or: facultyProfile?.department
          ? [
              { department: { $exists: false } },
              { department: null },
              { department: '' },
              { department: facultyProfile.department }
            ]
          : [
              { department: { $exists: false } },
              { department: null },
              { department: '' }
            ]
      });

      if (facultyProfile?.department) {
        audienceFilters.push({
          targetAudience: 'department',
          department: facultyProfile.department
        });
      }
    } else {
      audienceFilters.push({ targetAudience: 'all' });
      audienceFilters.push({ targetAudience: userRole });
      audienceFilters.push({ createdBy: req.user._id });
    }

    if (targetAudience) {
      const filteredAudienceMatches = audienceFilters.filter((entry) => entry.targetAudience === targetAudience);
      filter.$and.push({
        $or: filteredAudienceMatches.length > 0 ? filteredAudienceMatches : [{ targetAudience }]
      });
    } else {
      filter.$and.push({ $or: audienceFilters });
    }

    if (department) {
      filter.$and.push({ department });
    }

    // Use lean() for faster queries and limit results
    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .populate('createdBy', 'email role')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(parseInt(skip))
        .lean(),
      Notification.countDocuments(filter)
    ]);

    res.json({
      notifications,
      total,
      page: Math.floor(skip / limit) + 1,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getNotificationById = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)
      .populate('createdBy', 'email role');

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'email role');

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({
      message: 'Notification updated successfully',
      notification
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete all notifications
const deleteAllNotifications = async (req, res) => {
  try {
    const { type, targetAudience, department } = req.query;
    const filter = { isActive: true };
    
    if (type) filter.type = type;
    if (targetAudience) filter.targetAudience = targetAudience;
    if (department) filter.department = department;

    const result = await Notification.updateMany(
      filter,
      { isActive: false }
    );

    res.json({ 
      message: 'Notifications deleted successfully', 
      deletedCount: result.modifiedCount 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete notifications by creator (for staff/management)
const deleteNotificationsByCreator = async (req, res) => {
  try {
    const { creatorId } = req.params;
    const { type, targetAudience, department } = req.query;
    
    const filter = { 
      createdBy: creatorId,
      isActive: true 
    };
    
    if (type) filter.type = type;
    if (targetAudience) filter.targetAudience = targetAudience;
    if (department) filter.department = department;

    const result = await Notification.updateMany(
      filter,
      { isActive: false }
    );

    res.json({ 
      message: 'Notifications deleted successfully', 
      deletedCount: result.modifiedCount 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createNotification,
  getNotifications,
  getNotificationById,
  updateNotification,
  deleteNotification,
  deleteAllNotifications,
  deleteNotificationsByCreator
};
