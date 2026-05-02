const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  color: { type: String, default: '#6366f1' },
  admin: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['active', 'archived'], default: 'active' },
}, { timestamps: true });

projectSchema.virtual('taskCount', {
  ref: 'Task', localField: '_id', foreignField: 'project', count: true
});

module.exports = mongoose.model('Project', projectSchema);
