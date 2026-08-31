/**
 * Base Repository class
 * Provides helper methods for raw SQL queries
 * Implements Data Mapper pattern for separation of concerns
 */
class BaseRepository {
  constructor(pool) {
    this.pool = pool
  }

  /**
   * Execute a query and return first result
   */
  async queryOne(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params)
      return result.rows[0] || null
    } catch (error) {
      throw new Error(`Database query failed: ${error.message}`)
    }
  }

  /**
   * Execute a query and return all results
   */
  async queryMany(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params)
      return result.rows
    } catch (error) {
      throw new Error(`Database query failed: ${error.message}`)
    }
  }

  /**
   * Execute a query and return affected row count
   */
  async queryCount(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params)
      return result.rowCount
    } catch (error) {
      throw new Error(`Database query failed: ${error.message}`)
    }
  }

  /**
   * Start a transaction
   */
  async startTransaction() {
    const client = await this.pool.connect()
    try {
      await client.query('BEGIN')
      return client
    } catch (error) {
      client.release()
      throw error
    }
  }

  /**
   * Commit a transaction
   */
  async commitTransaction(client) {
    try {
      await client.query('COMMIT')
    } finally {
      client.release()
    }
  }

  /**
   * Rollback a transaction
   */
  async rollbackTransaction(client) {
    try {
      await client.query('ROLLBACK')
    } finally {
      client.release()
    }
  }

  /**
   * Format column name for SQL (escaping)
   */
  escapeIdentifier(name) {
    return `"${name}"`
  }
}

module.exports = BaseRepository
