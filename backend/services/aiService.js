const Anthropic = require('@anthropic-ai/sdk')
const config = require('../config/config')

const client = new Anthropic({
  apiKey: config.ANTHROPIC_API_KEY
})

// Generate interview questions for a role and level
const generateInterviewQuestions = async (role, level, topic, count = 5) => {
  const message = await client.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `You are a senior engineer at a top tech company conducting
a technical interview for a ${role} position at ${level} level.

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
    ]
  })

  const content = message.content[0].text
  return JSON.parse(content)
}

// Evaluate a candidate's answer
const evaluateAnswer = async (question, answer, role, level) => {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    messages: [
      {
        role: 'user',
        content: `You are a senior engineer evaluating a candidate's interview answer.

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
    ]
  })

  const content = message.content[0].text
  return JSON.parse(content)
}

// Stream AI interviewer response (for real-time feel)
const streamInterviewerResponse = async (
  conversationHistory,
  role,
  level,
  res
) => {
  // Set headers for streaming
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const stream = await client.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 1000,
    system: `You are an expert technical interviewer conducting a
${level} level interview for a ${role} position.
Ask focused follow-up questions based on candidate responses.
Be professional but conversational. One question at a time.`,
    messages: conversationHistory
  })

  for await (const chunk of stream) {
    if (
      chunk.type === 'content_block_delta' &&
      chunk.delta.type === 'text_delta'
    ) {
      res.write(`data: ${JSON.stringify({ text: chunk.delta.text })}\n\n`)
    }
  }

  // Signal stream is complete
  res.write('data: [DONE]\n\n')
  res.end()
}

module.exports = {
  generateInterviewQuestions,
  evaluateAnswer,
  streamInterviewerResponse
}
