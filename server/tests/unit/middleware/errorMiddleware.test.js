'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const AppError = require('../../../src/utils/AppError');
const errorMiddleware = require('../../../src/middleware/errorMiddleware');
const { JsonWebTokenError } = require('jsonwebtoken');

function makeResMock() {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
}

describe('errorMiddleware', () => {
  let req;
  let next;

  beforeEach(() => {
    req = {};
    next = sinon.spy();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should respond 400 with correct JSON for operational AppError', () => {
    const err = new AppError('Validation failed', 400, 'VALIDATION_ERROR');
    const res = makeResMock();

    errorMiddleware(err, req, res, next);

    expect(res.status.calledWith(400)).to.equal(true);
    const body = res.json.firstCall.args[0];
    expect(body.success).to.equal(false);
    expect(body.code).to.equal('VALIDATION_ERROR');
    expect(body.message).to.equal('Validation failed');
  });

  it('should respond 500 for non-operational errors', () => {
    const err = new Error('Something went badly wrong');
    err.isOperational = false;
    const res = makeResMock();

    errorMiddleware(err, req, res, next);

    expect(res.status.calledWith(500)).to.equal(true);
    const body = res.json.firstCall.args[0];
    expect(body.success).to.equal(false);
    expect(body.code).to.equal('SERVER_ERROR');
  });

  it('should respond 409 for ER_DUP_ENTRY mysql error', () => {
    const err = new Error('Duplicate entry');
    err.code = 'ER_DUP_ENTRY';
    const res = makeResMock();

    errorMiddleware(err, req, res, next);

    expect(res.status.calledWith(409)).to.equal(true);
    const body = res.json.firstCall.args[0];
    expect(body.success).to.equal(false);
    expect(body.code).to.equal('DUPLICATE_ENTRY');
  });

  it('should respond 401 for JsonWebTokenError', () => {
    const err = new JsonWebTokenError('invalid signature');
    const res = makeResMock();

    errorMiddleware(err, req, res, next);

    expect(res.status.calledWith(401)).to.equal(true);
    const body = res.json.firstCall.args[0];
    expect(body.success).to.equal(false);
    expect(body.code).to.equal('AUTH_ERROR');
  });
});
