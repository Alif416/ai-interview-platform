/**
 * Base Repository class
 * Provides common database operations and error handling
 * Implements Data Mapper pattern for separation of concerns
 */
class BaseRepository {
  constructor(prisma, model) {
    this.prisma = prisma
    this.model = model
  }

  async findById(id, options = {}) {
    try {
      return await this.model.findUnique({
        where: { id },
        ...options
      })
    } catch (error) {
      throw new Error(`Failed to find ${this.model.name} by ID: ${error.message}`)
    }
  }

  async findAll(options = {}) {
    try {
      return await this.model.findMany(options)
    } catch (error) {
      throw new Error(`Failed to fetch all records: ${error.message}`)
    }
  }

  async findOne(where, options = {}) {
    try {
      return await this.model.findUnique({
        where,
        ...options
      })
    } catch (error) {
      throw new Error(`Failed to find record: ${error.message}`)
    }
  }

  async findMany(where, options = {}) {
    try {
      return await this.model.findMany({
        where,
        ...options
      })
    } catch (error) {
      throw new Error(`Failed to find records: ${error.message}`)
    }
  }

  async create(data) {
    try {
      return await this.model.create({ data })
    } catch (error) {
      throw new Error(`Failed to create record: ${error.message}`)
    }
  }

  async update(id, data) {
    try {
      return await this.model.update({
        where: { id },
        data
      })
    } catch (error) {
      throw new Error(`Failed to update record: ${error.message}`)
    }
  }

  async delete(id) {
    try {
      return await this.model.delete({
        where: { id }
      })
    } catch (error) {
      throw new Error(`Failed to delete record: ${error.message}`)
    }
  }

  async exists(where) {
    try {
      const record = await this.model.findFirst({ where })
      return !!record
    } catch (error) {
      throw new Error(`Failed to check existence: ${error.message}`)
    }
  }

  async count(where = {}) {
    try {
      return await this.model.count({ where })
    } catch (error) {
      throw new Error(`Failed to count records: ${error.message}`)
    }
  }
}

module.exports = BaseRepository
