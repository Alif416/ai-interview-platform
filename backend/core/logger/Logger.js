/**
 * Centralized Logger Service
 * Provides structured logging with levels, formatting, and context
 * Can be extended to integrate with external logging services (Sentry, DataDog, etc.)
 */
class Logger {
  constructor(context = 'App') {
    this.context = context
  }

  #format(level, message, meta = {}) {
    const timestamp = new Date().toISOString()
    return {
      timestamp,
      level,
      context: this.context,
      message,
      ...meta
    }
  }

  #log(level, message, meta = {}) {
    const formatted = this.#format(level, message, meta)
    const output = `[${formatted.timestamp}] ${level.toUpperCase()} [${this.context}] ${message}`

    if (level === 'error') {
      console.error(output, meta)
    } else if (level === 'warn') {
      console.warn(output, meta)
    } else {
      console.log(output, meta)
    }
  }

  info(message, meta = {}) {
    this.#log('info', message, meta)
  }

  debug(message, meta = {}) {
    if (process.env.NODE_ENV !== 'production') {
      this.#log('debug', message, meta)
    }
  }

  warn(message, meta = {}) {
    this.#log('warn', message, meta)
  }

  error(message, error = null, meta = {}) {
    const errorMeta = error ? {
      errorMessage: error.message,
      errorStack: error.stack,
      ...meta
    } : meta
    this.#log('error', message, errorMeta)
  }

  success(message, meta = {}) {
    const output = `✅ [${new Date().toISOString()}] [${this.context}] ${message}`
    console.log(output, meta)
  }

  fail(message, meta = {}) {
    const output = `❌ [${new Date().toISOString()}] [${this.context}] ${message}`
    console.error(output, meta)
  }

  // Create a child logger with additional context
  child(childContext) {
    const logger = new Logger(`${this.context}:${childContext}`)
    return logger
  }
}

module.exports = Logger
