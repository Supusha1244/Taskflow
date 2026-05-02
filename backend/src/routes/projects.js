const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  getProjects, createProject, getProject, updateProject, deleteProject, addMember, removeMember
} = require('../controllers/projectController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/').get(getProjects).post([
  body('name').trim().notEmpty().withMessage('Project name is required')
], createProject);

router.route('/:id').get(getProject).patch(updateProject).delete(deleteProject);
router.post('/:id/members', addMember);
router.delete('/:id/members/:userId', removeMember);

module.exports = router;
