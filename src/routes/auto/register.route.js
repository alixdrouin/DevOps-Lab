import { Router } from 'express'
import { getDatabase } from '../../config/database.js'
import { hashPassword } from '../../utils/password.js'

const router = Router()

router.post('/api/auth/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body ?? {}

    if (
      typeof name !== 'string' ||
      !name.trim() ||
      typeof email !== 'string' ||
      typeof password !== 'string' ||
      !password
    ) {
      return res.status(400).json({
        error: 'All fields are required'
      })
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return res.status(400).json({
        error: 'Invalid email address'
      })
    }

    const normalizedEmail = email.trim().toLowerCase()
    const users = getDatabase().collection('users')

    const existingUser = await users.findOne({
      email: normalizedEmail
    })

    if (existingUser) {
      return res.status(409).json({
        error: 'Email already registered'
      })
    }

    const passwordHash = await hashPassword(password)

    const result = await users.insertOne({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      createdAt: new Date()
    })

    return res.status(201).json({
      message: 'Account created successfully',
      userId: result.insertedId.toString(),
      name: name.trim(),
      email: normalizedEmail
    })
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ error: 'Email already registered' })
    }
    next(error)
  }
})

export default router
