const BaseRepository = require('./BaseRepository')
const { NotFoundError } = require('../core/errors')

class ProblemRepository extends BaseRepository {
  constructor(pool) {
    super(pool)
  }

  async findProblemById(id) {
    const sql = 'SELECT * FROM "Problem" WHERE id = $1'
    const problem = await this.queryOne(sql, [id])

    if (!problem) {
      throw new NotFoundError('Problem')
    }

    return problem
  }

  async findProblemBySlug(slug) {
    const sql = 'SELECT * FROM "Problem" WHERE slug = $1'
    const problem = await this.queryOne(sql, [slug])

    if (!problem) {
      throw new NotFoundError('Problem')
    }

    return problem
  }

  async findAllProblems(filters = {}) {
    const { difficulty, tag, search, skip = 0, take = 20 } = filters

    let whereConditions = []
    let params = []
    let paramCount = 1

    // Build WHERE clause dynamically
    if (difficulty) {
      whereConditions.push(`difficulty = $${paramCount++}`)
      params.push(difficulty)
    }

    if (tag) {
      whereConditions.push(`$${paramCount++} = ANY(tags)`)
      params.push(tag)
    }

    if (search) {
      const searchPattern = `%${search}%`
      whereConditions.push(
        `(title ILIKE $${paramCount} OR description ILIKE $${paramCount + 1})`
      )
      params.push(searchPattern, searchPattern)
      paramCount += 2
    }

    const whereClause = whereConditions.length > 0
      ? `WHERE ${whereConditions.join(' AND ')}`
      : ''

    // Get total count
    const countSql = `SELECT COUNT(*) as total FROM "Problem" ${whereClause}`
    const countResult = await this.queryOne(countSql, params)
    const total = parseInt(countResult.total)

    // Get paginated results
    const problemsSql = `
      SELECT * FROM "Problem"
      ${whereClause}
      ORDER BY "createdAt" DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `

    const problems = await this.queryMany(problemsSql, [
      ...params,
      take,
      skip
    ])

    return { problems, total }
  }

  async findProblemsByDifficulty(difficulty) {
    const sql = `
      SELECT * FROM "Problem"
      WHERE difficulty = $1
      ORDER BY "createdAt" DESC
    `
    return await this.queryMany(sql, [difficulty])
  }

  async findProblemsByTag(tag) {
    const sql = `
      SELECT * FROM "Problem"
      WHERE $1 = ANY(tags)
      ORDER BY "createdAt" DESC
    `
    return await this.queryMany(sql, [tag])
  }

  async getUniqueTags() {
    const sql = `
      SELECT DISTINCT unnest(tags) as tag
      FROM "Problem"
      WHERE tags IS NOT NULL
      ORDER BY tag ASC
    `
    const result = await this.queryMany(sql)
    return result.map(r => r.tag)
  }

  async getProblemStats() {
    const totalSql = 'SELECT COUNT(*) as count FROM "Problem"'
    const total = await this.queryOne(totalSql)

    const difficultySql = `
      SELECT difficulty, COUNT(*) as count
      FROM "Problem"
      GROUP BY difficulty
    `
    const difficultyResults = await this.queryMany(difficultySql)

    const byDifficulty = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0
    }

    difficultyResults.forEach(result => {
      byDifficulty[result.difficulty] = parseInt(result.count)
    })

    return {
      total: parseInt(total.count),
      byDifficulty
    }
  }
}

module.exports = ProblemRepository
