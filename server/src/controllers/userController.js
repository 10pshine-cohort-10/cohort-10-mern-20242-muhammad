'use strict';

const userModel = require('../models/userModel');
const authService = require('../services/authService');

/**
 * GET /api/users/profile
 */
async function getProfile(req, res, next) {
  try {
    const user = await userModel.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' });
    }
    return res.json({
      success: true,
      message: 'Profile retrieved successfully',
      data: { user },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/users/profile
 */
async function updateProfile(req, res, next) {
  try {
    const { username, email, currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await userModel.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' });
    }

    const isEmailChanging = Boolean(email && email.toLowerCase() !== user.email.toLowerCase());
    const isPasswordChanging = Boolean(newPassword);

    if (isEmailChanging || isPasswordChanging) {
      if (!currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password is required', code: 'PASSWORD_REQUIRED' });
      }
      const isValid = await authService.verifyPassword(currentPassword, user.password_hash);
      if (!isValid) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect', code: 'INVALID_PASSWORD' });
      }
    }

    if (isEmailChanging) {
      const existingEmailUser = await userModel.findByEmail(email);
      if (existingEmailUser && existingEmailUser.id !== userId) {
        return res.status(409).json({ success: false, message: 'Email already in use', code: 'DUPLICATE_ENTRY' });
      }
    }

    if (username && username !== user.username) {
      const existingNameUser = await userModel.findByUsername(username);
      if (existingNameUser && existingNameUser.id !== userId) {
        return res.status(409).json({ success: false, message: 'Username already taken', code: 'DUPLICATE_ENTRY' });
      }
    }

    await userModel.updateProfile(userId, {
      username: username || user.username,
      email: isEmailChanging ? email : user.email,
    });

    if (isPasswordChanging) {
      if (currentPassword === newPassword) {
        return res.status(400).json({ success: false, message: 'New password must be different from current password', code: 'SAME_PASSWORD' });
      }
      const newHash = await authService.hashPassword(newPassword);
      await userModel.updatePassword(userId, newHash);
    }

    const updatedUser = await userModel.findById(userId);
    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user: updatedUser },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/users/change-password
 */
async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.userId;

    const user = await userModel.findByEmail(req.user.email);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' });
    }

    const isValid = await authService.verifyPassword(currentPassword, user.password_hash);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect', code: 'INVALID_PASSWORD' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password must be different from current password', code: 'SAME_PASSWORD' });
    }

    const newHash = await authService.hashPassword(newPassword);
    await userModel.updatePassword(userId, newHash);

    return res.json({
      success: true,
      message: 'Password changed successfully',
      data: null,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getProfile, updateProfile, changePassword };
