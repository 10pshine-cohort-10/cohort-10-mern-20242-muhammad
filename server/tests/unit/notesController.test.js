'use strict';

const { expect } = require('chai');
const sinon = require('sinon');
const notesController = require('../../src/controllers/notesController');
const notesService = require('../../src/services/notesService');
const AppError = require('../../src/utils/AppError');

function makeRes() {
  const res = {};
  res.status = sinon.stub().returns(res);
  res.json = sinon.stub().returns(res);
  return res;
}

describe('notesController (Unit Tests)', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('createNote should return 201 with created note', async () => {
    const req = {
      user: { userId: 10 },
      body: { title: 'My Note', content: '<p>Hello</p>', is_pinned: 1 },
    };
    const res = makeRes();
    const next = sinon.spy();

    const createdNote = { id: 1, user_id: 10, title: 'My Note', content: '<p>Hello</p>', is_pinned: 1 };
    sinon.stub(notesService, 'createNote').resolves(createdNote);

    await notesController.createNote(req, res, next);

    expect(res.status.calledWith(201)).to.equal(true);
    expect(res.json.firstCall.args[0].data.note).to.deep.equal(createdNote);
  });

  it('getAllNotes should return 200 with user notes list', async () => {
    const req = {
      user: { userId: 10 },
      query: { search: 'plan', pinned: 'true', sort: 'newest' },
    };
    const res = makeRes();
    const next = sinon.spy();

    const notesList = [{ id: 1, user_id: 10, title: 'Plan' }];
    sinon.stub(notesService, 'getNotesByUser').resolves(notesList);

    await notesController.getAllNotes(req, res, next);

    expect(res.json.firstCall.args[0].success).to.equal(true);
    expect(res.json.firstCall.args[0].data.notes).to.deep.equal(notesList);
  });

  it('getNoteById should forward 404 AppError to next when note is missing or owned by another user', async () => {
    const req = {
      user: { userId: 20 },
      params: { id: '100' },
    };
    const res = makeRes();
    const next = sinon.spy();

    const notFoundErr = new AppError('Note not found', 404, 'NOTE_NOT_FOUND');
    sinon.stub(notesService, 'getNoteById').rejects(notFoundErr);

    await notesController.getNoteById(req, res, next);

    expect(next.calledOnceWith(notFoundErr)).to.equal(true);
  });

  it('updateNote should return 200 with updated note', async () => {
    const req = {
      user: { userId: 10 },
      params: { id: '100' },
      body: { title: 'Updated' },
    };
    const res = makeRes();
    const next = sinon.spy();

    const updated = { id: 100, user_id: 10, title: 'Updated' };
    sinon.stub(notesService, 'updateNote').resolves(updated);

    await notesController.updateNote(req, res, next);

    expect(res.json.firstCall.args[0].success).to.equal(true);
    expect(res.json.firstCall.args[0].data.note).to.deep.equal(updated);
  });

  it('deleteNote should return 200 when note is deleted by owner', async () => {
    const req = {
      user: { userId: 10 },
      params: { id: '100' },
    };
    const res = makeRes();
    const next = sinon.spy();

    sinon.stub(notesService, 'deleteNote').resolves();

    await notesController.deleteNote(req, res, next);

    expect(res.json.firstCall.args[0].success).to.equal(true);
    expect(res.json.firstCall.args[0].message).to.equal('Note deleted successfully');
  });
});
