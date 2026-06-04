const ApiResponse = require('../utils/apiResponse')
const asyncHandler = require('../middleware/asyncHandler')
const { prisma } = require('../config/database')

// GET /api/v1/performance
const getMyPerformance = asyncHandler(async (req, res) => {
  const userId = req.user.id

  const evaluations = await prisma.aIEvaluation.findMany({
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
    }
  })

  if (!evaluations.length) {
    return ApiResponse.success(res, {
      evaluations: [],
      stats: { totalAttempts: 0, averageScore: 0, bestScore: 0, latestScore: 0, trend: 0 },
      byTopic: [],
      byLevel: [],
      scoreTrend: [],
    }, 'No evaluations found')
  }

  const scores = evaluations.map(e => e.score)
  const totalAttempts = scores.length
  const averageScore = parseFloat((scores.reduce((a, b) => a + b, 0) / totalAttempts).toFixed(2))
  const bestScore = Math.max(...scores)
  const latestScore = scores[scores.length - 1]

  const firstSlice = scores.slice(0, Math.min(5, scores.length))
  const lastSlice = scores.slice(-Math.min(5, scores.length))
  const firstAvg = firstSlice.reduce((a, b) => a + b, 0) / firstSlice.length
  const lastAvg = lastSlice.reduce((a, b) => a + b, 0) / lastSlice.length
  const trend = parseFloat((lastAvg - firstAvg).toFixed(2))

  // ── Score trend: daily grouped averages ──────────────────────────────
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

  // ── Topic breakdown with strengths/weakness analysis ─────────────────
  const topicMap = {}
  for (const e of evaluations) {
    if (!topicMap[e.topic]) {
      topicMap[e.topic] = {
        count: 0,
        totalScore: 0,
        best: 0,
        allStrengths: [],
        allImprovements: [],
        scores: [],
      }
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
    const avgScore = parseFloat((v.totalScore / v.count).toFixed(2))

    // Topic-level trend: last 3 vs first 3 attempts
    const earlyScores = v.scores.slice(0, Math.min(3, v.scores.length))
    const recentScores = v.scores.slice(-Math.min(3, v.scores.length))
    const earlyAvg = earlyScores.reduce((a, b) => a + b, 0) / earlyScores.length
    const recentAvg = recentScores.reduce((a, b) => a + b, 0) / recentScores.length
    const topicTrend = parseFloat((recentAvg - earlyAvg).toFixed(2))

    // Deduplicate and keep up to 5 unique strengths/improvements
    const uniqueStrengths = [...new Set(v.allStrengths)].slice(0, 5)
    const uniqueImprovements = [...new Set(v.allImprovements)].slice(0, 5)

    return {
      topic,
      count: v.count,
      avgScore,
      bestScore: v.best,
      trend: topicTrend,
      strengths: uniqueStrengths,
      improvements: uniqueImprovements,
    }
  }).sort((a, b) => b.count - a.count)

  // ── Level breakdown ───────────────────────────────────────────────────
  const levelMap = {}
  for (const e of evaluations) {
    if (!levelMap[e.level]) levelMap[e.level] = { count: 0, totalScore: 0 }
    levelMap[e.level].count++
    levelMap[e.level].totalScore += e.score
  }
  const byLevel = Object.entries(levelMap).map(([level, v]) => ({
    level,
    count: v.count,
    avgScore: parseFloat((v.totalScore / v.count).toFixed(2)),
  })).sort((a, b) => a.level.localeCompare(b.level))

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

  const sessions = await prisma.interviewSession.findMany({
    where: { interviewerId: userId },
    include: {
      candidate: { select: { id: true, name: true, email: true } },
    },
    orderBy: { scheduledAt: 'desc' },
  })

  if (!sessions.length) {
    return ApiResponse.success(res, {
      totalSessions: 0,
      uniqueCandidates: 0,
      byStatus: { SCHEDULED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 },
      sessionsOverTime: [],
      recentSessions: [],
    }, 'No sessions found')
  }

  // ── Status breakdown ──────────────────────────────────────────────────
  const byStatus = { SCHEDULED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0 }
  for (const s of sessions) {
    byStatus[s.status] = (byStatus[s.status] || 0) + 1
  }

  // ── Unique candidates ─────────────────────────────────────────────────
  const uniqueCandidates = new Set(sessions.map(s => s.candidateId)).size

  // ── Sessions over time: group by ISO week (Mon of the week) ──────────
  const weekMap = {}
  for (const s of sessions) {
    const d = new Date(s.scheduledAt)
    // Get Monday of the week
    const day = d.getDay() || 7 // treat Sunday as 7
    d.setDate(d.getDate() - day + 1)
    const weekKey = d.toISOString().split('T')[0]
    if (!weekMap[weekKey]) weekMap[weekKey] = { SCHEDULED: 0, IN_PROGRESS: 0, COMPLETED: 0, CANCELLED: 0, total: 0 }
    weekMap[weekKey][s.status]++
    weekMap[weekKey].total++
  }
  const sessionsOverTime = Object.entries(weekMap)
    .map(([week, v]) => ({ week, ...v }))
    .sort((a, b) => a.week.localeCompare(b.week))
    .slice(-12) // last 12 weeks

  // ── Activity stats ────────────────────────────────────────────────────
  const completionRate = sessions.length
    ? parseFloat(((byStatus.COMPLETED / sessions.length) * 100).toFixed(1))
    : 0

  ApiResponse.success(res, {
    totalSessions: sessions.length,
    uniqueCandidates,
    completionRate,
    byStatus,
    sessionsOverTime,
    recentSessions: sessions.slice(0, 10),
  }, 'Interviewer stats retrieved successfully')
})

module.exports = { getMyPerformance, getInterviewerStats }
