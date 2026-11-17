'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const jwt = require('jsonwebtoken');
const authService = require('../../src/services/authService');

// Ensure JWT_SECRET is set for tests
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';

describe('authService', () => {
  afterEach(() => {
    sinon.restore();
  });

  // ─── hashPassword ────────────────────────────────────────────────────────────
  describe('hashPassword', () => {
    it('should return a string', async () => {
      const hash = await authService.hashPassword('password123');
      expect(hash).to.be.a('string');
    });

    it('should return a bcrypt hash (starts with $2b$)', async () => {
      const hash = await authService.hashPassword('password123');
      expect(hash).to.match(/^\$2b\$/);
    });

    it('should hash different passwords differently', async () => {
      const hash1 = await authService.hashPassword('password123');
      const hash2 = await authService.hashPassword('differentPassword');
      expect(hash1).to.not.equal(hash2);
    });
  });

  // ─── verifyPassword ──────────────────────────────────────────────────────────
  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'mySecret123';
      const hash = await authService.hashPassword(password);
      const result = await authService.verifyPassword(password, hash);
      expect(result).to.equal(true);
    });

    it('should return false for wrong password', async () => {
      const hash = await authService.hashPassword('correctPassword');
      const result = await authService.verifyPassword('wrongPassword', hash);
      expect(result).to.equal(false);
    });
  });

  // ─── signToken ───────────────────────────────────────────────────────────────
  describe('signToken', () => {
    it('should return a string', () => {
      const token = authService.signToken({ userId: 1, email: 'test@example.com' });
      expect(token).to.be.a('string');
    });

    it('should contain expected payload when decoded', () => {
      const payload = { userId: 42, email: 'user@example.com' };
      const token = authService.signToken(payload);
      const decoded = jwt.decode(token);
      expect(decoded.userId).to.equal(payload.userId);
      expect(decoded.email).to.equal(payload.email);
    });
  });

  // ─── verifyToken ─────────────────────────────────────────────────────────────
  describe('verifyToken', () => {
    it('should decode a valid token', () => {
      const payload = { userId: 7, email: 'verify@example.com' };
      const token = authService.signToken(payload);
      const decoded = authService.verifyToken(token);
      expect(decoded.userId).to.equal(payload.userId);
      expect(decoded.email).to.equal(payload.email);
    });

    it('should throw on invalid token', () => {
      expect(() => authService.verifyToken('this.is.not.valid')).to.throw(jwt.JsonWebTokenError);
    });

    it('should throw on expired token', async () => {
      // Sign a token that expires immediately
      const token = jwt.sign(
        { userId: 99 },
        process.env.JWT_SECRET,
        { expiresIn: '1ms' }
      );
      // Wait a bit to let it expire
      await new Promise((resolve) => setTimeout(resolve, 10));
      expect(() => authService.verifyToken(token)).to.throw(jwt.TokenExpiredError);
    });
  });
});
