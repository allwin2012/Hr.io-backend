const mongoose = require('mongoose');

// Project Schema
const projectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  managers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  status: { type: String, enum: ['active', 'archived', 'on-hold'], default: 'active' },
  createdAt: { type: Date, default: Date.now }
});

// Task Schema
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['todo', 'in-progress', 'blocked', 'completed'], default: 'todo' },
  priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
  dueDate: { type: Date },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  secondaryAssignees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  estimatedHours: { type: Number },
  actualHours: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Subtask Schema
const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
  task: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
  assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dueDate: { type: Date },
  estimatedHours: { type: Number },
  actualHours: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

// Comment Schema
const commentSchema = new mongoose.Schema({
  content: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['task', 'subtask'], required: true },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'targetType'
  },
  attachments: [{
    url: String,
    name: String,
    type: String
  }],
  createdAt: { type: Date, default: Date.now }
});

// Virtuals and Indexes
taskSchema.virtual('subtasks', {
  ref: 'Subtask',
  localField: '_id',
  foreignField: 'task'
});

taskSchema.virtual('comments', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'targetId',
  match: { targetType: 'task' }
});

taskSchema.index({ assignee: 1, status: 1 });
taskSchema.index({ project: 1, status: 1 });
subtaskSchema.index({ task: 1, status: 1 });
commentSchema.index({ targetType: 1, targetId: 1 });

// Create Models Safely (avoid OverwriteModelError)
const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);
const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);
const Subtask = mongoose.models.Subtask || mongoose.model('Subtask', subtaskSchema);
const Comment = mongoose.models.Comment || mongoose.model('Comment', commentSchema);

module.exports = {
  Project,
  Task,
  Subtask,
  Comment
};
