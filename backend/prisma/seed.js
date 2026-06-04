require('dotenv').config()
const { PrismaClient } = require('@prisma/client')
const { PrismaPg } = require('@prisma/adapter-pg')
const bcrypt = require('bcrypt')

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

const PROBLEMS = [
  {
    title: 'Two Sum',
    slug: 'two-sum',
    difficulty: 'EASY',
    description: `Given an array of integers \`nums\` and an integer \`target\`, return **indices** of the two numbers such that they add up to \`target\`.

You may assume that each input would have **exactly one solution**, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      { input: 'nums = [2,7,11,15], target = 9', output: '[0,1]', explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].' },
      { input: 'nums = [3,2,4], target = 6', output: '[1,2]' },
      { input: 'nums = [3,3], target = 6', output: '[0,1]' },
    ],
    constraints: [
      '2 <= nums.length <= 10^4',
      '-10^9 <= nums[i] <= 10^9',
      '-10^9 <= target <= 10^9',
      'Only one valid answer exists.',
    ],
    testCases: [
      { call: 'twoSum([2,7,11,15], 9)', expected: [0, 1] },
      { call: 'twoSum([3,2,4], 6)', expected: [1, 2] },
      { call: 'twoSum([3,3], 6)', expected: [0, 1] },
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @param {number} target
 * @return {number[]}
 */
var twoSum = function(nums, target) {

};`,
      python: `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        pass`,
      java: `class Solution {
    public int[] twoSum(int[] nums, int target) {

    }
}`,
    },
    tags: ['Array', 'Hash Table'],
  },
  {
    title: 'Valid Parentheses',
    slug: 'valid-parentheses',
    difficulty: 'EASY',
    description: `Given a string \`s\` containing just the characters \`'('\`, \`')'\`, \`'{'\`, \`'}'\`, \`'['\` and \`']'\`, determine if the input string is valid.

An input string is valid if:
1. Open brackets must be closed by the **same type** of brackets.
2. Open brackets must be closed in the **correct order**.
3. Every close bracket has a corresponding open bracket of the same type.`,
    examples: [
      { input: 's = "()"', output: 'true' },
      { input: 's = "()[]{}"', output: 'true' },
      { input: 's = "(]"', output: 'false' },
    ],
    constraints: [
      '1 <= s.length <= 10^4',
      "s consists of parentheses only '()[]{}'.",
    ],
    testCases: [
      { call: 'isValid("()")', expected: true },
      { call: 'isValid("()[]{}")', expected: true },
      { call: 'isValid("(]")', expected: false },
      { call: 'isValid("([)]")', expected: false },
      { call: 'isValid("{[]}")', expected: true },
    ],
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {boolean}
 */
var isValid = function(s) {

};`,
      python: `class Solution:
    def isValid(self, s: str) -> bool:
        pass`,
      java: `class Solution {
    public boolean isValid(String s) {

    }
}`,
    },
    tags: ['String', 'Stack'],
  },
  {
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    difficulty: 'MEDIUM',
    description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.

A **substring** is a contiguous non-empty sequence of characters within a string.`,
    examples: [
      { input: 's = "abcabcbb"', output: '3', explanation: 'The answer is "abc", with the length of 3.' },
      { input: 's = "bbbbb"', output: '1', explanation: 'The answer is "b", with the length of 1.' },
      { input: 's = "pwwkew"', output: '3', explanation: 'The answer is "wke", with the length of 3.' },
    ],
    constraints: [
      '0 <= s.length <= 5 * 10^4',
      's consists of English letters, digits, symbols and spaces.',
    ],
    testCases: [
      { call: 'lengthOfLongestSubstring("abcabcbb")', expected: 3 },
      { call: 'lengthOfLongestSubstring("bbbbb")', expected: 1 },
      { call: 'lengthOfLongestSubstring("pwwkew")', expected: 3 },
      { call: 'lengthOfLongestSubstring("")', expected: 0 },
    ],
    starterCode: {
      javascript: `/**
 * @param {string} s
 * @return {number}
 */
var lengthOfLongestSubstring = function(s) {

};`,
      python: `class Solution:
    def lengthOfLongestSubstring(self, s: str) -> int:
        pass`,
      java: `class Solution {
    public int lengthOfLongestSubstring(String s) {

    }
}`,
    },
    tags: ['Hash Table', 'String', 'Sliding Window'],
  },
  {
    title: 'Maximum Subarray',
    slug: 'maximum-subarray',
    difficulty: 'MEDIUM',
    description: `Given an integer array \`nums\`, find the **subarray** with the largest sum, and return its sum.

A **subarray** is a contiguous part of an array.`,
    examples: [
      { input: 'nums = [-2,1,-3,4,-1,2,1,-5,4]', output: '6', explanation: 'The subarray [4,-1,2,1] has the largest sum 6.' },
      { input: 'nums = [1]', output: '1' },
      { input: 'nums = [5,4,-1,7,8]', output: '23' },
    ],
    constraints: [
      '1 <= nums.length <= 10^5',
      '-10^4 <= nums[i] <= 10^4',
    ],
    testCases: [
      { call: 'maxSubArray([-2,1,-3,4,-1,2,1,-5,4])', expected: 6 },
      { call: 'maxSubArray([1])', expected: 1 },
      { call: 'maxSubArray([5,4,-1,7,8])', expected: 23 },
    ],
    starterCode: {
      javascript: `/**
 * @param {number[]} nums
 * @return {number}
 */
var maxSubArray = function(nums) {

};`,
      python: `class Solution:
    def maxSubArray(self, nums: list[int]) -> int:
        pass`,
      java: `class Solution {
    public int maxSubArray(int[] nums) {

    }
}`,
    },
    tags: ['Array', 'Dynamic Programming', 'Divide and Conquer'],
  },
  {
    title: 'Climbing Stairs',
    slug: 'climbing-stairs',
    difficulty: 'EASY',
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb **1** or **2** steps. In how many distinct ways can you climb to the top?`,
    examples: [
      { input: 'n = 2', output: '2', explanation: 'There are two ways: 1 step + 1 step; or 2 steps.' },
      { input: 'n = 3', output: '3', explanation: 'There are three ways: 1+1+1 steps; 1+2 steps; 2+1 steps.' },
    ],
    constraints: ['1 <= n <= 45'],
    testCases: [
      { call: 'climbStairs(2)', expected: 2 },
      { call: 'climbStairs(3)', expected: 3 },
      { call: 'climbStairs(4)', expected: 5 },
      { call: 'climbStairs(10)', expected: 89 },
    ],
    starterCode: {
      javascript: `/**
 * @param {number} n
 * @return {number}
 */
var climbStairs = function(n) {

};`,
      python: `class Solution:
    def climbStairs(self, n: int) -> int:
        pass`,
      java: `class Solution {
    public int climbStairs(int n) {

    }
}`,
    },
    tags: ['Math', 'Dynamic Programming', 'Memoization'],
  },
]

async function main() {
  console.log('🌱 Seeding database...')

  const hashedPassword = await bcrypt.hash('password123', 12)

  const interviewer = await prisma.user.upsert({
    where: { email: 'interviewer@google.com' },
    update: { password: hashedPassword },
    create: {
      email: 'interviewer@google.com',
      name: 'Senior Engineer',
      password: hashedPassword,
      role: 'INTERVIEWER',
    },
  })

  const candidate = await prisma.user.upsert({
    where: { email: 'alif@example.com' },
    update: { password: hashedPassword },
    create: {
      email: 'alif@example.com',
      name: 'Alif',
      password: hashedPassword,
      role: 'CANDIDATE',
    },
  })

  await prisma.interviewSession.upsert({
    where: { id: 1 },
    update: {},
    create: {
      title: 'Google L3 Technical Interview',
      role: 'Software Engineer',
      level: 'L3',
      status: 'SCHEDULED',
      scheduledAt: new Date('2024-12-01T10:00:00Z'),
      interviewerId: interviewer.id,
      candidateId: candidate.id,
    },
  })

  for (const problem of PROBLEMS) {
    await prisma.problem.upsert({
      where: { slug: problem.slug },
      update: {
        title: problem.title,
        difficulty: problem.difficulty,
        description: problem.description,
        examples: problem.examples,
        constraints: problem.constraints,
        testCases: problem.testCases,
        starterCode: problem.starterCode,
        tags: problem.tags,
      },
      create: problem,
    })
    console.log(`  ✓ ${problem.title}`)
  }

  console.log('✅ Seeded successfully')
}

main()
  .catch(console.error)
  .finally(async () => await prisma.$disconnect())
