const jwt = require('jsonwebtoken');
const User = require('../models/User');

exports.protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.startsWith('Bearer ')
      ? req.headers.authorization.split(' ')[1]
      : null;

    if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.user = await User.findById(decoded.id).select('-password');
    if (!req.user) return res.status(401).json({ message: 'User not found' });

    next();
  } catch (error) {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

exports.requireAdmin = (projectField = 'project') => async (req, res, next) => {
  const Project = require('../models/Project');
  const projectId = req.params.projectId || req.body.project || req.query.project;
  const project = await Project.findById(projectId);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  if (project.admin.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  req.project = project;
  next();
};
