const bcrypt = require('bcrypt')
const crypto = require('crypto')
const { generateToken } = require('../utils/jwt')
const { AuthError, ValidationError, ConflictError, NotFoundError } = require('../core/errors')

/**
 * Authentication Service
 * Encapsulates all auth logic: registration, login, password reset, etc.
 * Uses dependency injection for repositories and external services
 */
class AuthService {
  constructor(userRepository, emailService, config, logger) {
    this.userRepository = userRepository
    this.emailService = emailService
    this.config = config
    this.logger = logger.child('AuthService')

    this.PENDING_TTL = 24 * 60 * 60 // 24 hours in seconds
    this.RESET_TTL = 60 * 60 // 1 hour in seconds
  }

  /**
   * Get cookie options based on environment
   */
  getCookieOptions() {
    return {
      httpOnly: true,
      secure: this.config.NODE_ENV === 'production',
      sameSite: this.config.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: this.config.COOKIE_MAX_AGE,
    }
  }

  /**
   * Register a new user (stores in pending cache, requires email verification)
   */
  async register(registerDTO, cache) {
    const { name, username, email, password, role = 'CANDIDATE' } = registerDTO

    // Validate email domain
    const domainValid = await this.emailService.validateEmailDomain(email)
    if (!domainValid) {
      throw new ValidationError('Email address is invalid or does not exist')
    }

    // Check for existing users
    const existingEmail = await this.userRepository.findByEmailWithoutThrow(email)
    if (existingEmail) {
      throw new ConflictError('Email already registered')
    }

    const existingUsername = await this.userRepository.findByUsernameWithoutThrow(username)
    if (existingUsername) {
      throw new ConflictError('Username already taken')
    }

    // Check pending registrations
    const pendingUsernameToken = await cache.get(`pending:username:${username}`)
    if (pendingUsernameToken) {
      const pendingData = await cache.get(`pending:reg:${pendingUsernameToken}`)
      if (pendingData && pendingData.email !== email) {
        throw new ConflictError('Username already taken')
      }
    }

    // Hash password and create token
    const hashedPassword = await bcrypt.hash(password, 10)
    const token = crypto.randomBytes(32).toString('hex')
    const pendingData = { name, username, email, hashedPassword, role }

    // Clean up old pending registrations for this email
    const existingPendingToken = await cache.get(`pending:email:${email}`)
    if (existingPendingToken) {
      await cache.delete(`pending:reg:${existingPendingToken}`)
    }

    // Store pending registration in cache
    await Promise.all([
      cache.set(`pending:reg:${token}`, pendingData, this.PENDING_TTL),
      cache.set(`pending:email:${email}`, token, this.PENDING_TTL),
      cache.set(`pending:username:${username}`, token, this.PENDING_TTL),
    ])

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(email, name, token)
      this.logger.info(`Registration initiated for ${email}`)
    } catch (error) {
      // Clean up cache on email failure
      await Promise.all([
        cache.delete(`pending:reg:${token}`),
        cache.delete(`pending:email:${email}`),
        cache.delete(`pending:username:${username}`),
      ])
      this.logger.error(`Verification email failed for ${email}`, error)
      throw new Error('Failed to send verification email. Please try again later.')
    }

    return { email, message: 'Registration successful. Please check your email to verify your account.' }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token, cache) {
    if (!token) {
      throw new ValidationError('Verification token is required')
    }

    const rawData = await cache.get(`pending:reg:${token}`)
    if (!rawData) {
      throw new ValidationError('Invalid or expired verification link')
    }

    const { name, username, email, hashedPassword, role } = rawData

    // Guard against double-click / race condition
    const alreadyExists = await this.userRepository.findByEmailWithoutThrow(email)
    if (alreadyExists) {
      await Promise.all([
        cache.delete(`pending:reg:${token}`),
        cache.delete(`pending:email:${email}`),
        cache.delete(`pending:username:${username}`),
      ])
      return { message: 'Email already verified. You can now log in.' }
    }

    // Check if username was claimed
    const usernameTaken = await this.userRepository.findByUsernameWithoutThrow(username)
    if (usernameTaken) {
      await Promise.all([
        cache.delete(`pending:reg:${token}`),
        cache.delete(`pending:email:${email}`),
        cache.delete(`pending:username:${username}`),
      ])
      throw new ConflictError('Your username was taken while your verification was pending. Please register again.')
    }

    // Create user
    const newUser = await this.userRepository.create({
      name,
      username,
      email,
      password: hashedPassword,
      role,
    })

    // Clean up cache
    await Promise.all([
      cache.delete(`pending:reg:${token}`),
      cache.delete(`pending:email:${email}`),
      cache.delete(`pending:username:${username}`),
    ])

    this.logger.info(`Email verified for ${email}`)
    return { message: 'Email verified successfully. You can now log in.' }
  }

  /**
   * Resend verification email
   */
  async resendVerification(email, cache) {
    if (!email) {
      throw new ValidationError('Email is required')
    }

    const existingToken = await cache.get(`pending:email:${email}`)

    if (!existingToken) {
      // Return generic response to avoid email enumeration
      return { message: 'If that email exists and is unverified, a new link has been sent.' }
    }

    const rawData = await cache.get(`pending:reg:${existingToken}`)
    if (!rawData) {
      return { message: 'If that email exists and is unverified, a new link has been sent.' }
    }

    const data = rawData
    const newToken = crypto.randomBytes(32).toString('hex')

    await Promise.all([
      cache.delete(`pending:reg:${existingToken}`),
      cache.set(`pending:reg:${newToken}`, rawData, this.PENDING_TTL),
      cache.set(`pending:email:${email}`, newToken, this.PENDING_TTL),
      cache.set(`pending:username:${data.username}`, newToken, this.PENDING_TTL),
    ])

    try {
      await this.emailService.sendVerificationEmail(email, data.name, newToken)
    } catch (error) {
      this.logger.warn(`Failed to resend verification to ${email}`, error)
    }

    return { message: 'If that email exists and is unverified, a new link has been sent.' }
  }

  /**
   * Login user
   */
  async login(loginDTO) {
    const { email, password } = loginDTO

    if (!email || !password) {
      throw new ValidationError('Email and password are required')
    }

    const user = await this.userRepository.findByEmailWithoutThrow(email)
    if (!user) {
      throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS')
    }

    const passwordMatch = await bcrypt.compare(password, user.password)
    if (!passwordMatch) {
      throw new AuthError('Invalid email or password', 'INVALID_CREDENTIALS')
    }

    const token = generateToken(user.id)

    this.logger.info(`User ${email} logged in`)

    return {
      token,
      user: this.#formatUserResponse(user),
      cookieOptions: this.getCookieOptions(),
    }
  }

  /**
   * Request password reset
   */
  async forgotPassword(email) {
    if (!email) {
      throw new ValidationError('Email is required')
    }

    const user = await this.userRepository.findByEmailWithoutThrow(email)

    if (!user) {
      // Return generic response to avoid email enumeration
      return { message: 'If that email is registered, a reset link has been sent.' }
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenExpiry = new Date(Date.now() + this.RESET_TTL * 1000)

    await this.userRepository.updateUser(user.id, {
      resetToken,
      resetTokenExpiry,
    })

    try {
      await this.emailService.sendPasswordResetEmail(email, user.name, resetToken)
      this.logger.info(`Password reset requested for ${email}`)
    } catch (error) {
      this.logger.warn(`Failed to send password reset email to ${email}`, error)
    }

    return { message: 'If that email is registered, a reset link has been sent.' }
  }

  /**
   * Reset password with token
   */
  async resetPassword(resetDTO) {
    const { token, password } = resetDTO

    if (!token) {
      throw new ValidationError('Reset token is required')
    }

    if (!password || password.length < 6) {
      throw new ValidationError('Password must be at least 6 characters')
    }

    const user = await this.userRepository.findByEmailWithoutThrow(null, { where: { resetToken: token } })
    if (!user) {
      throw new ValidationError('Invalid or expired reset link')
    }

    if (user.resetTokenExpiry < new Date()) {
      throw new ValidationError('Reset link has expired. Please request a new one.')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    await this.userRepository.updateUser(user.id, {
      password: hashedPassword,
      resetToken: null,
      resetTokenExpiry: null,
    })

    this.logger.info(`Password reset for ${user.email}`)

    return { message: 'Password reset successfully. You can now log in with your new password.' }
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(userId, changePasswordDTO) {
    const { currentPassword, newPassword } = changePasswordDTO

    if (!currentPassword || !newPassword) {
      throw new ValidationError('Current and new passwords are required')
    }

    const user = await this.userRepository.findByIdWithoutThrow(userId)
    if (!user) {
      throw new NotFoundError('User')
    }

    const passwordMatch = await bcrypt.compare(currentPassword, user.password)
    if (!passwordMatch) {
      throw new AuthError('Current password is incorrect', 'INVALID_PASSWORD')
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)

    await this.userRepository.updateUser(userId, {
      password: hashedPassword,
    })

    this.logger.info(`Password changed for user ${userId}`)

    return { message: 'Password changed successfully.' }
  }

  /**
   * Format user response (excludes sensitive fields)
   */
  #formatUserResponse(user) {
    const { password, resetToken, resetTokenExpiry, ...userResponse } = user
    return userResponse
  }
}

module.exports = AuthService
