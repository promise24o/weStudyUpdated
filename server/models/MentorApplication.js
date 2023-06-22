const {required} = require ("joi");
const mongoose = require ("mongoose");

const mentorApplicationSchema = new mongoose.Schema ({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    skills: {
        type: String,
        required: true
    },
    faculty: {
        type: mongoose.ObjectId,
        required: true,
        ref: "MentorFaculty"
    },
    about: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    linkedin: {
        type: String
    },
    facebook: {
        type: String
    },
    twitterHandle: {
        type: String
    },
    status: {
        type: String,
        enum: [
            "Pending", "Under Review", "Approved", "Rejected"
        ],
        default: "Pending"
    },
    lastUpdated: [
        {
            admin: {
                type: mongoose.ObjectId,
                required: true,
                ref: "Admin"
            },
            action: {
                type: String,
                required: true
            },
            dateUpdated: {
                type: Date,
                default: Date.now
            }
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {collection: "mentorApplications"});

const MentorApplication = mongoose.model ("MentorApplication", mentorApplicationSchema);

module.exports = MentorApplication;
