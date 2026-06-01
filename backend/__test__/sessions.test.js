const request = require('supertest')
const app = require('../server')
const {
  createTestUser,
  createTestInterviewer,
  createTestSession
} = require('./helpers')

describe('Session Endpoints', () => {

  describe('GET /api/v1/sessions', () => {

    test('should return all sessions publicly', async () => {
      const { user: interviewer } = await createTestInterviewer()
      const { user: candidate } = await createTestUser()
      await createTestSession(interviewer.id, candidate.id)

      const response = await request(app).get('/api/v1/sessions')

      expect(response.status).toBe(200)
      expect(response.body.data.count).toBe(1)
      expect(response.body.data.sessions).toHaveLength(1)
    })

    test('should filter sessions by status', async () => {
      const { user: interviewer } = await createTestInterviewer()
      const { user: candidate } = await createTestUser()
      await createTestSession(interviewer.id, candidate.id)

      const response = await request(app)
        .get('/api/v1/sessions?status=SCHEDULED')

      expect(response.status).toBe(200)
      expect(response.body.data.sessions[0].status).toBe('SCHEDULED')
    })
  })

  describe('POST /api/v1/sessions', () => {

    test('should create session as interviewer', async () => {
      const { token, user: interviewer } = await createTestInterviewer()
      const { user: candidate } = await createTestUser()

      const response = await request(app)
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Google L3 Interview',
          role: 'Software Engineer',
          level: 'L3',
          scheduledAt: '2024-12-01T10:00:00Z',
          interviewerId: interviewer.id,
          candidateId: candidate.id
        })

      expect(response.status).toBe(201)
      expect(response.body.data.title).toBe('Google L3 Interview')
    })

    test('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/v1/sessions')
        .send({
          title: 'Test Interview',
          role: 'Engineer',
          level: 'L3',
          scheduledAt: '2024-12-01T10:00:00Z',
          interviewerId: 1,
          candidateId: 2
        })

      expect(response.status).toBe(401)
    })

    test('should return 403 when candidate tries to create session', async () => {
      const { token } = await createTestUser({ role: 'CANDIDATE' })

      const response = await request(app)
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Interview',
          role: 'Engineer',
          level: 'L3',
          scheduledAt: '2024-12-01T10:00:00Z',
          interviewerId: 1,
          candidateId: 2
        })

      expect(response.status).toBe(403)
    })

    test('should fail with invalid level', async () => {
      const { token } = await createTestInterviewer()

      const response = await request(app)
        .post('/api/v1/sessions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: 'Test Interview',
          role: 'Engineer',
          level: 'L99',
          scheduledAt: '2024-12-01T10:00:00Z',
          interviewerId: 1,
          candidateId: 2
        })

      expect(response.status).toBe(400)
      expect(response.body.errors[0].field).toBe('level')
    })
  })
})