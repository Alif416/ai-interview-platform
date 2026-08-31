const BaseRepository = require('./BaseRepository')
const { NotFoundError } = require('../core/errors')

class SessionRepository extends BaseRepository {
  constructor(prisma) {
    super(prisma, prisma.interviewSession)
    this.prisma = prisma
  }

  async createSession(sessionData) {
    return await this.prisma.interviewSession.create({
      data: sessionData,
      include: {
        interviewer: {
          select: { id: true, username: true, name: true, email: true }
        },
        candidate: {
          select: { id: true, username: true, name: true, email: true }
        }
      }
    })
  }

  async findSessionById(id) {
    const session = await this.prisma.interviewSession.findUnique({
      where: { id },
      include: {
        interviewer: {
          select: { id: true, username: true, name: true, email: true }
        },
        candidate: {
          select: { id: true, username: true, name: true, email: true }
        }
      }
    })

    if (!session) {
      throw new NotFoundError('Interview Session')
    }

    return session
  }

  async findUserSessions(userId, role = null) {
    const where = role === 'INTERVIEWER'
      ? { interviewerId: userId }
      : role === 'CANDIDATE'
        ? { candidateId: userId }
        : {
          OR: [
            { interviewerId: userId },
            { candidateId: userId }
          ]
        }

    return await this.prisma.interviewSession.findMany({
      where,
      include: {
        interviewer: {
          select: { id: true, username: true, name: true }
        },
        candidate: {
          select: { id: true, username: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  async findSessionsByInterviewer(interviewerId) {
    return await this.prisma.interviewSession.findMany({
      where: { interviewerId },
      include: {
        candidate: {
          select: { id: true, username: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })
  }

  async updateSession(id, data) {
    return await this.prisma.interviewSession.update({
      where: { id },
      data,
      include: {
        interviewer: {
          select: { id: true, username: true, name: true }
        },
        candidate: {
          select: { id: true, username: true, name: true }
        }
      }
    })
  }

  async deleteSession(id) {
    return await this.prisma.interviewSession.delete({
      where: { id }
    })
  }
}

module.exports = SessionRepository
