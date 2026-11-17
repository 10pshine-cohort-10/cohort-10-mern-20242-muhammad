'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const db = require('../../src/config/db');
const userModel = require('../../src/models/userModel');
const notesModel = require('../../src/models/notesModel');

describe('Database Access Layer & Models (Unit Tests with Sinon)', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('db.query, db.testConnection & db.transaction', () => {
    it('db.query executes parameterized SQL via pool.execute', async () => {
      const mockRows = [{ id: 1 }];
      const execStub = sinon.stub(db.pool, 'execute').resolves([mockRows, []]);

      const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [1]);

      expect(execStub.calledOnceWithExactly('SELECT * FROM users WHERE id = ?', [1])).to.equal(true);
      expect(rows).to.deep.equal(mockRows);
    });

    it('db.query logs and rethrows database errors', async () => {
      const dbErr = new Error('Connection lost');
      dbErr.code = 'PROTOCOL_CONNECTION_LOST';
      sinon.stub(db.pool, 'execute').rejects(dbErr);

      let caught;
      try {
        await db.query('SELECT 1', []);
      } catch (err) {
        caught = err;
      }

      expect(caught).to.equal(dbErr);
    });

    it('db.testConnection returns success: false when pool.getConnection fails', async () => {
      const connErr = new Error('ECONNREFUSED');
      connErr.code = 'ECONNREFUSED';
      sinon.stub(db.pool, 'getConnection').rejects(connErr);

      const res = await db.testConnection();
      expect(res.success).to.equal(false);
      expect(res.code).to.equal('ECONNREFUSED');
    });

    it('db.transaction commits on success and releases connection', async () => {
      const fakeConn = {
        beginTransaction: sinon.stub().resolves(),
        commit: sinon.stub().resolves(),
        rollback: sinon.stub().resolves(),
        release: sinon.stub(),
      };
      sinon.stub(db.pool, 'getConnection').resolves(fakeConn);

      const output = await db.transaction(async () => 'tx-result');

      expect(output).to.equal('tx-result');
      expect(fakeConn.beginTransaction.calledOnce).to.equal(true);
      expect(fakeConn.commit.calledOnce).to.equal(true);
      expect(fakeConn.rollback.called).to.equal(false);
      expect(fakeConn.release.calledOnce).to.equal(true);
    });

    it('db.transaction rolls back on error and releases connection', async () => {
      const fakeConn = {
        beginTransaction: sinon.stub().resolves(),
        commit: sinon.stub().resolves(),
        rollback: sinon.stub().resolves(),
        release: sinon.stub(),
      };
      sinon.stub(db.pool, 'getConnection').resolves(fakeConn);

      let caught;
      try {
        await db.transaction(async () => {
          throw new Error('Transaction step failed');
        });
      } catch (err) {
        caught = err;
      }

      expect(caught.message).to.equal('Transaction step failed');
      expect(fakeConn.rollback.calledOnce).to.equal(true);
      expect(fakeConn.release.calledOnce).to.equal(true);
    });
  });

  describe('userModel & notesModel parameterized queries', () => {
    it('userModel.findByEmail returns user row or null when not found', async () => {
      sinon.stub(db.pool, 'execute').resolves([[], []]);
      const user = await userModel.findByEmail('missing@example.com');
      expect(user).to.be.null;
    });

    it('notesModel.stripHtml removes HTML tags and collapses whitespace', () => {
      expect(notesModel.stripHtml('<h1>Hello</h1><p>World</p>')).to.equal('Hello World');
      expect(notesModel.stripHtml('')).to.equal('');
    });
  });
});
