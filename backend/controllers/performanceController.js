const ApiResponse = require('../utils/apiResponse')
const asyncHandler = require('../middleware/asyncHandler')
const { prisma } = require('../config/database')

// GET /api/v1/performance
const getMyPerformance = asyncHandler(async (req, res) => {
  const userId = req.user.id

  // Fire all DB queries in parallel: aggregate stats, level grouping, and
  // the evaluation list (needed for topic breakdown, score trend, and display).
  const [aggregate, byLevelRaw, evaluations] = await Promise.all([
    prisma.aIEvaluation.aggregate({
      where: { userId },
      _count: { id: true },
      _avg:   { score: true },
      _max:   { score: true },
    }),
    prisma.aIEvaluation.groupBy({
      by: ['level'],
      where: { userId },
      _count: { id: true },
      _avg:   { score: true },
      orderBy: { level: 'asc' },
    }),
    prisma.aIEvaluation.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        question: true,
        role: true,
        level: true,
        topic: true,
        score: true,
        grade: true,
        strengths: true,
        improvements: true,
        createdAt: true,
      },
    }),
  ])

  if (!aggregate._count.id) {
    return ApiResponse.success(res, {
      evaluations: [],
      stats: { totalAttempts: 0, averageScore: 0, bestScore: 0, latestScore: 0, trend: 0 },
      byTopic: [],
      byLevel: [],
      scoreTrend: [],
    }, 'No evaluations found')
  }

  const totalAttempts = aggregate._count.id
  const averageScore  = parseFloat((aggregate._avg.score).toFixed(2))
  const bestScore     = aggregate._max.score
  const latestScore   = evaluations[evaluations.length - 1].score

  const scores     = evaluations.map(e => e.score)
  const firstSlice = scores.slice(0, Math.min(5, scores.length))
  const lastSlice  = scores.slice(-Math.min(5, scores.length))
  const trend      = parseFloat(
    (lastSlice.reduce((a, b) => a + b, 0) / lastSlice.length -
     firstSlice.reduce((a, b) => a + b, 0) / firstSlice.length).toFixed(2)
  )

  // ── Level breakdown — already computed in DB ──────────────────────────
  const byLevel = byLevelRaw.map(r => ({
    level:    r.level,
    count:    r._count.id,
    avgScore: parseFloat(r._avg.score.toFixed(2)),
  }))

  // ── Score trend: daily grouped averages ───────────────────────────────
  const dailyMap = {}
  for (const e of evaluations) {
    const date = e.createdAt.toISOString().split('T')[0]
    if (!dailyMap[date]) dailyMap[date] = { totalScore: 0, count: 0 }
    dailyMap[date].totalScore += e.score
    dailyMap[date].count++
  }
  const scoreTrend = Object.entries(dailyMap)
    .map(([date, v]) => ({
      date,
      avgScore: parseFloat((v.totalScore / v.count).toFixed(2)),
      count: v.count,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // ── Topic breakdown — needs strengths/improvements arrays so stays in JS ──
  const topicMap = {}
  for (const e of evaluations) {
    if (!topicMap[e.topic]) {
      topicMap[e.topic] = { count: 0, totalScore: 0, best: 0, allStrengths: [], allImprovements: [], scores: [] }
    }
    const t = topicMap[e.topic]
    t.count++
    t.totalScore += e.score
    t.best = Math.max(t.best, e.score)
    t.allStrengths.push(...e.strengths)
    t.allImprovements.push(...e.improvements)
    t.scores.push(e.score)
  }

  const byTopic = Object.entries(topicMap).map(([topic, v]) => {
    const earlyScores  = v.scores.slice(0, Math.min(3, v.scores.length))
    const recentScores = v.scores.slice(-Math.min(3, v.scores.length))
    const topicTrend   = parseFloat(
      (recentScores.reduce((a, b) => a + b, 0) / recentScores.length -
       earlyScores.reduce((a, b) => a + b, 0) / earlyScores.length).toFixed(2)
    )
    return {
      topic,
      count:        v.count,
      avgScore:     parseFloat((v.totalScore / v.count).toFixed(2)),
      bestScore:    v.best,
      trend:        topicTrend,
      strengths:    [...new Set(v.allStrengths)].slice(0, 5),
      improvements: [...new Set(v.allImprovements)].slice(0, 5),
    }
  }).sort((a, b) => b.count - a.count)

  ApiResponse.success(res, {
    evaluations,
    stats: { totalAttempts, averageScore, bestScore, latestScore, trend },
    byTopic,
    byLevel,
    scoreTrend,
  }, 'Performance data retrieved successfully')
})

// GET /api/v1/performance/interviewer
const getInterviewerStats = asyncHandler(async (req, res) => {
  const userId = req.user.id

  // Two parallel queries: lightweight aggregation data + full recent sessions.
  // Avoids joining candidate relation on every row when only 10 are displayed.
  const [sessions, recentSessions, byStatusRaw] = await Promise.all([
    prisma.interviewSession.findMany({
      where: { interviewerId: userId },
      select: { candidateId: true, status: true, scheduledAt: true },
      orderBy: { scheduledAt: 'desc' },
    }),
    prisma.interviewSession.findMany({
      where: { interviewerId: userId },
      select: {
        id: true, title: true, role: true, level: true,
        status: true, scheduledAt: true,
        candidate: { select: { id: true, name: true, email: true } },
      },
      orderBy: { scheduledAt: 'desc' },
      take: 10,
    }),
    prisma.interviewSession.groupBy({
      by: ['status'],
      where: { interviewerId: userId },
      _count: { id: true },
    }),
  ])

  if (!sessions.length) {
    return ApiResponse.success(res, {
      totalSessions: 0,
      uniqueCandidates: 0,
      byStatus: { SCHEDULED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 },
      sessionsOverTime: [],
      recentSessions: [],
    }, 'No sessions found')
  }

  // ── Status breakdown — from DB groupBy ───────────────────────────────
  const byStatus = { SCHEDULED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 }
  for (const r of byStatusRaw) byStatus[r.status] = r._count.id

  // ── Unique candidates ─────────────────────────────────────────────────
  const uniqueCandidates = new Set(sessions.map(s => s.candidateId)).size

  // ── Sessions over time: group by ISO week (Mon of the week) ──────────
  const weekMap = {}
  for (const s of sessions) {
    const d = new Date(s.scheduledAt)
    const day = d.getDay() || 7
    d.setDate(d.getDate() - day + 1)
    const weekKey = d.toISOString().split('T')[0]
    if (!weekMap[weekKey]) weekMap[weekKey] = { SCHEDULED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0, total: 0 }
    weekMap[weekKey][s.status]++
    weekMap[weekKey].total++
  }
  const sessionsOverTime = Object.entries(weekMap)
    .map(([week, v]) => ({ week, ...v }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-12)

  const completionRate = parseFloat(((byStatus.COMPLETED / sessions.length) * 100).toFixed(1))

  ApiResponse.success(res, {
    totalSessions: sessions.length,
    uniqueCandidates,
    completionRate,
    byStatus,
    sessionsOverTime,
    recentSessions,
  }, 'Interviewer stats retrieved successfully')
})

module.exports = { getMyPerformance, getInterviewerStats }
