const axios = require('axios')
const { Resolver } = require('dns').promises

/**
 * Email Service
 * Handles email sending and domain validation via Brevo
 * Provides abstraction for email operations
 */
class EmailService {
  constructor(config, logger) {
    this.config = config
    this.logger = logger.child('EmailService')

    this.brevo = axios.create({
      baseURL: 'https://api.brevo.com/v3',
      headers: {
        'api-key': config.BREVO_API_KEY,
        'Content-Type': 'application/json',
      },
    })

    this.resolver = new Resolver()
    this.resolver.setServers(['8.8.8.8', '1.1.1.1'])
  }

  /**
   * Verify email service is configured correctly
   */
  async verify() {
    if (!this.config.BREVO_API_KEY || this.config.BREVO_API_KEY === 'your_brevo_api_key_here') {
      throw new Error('BREVO_API_KEY is not set in .env')
    }
    this.logger.success('Email service (Brevo) ready')
  }

  /**
   * Validate email domain has valid MX records
   * Fails open on network errors to avoid blocking legitimate users
   */
  async validateEmailDomain(email) {
    const domain = email.split('@')[1]
    try {
      const records = await Promise.race([
        this.resolver.resolveMx(domain),
        new Promise((_, reject) => setTimeout(() => reject(new Error('dns_timeout')), 5000)),
      ])
      return Array.isArray(records) && records.length > 0
    } catch (err) {
      if (err.code === 'ENOTFOUND' || err.code === 'ENODATA' || err.code === 'ESERVFAIL') {
        return false
      }
      return true
    }
  }

  /**
   * Send verification email
   */
  async sendVerificationEmail(email, name, token) {
    const url = `${this.config.FRONTEND_URL}/verify-email?token=${token}`

    try {
      const { data } = await this.brevo.post('/smtp/email', {
        sender: { name: 'LevelUp.io', email: this.config.EMAIL_FROM },
        to: [{ email }],
        subject: 'Verify your email — LevelUp.io',
        htmlContent: this.#getVerificationEmailTemplate(name, url),
      })

      this.logger.info(`Verification email sent to ${email}`)
      return data
    } catch (error) {
      this.logger.error(`Failed to send verification email to ${email}`, error)
      throw error
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email, name, token) {
    const url = `${this.config.FRONTEND_URL}/reset-password?token=${token}`

    try {
      const { data } = await this.brevo.post('/smtp/email', {
        sender: { name: 'LevelUp.io', email: this.config.EMAIL_FROM },
        to: [{ email }],
        subject: 'Reset your password — LevelUp.io',
        htmlContent: this.#getPasswordResetEmailTemplate(name, url),
      })

      this.logger.info(`Password reset email sent to ${email}`)
      return data
    } catch (error) {
      this.logger.error(`Failed to send password reset email to ${email}`, error)
      throw error
    }
  }

  /**
   * Get verification email HTML template
   */
  #getVerificationEmailTemplate(name, url) {
    return `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#1a1a1a;color:#e5e5e5;border-radius:12px">
        <h2 style="color:#ffa116;margin:0 0 8px">LevelUp.io</h2>
        <h3 style="margin:0 0 16px;color:#ffffff">Verify your email address</h3>
        <p style="color:#a3a3a3;margin:0 0 24px">Hi ${name}, thanks for signing up. Click the button below to verify your email. This link expires in <strong style="color:#e5e5e5">24 hours</strong>.</p>
        <a href="${url}" style="display:inline-block;background:#ffa116;color:#000;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px">Verify Email</a>
        <p style="color:#525252;font-size:12px;margin:24px 0 0">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `
  }

  /**
   * Get password reset email HTML template
   */
  #getPasswordResetEmailTemplate(name, url) {
    return `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#1a1a1a;color:#e5e5e5;border-radius:12px">
        <h2 style="color:#ffa116;margin:0 0 8px">LevelUp.io</h2>
        <h3 style="margin:0 0 16px;color:#ffffff">Reset your password</h3>
        <p style="color:#a3a3a3;margin:0 0 24px">Hi ${name}, we received a request to reset your password. Click the button below to choose a new one. This link expires in <strong style="color:#e5e5e5">1 hour</strong>.</p>
        <a href="${url}" style="display:inline-block;background:#ffa116;color:#000;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px">Reset Password</a>
        <p style="color:#525252;font-size:12px;margin:24px 0 0">If you didn't request a password reset, you can safely ignore this email. Your password will not change.</p>
      </div>
    `
  }
}

module.exports = EmailService

// Legacy function-based exports for backwards compatibility
const config = require('../config/config')
const logger = require('../core/logger/Logger')
const emailService = new EmailService(config, new logger('EmailService'))

module.exports.verifyTransporter = () => emailService.verify()
module.exports.validateEmailDomain = (email) => emailService.validateEmailDomain(email)
module.exports.sendVerificationEmail = (email, name, token) => emailService.sendVerificationEmail(email, name, token)
module.exports.sendPasswordResetEmail = (email, name, token) => emailService.sendPasswordResetEmail(email, name, token)
