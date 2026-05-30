const jwt = require('jsonwebtoken')
const config = require('../config/config')

const generateToken = (payload) => {
    return jwt.sign(payload, config.JWT_SECRET, {
        expiresIn: config.JWT_EXPIRES_IN
    })
}

const verifyToken = (token) => {
    try {
        return jwt.verify(token, config.JWT_SECRET)
        
    } catch (error) {
        return null
    }
}

module.exports = {generateToken,verifyToken}