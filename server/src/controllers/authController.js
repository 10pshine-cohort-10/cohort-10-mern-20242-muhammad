'use strict';

const userModel = require('../models/userModel');
const authService = require('../services/authService');

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

/**
 * POST /api/auth/register
 */
async function register(req, res, next) {
  try {
    const { name, username, email, password } = req.body;
    const finalUsername = username || (name ? name.toLowerCase().replace(/\s+/g, '_') : email.split('@')[0]);

    const existingEmail = await userModel.findByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'Email already in use', code: 'DUPLICATE_ENTRY' });
    }

    const existingUsername = await userModel.findByUsername(finalUsername);
    if (existingUsername) {
      return res.status(409).json({ success: false, message: 'Username already taken', code: 'DUPLICATE_ENTRY' });
    }

    const password_hash = await authService.hashPassword(password);
    const user = await userModel.create({ name, username: finalUsername, email, password_hash });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: { id: user.id, name: user.name, username: user.username, email: user.email },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    const user = await userModel.findByEmail(email);
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const isValid = await authService.verifyPassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ success: false, message: 'Invalid credentials', code: 'INVALID_CREDENTIALS' });
    }

    const token = authService.signToken({ userId: user.id, email: user.email });

    res.cookie('token', token, cookieOptions);

    return res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user.id, name: user.name, username: user.username, email: user.email },
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 */
async function logout(req, res, next) {
  try {
    res.clearCookie('token', cookieOptions);
    return res.json({ success: true, message: 'Logged out successfully', data: null });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 */
async function getMe(req, res, next) {
  try {
    const user = await userModel.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found', code: 'USER_NOT_FOUND' });
    }
    return res.json({ success: true, message: 'User retrieved successfully', data: { user } });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, getMe };
