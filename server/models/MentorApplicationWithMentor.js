const {required} = require ("joi");
const mongoose = require ("mongoose");

const mentorApplicationWithMentorSchema = new mongoose.Schema ({
    mentorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Mentors",
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
    education: {
        type: String,
        required: true
    },
    organization: {
        type: String,
        required: true
    },
    linkedin: {
        type: String
    },
    googleMeet: {
        type: String
    },
    twitterHandle: {
        type: String
    },
    status: {
        type: String,
        enum: [
            "Pending",
            "Profile Pending",
            "Application Submitted",
            "Under Review",
            "Approved",
            "Active",
            "Suspended",
            "Rejected"
        ],
        default: "Application Submitted"
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
}, {collection: "mentorApplicationsWithMentor"});

const MentorApplicationWithMentor = mongoose.model ("MentorApplicationWithMentor", mentorApplicationWithMentorSchema);

module.exports = MentorApplicationWithMentor;
