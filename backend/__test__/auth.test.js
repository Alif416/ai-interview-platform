const request = require('supertest')
const app = require('../server')
const { createTestUser } = require('./helpers')

describe('Auth Endpoints', () => {

  // ── Registration Tests ───────────────────────────
  describe('POST /api/v1/auth/register', () => {

    test('should register a new user successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Alif',
          email: 'alif@test.com',
          password: 'password123',
          role: 'CANDIDATE'
        })

      expect(response.status).toBe(201)
      expect(response.body.success).toBe(true)
      expect(response.body.data.user.email).toBe('alif@test.com')
      expect(response.body.data.token).toBeDefined()
      // CRITICAL: password must never be returned
      expect(response.body.data.user.password).toBeUndefined()
    })

    test('should fail with invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Alif',
          email: 'notanemail',
          password: 'password123'
        })

      expect(response.status).toBe(400)
      expect(response.body.success).toBe(false)
      expect(response.body.errors[0].field).toBe('email')
    })

    test('should fail with short password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Alif',
          email: 'alif@test.com',
          password: '123'
        })

      expect(response.status).toBe(400)
      expect(response.body.errors[0].field).toBe('password')
    })

    test('should fail with duplicate email', async () => {
      // Create user first
      await createTestUser({ email: 'alif@test.com' })

      // Try to register same email
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Alif',
          email: 'alif@test.com',
          password: 'password123'
        })

      expect(response.status).toBe(400)
      expect(response.body.message).toBe('Email already registered')
    })

    test('should lowercase email automatically', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          name: 'Alif',
          email: 'ALIF@TEST.COM',
          password: 'password123'
        })

      expect(response.status).toBe(201)
      expect(response.body.data.user.email).toBe('alif@test.com')
    })
  })

  // ── Login Tests ──────────────────────────────────
  describe('POST /api/v1/auth/login', () => {

    test('should login successfully with correct credentials', async () => {
      await createTestUser({ email: 'alif@test.com' })

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'alif@test.com',
          password: 'password123'
        })

      expect(response.status).toBe(200)
      expect(response.body.data.token).toBeDefined()
      expect(response.body.data.user.password).toBeUndefined()
    })

    test('should fail with wrong password', async () => {
      await createTestUser({ email: 'alif@test.com' })

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'alif@test.com',
          password: 'wrongpassword'
        })

      expect(response.status).toBe(401)
      expect(response.body.message).toBe('Invalid email or password')
    })

    test('should fail with non-existent email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'nobody@test.com',
          password: 'password123'
        })

      expect(response.status).toBe(401)
      // Same message — never reveal which field was wrong
      expect(response.body.message).toBe('Invalid email or password')
    })
  })

  // ── Get Me Tests ─────────────────────────────────
  describe('GET /api/v1/auth/me', () => {

    test('should return current user with valid token', async () => {
      const { token } = await createTestUser({ email: 'alif@test.com' })

      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)

      expect(response.status).toBe(200)
      expect(response.body.data.email).toBe('alif@test.com')
    })

    test('should return 401 with no token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')

      expect(response.status).toBe(401)
    })

    test('should return 401 with invalid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer invalidtoken123')

      expect(response.status).toBe(401)
    })
  })
})