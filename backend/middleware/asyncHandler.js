// This is GENIUS level middleware
// Wraps async functions so you never need try/catch in controllers

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

module.exports = asyncHandler