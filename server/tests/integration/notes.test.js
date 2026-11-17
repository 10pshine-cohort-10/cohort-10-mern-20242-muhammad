'use strict';

const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/app');
const { pool } = require('../../src/config/db');

const AUTH_BASE = '/api/auth';
const NOTES_BASE = '/api/notes';

// ─── Test Users ───────────────────────────────────────────────────────────────
const userA = {
  username: 'userAlpha',
  email: 'userA@example.com',
  password: 'passwordA123',
};

const userB = {
  username: 'userBeta',
  email: 'userB@example.com',
  password: 'passwordB123',
};

describe('Notes API Integration Tests (notes_app_test)', () => {
  let cookieA;
  let cookieB;
  let userANoteId;

  beforeEach(async () => {
    // Truncate tables in test DB before each test to guarantee complete test isolation
    await pool.execute('DELETE FROM notes');
    await pool.execute('DELETE FROM users');

    // Register userA & userB
    await request(app).post(`${AUTH_BASE}/register`).send(userA).expect(201);
    await request(app).post(`${AUTH_BASE}/register`).send(userB).expect(201);

    // Login userA
    const loginA = await request(app)
      .post(`${AUTH_BASE}/login`)
      .send({ email: userA.email, password: userA.password })
      .expect(200);
    cookieA = loginA.headers['set-cookie'][0];

    // Login userB
    const loginB = await request(app)
      .post(`${AUTH_BASE}/login`)
      .send({ email: userB.email, password: userB.password })
      .expect(200);
    cookieB = loginB.headers['set-cookie'][0];

    // Create a base note owned by userA
    const noteRes = await request(app)
      .post(NOTES_BASE)
      .set('Cookie', cookieA)
      .send({
        title: 'User A Secret Note',
        content: '<p>Private content for User A only</p>',
        is_pinned: 0,
      })
      .expect(201);
    userANoteId = noteRes.body.data.note.id;
  });

  after(async () => {
    await pool.execute('DELETE FROM notes');
    await pool.execute('DELETE FROM users');
  });

  // ─── Unauthenticated 401 across all Notes routes ──────────────────────────
  describe('Unauthenticated Access Protection (401 on all routes)', () => {
    it('returns 401 on GET /api/notes, GET /api/notes/:id, POST /api/notes, PUT /api/notes/:id, and DELETE /api/notes/:id without cookie', async () => {
      await request(app).get(NOTES_BASE).expect(401);
      await request(app).get(`${NOTES_BASE}/${userANoteId}`).expect(401);
      await request(app).post(NOTES_BASE).send({ title: 'T', content: '<p>C</p>' }).expect(401);
      await request(app).put(`${NOTES_BASE}/${userANoteId}`).send({ title: 'T' }).expect(401);
      await request(app).delete(`${NOTES_BASE}/${userANoteId}`).expect(401);
    });
  });

  // ─── POST /api/notes & XSS Sanitization ───────────────────────────────────
  describe('POST /api/notes', () => {
    it('should create a note and return 201 with note data and content_text computed', async () => {
      const res = await request(app)
        .post(NOTES_BASE)
        .set('Cookie', cookieA)
        .send({
          title: 'HTML Note',
          content: '<h1>Title</h1><p>Paragraph with <strong>bold</strong> words.</p>',
          is_pinned: 1,
        })
        .expect(201);

      expect(res.body).to.have.property('success', true);
      expect(res.body.data.note).to.have.property('title', 'HTML Note');
      expect(res.body.data.note).to.have.property('content_text');
      expect(res.body.data.note.content_text).to.include('Title Paragraph with bold words.');
      expect(res.body.data.note.is_pinned).to.equal(1);
    });

    it('should sanitize XSS payloads in both title and content when creating a note', async () => {
      const res = await request(app)
        .post(NOTES_BASE)
        .set('Cookie', cookieA)
        .send({
          title: '<script>alert("xss")</script><b>Sanitized Title</b>',
          content: '<p>Hello</p><script>stealCookies()</script><img src="x" onerror="alert(1)" />',
          is_pinned: 0,
        })
        .expect(201);

      expect(res.body.data.note.title).to.equal('Sanitized Title');
      expect(res.body.data.note.content).to.include('<p>Hello</p>');
      expect(res.body.data.note.content).to.not.include('<script>');
      expect(res.body.data.note.content).to.not.include('onerror');
    });

    it('should return 400 when title is empty', async () => {
      const res = await request(app)
        .post(NOTES_BASE)
        .set('Cookie', cookieA)
        .send({ title: '', content: 'Content without title' })
        .expect(400);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('code', 'VALIDATION_ERROR');
    });
  });

  // ─── Mandatory Cross-User Isolation & Search Tests ────────────────────────
  describe('Cross-User Isolation (User A vs User B)', () => {
    beforeEach(async () => {
      await request(app)
        .post(NOTES_BASE)
        .set('Cookie', cookieA)
        .send({
          title: 'Pinned Note Alpha',
          content: '<p>Top priority task</p>',
          is_pinned: 1,
        })
        .expect(201);

      await request(app)
        .post(NOTES_BASE)
        .set('Cookie', cookieA)
        .send({
          title: 'Recipe Book',
          content: '<p>Contains secret recipe ingredients</p>',
          is_pinned: 0,
        })
        .expect(201);

      await request(app)
        .post(NOTES_BASE)
        .set('Cookie', cookieB)
        .send({
          title: 'User B Confidential',
          content: '<p>User B exclusive ideas</p>',
          is_pinned: 0,
        })
        .expect(201);
    });

    it('1. GET /api/notes/:id: User B gets 404 when trying to read User A note', async () => {
      const res = await request(app)
        .get(`${NOTES_BASE}/${userANoteId}`)
        .set('Cookie', cookieB)
        .expect(404);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('code', 'NOTE_NOT_FOUND');
    });

    it('2. PUT /api/notes/:id: User B gets 404 and User A note remains unchanged', async () => {
      await request(app)
        .put(`${NOTES_BASE}/${userANoteId}`)
        .set('Cookie', cookieB)
        .send({ title: 'Hijacked Title', content: '<p>Hijacked Content</p>' })
        .expect(404);

      // Verify User A's note is completely unchanged
      const checkRes = await request(app)
        .get(`${NOTES_BASE}/${userANoteId}`)
        .set('Cookie', cookieA)
        .expect(200);

      expect(checkRes.body.data.note.title).to.equal('User A Secret Note');
      expect(checkRes.body.data.note.content).to.equal('<p>Private content for User A only</p>');
    });

    it('3. DELETE /api/notes/:id: User B gets 404 and User A note remains intact', async () => {
      await request(app)
        .delete(`${NOTES_BASE}/${userANoteId}`)
        .set('Cookie', cookieB)
        .expect(404);

      // Verify User A's note still exists
      const checkRes = await request(app)
        .get(`${NOTES_BASE}/${userANoteId}`)
        .set('Cookie', cookieA)
        .expect(200);

      expect(checkRes.body.data.note.id).to.equal(userANoteId);
    });

    it('4. GET /api/notes: returns ONLY User B own notes when requested by User B', async () => {
      const res = await request(app)
        .get(NOTES_BASE)
        .set('Cookie', cookieB)
        .expect(200);

      expect(res.body.data.notes).to.be.an('array');
      expect(res.body.data.notes.length).to.equal(1);
      expect(res.body.data.notes[0].title).to.equal('User B Confidential');
    });

    it('5. Search (?search=): never returns User A notes to User B', async () => {
      const res = await request(app)
        .get(`${NOTES_BASE}?search=Secret`)
        .set('Cookie', cookieB)
        .expect(200);

      expect(res.body.data.notes).to.be.an('array').that.is.empty;
    });

    it('should return pinned notes at the top of the list and support owner search', async () => {
      const listRes = await request(app)
        .get(NOTES_BASE)
        .set('Cookie', cookieA)
        .expect(200);

      expect(listRes.body.data.notes[0].is_pinned).to.equal(1);
      expect(listRes.body.data.notes[0].title).to.equal('Pinned Note Alpha');

      const searchRes = await request(app)
        .get(`${NOTES_BASE}?search=recipe`)
        .set('Cookie', cookieA)
        .expect(200);

      expect(searchRes.body.data.notes.length).to.equal(1);
      expect(searchRes.body.data.notes[0].title).to.equal('Recipe Book');
    });
  });

  // ─── Owner PUT & DELETE operations ────────────────────────────────────────
  describe('Owner PUT & DELETE /api/notes/:id', () => {
    it('should allow owner to update note and sanitize XSS in updated fields', async () => {
      const res = await request(app)
        .put(`${NOTES_BASE}/${userANoteId}`)
        .set('Cookie', cookieA)
        .send({
          title: 'Updated Note Title',
          content: '<p>New plain text</p><script>evil()</script>',
        })
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body.data.note.title).to.equal('Updated Note Title');
      expect(res.body.data.note.content).to.equal('<p>New plain text</p>');
      expect(res.body.data.note.content_text).to.equal('New plain text');
    });

    it('should delete the note when requested by the owner', async () => {
      const res = await request(app)
        .delete(`${NOTES_BASE}/${userANoteId}`)
        .set('Cookie', cookieA)
        .expect(200);

      expect(res.body).to.have.property('success', true);

      await request(app)
        .get(`${NOTES_BASE}/${userANoteId}`)
        .set('Cookie', cookieA)
        .expect(404);
    });
  });
});
