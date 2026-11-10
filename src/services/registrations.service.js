import mongoose from 'mongoose'
import '../models/student.js'
import StudySession from '../models/StudySession.js'
import Registration from '../models/Registration.js'
import { HttpError } from '../utils/HttpError.js'

/*
 Only the tutor of the session may see the list.
 */
export async function getRegisteredStudents (sessionId, requesterId) {
  if (!mongoose.isValidObjectId(sessionId)) {
    throw new HttpError(400, 'Invalid session id')
  }

  const session = await StudySession.findById(sessionId).select('tutor capacity').lean()
  if (!session) {
    throw new HttpError(404, 'Session not found')
  }

  // Authorization: only the tutor of this session
  if (String(session.tutor) !== String(requesterId)) {
    throw new HttpError(403, 'Only the tutor of this session can see its registered students')
  }

  // Only seats actually taken (Confirmed) count; cancelled bookings free the seat
  const registrations = await Registration.find({ session: sessionId, status: 'Confirmed' })
    .sort({ registeredAt: 1 })
    .populate({ path: 'student', select: 'name year major' }) // never email/password
    .lean()

  const students = registrations
    .filter((r) => r.student)
    .map((r) => ({
      id: r.student._id,
      name: r.student.name,
      year: r.student.year,
      major: r.student.major
    }))

  return {
    sessionId,
    seats: { taken: registrations.length, max: session.capacity },
    students
  }
}
