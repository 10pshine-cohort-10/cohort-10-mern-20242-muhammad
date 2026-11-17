'use strict';

const router = require('express').Router();
const {
  getProfile,
  updateProfile,
  changePassword,
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const {
  profileValidation,
  changePasswordValidation,
  validate,
} = require('../middleware/validateMiddleware');

// All user routes require authentication
router.use(protect);

router.get('/profile', getProfile);
router.put('/profile', profileValidation, validate, updateProfile);
router.put('/change-password', changePasswordValidation, validate, changePassword);

module.exports = router;
