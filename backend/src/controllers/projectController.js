const { validationResult } = require('express-validator');
const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');

exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ admin: req.user._id }, { members: req.user._id }]
    }).populate('admin', 'name email').populate('members', 'name email').sort('-createdAt');
    res.json({ projects });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createProject = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { name, description, color } = req.body;
    const project = await Project.create({
      name, description, color, admin: req.user._id, members: [req.user._id]
    });
    await project.populate('admin', 'name email');
    res.status(201).json({ project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('admin', 'name email')
      .populate('members', 'name email');
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const isMember = project.members.some(m => m._id.toString() === req.user._id.toString())
      || project.admin._id.toString() === req.user._id.toString();
    if (!isMember) return res.status(403).json({ message: 'Access denied' });

    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Admin only' });
    }
    const { name, description, color, status } = req.body;
    Object.assign(project, { name: name || project.name, description: description ?? project.description, color: color || project.color, status: status || project.status });
    await project.save();
    await project.populate('admin', 'name email');
    await project.populate('members', 'name email');
    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Admin only' });
    }
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.addMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Admin only' });
    }
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (project.members.includes(user._id)) {
      return res.status(400).json({ message: 'Already a member' });
    }
    project.members.push(user._id);
    await project.save();
    await project.populate('admin', 'name email');
    await project.populate('members', 'name email');
    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Admin only' });
    }
    const { userId } = req.params;
    if (userId === project.admin.toString()) {
      return res.status(400).json({ message: 'Cannot remove admin' });
    }
    project.members = project.members.filter(m => m.toString() !== userId);
    await project.save();
    await project.populate('admin', 'name email');
    await project.populate('members', 'name email');
    res.json({ project });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
