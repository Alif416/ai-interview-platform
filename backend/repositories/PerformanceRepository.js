const BaseRepository = require('./BaseRepository')
const { NotFoundError } = require('../core/errors')

class PerformanceRepository extends BaseRepository {
  constructor(prisma) {
    super(prisma, prisma.aIEvaluation)
    this.prisma = prisma
  }

  async createEvaluation(evaluationData) {
    return await this.prisma.aIEvaluation.create({
      data: evaluationData
    })
  }

  async findEvaluationById(id) {
    const evaluation = await this.prisma.aIEvaluation.findUnique({
      where: { id }
    })

    if (!evaluation) {
      throw new NotFoundError('Evaluation')
    }

    return evaluation
  }

  async findUserEvaluations(userId) {
    return await this.prisma.aIEvaluation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findUserEvaluationsByTopic(userId, topic) {
    return await this.prisma.aIEvaluation.findMany({
      where: { userId, topic },
      orderBy: { createdAt: 'desc' }
    })
  }

  async getUserPerformanceStats(userId) {
    const evaluations = await this.prisma.aIEvaluation.findMany({
      where: { userId }
    })

    if (evaluations.length === 0) {
      return {
        totalEvaluations: 0,
        averageScore: 0,
        averageGrade: 'N/A',
        byTopic: {},
        performanceTrend: []
      }
    }

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
    const evaluations = await this.prisma.aIEvaluation.findMany({
      where: { userId },
      select: { topic: true, score: true, grade: true }
    })

    const stats = {}

    evaluations.forEach(eval => {
      if (!stats[eval.topic]) {
        stats[eval.topic] = { scores: [], grades: [] }
      }
      stats[eval.topic].scores.push(eval.score)
      stats[eval.topic].grades.push(eval.grade)
    })

    const result = {}

    Object.keys(stats).forEach(topic => {
      const scores = stats[topic].scores
      result[topic] = {
        count: scores.length,
        average: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
        min: Math.min(...scores),
        max: Math.max(...scores)
      }
    })

    return result
  }

  async deleteEvaluation(id) {
    return await this.prisma.aIEvaluation.delete({
      where: { id }
    })
  }
}

module.exports = PerformanceRepository
