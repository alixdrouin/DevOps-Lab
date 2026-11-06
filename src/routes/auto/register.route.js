import { Router } from 'express'

const router = Router()

router.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body ?? {}

  // Check required fields
  if (!name || !email || !password) {
    return res.status(400).json({
      error: 'All fields are required'
    })
  }

  // Check email format
  if (
    typeof email !== 'string' ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
  ) {
    return res.status(400).json({
      error: 'Invalid email address'
    })
  }

  const normalizedEmail = email.trim().toLowerCase()

  return res.status(200).json({
    message: 'Registration data validated',
    name,
    email: normalizedEmail
  })
})

export default router
