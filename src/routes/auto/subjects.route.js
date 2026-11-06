import { Router } from 'express'

const router = Router()

// STUD-10: list of my strong subjects (no database yet)
const subjects = [
  { id: 1, name: 'Maths', level: 'Advanced' }
]
let nextId = 2

// GET all subjects
router.get('/api/subjects', (req, res) => {
  res.status(200).json(subjects)
})

// GET one subject
router.get('/api/subjects/:id', (req, res) => {
  const subject = subjects.find(s => s.id === Number(req.params.id))
  if (!subject) {
    return res.status(404).json({ error: 'Subject not found' })
  }
  res.status(200).json(subject)
})

// POST add a subject
router.post('/api/subjects', (req, res) => {
  const { name, level } = req.body
  if (!name || !level) {
    return res.status(400).json({ error: 'Missing name or level' })
  }
  const newSubject = { id: nextId++, name, level }
  subjects.push(newSubject)
  res.status(201).json(newSubject)
})

// PUT update a subject
router.put('/api/subjects/:id', (req, res) => {
  const subject = subjects.find(s => s.id === Number(req.params.id))
  if (!subject) {
    return res.status(404).json({ error: 'Subject not found' })
  }
  if (req.body.name) subject.name = req.body.name
  if (req.body.level) subject.level = req.body.level
  res.status(200).json(subject)
})

// DELETE remove a subject
router.delete('/api/subjects/:id', (req, res) => {
  const index = subjects.findIndex(s => s.id === Number(req.params.id))
  if (index === -1) {
    return res.status(404).json({ error: 'Subject not found' })
  }
  subjects.splice(index, 1)
  res.status(204).end()
})

export default router
