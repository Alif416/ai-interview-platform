/**
 * User Controller
 * Handles user profile operations
 * Delegates business logic to services/repositories
 */

const ApiResponse = require('../utils/apiResponse')
const asyncHandler = require('../middleware/asyncHandler')
const { NotFoundError } = require('../core/errors')

const getProfile = asyncHandler(async (req, res) => {
  const { userRepository } = req.container
  const user = await userRepository.getUserProfile(req.user.id)
  ApiResponse.success(res, user, 'Profile retrieved successfully')
})

const updateProfile = asyncHandler(async (req, res) => {
  const { userRepository } = req.container
  const { name, username } = req.body

  const updateData = {}
  if (name) updateData.name = name
  if (username) updateData.username = username

  const user = await userRepository.updateUser(req.user.id, updateData)
  ApiResponse.success(res, user, 'Profile updated successfully')
})

const getUserById = asyncHandler(async (req, res) => {
  const { userRepository } = req.container
  const { userId } = req.params

  const user = await userRepository.getUserProfile(parseInt(userId))
  ApiResponse.success(res, user, 'User retrieved successfully')
})

module.exports = { getProfile, updateProfile, getUserById }