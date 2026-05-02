const Task = require('../models/Task');
const Project = require('../models/Project');

exports.getDashboard = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ admin: req.user._id }, { members: req.user._id }]
    }).select('_id');
    const projectIds = projects.map(p => p._id);

    const [tasks, statusStats, priorityStats, overdueCount] = await Promise.all([
      Task.find({ project: { $in: projectIds } })
        .populate('assignee', 'name email')
        .populate('project', 'name color')
        .sort('-createdAt').limit(10),

      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      Task.aggregate([
        { $match: { project: { $in: projectIds } } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),

      Task.countDocuments({
        project: { $in: projectIds },
        dueDate: { $lt: new Date() },
        status: { $ne: 'done' }
      })
    ]);

    const tasksByUser = await Task.aggregate([
      { $match: { project: { $in: projectIds }, assignee: { $ne: null } } },
      { $group: { _id: '$assignee', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { count: 1, 'user.name': 1, 'user.email': 1 } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const totalTasks = await Task.countDocuments({ project: { $in: projectIds } });

    res.json({
      totalTasks,
      totalProjects: projects.length,
      overdueCount,
      statusStats: statusStats.reduce((acc, s) => ({ ...acc, [s._id]: s.count }), {}),
      priorityStats: priorityStats.reduce((acc, p) => ({ ...acc, [p._id]: p.count }), {}),
      tasksByUser,
      recentTasks: tasks
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
