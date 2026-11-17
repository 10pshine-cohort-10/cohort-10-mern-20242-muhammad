'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const authController = require('../../src/controllers/authController');
const userModel = require('../../src/models/userModel');
const authService = require('../../src/services/authService');
const AppError = require('../../src/utils/AppError');

function makeRes() {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  res.cookie = sinon.stub().returns(res);
  res.clearCookie = sinon.stub().returns(res);
  return res;
}

describe('authController (Unit Tests)', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('register', () => {
    it('should register a new user and return 201', async () => {
      const req = {
        body: { username: 'farhan', email: 'farhan@example.com', password: 'Password123' },
      };
      const res = makeRes();
      const next = sinon.spy();

      sinon.stub(userModel, 'findByEmail').resolves(null);
      sinon.stub(userModel, 'findByUsername').resolves(null);
      sinon.stub(authService, 'hashPassword').resolves('$2b$12$hashedpassword');
      sinon.stub(userModel, 'create').resolves({
        id: 1,
        name: 'farhan',
        username: 'farhan',
        email: 'farhan@example.com',
      });

      await authController.register(req, res, next);

      expect(res.status.calledWith(201)).to.equal(true);
      const payload = res.json.firstCall.args[0];
      expect(payload.success).to.equal(true);
      expect(payload.data.user.email).to.equal('farhan@example.com');
      expect(payload.data.user).to.not.have.property('password_hash');
    });

    it('should call next with 409 AppError when email already exists', async () => {
      const req = {
        body: { username: 'farhan', email: 'existing@example.com', password: 'Password123' },
      };
      const res = makeRes();
      const next = sinon.spy();

      sinon.stub(userModel, 'findByEmail').resolves({ id: 9, email: 'existing@example.com' });

      await authController.register(req, res, next);

      expect(next.calledOnce).to.equal(true);
      const err = next.firstCall.args[0];
      expect(err).to.be.instanceOf(AppError);
      expect(err.statusCode).to.equal(409);
      expect(err.code).to.equal('DUPLICATE_ENTRY');
    });

    it('should forward database errors to next()', async () => {
      const req = {
        body: { username: 'farhan', email: 'farhan@example.com', password: 'Password123' },
      };
      const res = makeRes();
      const next = sinon.spy();

      const dbError = new Error('DB connection lost');
      sinon.stub(userModel, 'findByEmail').rejects(dbError);

      await authController.register(req, res, next);

      expect(next.calledOnceWith(dbError)).to.equal(true);
    });
  });

  describe('login', () => {
    it('should set HttpOnly cookie and return 200 on valid credentials', async () => {
      const req = {
        body: { email: 'farhan@example.com', password: 'Password123' },
      };
      const res = makeRes();
      const next = sinon.spy();

      sinon.stub(userModel, 'findByEmail').resolves({
        id: 1,
        name: 'Farhan',
        username: 'farhan',
        email: 'farhan@example.com',
        password_hash: '$2b$12$hash',
      });
      sinon.stub(authService, 'verifyPassword').resolves(true);
      sinon.stub(authService, 'signToken').returns('signed.jwt.token');

      await authController.login(req, res, next);

      expect(res.cookie.calledOnce).to.equal(true);
      expect(res.cookie.firstCall.args[0]).to.equal('token');
      expect(res.cookie.firstCall.args[1]).to.equal('signed.jwt.token');
      const payload = res.json.firstCall.args[0];
      expect(payload.success).to.equal(true);
      expect(payload.data.user.email).to.equal('farhan@example.com');
    });

    it('should call next with 401 INVALID_CREDENTIALS when user is not found', async () => {
      const req = {
        body: { email: 'unknown@example.com', password: 'Password123' },
      };
      const res = makeRes();
      const next = sinon.spy();

      sinon.stub(userModel, 'findByEmail').resolves(null);

      await authController.login(req, res, next);

      const err = next.firstCall.args[0];
      expect(err).to.be.instanceOf(AppError);
      expect(err.statusCode).to.equal(401);
      expect(err.message).to.equal('Invalid credentials');
    });

    it('should call next with 401 INVALID_CREDENTIALS when password is wrong', async () => {
      const req = {
        body: { email: 'farhan@example.com', password: 'WrongPassword' },
      };
      const res = makeRes();
      const next = sinon.spy();

      sinon.stub(userModel, 'findByEmail').resolves({
        id: 1,
        email: 'farhan@example.com',
        password_hash: '$2b$12$hash',
      });
      sinon.stub(authService, 'verifyPassword').resolves(false);

      await authController.login(req, res, next);

      const err = next.firstCall.args[0];
      expect(err).to.be.instanceOf(AppError);
      expect(err.statusCode).to.equal(401);
      expect(err.message).to.equal('Invalid credentials');
    });
  });

  describe('logout & getMe', () => {
    it('should clear token cookie on logout', async () => {
      const req = { user: { userId: 1 } };
      const res = makeRes();
      const next = sinon.spy();

      await authController.logout(req, res, next);

      expect(res.clearCookie.calledOnce).to.equal(true);
      expect(res.json.firstCall.args[0].success).to.equal(true);
    });

    it('should return 404 when getMe user does not exist in DB', async () => {
      const req = { user: { userId: 999 } };
      const res = makeRes();
      const next = sinon.spy();

      sinon.stub(userModel, 'findById').resolves(null);

      await authController.getMe(req, res, next);

      const err = next.firstCall.args[0];
      expect(err).to.be.instanceOf(AppError);
      expect(err.statusCode).to.equal(404);
    });
  });
});
