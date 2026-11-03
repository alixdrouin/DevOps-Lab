import { Router } from 'express'
import { users } from '../../data/users.js'

const router = Router()

// STUD-7: log in
router.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body
  const user = users.find(u => u.email === email && u.password === password)
  if (!user) {
    return res.status(401).json({ error: 'Wrong email or password' })
  }
  res.status(200).json({ message: 'Logged in', name: user.name })
})

// STUD-7: log out
router.post('/api/auth/logout', (req, res) => {
  res.status(200).json({ message: 'Logged out' })
})

export default router
