const { z } = require('zod')

// ── Auth Schemas ─────────────────────────────────
const registerSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .trim(),

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

  interviewerId: z.number()
    .int('interviewerId must be an integer')
    .positive('interviewerId must be positive'),

  candidateId: z.number()
    .int('candidateId must be an integer')
    .positive('candidateId must be positive')
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

module.exports = {
  registerSchema,
  loginSchema,
  createSessionSchema,
  updateSessionSchema,
  sessionQuerySchema
}