'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const notesService = require('../../src/services/notesService');
const notesModel = require('../../src/models/notesModel');
const AppError = require('../../src/utils/AppError');

describe('notesService (Unit Tests with Sinon DB Mocks)', () => {
  const userAId = 10;
  const userBId = 20;
  const userANote = {
    id: 100,
    user_id: userAId,
    title: 'User A Private Note',
    content: '<p>Confidential data belonging to User A</p>',
    content_text: 'Confidential data belonging to User A',
    is_pinned: 0,
  };

  afterEach(() => {
    sinon.restore();
  });

  // ─── assertOwnership ───────────────────────────────────────────────────────
  describe('assertOwnership', () => {
    it('should throw 404 AppError when note is null', () => {
      let thrownError;
      try {
        notesService.assertOwnership(null, userAId);
      } catch (err) {
        thrownError = err;
      }
      expect(thrownError).to.be.instanceOf(AppError);
      expect(thrownError.statusCode).to.equal(404);
      expect(thrownError.code).to.equal('NOTE_NOT_FOUND');
    });

    it('should throw 404 AppError when note.user_id !== userId', () => {
      let thrownError;
      try {
        notesService.assertOwnership(userANote, userBId);
      } catch (err) {
        thrownError = err;
      }
      expect(thrownError).to.be.instanceOf(AppError);
      expect(thrownError.statusCode).to.equal(404);
      expect(thrownError.code).to.equal('NOTE_NOT_FOUND');
    });

    it('should not throw when note.user_id === userId', () => {
      expect(() => notesService.assertOwnership(userANote, userAId)).to.not.throw();
    });
  });

  // ─── Mandatory Cross-User Access Unit Tests (Service Level with Sinon) ─────
  describe('Cross-User Isolation (User A vs User B)', () => {
    it('1. GET note by ID: User B gets 404 when trying to read User A note', async () => {
      sinon.stub(notesModel, 'findById').withArgs(100, userBId).resolves(null);

      let thrown;
      try {
        await notesService.getNoteById(100, userBId);
      } catch (err) {
        thrown = err;
      }

      expect(thrown).to.be.instanceOf(AppError);
      expect(thrown.statusCode).to.equal(404);
      expect(thrown.code).to.equal('NOTE_NOT_FOUND');
    });

    it('2. PUT note by ID: User B gets 404 and note is unchanged when trying to update User A note', async () => {
      sinon.stub(notesModel, 'findById').withArgs(100, userBId).resolves(null);
      const updateSpy = sinon.stub(notesModel, 'update');

      let thrown;
      try {
        await notesService.updateNote(100, userBId, {
          title: 'Hijacked by User B',
          content: '<p>Tampered</p>',
        });
      } catch (err) {
        thrown = err;
      }

      expect(thrown).to.be.instanceOf(AppError);
      expect(thrown.statusCode).to.equal(404);
      expect(updateSpy.called).to.equal(false);
    });

    it('3. DELETE note by ID: User B gets 404 and note is unchanged when trying to delete User A note', async () => {
      sinon.stub(notesModel, 'findById').withArgs(100, userBId).resolves(null);
      const deleteSpy = sinon.stub(notesModel, 'deleteById');

      let thrown;
      try {
        await notesService.deleteNote(100, userBId);
      } catch (err) {
        thrown = err;
      }

      expect(thrown).to.be.instanceOf(AppError);
      expect(thrown.statusCode).to.equal(404);
      expect(deleteSpy.called).to.equal(false);
    });

    it('4. List notes: getNotesByUser for User B returns only User B notes', async () => {
      const userBNotes = [{ id: 201, user_id: userBId, title: 'User B Own Note' }];
      const findStub = sinon.stub(notesModel, 'findAllByUser').withArgs(userBId, {}).resolves(userBNotes);

      const result = await notesService.getNotesByUser(userBId, {});

      expect(findStub.calledOnceWithExactly(userBId, {})).to.equal(true);
      expect(result).to.deep.equal(userBNotes);
      expect(result.every((n) => n.user_id === userBId)).to.equal(true);
    });

    it('5. Search notes: getNotesByUser with ?search= scopes strictly to User B and never returns User A notes', async () => {
      const findStub = sinon
        .stub(notesModel, 'findAllByUser')
        .withArgs(userBId, { search: 'Confidential' })
        .resolves([]);

      const result = await notesService.getNotesByUser(userBId, { search: 'Confidential' });

      expect(findStub.calledOnceWithExactly(userBId, { search: 'Confidential' })).to.equal(true);
      expect(result).to.be.an('array').that.is.empty;
    });
  });

  // ─── XSS Sanitization & Validation in Service Layer ────────────────────────
  describe('XSS Sanitization & Validation', () => {
    it('strips <script>, onerror, and HTML tags from title and dangerous payloads from content on createNote', async () => {
      const createStub = sinon.stub(notesModel, 'create').callsFake(async (data) => ({
        id: 55,
        ...data,
      }));

      const result = await notesService.createNote(userAId, {
        title: '<script>alert("xss")</script><b>Clean Heading</b>',
        content: '<p>Safe paragraph</p><script>evil()</script><img src="x" onerror="alert(1)" /><a href="javascript:alert(1)">Bad Link</a>',
        is_pinned: 1,
      });

      expect(createStub.calledOnce).to.equal(true);
      expect(result.title).to.equal('Clean Heading');
      expect(result.content).to.include('<p>Safe paragraph</p>');
      expect(result.content).to.not.include('<script>');
      expect(result.content).to.not.include('onerror');
      expect(result.content).to.not.include('javascript:');
    });

    it('throws 400 VALIDATION_ERROR when title becomes empty after stripping HTML tags', async () => {
      let thrown;
      try {
        await notesService.createNote(userAId, {
          title: '<script>alert(1)</script>',
          content: '<p>Valid content</p>',
        });
      } catch (err) {
        thrown = err;
      }

      expect(thrown).to.be.instanceOf(AppError);
      expect(thrown.statusCode).to.equal(400);
      expect(thrown.code).to.equal('VALIDATION_ERROR');
    });

    it('propagates database failures when notesModel throws', async () => {
      sinon.stub(notesModel, 'findAllByUser').rejects(new Error('ER_ACCESS_DENIED_ERROR'));

      let thrown;
      try {
        await notesService.getNotesByUser(userAId);
      } catch (err) {
        thrown = err;
      }

      expect(thrown).to.be.an('error');
      expect(thrown.message).to.equal('ER_ACCESS_DENIED_ERROR');
    });
  });
});
