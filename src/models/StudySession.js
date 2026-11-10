import mongoose from 'mongoose'

const studySessionSchema = new mongoose.Schema({
  tutor: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  subject: { type: String, required: true },
  topic: { type: String },
  date: { type: Date, required: true },
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  academicLevel: { type: String },
  description: { type: String, maxlength: 500 },
  capacity: { type: Number, required: true, min: 1, max: 30 },
  status: { type: String, enum: ['Active', 'Cancelled'], default: 'Active' }
}, { timestamps: true })

export default mongoose.model('StudySession', studySessionSchema)
