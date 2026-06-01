const ApiResponse = require('../utils/apiResponse')
const asyncHandler = require('../middleware/asyncHandler')
const aiService = require('../services/aiService')

// POST /api/v1/ai/questions
const generateQuestions = asyncHandler(async (req, res) => {
  const { role, level, topic, count } = req.body

  if (!role || !level || !topic) {
    return ApiResponse.badRequest(
      res,
      'role, level, and topic are required'
    )
  }

  const result = await aiService.generateInterviewQuestions(
    role,
    level,
    topic,
    count || 5
  )

  ApiResponse.success(res, result, 'Questions generated successfully')
})

// POST /api/v1/ai/evaluate
const evaluateAnswer = asyncHandler(async (req, res) => {
  const { question, answer, role, level } = req.body

  if (!question || !answer || !role || !level) {
    return ApiResponse.badRequest(
      res,
      'question, answer, role, and level are required'
    )
  }

  const evaluation = await aiService.evaluateAnswer(
    question,
    answer,
    role,
    level
  )

  ApiResponse.success(res, evaluation, 'Answer evaluated successfully')
})

// POST /api/v1/ai/interview/stream
const streamInterview = asyncHandler(async (req, res) => {
  const { conversationHistory, role, level } = req.body

  if (!conversationHistory || !role || !level) {
    return ApiResponse.badRequest(
      res,
      'conversationHistory, role, and level are required'
    )
  }

  // This streams directly — no ApiResponse wrapper
  await aiService.streamInterviewerResponse(
    conversationHistory,
    role,
    level,
    res
  )
})

module.exports = {
  generateQuestions,
  evaluateAnswer,
  streamInterview
}