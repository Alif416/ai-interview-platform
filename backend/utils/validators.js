const { z } = require('zod')

// ── Auth Schemas ─────────────────────────────────
const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .trim(),

  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-z0-9_]+$/, 'Username can only contain lowercase letters, numbers, and underscores')
    .toLowerCase(),

  email: z.string()
    .email('Please provide a valid email')
    .toLowerCase(),

  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long'),

  role: z.enum(['CANDIDATE', 'INTERVIEWER', 'ADMIN'])
    .optional()
    .default('CANDIDATE')
})

const loginSchema = z.object({
  email: z.string()
    .email('Please provide a valid email')
    .toLowerCase(),

  password: z.string()
    .min(1, 'Password is required')
})

// ── Session Schemas ───────────────────────────────
const createSessionSchema = z.object({
  title: z.string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title too long')
    .trim(),

  role: z.string()
    .min(2, 'Role must be at least 2 characters')
    .trim(),

  level: z.enum(['L3', 'L4', 'L5', 'L6', 'L7'], {
    errorMap: () => ({ message: 'Level must be L3, L4, L5, L6, or L7' })
  }),

  scheduledAt: z.string()
    .datetime('scheduledAt must be a valid ISO datetime'),

  candidateUsername: z.string()
    .min(3, 'candidateUsername must be at least 3 characters')
    .toLowerCase()
})

const updateSessionSchema = z.object({
  status: z.enum(
    ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
    { errorMap: () => ({ message: 'Invalid status value' }) }
  )
})

// ── Query Schemas (for filtering) ─────────────────
const sessionQuerySchema = z.object({
  status: z.enum(['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'])
    .optional(),
  role: z.string().optional(),
  page: z.string().regex(/^\d+$/).optional().transform(Number),
  limit: z.string().regex(/^\d+$/).optional().transform(Number)
})

const forgotPasswordSchema = z.object({
  email: z.string().email('Please provide a valid email').toLowerCase()
})

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long')
})

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(6, 'Password must be at least 6 characters')
    .max(100, 'Password too long'),
})

const deleteAccountSchema = z.object({
  password: z.string().min(1, 'Password is required'),
})

module.exports = {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createSessionSchema,
  updateSessionSchema,
  sessionQuerySchema,
  changePasswordSchema,
  deleteAccountSchema,
}