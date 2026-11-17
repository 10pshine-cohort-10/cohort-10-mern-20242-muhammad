'use strict';

const request = require('supertest');
const { expect } = require('chai');
const app = require('../../src/app');
const { pool } = require('../../src/config/db');

// ─── Helpers ──────────────────────────────────────────────────────────────────
const BASE = '/api/auth';

const validUser = {
  username: 'testuser',
  email: 'testuser@example.com',
  password: 'password123',
};

// ─── Suite ───────────────────────────────────────────────────────────────────
describe('Auth API Integration Tests', () => {
  beforeEach(async () => {
    // Truncate tables before each test to guarantee complete test isolation
    await pool.execute('DELETE FROM notes');
    await pool.execute('DELETE FROM users');
  });

  after(async () => {
    await pool.execute('DELETE FROM notes');
    await pool.execute('DELETE FROM users');
  });

  // ─── POST /api/auth/register ─────────────────────────────────────────────
  describe('POST /api/auth/register', () => {
    it('should register a new user and return 201 with user data', async () => {
      const res = await request(app)
        .post(`${BASE}/register`)
        .send(validUser)
        .expect(201);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('message');
      expect(res.body).to.have.property('data');
      expect(res.body.data.user).to.have.property('email', validUser.email);
      expect(res.body.data.user).to.have.property('username', validUser.username);
      // No cookie set on register
      expect(res.headers['set-cookie']).to.be.undefined;
    });

    it('should return 409 when email already exists', async () => {
      await request(app).post(`${BASE}/register`).send(validUser).expect(201);

      const res = await request(app)
        .post(`${BASE}/register`)
        .send({ ...validUser, username: 'differentUsername' })
        .expect(409);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('code', 'DUPLICATE_ENTRY');
    });

    it('should return 409 when username already exists', async () => {
      await request(app).post(`${BASE}/register`).send(validUser).expect(201);

      const res = await request(app)
        .post(`${BASE}/register`)
        .send({ ...validUser, email: 'different@example.com' })
        .expect(409);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('code', 'DUPLICATE_ENTRY');
    });

    it('should return 400 when password is too short (< 8 chars)', async () => {
      const res = await request(app)
        .post(`${BASE}/register`)
        .send({ username: 'newuser2', email: 'newuser2@example.com', password: 'short' })
        .expect(400);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('code', 'VALIDATION_ERROR');
    });

    it('should return 400 when email is invalid', async () => {
      const res = await request(app)
        .post(`${BASE}/register`)
        .send({ username: 'newuser3', email: 'not-an-email', password: 'password123' })
        .expect(400);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('code', 'VALIDATION_ERROR');
    });
  });

  // ─── POST /api/auth/login ────────────────────────────────────────────────
  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post(`${BASE}/register`).send(validUser).expect(201);
    });

    it('should login and return 200 with Set-Cookie header containing token', async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .send({ email: validUser.email, password: validUser.password })
        .expect(200);

      expect(res.headers['set-cookie']).to.be.an('array');
      const cookieHeader = res.headers['set-cookie'].join('; ');
      expect(cookieHeader).to.include('token=');
      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('message');
      expect(res.body.data.user).to.have.property('email', validUser.email);
    });

    it('should return 401 for wrong password', async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .send({ email: validUser.email, password: 'wrongpassword' })
        .expect(401);

      expect(res.body).to.have.property('success', false);
      expect(res.body).to.have.property('code', 'INVALID_CREDENTIALS');
    });

    it('should return 401 for non-existent email', async () => {
      const res = await request(app)
        .post(`${BASE}/login`)
        .send({ email: 'nobody@example.com', password: 'password123' })
        .expect(401);

      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.equal('Invalid credentials');
    });
  });

  // ─── GET /api/auth/me ────────────────────────────────────────────────────
  describe('GET /api/auth/me', () => {
    it('should return 401 without cookie', async () => {
      const res = await request(app).get(`${BASE}/me`).expect(401);
      expect(res.body).to.have.property('success', false);
    });

    it('should return current user when authenticated', async () => {
      await request(app).post(`${BASE}/register`).send(validUser).expect(201);

      const loginRes = await request(app)
        .post(`${BASE}/login`)
        .send({ email: validUser.email, password: validUser.password });

      const cookie = loginRes.headers['set-cookie'][0];

      const res = await request(app)
        .get(`${BASE}/me`)
        .set('Cookie', cookie)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body.data.user).to.have.property('email', validUser.email);
    });
  });

  // ─── POST /api/auth/logout ───────────────────────────────────────────────
  describe('POST /api/auth/logout', () => {
    it('should return 200 and clear the cookie', async () => {
      const res = await request(app)
        .post(`${BASE}/logout`)
        .expect(200);

      expect(res.body).to.have.property('success', true);
      expect(res.body).to.have.property('message', 'Logged out successfully');
      const setCookie = res.headers['set-cookie'];
      if (setCookie) {
        const cookieStr = setCookie.join('; ');
        const isCleared =
          cookieStr.includes('Max-Age=0') ||
          cookieStr.includes('Expires=') ||
          cookieStr.includes('token=;');
        expect(isCleared).to.equal(true);
      }
    });
  });
});
