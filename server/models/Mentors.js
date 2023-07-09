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
    gender: {
        type: String
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
    googleMeet: {
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
    ],
    mentees: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user',
                required: true
            },
            dateAdded: {
                type: Date,
                default: Date.now ()
            },
            chatStatus: {
                type: Boolean,
                default: false
            }
        }
    ],
    sessions: [
        {
            date: {
                type: Date,
                required: true
            },
            startTime: {
                type: String,
                required: true
            },
            endTime: {
                type: String,
                required: true
            },
            slots: {
                type: Number,
                required: true
            },
            dateAdded: {
                type: Date,
                default: Date.now ()
            }
        }
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
    userId: {
        type: mongoose.ObjectId,
        required: true,
        ref: "user"
    },
    mentorId: {
        type: mongoose.ObjectId,
        ref: "mentors",
        required: true
    },
    session: {
        type: mongoose.ObjectId,
        ref: 'mentors.sessions',  
        required: true,
    },
    topic: {
        type: String,
        required: true
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
