const nodemailer = require('nodemailer')
const { Resolver } = require('dns').promises
const config = require('../config/config')

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  connectionTimeout: 10000,
  socketTimeout: 10000,
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASS,
  },
})

const resolver = new Resolver()
resolver.setServers(['8.8.8.8', '1.1.1.1'])

// Returns false only when we can positively confirm the domain has no mail servers.
// Fails open on network/DNS errors so legitimate users aren't blocked by a DNS outage.
const validateEmailDomain = async (email) => {
  const domain = email.split('@')[1]
  try {
    const records = await Promise.race([
      resolver.resolveMx(domain),
      new Promise((_, reject) => setTimeout(() => reject(new Error('dns_timeout')), 5000)),
    ])
    return Array.isArray(records) && records.length > 0
  } catch (err) {
    // ENOTFOUND / ENODATA = domain has no MX records → definitely invalid
    if (err.code === 'ENOTFOUND' || err.code === 'ENODATA' || err.code === 'ESERVFAIL') {
      return false
    }
    // Network/timeout issues → fail open, let the send attempt surface the real error
    return true
  }
}

const verifyTransporter = async () => {
  await transporter.verify()
  console.log('✅ Email transporter ready')
}

const sendVerificationEmail = async (email, name, token) => {
  const url = `${config.FRONTEND_URL}/verify-email?token=${token}`

  await transporter.sendMail({
    from: `"LevelUp.io" <${config.EMAIL_USER}>`,
    to: email,
    subject: 'Verify your email — LevelUp.io',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#1a1a1a;color:#e5e5e5;border-radius:12px">
        <h2 style="color:#ffa116;margin:0 0 8px">LevelUp.io</h2>
        <h3 style="margin:0 0 16px;color:#ffffff">Verify your email address</h3>
        <p style="color:#a3a3a3;margin:0 0 24px">Hi ${name}, thanks for signing up. Click the button below to verify your email. This link expires in <strong style="color:#e5e5e5">24 hours</strong>.</p>
        <a href="${url}" style="display:inline-block;background:#ffa116;color:#000;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px">Verify Email</a>
        <p style="color:#525252;font-size:12px;margin:24px 0 0">If you didn't create an account, you can safely ignore this email.</p>
      </div>
    `,
  })
}

const sendPasswordResetEmail = async (email, name, token) => {
  const url = `${config.FRONTEND_URL}/reset-password?token=${token}`

  await transporter.sendMail({
    from: `"LevelUp.io" <${config.EMAIL_USER}>`,
    to: email,
    subject: 'Reset your password — LevelUp.io',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;background:#1a1a1a;color:#e5e5e5;border-radius:12px">
        <h2 style="color:#ffa116;margin:0 0 8px">LevelUp.io</h2>
        <h3 style="margin:0 0 16px;color:#ffffff">Reset your password</h3>
        <p style="color:#a3a3a3;margin:0 0 24px">Hi ${name}, we received a request to reset your password. Click the button below to choose a new one. This link expires in <strong style="color:#e5e5e5">1 hour</strong>.</p>
        <a href="${url}" style="display:inline-block;background:#ffa116;color:#000;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;font-size:14px">Reset Password</a>
        <p style="color:#525252;font-size:12px;margin:24px 0 0">If you didn't request a password reset, you can safely ignore this email. Your password will not change.</p>
      </div>
    `,
  })
}

module.exports = { verifyTransporter, validateEmailDomain, sendVerificationEmail, sendPasswordResetEmail }
