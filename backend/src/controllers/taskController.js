const { validationResult } = require('express-validator');
const Task = require('../models/Task');
const Project = require('../models/Project');

const checkProjectAccess = async (projectId, userId) => {
  const project = await Project.findById(projectId);
  if (!project) return { error: 'Project not found', status: 404 };
  const isMember = project.members.some(m => m.toString() === userId.toString())
    || project.admin.toString() === userId.toString();
  if (!isMember) return { error: 'Access denied', status: 403 };
  return { project };
};

exports.getTasks = async (req, res) => {
  try {
    const { projectId, status, priority, assignee } = req.query;
    let filter = {};

    if (projectId) {
      const { error, status: errStatus, project } = await checkProjectAccess(projectId, req.user._id);
      if (error) return res.status(errStatus).json({ message: error });
      filter.project = projectId;
    } else {
      const projects = await Project.find({
        $or: [{ admin: req.user._id }, { members: req.user._id }]
      }).select('_id');
      filter.project = { $in: projects.map(p => p._id) };
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignee) filter.assignee = assignee;

    const tasks = await Task.find(filter)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name color')
      .sort('-createdAt');
    res.json({ tasks });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { title, description, project: projectId, assignee, priority, dueDate, tags } = req.body;
    const { error, status, project } = await checkProjectAccess(projectId, req.user._id);
    if (error) return res.status(status).json({ message: error });

    if (project.admin.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only admin can create tasks' });
    }

    if (assignee) {
      const isMember = project.members.some(m => m.toString() === assignee);
      if (!isMember) return res.status(400).json({ message: 'Assignee is not a project member' });
    }

    const task = await Task.create({
      title, description, project: projectId, assignee: assignee || null,
      priority, dueDate, tags: tags || [], createdBy: req.user._id
    });

    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');
    await task.populate('project', 'name color');
    res.status(201).json({ task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email')
      .populate('createdBy', 'name email')
      .populate('project', 'name color admin members');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { error, status } = await checkProjectAccess(task.project._id, req.user._id);
    if (error) return res.status(status).json({ message: error });

    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const project = task.project;
    const isAdmin = project.admin.toString() === req.user._id.toString();
    const isAssignee = task.assignee?.toString() === req.user._id.toString();

    if (!isAdmin && !isAssignee) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const allowed = isAdmin
      ? ['title', 'description', 'assignee', 'priority', 'dueDate', 'status', 'tags']
      : ['status'];

    allowed.forEach(field => {
      if (req.body[field] !== undefined) task[field] = req.body[field];
    });

    await task.save();
    await task.populate('assignee', 'name email');
    await task.populate('createdBy', 'name email');
    await task.populate('project', 'name color');
    res.json({ task });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id).populate('project');
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isAdmin = task.project.admin.toString() === req.user._id.toString();
    if (!isAdmin) return res.status(403).json({ message: 'Admin only' });

    await task.deleteOne();
    res.json({ message: 'Task deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
