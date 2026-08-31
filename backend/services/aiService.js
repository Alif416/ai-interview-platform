const Anthropic = require('@anthropic-ai/sdk')

/**
 * AI Service
 * Encapsulates all Claude AI interactions
 * Handles question generation, answer evaluation, and streaming responses
 */
class AIService {
  constructor(config, cacheService, logger) {
    this.config = config
    this.cacheService = cacheService
    this.logger = logger.child('AIService')

    this.client = new Anthropic({
      apiKey: config.ANTHROPIC_API_KEY
    })

    this.MODELS = {
      QUICK: 'claude-haiku-4-5-20251001',
      STANDARD: 'claude-sonnet-4-6',
    }
  }

  /**
   * Generate interview questions for a role and level
   * Uses cache to avoid regenerating same questions
   */
  async generateInterviewQuestions(role, level, topic, count = 5) {
    const cacheKey = `questions:${role}:${level}:${topic}:${count}`.toLowerCase()

    return await this.cacheService.remember(
      cacheKey,
      this.cacheService.TTL.QUESTIONS,
      async () => {
        this.logger.debug(`Generating interview questions for ${role}/${level}/${topic}`)

        const message = await this.client.messages.create({
          model: this.MODELS.QUICK,
          max_tokens: 2000,
          messages: [
            {
              role: 'user',
              content: this.#getQuestionsPrompt(role, level, topic, count)
            }
          ]
        })

        const raw = this.#extractJSON(message.content[0].text)
        const result = JSON.parse(raw)

        this.logger.debug(`Generated ${result.questions.length} questions`)
        return result
      }
    )
  }

  /**
   * Evaluate a candidate's answer to an interview question
   */
  async evaluateAnswer(question, answer, role, level) {
    this.logger.debug(`Evaluating answer for ${role}/${level}`)

    try {
      const message = await this.client.messages.create({
        model: this.MODELS.STANDARD,
        max_tokens: 1500,
        messages: [
          {
            role: 'user',
            content: this.#getEvaluationPrompt(question, answer, role, level)
          }
        ]
      })

      const raw = this.#extractJSON(message.content[0].text)
      const result = JSON.parse(raw)

      this.logger.debug(`Evaluation complete: score ${result.score}/10`)
      return result
    } catch (error) {
      this.logger.error('Failed to evaluate answer', error)
      throw new Error('Failed to evaluate answer. Please try again.')
    }
  }

  /**
   * Stream AI interviewer response for real-time conversation
   */
  async streamInterviewerResponse(conversationHistory, role, level, res) {
    this.logger.debug(`Streaming interviewer response for ${role}/${level}`)

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    try {
      const stream = await this.client.messages.stream({
        model: this.MODELS.STANDARD,
        max_tokens: 1000,
        system: this.#getInterviewerSystemPrompt(role, level),
        messages: conversationHistory
      })

      for await (const chunk of stream) {
        if (
          chunk.type === 'content_block_delta' &&
          chunk.delta.type === 'text_delta'
        ) {
          res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
        }

        if (chunk.type === 'message_stop') {
          res.write('data: [DONE]\n\n')
          res.end()
          this.logger.debug('Stream completed')
        }
      }
    } catch (error) {
      this.logger.error('Streaming failed', error)
      res.write(`data: ${JSON.stringify({ error: error.message })}\n\n`)
      res.end()
    }
  }

  /**
   * Get follow-up question from interviewer
   */
  async getFollowUpQuestion(conversationHistory, role, level) {
    this.logger.debug(`Generating follow-up for ${role}/${level}`)

    try {
      const message = await this.client.messages.create({
        model: this.MODELS.STANDARD,
        max_tokens: 300,
        system: this.#getInterviewerSystemPrompt(role, level),
        messages: conversationHistory
      })

      return message.content[0].text
    } catch (error) {
      this.logger.error('Failed to generate follow-up', error)
      throw error
    }
  }

  #getQuestionsPrompt(role, level, topic, count) {
    return `You are a senior engineer at a top tech company conducting a technical interview for a ${role} position at ${level} level.

Generate exactly ${count} interview questions about: ${topic}

For each question provide:
1. The question itself
2. What concept/skill it tests
3. Key points a strong ${level} candidate should cover

Format your response as valid JSON with this exact structure:
{
  "questions": [
    {
      "id": 1,
      "question": "...",
      "tests": "...",
      "keyPoints": ["point1", "point2", "point3"]
    }
  ]
}

Return ONLY the JSON. No extra text.`
  }

  #getEvaluationPrompt(question, answer, role, level) {
    return `You are a senior engineer evaluating a candidate's interview answer.

Role: ${role}
Level: ${level}

Question: ${question}

Candidate's Answer: ${answer}

Evaluate this answer and provide:
1. Score out of 10
2. Strengths in the answer
3. Areas for improvement
4. What a perfect answer would include

Format as valid JSON:
{
  "score": 8,
  "grade": "Good",
  "strengths": ["strength1", "strength2"],
  "improvements": ["improvement1", "improvement2"],
  "idealAnswer": "A perfect answer would..."
}

Return ONLY the JSON. No extra text.`
  }

  #getInterviewerSystemPrompt(role, level) {
    return `You are an expert technical interviewer conducting a ${level} level interview for a ${role} position. Ask focused follow-up questions based on candidate responses. Be professional but conversational. One question at a time.`
  }

  #extractJSON(text) {
    const trimmed = text.trim()
    return trimmed
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim()
  }
}

module.exports = AIService

// Legacy function-based exports for backwards compatibility
const config = require('../config/config')
const Logger = require('../core/logger/Logger')
const legacyLogger = new Logger('AIService')

let legacyAIService = null

function getLegacyService() {
  if (!legacyAIService && config.ANTHROPIC_API_KEY) {
    const CacheService = require('./cacheService')
    const cache = new CacheService(require('../config/redis').getRedis(), legacyLogger)
    legacyAIService = new AIService(config, cache, legacyLogger)
  }
  return legacyAIService
}

module.exports.generateInterviewQuestions = (role, level, topic, count) =>
  getLegacyService()?.generateInterviewQuestions(role, level, topic, count)

module.exports.evaluateAnswer = (question, answer, role, level) =>
  getLegacyService()?.evaluateAnswer(question, answer, role, level)

module.exports.streamInterviewerResponse = (history, role, level, res) =>
  getLegacyService()?.streamInterviewerResponse(history, role, level, res)
