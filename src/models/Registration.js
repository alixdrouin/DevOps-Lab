import mongoose from 'mongoose'

const registrationSchema = new mongoose.Schema({
    session: { type: mongoose.Schema.Types.ObjectId, ref: 'StudySession', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    status: {
        type: String,
        enum: ['Confirmed', 'CancelledByLearner', 'CancelledByTutor', 'Completed', 'Disputed'],
        default: 'Confirmed'
    },
    registeredAt: { type: Date, default: Date.now }
})

registrationSchema.index(
    { session: 1, student: 1 },
    { unique: true, partialFilterExpression: { status: 'Confirmed' } }
)

export default mongoose.model('Registration', registrationSchema)