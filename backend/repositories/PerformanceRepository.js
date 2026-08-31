const BaseRepository = require('./BaseRepository')
const { NotFoundError } = require('../core/errors')

class PerformanceRepository extends BaseRepository {
  constructor(pool) {
    super(pool)
  }

  async createEvaluation(evaluationData) {
    const sql = `
      INSERT INTO "AIEvaluation"
      ("userId", question, answer, role, level, topic, score, grade, strengths, improvements, "idealAnswer", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `

    return await this.queryOne(sql, [
      evaluationData.userId,
      evaluationData.question,
      evaluationData.answer,
      evaluationData.role,
      evaluationData.level,
      evaluationData.topic,
      evaluationData.score,
      evaluationData.grade,
      evaluationData.strengths || [],
      evaluationData.improvements || [],
      evaluationData.idealAnswer
    ])
  }

  async findEvaluationById(id) {
    const sql = 'SELECT * FROM "AIEvaluation" WHERE id = $1'
    const evaluation = await this.queryOne(sql, [id])

    if (!evaluation) {
      throw new NotFoundError('Evaluation')
    }

    return evaluation
  }

  async findUserEvaluations(userId) {
    const sql = `
      SELECT * FROM "AIEvaluation"
      WHERE "userId" = $1
      ORDER BY "createdAt" DESC
    `
    return await this.queryMany(sql, [userId])
  }

  async findUserEvaluationsByTopic(userId, topic) {
    const sql = `
      SELECT * FROM "AIEvaluation"
      WHERE "userId" = $1 AND topic = $2
      ORDER BY "createdAt" DESC
    `
    return await this.queryMany(sql, [userId, topic])
  }

  async getUserPerformanceStats(userId) {
    // Get all evaluations for the user
    const evaluationsSql = `
      SELECT * FROM "AIEvaluation"
      WHERE "userId" = $1
      ORDER BY "createdAt" DESC
    `
    const evaluations = await this.queryMany(evaluationsSql, [userId])

    if (evaluations.length === 0) {
      return {
        totalEvaluations: 0,
        averageScore: 0,
        averageGrade: 'N/A',
        byTopic: {},
        performanceTrend: []
      }
    }

    // Calculate stats
    const byTopic = {}
    let totalScore = 0

    evaluations.forEach(eval => {
      totalScore += eval.score

      if (!byTopic[eval.topic]) {
        byTopic[eval.topic] = { count: 0, totalScore: 0, grades: [] }
      }

      byTopic[eval.topic].count += 1
      byTopic[eval.topic].totalScore += eval.score
      byTopic[eval.topic].grades.push(eval.grade)
    })

    // Calculate averages per topic
    Object.keys(byTopic).forEach(topic => {
      byTopic[topic].average = Math.round(byTopic[topic].totalScore / byTopic[topic].count)
    })

    return {
      totalEvaluations: evaluations.length,
      averageScore: Math.round(totalScore / evaluations.length),
      byTopic,
      performanceTrend: evaluations.slice(0, 10).reverse()
    }
  }

  async getTopicPerformance(userId) {
    const sql = `
      SELECT
        topic,
        COUNT(*) as count,
        ROUND(AVG(score)::numeric, 2) as average,
        MIN(score) as min,
        MAX(score) as max
      FROM "AIEvaluation"
      WHERE "userId" = $1
      GROUP BY topic
      ORDER BY average DESC
    `

    const results = await this.queryMany(sql, [userId])

    const result = {}
    results.forEach(row => {
      result[row.topic] = {
        count: parseInt(row.count),
        average: parseFloat(row.average),
        min: parseFloat(row.min),
        max: parseFloat(row.max)
      }
    })

    return result
  }

  async deleteEvaluation(id) {
    const sql = 'DELETE FROM "AIEvaluation" WHERE id = $1 RETURNING *'
    return await this.queryOne(sql, [id])
  }
}

module.exports = PerformanceRepository
