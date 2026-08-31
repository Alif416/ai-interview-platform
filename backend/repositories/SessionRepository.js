const BaseRepository = require('./BaseRepository')
const { NotFoundError } = require('../core/errors')

class SessionRepository extends BaseRepository {
  constructor(pool) {
    super(pool)
  }

  async createSession(sessionData) {
    const sql = `
      INSERT INTO "InterviewSession"
      (title, role, level, status, "scheduledAt", "interviewerId", "candidateId", "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      RETURNING *
    `

    const session = await this.queryOne(sql, [
      sessionData.title,
      sessionData.role,
      sessionData.level,
      sessionData.status || 'SCHEDULED',
      sessionData.scheduledAt,
      sessionData.interviewerId,
      sessionData.candidateId
    ])

    if (!session) throw new Error('Failed to create session')

    // Fetch related users
    return await this.enrichSessionWithUsers(session)
  }

  async findSessionById(id) {
    const sql = 'SELECT * FROM "InterviewSession" WHERE id = $1'
    const session = await this.queryOne(sql, [id])

    if (!session) {
      throw new NotFoundError('Interview Session')
    }

    return await this.enrichSessionWithUsers(session)
  }

  async findUserSessions(userId, role = null) {
    let sql = `
      SELECT * FROM "InterviewSession"
      WHERE ${role === 'INTERVIEWER'
        ? '"interviewerId" = $1'
        : role === 'CANDIDATE'
          ? '"candidateId" = $1'
          : '("interviewerId" = $1 OR "candidateId" = $1)'}
      ORDER BY "createdAt" DESC
    `

    const sessions = await this.queryMany(sql, [userId])

    // Enrich each session with user data
    return Promise.all(sessions.map(s => this.enrichSessionWithUsers(s)))
  }

  async findSessionsByInterviewer(interviewerId) {
    const sql = `
      SELECT * FROM "InterviewSession"
      WHERE "interviewerId" = $1
      ORDER BY "createdAt" DESC
    `

    const sessions = await this.queryMany(sql, [interviewerId])
    return Promise.all(sessions.map(s => this.enrichSessionWithUsers(s)))
  }

  async updateSession(id, data) {
    const updates = []
    const values = []
    let paramCount = 1

    if (data.title !== undefined) {
      updates.push(`title = $${paramCount++}`)
      values.push(data.title)
    }
    if (data.status !== undefined) {
      updates.push(`status = $${paramCount++}`)
      values.push(data.status)
    }
    if (data.role !== undefined) {
      updates.push(`role = $${paramCount++}`)
      values.push(data.role)
    }
    if (data.level !== undefined) {
      updates.push(`level = $${paramCount++}`)
      values.push(data.level)
    }
    if (data.scheduledAt !== undefined) {
      updates.push(`"scheduledAt" = $${paramCount++}`)
      values.push(data.scheduledAt)
    }

    updates.push(`"updatedAt" = NOW()`)
    values.push(id)

    const sql = `
      UPDATE "InterviewSession"
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    const session = await this.queryOne(sql, values)
    return await this.enrichSessionWithUsers(session)
  }

  async deleteSession(id) {
    const sql = 'DELETE FROM "InterviewSession" WHERE id = $1 RETURNING *'
    return await this.queryOne(sql, [id])
  }

  /**
   * Helper: Enrich session with interviewer and candidate data
   */
  async enrichSessionWithUsers(session) {
    const userSql = 'SELECT id, username, name, email FROM "User" WHERE id = $1'

    const [interviewer, candidate] = await Promise.all([
      this.queryOne(userSql, [session.interviewerId]),
      this.queryOne(userSql, [session.candidateId])
    ])

    return {
      ...session,
      interviewer,
      candidate
    }
  }
}

module.exports = SessionRepository
