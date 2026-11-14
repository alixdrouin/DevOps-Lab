import { getRegisteredStudents } from '../services/registrations.service.js'
import { HttpError } from '../utils/HttpError.js'

export async function listSessionRegistrations (req, res, next) {
  try {
    // req.user is set by the auth middleware (requireAuth)
    const result = await getRegisteredStudents(req.params.id, req.user.id)
    res.json(result)
  } catch (err) {
    if (err instanceof HttpError) {
      return res.status(err.status).json({ message: err.message })
    }
    next(err)
  }
}
