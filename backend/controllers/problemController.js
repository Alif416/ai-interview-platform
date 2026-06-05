const vm = require('vm')
const axios = require('axios')
const ApiResponse = require('../utils/apiResponse')
const asyncHandler = require('../middleware/asyncHandler')
const { prisma } = require('../config/database')
const NEETCODE_SLUGS = require('../data/neetcode250Slugs')
const cache = require('../services/cacheService')

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql'
const PROBLEM_QUERY = `
  query questionData($titleSlug: String!) {
    question(titleSlug: $titleSlug) {
      title
      titleSlug
      content
      difficulty
      topicTags { name }
      exampleTestcases
      codeSnippets { langSlug code }
    }
  }
`

async function fetchFromLeetCode(slug) {
  const { data } = await axios.post(
    LEETCODE_GRAPHQL,
    { query: PROBLEM_QUERY, variables: { titleSlug: slug } },
    {
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
      timeout: 15000,
    }
  )
  return data.data?.question ?? null
}

function transformQuestion(q) {
  if (!q || !q.content) return null // premium or unavailable

  const difficulty = q.difficulty?.toUpperCase()
  const jsCode = q.codeSnippets?.find(s => s.langSlug === 'javascript')?.code ?? ''
  const pyCode = q.codeSnippets?.find(s => s.langSlug === 'python3')?.code ?? ''

  const exampleLines = (q.exampleTestcases ?? '').split('\n').filter(Boolean)
  const examples = exampleLines.length
    ? [{ input: exampleLines[0], output: '', explanation: '' }]
    : []

  return {
    title: q.title,
    slug: q.titleSlug,
    difficulty: ['EASY', 'MEDIUM', 'HARD'].includes(difficulty) ? difficulty : 'MEDIUM',
    description: q.content,
    examples,
    constraints: [],
    testCases: [],
    starterCode: { javascript: jsCode, python: pyCode },
    tags: q.topicTags?.map(t => t.name) ?? [],
  }
}

// GET /api/v1/problems?page=1&limit=20&difficulty=EASY&search=two+sum
const getAllProblems = asyncHandler(async (req, res) => {
  const page       = Math.max(1, parseInt(req.query.page)  || 1)
  const limit      = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20))
  const difficulty = ['EASY', 'MEDIUM', 'HARD'].includes(req.query.difficulty)
    ? req.query.difficulty
    : undefined
  const search = req.query.search?.trim() || undefined

  const cacheKey = `problems:list:${page}:${limit}:${difficulty || ''}:${search || ''}`
  const cached = await cache.get(cacheKey)
  if (cached) return ApiResponse.success(res, cached, 'Problems fetched successfully')

  const where = {
    ...(difficulty && { difficulty }),
    ...(search && {
      OR: [
        { title: { contains: search, mode: 'insensitive' } },
        { tags:  { has: search } },
      ],
    }),
  }

  const [total, problems] = await Promise.all([
    prisma.problem.count({ where }),
    prisma.problem.findMany({
      where,
      select: { id: true, title: true, slug: true, difficulty: true, tags: true },
      orderBy: [{ difficulty: 'asc' }, { id: 'asc' }],
      skip: (page - 1) * limit,
      take: limit,
    }),
  ])

  const result = { problems, total, page, limit, totalPages: Math.ceil(total / limit) }
  await cache.set(cacheKey, result, cache.TTL.PROBLEMS_LIST)

  ApiResponse.success(res, result, 'Problems fetched successfully')
})

// GET /api/v1/problems/:id
const getProblemById = asyncHandler(async (req, res) => {
  const id = Number(req.params.id)
  const cacheKey = `problems:id:${id}`
  const cached = await cache.get(cacheKey)
  if (cached) return ApiResponse.success(res, cached, 'Problem fetched successfully')

  const problem = await prisma.problem.findUnique({ where: { id } })
  if (!problem) return ApiResponse.notFound(res, 'Problem not found')

  await cache.set(cacheKey, problem, cache.TTL.PROBLEM)
  ApiResponse.success(res, problem, 'Problem fetched successfully')
})

// POST /api/v1/problems/:id/run
const runCode = asyncHandler(async (req, res) => {
  const { code, language = 'javascript' } = req.body

  if (!code) return ApiResponse.badRequest(res, 'code is required')

  const problem = await prisma.problem.findUnique({
    where: { id: Number(req.params.id) },
    select: { testCases: true, title: true },
  })
  if (!problem) return ApiResponse.notFound(res, 'Problem not found')

  if (language !== 'javascript') {
    return ApiResponse.success(
      res,
      {
        supported: false,
        language,
        message: `Sandbox execution only supports JavaScript. Switch to JavaScript to run your code against test cases.`,
      },
      'Language not supported'
    )
  }

  const testCases = Array.isArray(problem.testCases) ? problem.testCases : []
  const results = testCases.map((tc, index) => {
    const startTime = Date.now()
    try {
      // Run user code + function call in isolated vm context
      const sandbox = Object.create(null)
      vm.runInNewContext(code, sandbox, { timeout: 3000 })

      sandbox.__result__ = undefined
      vm.runInNewContext(`__result__ = ${tc.call}`, sandbox, { timeout: 3000 })

      const runtime = Date.now() - startTime
      const passed =
        JSON.stringify(sandbox.__result__) === JSON.stringify(tc.expected)

      return {
        index: index + 1,
        input: tc.call,
        expected: tc.expected,
        got: sandbox.__result__,
        passed,
        runtime,
        error: null,
      }
    } catch (e) {
      return {
        index: index + 1,
        input: tc.call,
        expected: tc.expected,
        got: null,
        passed: false,
        runtime: Date.now() - startTime,
        error: e.message.split('\n')[0],
      }
    }
  })

  const passed = results.filter((r) => r.passed).length

  ApiResponse.success(
    res,
    {
      supported: true,
      results,
      summary: {
        total: results.length,
        passed,
        failed: results.length - passed,
        allPassed: passed === results.length,
      },
    },
    'Code executed successfully'
  )
})

// POST /api/v1/problems/sync  — fetch all NeetCode 250 from LeetCode and cache in DB
const syncProblems = asyncHandler(async (req, res) => {
  const synced = []
  const skipped = []
  const errors = []

  for (let i = 0; i < NEETCODE_SLUGS.length; i++) {
    const slug = NEETCODE_SLUGS[i]
    try {
      const question = await fetchFromLeetCode(slug)
      const problem = transformQuestion(question)

      if (!problem) {
        skipped.push(slug)
        continue
      }

      await prisma.problem.upsert({
        where: { slug: problem.slug },
        update: problem,
        create: problem,
      })
      synced.push(problem.title)
    } catch (e) {
      errors.push({ slug, error: e.message })
    }

    // Small delay between requests to avoid rate-limiting
    if (i < NEETCODE_SLUGS.length - 1) {
      await new Promise(r => setTimeout(r, 300))
    }
  }

  await cache.delByPattern('problems:*')

  ApiResponse.success(
    res,
    { synced: synced.length, skipped: skipped.length, errors },
    `Synced ${synced.length} problems, skipped ${skipped.length} (premium/unavailable)`
  )
})

module.exports = { getAllProblems, getProblemById, runCode, syncProblems }
