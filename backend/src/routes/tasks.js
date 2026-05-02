const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { getTasks, createTask, getTask, updateTask, deleteTask } = require('../controllers/taskController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getTasks).post([
  body('title').trim().notEmpty().withMessage('Task title is required'),
  body('project').notEmpty().withMessage('Project is required'),
  body('priority').optional().isIn(['low', 'medium', 'high'])
], createTask);

router.route('/:id').get(getTask).patch(updateTask).delete(deleteTask);

module.exports = router;
