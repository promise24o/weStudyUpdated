const mongoose = require ("mongoose");
const jwt = require ('jsonwebtoken');

const mentorFacultySchema = new mongoose.Schema ({
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
        default: Date.now ()
    }
});

const mentorsSchema = new mongoose.Schema ({
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
        type: mongoose.ObjectId,
        ref: "MentorFaculty"
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    token: {
        type: String
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String
    },
    institution: {
        type: String
    },
    city: {
        type: String
    },
    country: {
        type: String
    },
    linkedin: {
        type: String
    },
    twitter: {
        type: String
    },
    facebook: {
        type: String
    },
    skills: {
        type: String
    },
    calendly: {
        type: String
    },
    status: {
        type: String,
        enum: [
            "Pending",
            "Profile Pending",
            "Under Review",
            "Active",
            "Suspended"

        ],
        default: "Pending",
        required: true
    },
    source: {
        type: String,
        required: true
    },
    rating: [
        {
            review: {
                type: String
            },
            rating: {
                type: Number
            },
            user: {
                type: mongoose.ObjectId,
                required: true,
                ref: "user"
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        },
    ]
});

mentorsSchema.set ("timestamps", true);

mentorsSchema.methods.generateAuthToken = async function () {
    const token = jwt.sign ({
        _id: this._id
    }, process.env.JWT_SECRET_KEY, {expiresIn: '1d'});
    this.token = token;
    await this.save ();
    return token;
};


const scheduleSchema = new mongoose.Schema ({
    user: {
        type: mongoose.ObjectId,
        required: true,
        ref: "user"
    },
    mentorId: {
        type: mongoose.ObjectId,
        ref: "mentors",
        required: true
    },
    eventType: {
        type: String,
        required: true
    },
    eventName: {
        type: String,
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    location: {
        joinUrl: {
            type: String,
            required: true
        },
        status: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        }
    },
    status: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        required: true
    },
    updatedAt: {
        type: Date,
        required: true
    }
});

scheduleSchema.set ("timestamps", true);

module.exports = {
    MentorFaculty: mongoose.model ("MentorFaculty", mentorFacultySchema),
    Mentors: mongoose.model ("Mentors", mentorsSchema),
    Schedule: mongoose.model ("Schedule", scheduleSchema)
};
