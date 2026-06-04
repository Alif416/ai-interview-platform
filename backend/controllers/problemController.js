const vm = require('vm')
const ApiResponse = require('../utils/apiResponse')
const asyncHandler = require('../middleware/asyncHandler')
const { prisma } = require('../config/database')

// GET /api/v1/problems
const getAllProblems = asyncHandler(async (req, res) => {
  const problems = await prisma.problem.findMany({
    select: {
      id: true,
      title: true,
      slug: true,
      difficulty: true,
      tags: true,
    },
    orderBy: [{ difficulty: 'asc' }, { id: 'asc' }],
  })
  ApiResponse.success(res, problems, 'Problems fetched successfully')
})

// GET /api/v1/problems/:id
const getProblemById = asyncHandler(async (req, res) => {
  const problem = await prisma.problem.findUnique({
    where: { id: Number(req.params.id) },
  })
  if (!problem) return ApiResponse.notFound(res, 'Problem not found')
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

module.exports = { getAllProblems, getProblemById, runCode }
