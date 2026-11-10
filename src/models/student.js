import mongoose from 'mongoose'

const studentSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    year: { type: Number, required: true, min: 1, max: 5 },
    major: { type: String, required: true, trim: true },
    academicLevel: { type: String }
}, { timestamps: true })

export default mongoose.model('Student', studentSchema)