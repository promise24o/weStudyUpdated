const mongoose = require('mongoose');

const mentorFacultySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.ObjectId,
        required: true,
        ref: "admin"
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

const mentorsSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: true
    },
    avatar: {
        type: String
    },
    bio: {
        type: String
    },
    faculty: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    phone: {
        type: String,
        required: true,
    },
    institution: {
        type: String,
        required: true,
    },
    city: {
        type: String,
        required: true,
    },
    country: {
        type: String,
        required: true,
    },
    linkedin: {
        type: String,
    },
    twitter: {
        type: String,
    },
    facebook: {
        type: String,
    },
    calendly: {
        type: String,
        required: true
    },
});

mentorsSchema.set('timestamps', true);

module.exports = {
    MentorFaculty: mongoose.model('MentorFaculty', mentorFacultySchema),
    Mentors: mongoose.model('Mentors', mentorsSchema)
};