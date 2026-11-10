import mongoose from 'mongoose'
import Student from './models/Student.js'
import StudySession from './models/StudySession.js'
import Registration from './models/Registration.js'

await mongoose.connect(process.env.MONGODB_URI)

// On vide les anciennes données de test pour éviter les doublons
await Registration.deleteMany({})
await StudySession.deleteMany({})
await Student.deleteMany({})

const [tutor, alice, bob, carol, stranger] = await Student.insertMany([
    { name: 'Tutor', email: 'tutor@test.fr', password: 'x', year: 4, major: 'Data' },
    { name: 'Alice', email: 'alice@test.fr', password: 'x', year: 3, major: 'Data' },
    { name: 'Bob', email: 'bob@test.fr', password: 'x', year: 2, major: 'Finance' },
    { name: 'Carol', email: 'carol@test.fr', password: 'x', year: 2, major: 'Cyber' },
    { name: 'Stranger', email: 'stranger@test.fr', password: 'x', year: 1, major: 'Civil' }
])

const session = await StudySession.create({
    tutor: tutor._id,
    subject: 'Calculus',
    topic: 'Derivatives',
    date: new Date(Date.now() + 7 * 24 * 3600 * 1000),
    startTime: '14:00',
    endTime: '16:00',
    capacity: 5
})

await Registration.insertMany([
    { session: session._id, student: alice._id, status: 'Confirmed' },
    { session: session._id, student: bob._id, status: 'Confirmed' },
    { session: session._id, student: carol._id, status: 'CancelledByLearner' }
])

console.log({
    tutorId: String(tutor._id),
    strangerId: String(stranger._id),
    sessionId: String(session._id)
})
await mongoose.disconnect()