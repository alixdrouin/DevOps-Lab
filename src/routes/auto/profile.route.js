import { Router } from 'express'

const router = Router()

// Temporary storage for student profiles
const profiles = []

// GET - View a student's profile
router.get('/api/profiles/:id', (req, res) => {
  const profile = profiles.find(p => p.id === Number(req.params.id))

  if (!profile) {
    return res.status(404).json({ error: 'Profile not found' })
  }

  res.status(200).json(profile)
})

// PUT - Create or update a student's profile
router.put('/api/profiles/:id', (req, res) => {
  const { name, year, major, bio } = req.body

  if (!name || !year || !major || !bio) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const id = Number(req.params.id)

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({ error: 'Invalid profile ID' })
  }

  let profile = profiles.find(p => p.id === id)

  if (profile) {
    profile.name = name
    profile.year = year
    profile.major = major
    profile.bio = bio

    return res.status(200).json(profile)
  }

  profile = { id, name, year, major, bio }
  profiles.push(profile)

  res.status(201).json(profile)
})

export default router
