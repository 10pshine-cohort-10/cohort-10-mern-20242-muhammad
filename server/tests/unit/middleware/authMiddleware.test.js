'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const authService = require('../../../src/services/authService');
const { protect } = require('../../../src/middleware/authMiddleware');
const AppError = require('../../../src/utils/AppError');
const { JsonWebTokenError, TokenExpiredError } = require('jsonwebtoken');

function makeResMock() {
  return {
    status: sinon.stub().returnsThis(),
    json: sinon.stub().returnsThis(),
  };
}

describe('authMiddleware - protect', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should call next with MISSING_TOKEN AppError when no cookie', () => {
    const req = { cookies: {} };
    const res = makeResMock();
    const next = sinon.spy();

    protect(req, res, next);

    expect(next.calledOnce).to.equal(true);
    const err = next.firstCall.args[0];
    expect(err).to.be.instanceOf(AppError);
    expect(err.code).to.equal('MISSING_TOKEN');
    expect(err.statusCode).to.equal(401);
  });

  it('should call next with INVALID_TOKEN AppError when verifyToken throws JsonWebTokenError', () => {
    const req = { cookies: { token: 'bad.token.here' } };
    const res = makeResMock();
    const next = sinon.spy();

    sinon.stub(authService, 'verifyToken').throws(new JsonWebTokenError('invalid token'));

    protect(req, res, next);

    expect(next.calledOnce).to.equal(true);
    const err = next.firstCall.args[0];
    expect(err).to.be.instanceOf(AppError);
    expect(err.code).to.equal('INVALID_TOKEN');
    expect(err.statusCode).to.equal(401);
  });

  it('should call next with TOKEN_EXPIRED AppError when verifyToken throws TokenExpiredError', () => {
    const req = { cookies: { token: 'expired.token.here' } };
    const res = makeResMock();
    const next = sinon.spy();

    sinon.stub(authService, 'verifyToken').throws(new TokenExpiredError('jwt expired', new Date()));

    protect(req, res, next);

    expect(next.calledOnce).to.equal(true);
    const err = next.firstCall.args[0];
    expect(err).to.be.instanceOf(AppError);
    expect(err.code).to.equal('TOKEN_EXPIRED');
    expect(err.statusCode).to.equal(401);
  });

  it('should set req.user and call next() when token is valid', () => {
    const req = { cookies: { token: 'valid.token.here' } };
    const res = makeResMock();
    const next = sinon.spy();

    const decoded = { userId: 42, email: 'user@example.com' };
    sinon.stub(authService, 'verifyToken').returns(decoded);

    protect(req, res, next);

    expect(next.calledOnce).to.equal(true);
    expect(next.firstCall.args.length).to.equal(0); // called with no error
    expect(req.user).to.deep.equal({ userId: decoded.userId, email: decoded.email });
  });
});
