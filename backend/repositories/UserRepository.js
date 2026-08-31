const BaseRepository = require('./BaseRepository')
const { NotFoundError, ConflictError } = require('../core/errors')

/**
 * User Repository
 * Handles all database operations related to users
 * Uses raw SQL queries for direct database access
 */
class UserRepository extends BaseRepository {
  constructor(pool) {
    super(pool)
  }

  async findById(id) {
    const sql = 'SELECT * FROM "User" WHERE id = $1'
    const user = await this.queryOne(sql, [id])

    if (!user) {
      throw new NotFoundError('User')
    }

    return user
  }

  async findByEmail(email) {
    const sql = 'SELECT * FROM "User" WHERE email = $1'
    const user = await this.queryOne(sql, [email])

    if (!user) {
      throw new NotFoundError('User')
    }

    return user
  }

  async findByUsername(username) {
    const sql = 'SELECT * FROM "User" WHERE username = $1'
    const user = await this.queryOne(sql, [username])

    if (!user) {
      throw new NotFoundError('User')
    }

    return user
  }

  async findByIdWithoutThrow(id) {
    const sql = 'SELECT * FROM "User" WHERE id = $1'
    return await this.queryOne(sql, [id])
  }

  async findByEmailWithoutThrow(email) {
    const sql = 'SELECT * FROM "User" WHERE email = $1'
    return await this.queryOne(sql, [email])
  }

  async findByUsernameWithoutThrow(username) {
    const sql = 'SELECT * FROM "User" WHERE username = $1'
    return await this.queryOne(sql, [username])
  }

  async create(userData) {
    // Check for existing email
    const existingEmail = await this.findByEmailWithoutThrow(userData.email)
    if (existingEmail) {
      throw new ConflictError('Email already registered')
    }

    // Check for existing username
    const existingUsername = await this.findByUsernameWithoutThrow(userData.username)
    if (existingUsername) {
      throw new ConflictError('Username already taken')
    }

    const sql = `
      INSERT INTO "User" (email, username, password, name, role, "createdAt", "updatedAt")
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `

    return await this.queryOne(sql, [
      userData.email,
      userData.username,
      userData.password,
      userData.name,
      userData.role || 'CANDIDATE'
    ])
  }

  async updateUser(id, userData) {
    const updates = []
    const values = []
    let paramCount = 1

    // Dynamically build UPDATE query
    if (userData.name !== undefined) {
      updates.push(`name = $${paramCount++}`)
      values.push(userData.name)
    }
    if (userData.username !== undefined) {
      updates.push(`username = $${paramCount++}`)
      values.push(userData.username)
    }
    if (userData.password !== undefined) {
      updates.push(`password = $${paramCount++}`)
      values.push(userData.password)
    }
    if (userData.resetToken !== undefined) {
      updates.push(`"resetToken" = $${paramCount++}`)
      values.push(userData.resetToken)
    }
    if (userData.resetTokenExpiry !== undefined) {
      updates.push(`"resetTokenExpiry" = $${paramCount++}`)
      values.push(userData.resetTokenExpiry)
    }

    // Always update updatedAt
    updates.push(`"updatedAt" = NOW()`)
    values.push(id)

    const sql = `
      UPDATE "User"
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `

    return await this.queryOne(sql, values)
  }

  async findByResetToken(token) {
    const sql = 'SELECT * FROM "User" WHERE "resetToken" = $1'
    const user = await this.queryOne(sql, [token])

    if (!user) {
      throw new NotFoundError('User')
    }

    return user
  }

  async getUserProfile(id) {
    const sql = `
      SELECT
        id, email, username, name, role, "createdAt", "updatedAt"
      FROM "User"
      WHERE id = $1
    `

    const user = await this.queryOne(sql, [id])

    if (!user) {
      throw new NotFoundError('User')
    }

    return user
  }

  async deleteUserPermanently(id) {
    const client = await this.startTransaction()

    try {
      // Delete evaluations
      await client.query('DELETE FROM "AIEvaluation" WHERE "userId" = $1', [id])

      // Delete sessions where user is interviewer or candidate
      await client.query(
        'DELETE FROM "InterviewSession" WHERE "interviewerId" = $1 OR "candidateId" = $1',
        [id]
      )

      // Delete user
      const result = await client.query('DELETE FROM "User" WHERE id = $1 RETURNING *', [id])

      await this.commitTransaction(client)

      return result.rows[0]
    } catch (error) {
      await this.rollbackTransaction(client)
      throw error
    }
  }
}

module.exports = UserRepository
