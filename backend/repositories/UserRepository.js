const BaseRepository = require('./BaseRepository')
const { NotFoundError, ConflictError } = require('../core/errors')

/**
 * User Repository
 * Handles all database operations related to users
 * Abstracts Prisma client from business logic
 */
class UserRepository extends BaseRepository {
  constructor(prisma) {
    super(prisma, prisma.user)
    this.prisma = prisma
  }

  async findByEmail(email, options = {}) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      ...options
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    return user
  }

  async findByUsername(username, options = {}) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      ...options
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    return user
  }

  async findByIdWithoutThrow(id, options = {}) {
    return await this.prisma.user.findUnique({
      where: { id },
      ...options
    })
  }

  async findByEmailWithoutThrow(email, options = {}) {
    return await this.prisma.user.findUnique({
      where: { email },
      ...options
    })
  }

  async findByUsernameWithoutThrow(username, options = {}) {
    return await this.prisma.user.findUnique({
      where: { username },
      ...options
    })
  }

  async createUser(userData) {
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

    return await this.prisma.user.create({ data: userData })
  }

  async updateUser(id, userData) {
    return await this.prisma.user.update({
      where: { id },
      data: userData
    })
  }

  async findByResetToken(token) {
    const user = await this.prisma.user.findFirst({
      where: { resetToken: token }
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    return user
  }

  async getUserProfile(id) {
    const user = await this.findByIdWithoutThrow(id, {
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true
      }
    })

    if (!user) {
      throw new NotFoundError('User')
    }

    return user
  }

  async deleteUserPermanently(id) {
    // Delete related records first
    await this.prisma.aIEvaluation.deleteMany({ where: { userId: id } })
    await this.prisma.interviewSession.deleteMany({
      where: { OR: [{ interviewerId: id }, { candidateId: id }] }
    })

    return await this.prisma.user.delete({ where: { id } })
  }
}

module.exports = UserRepository
