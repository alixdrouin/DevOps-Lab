import { Router } from 'express'
import { randomBytes, createHash } from 'node:crypto'
import { users } from '../../data/users.js'
import { sendResetEmail } from '../../services/email.service.js'

const router = Router()
const resetTokens = new Map()
const RESET_EXPIRY_MS = 15 * 60 * 1000

// STUD-8: Request a password reset
router.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body ?? {}

  if (typeof email !== 'string' || !email.trim()) {
    return res.status(400).json({ error: 'Email is required' })
  }

  const user = users.find(
    u => u.email.toLowerCase() === email.trim().toLowerCase()
  )

  if (user) {
    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')

    resetTokens.set(tokenHash, {
      userId: user.id,
      expiresAt: Date.now() + RESET_EXPIRY_MS
    })

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'
    const resetLink = `${frontendUrl}/reset-password?token=${token}`

    try {
      await sendResetEmail(user.email, resetLink)
    } catch (error) {
      resetTokens.delete(tokenHash)
      return res.status(503).json({
        error: 'Password reset email service is unavailable'
      })
    }
  }

  return res.status(200).json({
    message: 'If this email exists, a reset link will be sent.'
  })
})

// STUD-8: Reset password
router.post('/api/auth/reset-password', (req, res) => {
  const { token, newPassword } = req.body ?? {}

  if (
    typeof token !== 'string' ||
    !token ||
    typeof newPassword !== 'string' ||
    newPassword.length < 8
  ) {
    return res.status(400).json({
      error: 'A valid token and a password of at least 8 characters are required'
    })
  }

  const tokenHash = createHash('sha256').update(token).digest('hex')
  const resetData = resetTokens.get(tokenHash)

  if (!resetData || Date.now() >= resetData.expiresAt) {
    resetTokens.delete(tokenHash)
    return res.status(400).json({
      error: 'Invalid or expired reset link'
    })
  }

  const user = users.find(u => u.id === resetData.userId)

  if (!user) {
    resetTokens.delete(tokenHash)
    return res.status(400).json({
      error: 'Invalid reset link'
    })
  }

  // Compatibility with the existing STUD-7 demo login
  user.password = newPassword

  // Invalidate all outstanding reset tokens for this user
  for (const [hash, data] of resetTokens) {
    if (data.userId === user.id) {
      resetTokens.delete(hash)
    }
  }

  return res.status(200).json({
    message: 'Password reset successful'
  })
})

export default router
