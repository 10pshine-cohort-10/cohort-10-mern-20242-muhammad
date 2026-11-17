'use strict';

const { body, validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

const usernameRule = () =>
  body('username')
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^\w+$/)
    .withMessage('Username may only contain letters, numbers, and underscores');

const emailRule = () =>
  body('email')
    .normalizeEmail()
    .isEmail()
    .withMessage('Please provide a valid email address');

// --- Validation rule arrays ---

const registerValidation = [
  usernameRule(),
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  emailRule(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
];

const loginValidation = [
  emailRule(),
  body('password').notEmpty().withMessage('Password is required'),
];

const noteValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),
  body('content').notEmpty().withMessage('Content is required'),
];

const updateNoteValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),
  body('content').optional(),
];

const profileValidation = [
  usernameRule(),
  body('email')
    .optional()
    .normalizeEmail()
    .isEmail()
    .withMessage('Please provide a valid email address'),
  body('currentPassword')
    .optional()
    .notEmpty()
    .withMessage('Current password cannot be empty'),
  body('newPassword')
    .optional()
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long'),
];

const changePasswordValidation = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long'),
];

// --- validate middleware ---

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400, 'VALIDATION_ERROR'));
  }
  next();
}

module.exports = {
  registerValidation,
  loginValidation,
  noteValidation,
  updateNoteValidation,
  profileValidation,
  changePasswordValidation,
  validate,
};
