import { ObjectId } from 'mongodb'
import { getDatabase } from '../config/database.js'
import { HttpError } from '../utils/HttpError.js'

export async function registerForSession (sessionId, studentId) {
  // Check if the student ID is provided
  if (studentId === undefined || studentId === null || String(studentId).trim() === '') {
    throw new HttpError(400, 'Invalid student ID')
  }

  // Check if the session ID is valid
  if (!ObjectId.isValid(sessionId)) {
    throw new HttpError(400, 'Invalid session ID')
  }

  // Connect to MongoDB
  const db = getDatabase()

  // Search for the session
  const session = await db.collection('sessions').findOne({
    _id: new ObjectId(sessionId)
  })

  // Check if the session exists
  if (!session) {
    throw new HttpError(404, 'Session not found')
  }

  // Check if the session is cancelled
  if (session.status === 'Cancelled') {
    throw new HttpError(409, 'This session is cancelled')
  }
  // Check if the student is already registered
  const existingRegistration = await db.collection('registrations').findOne({
    sessionId: new ObjectId(sessionId),
    studentId: String(studentId),
    status: 'registered'
  })

  if (existingRegistration) {
    throw new HttpError(409, 'You are already registered for this session')
  }

  // Atomically reserve one available seat
  const reservationResult = await db.collection('sessions').updateOne(
    {
      _id: session._id,
      status: { $ne: 'Cancelled' },
      $expr: {
        $lt: [
          { $ifNull: ['$reservedSeats', 0] },
          '$maxSeats'
        ]
      }
    },
    {
      $inc: { reservedSeats: 1 }
    }
  )

  if (reservationResult.modifiedCount === 0) {
    throw new HttpError(409, 'This session is full or cancelled')
  }

  // Save the student's registration
  const registration = {
    sessionId: new ObjectId(sessionId),
    studentId: String(studentId),
    status: 'registered',
    registeredAt: new Date()
  }

  let result

  try {
    result = await db.collection('registrations').insertOne(registration)
  } catch (error) {
    // Release the reserved seat if registration fails
    await db.collection('sessions').updateOne(
      { _id: session._id },
      { $inc: { reservedSeats: -1 } }
    )

    throw error
  }

  return {
    id: result.insertedId.toString(),
    message: 'Successfully registered for the session'
  }
}
