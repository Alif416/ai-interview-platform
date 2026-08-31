const BaseRepository = require('./BaseRepository')
const { NotFoundError } = require('../core/errors')

class ProblemRepository extends BaseRepository {
  constructor(prisma) {
    super(prisma, prisma.problem)
    this.prisma = prisma
  }

  async findProblemById(id) {
    const problem = await this.prisma.problem.findUnique({
      where: { id }
    })

    if (!problem) {
      throw new NotFoundError('Problem')
    }

    return problem
  }

  async findProblemBySlug(slug) {
    const problem = await this.prisma.problem.findUnique({
      where: { slug }
    })

    if (!problem) {
      throw new NotFoundError('Problem')
    }

    return problem
  }

  async findAllProblems(filters = {}) {
    const { difficulty, tag, search, skip = 0, take = 20 } = filters

    const where = {}

    if (difficulty) {
      where.difficulty = difficulty
    }

    if (tag) {
      where.tags = { hasSome: [tag] }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [problems, total] = await Promise.all([
      this.prisma.problem.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.problem.count({ where })
    ])

    return { problems, total }
  }

  async findProblemsByDifficulty(difficulty) {
    return await this.prisma.problem.findMany({
      where: { difficulty },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findProblemsByTag(tag) {
    return await this.prisma.problem.findMany({
      where: { tags: { hasSome: [tag] } },
      orderBy: { createdAt: 'desc' }
    })
  }

  async getUniqueTags() {
    const problems = await this.prisma.problem.findMany({
      select: { tags: true }
    })

    const tagSet = new Set()
    problems.forEach(p => {
      if (p.tags) {
        p.tags.forEach(tag => tagSet.add(tag))
      }
    })

    return Array.from(tagSet).sort()
  }

  async getProblemStats() {
    return {
      total: await this.prisma.problem.count(),
      byDifficulty: {
        EASY: await this.prisma.problem.count({ where: { difficulty: 'EASY' } }),
        MEDIUM: await this.prisma.problem.count({ where: { difficulty: 'MEDIUM' } }),
        HARD: await this.prisma.problem.count({ where: { difficulty: 'HARD' } })
      }
    }
  }
}

module.exports = ProblemRepository
