import { Router } from 'express'
import jwt from 'jsonwebtoken'
import { users } from '../../data/users.js'

const router = Router()

// STUD-7: Log in
router.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {}

  const user = users.find(
    u => u.email === email && u.password === password
  )

  if (!user) {
    return res.status(401).json({
      error: 'Wrong email or password'
    })
  }

  if (!process.env.JWT_SECRET) {
    return res.status(500).json({
      error: 'Authentication is not configured'
    })
  }

  // Generate a JWT containing the authenticated user's ID
  const token = jwt.sign(
    {},
    process.env.JWT_SECRET,
    {
      algorithm: 'HS256',
      subject: String(user.id),
      expiresIn: '1h'
    }
  )

  return res.status(200).json({
    message: 'Logged in',
    name: user.name,
    token
  })
})

// STUD-7: Log out
router.post('/api/auth/logout', (req, res) => {
  return res.status(200).json({
    message: 'Logged out'
  })
})

export default router
