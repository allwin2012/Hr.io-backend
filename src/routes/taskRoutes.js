const express = require('express');
const router = express.Router();
const { Project, Task, Subtask, Comment } = require('../models/Task');
const requireAuth = require('../middleware/auth');

// ----------- CREATE Task -----------
// router.post('/', requireAuth, async (req, res) => {
//   const { title, description, status, priority, dueDate, project, assignee, secondaryAssignees, estimatedHours } = req.body;

//   if (!title || !assignee) {
//     return res.status(400).json({ message: 'Title and Assignee are required' });
//   }

//   try {
//     // Validate project exists if provided
//     if (project) {
//       const projectExists = await Project.exists({ _id: project });
//       if (!projectExists) {
//         return res.status(404).json({ message: 'Project not found' });
//       }
//     }

//     const task = new Task({
//       title,
//       description,
//       status: status || 'To Do',
//       priority: priority || 'Medium',
//       dueDate,
//       project,
//       assignee,
//       secondaryAssignees,
//       estimatedHours,
//       actualHours: 0,
//       createdBy: req.user._id
//     });

//     await task.save();
//     res.status(201).json(task);
//   } catch (err) {
//     res.status(500).json({ 
//       message: 'Task creation failed', 
//       error: err.message 
//     });
//   }
// });
router.post('/', requireAuth, async (req, res) => {
  const { title, description, status, priority, dueDate, project, assignee, secondaryAssignees, estimatedHours } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required' });
  }

  try {
    // Validate project exists if provided
    if (project) {
      const projectExists = await Project.exists({ _id: project });
      if (!projectExists) {
        return res.status(404).json({ message: 'Project not found' });
      }
    }

    // If assignee is provided, validate they exist
    let finalAssignee = req.user._id; // Default to the creator
    
    if (assignee) {
      const assigneeExists = await User.exists({ _id: assignee });
      if (!assigneeExists) {
        return res.status(404).json({ message: 'Assignee not found' });
      }
      finalAssignee = assignee;
    }

    const task = new Task({
      title,
      description,
      status: status || 'Backlog', // Changed to Backlog for unassigned tasks
      priority: priority || 'Medium',
      dueDate,
      project,
      assignee: finalAssignee,
      secondaryAssignees,
      estimatedHours,
      actualHours: 0,
      createdBy: req.user._id,
      // Add field to track if task was self-assigned later
      originallyUnassigned: !assignee
    });

    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ 
      message: 'Task creation failed', 
      error: err.message 
    });
  }
});

// ----------- GET ALL Tasks -----------
router.get('/', requireAuth, async (req, res) => {
  try {
    const { status, priority, assignee, project, sortBy } = req.query;
    const match = {};
    const sort = {};

    // Build match object
    if (status) match.status = status;
    if (priority) match.priority = priority;
    if (assignee) match.assignee = assignee;
    if (project) match.project = project;

    // Build sort object
    if (sortBy) {
      const [field, order] = sortBy.split(':');
      sort[field] = order === 'desc' ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default sort by newest first
    }

    const tasks = await Task.find(match)
      .populate('assignee', 'name email avatar')
      .populate('secondaryAssignees', 'name email')
      .populate('project', 'name')
      .sort(sort);

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to fetch tasks', 
      error: err.message 
    });
  }
});

//self assigne for team
// PATCH /api/tasks/:id/assign-self - Allow users to assign themselves to tasks
router.patch('/:id/assign-self', requireAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if task is already assigned to someone
    if (task.assignee && task.assignee.toString() !== req.user._id.toString()) {
      return res.status(400).json({ message: 'Task is already assigned to someone else' });
    }

    // Update task assignment and status
    task.assignee = req.user._id;
    task.status = 'To Do'; // Move from Backlog to To Do
    task.updatedAt = new Date();
    
    await task.save();
    
    res.json(task);
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to assign task', 
      error: err.message 
    });
  }
});


// ----------- GET Task By ID -----------
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('assignee', 'name email avatar')
      .populate('secondaryAssignees', 'name email')
      .populate('project', 'name')
      .populate('subtasks')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name avatar'
        }
      });

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json(task);
  } catch (err) {
    res.status(500).json({ 
      message: 'Failed to fetch task', 
      error: err.message 
    });
  }
});

// ----------- UPDATE Task -----------
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check permissions
    if (task.assignee.toString() !== req.user._id.toString() && 
        task.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    const updatableFields = [
      'title', 'description', 'status', 'priority', 'dueDate',
      'project', 'assignee', 'secondaryAssignees', 'estimatedHours', 'actualHours'
    ];

    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        task[field] = req.body[field];
      }
    });

    task.updatedAt = new Date();
    await task.save();

    res.json(task);
  } catch (err) {
    res.status(500).json({ 
      message: 'Task update failed', 
      error: err.message 
    });
  }
});

// ----------- DELETE Task -----------
// router.delete('/:id', requireAuth, async (req, res) => {
//   try {
//     const task = await Task.findById(req.params.id);
//     if (!task) {
//       return res.status(404).json({ message: 'Task not found' });
//     }

//     // Check permissions (only creator or admin can delete)
//     const isCreator = task.createdBy.toString() === req.user._id.toString();
//     const isAdmin = req.user.role === 'Admin' || req.user.role === 'SuperAdmin';

//     if (!isCreator && !isAdmin) {
//       return res.status(403).json({ message: 'Not authorized to delete this task' });
//     }

//     await task.deleteOne();
//     res.json({ message: 'Task deleted successfully' });
//   } catch (err) {
//     res.status(500).json({ 
//       message: 'Task deletion failed', 
//       error: err.message 
//     });
//   }
// });

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    // ensure auth middleware attached a user
    if (!req.user || !req.user._id) {
      return res.status(401).json({ message: 'Unauthorized: user not found on request. Check auth middleware.' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // derive creator id robustly:
    // createdBy might be:
    // - an ObjectId (e.g. ObjectId("..."))
    // - a populated object ({ _id: "...", name: "..." })
    // - absent (null/undefined)
    let taskCreatorId = null;
    if (task.createdBy) {
      if (typeof task.createdBy === 'string') {
        taskCreatorId = task.createdBy;
      } else if (task.createdBy._id) {
        taskCreatorId = task.createdBy._id.toString();
      } else if (typeof task.createdBy.toString === 'function') {
        taskCreatorId = task.createdBy.toString();
      }
    }

    const requesterId = req.user._id.toString();

    // debug (remove in production)
    console.log('Delete attempt:', {
      taskId: task._id?.toString(),
      taskCreatorId,
      requesterId,
      requesterRole: req.user.role
    });

    const isCreator = taskCreatorId && requesterId && taskCreatorId === requesterId;
    const isAdmin = req.user.role === 'Admin' || req.user.role === 'SuperAdmin';

    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await task.deleteOne();
    return res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    console.error('Task deletion error:', err);
    return res.status(500).json({
      message: 'Task deletion failed',
      error: err.message
    });
  }
});


module.exports = router;