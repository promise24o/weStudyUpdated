const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");


const donorsSchema = new mongoose.Schema({
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
            "Rejected",
        ],
        default: "Pending",
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

donorsSchema.set("timestamps", true);

const donorApplicationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'applicationSource',
        required: true
    },
    applicationSource: {
        type: String,
        required: true,
        enum: ['user', 'Donors']
    },
    dob: {
        type: Date,
        required: true,
    },
    contactAddress: {
        type: String,
        required: true,
    },
    phoneNo: {
        type: String,
        required: true,
    },
    sourceOfFunds: {
        type: String,
        required: true,
    },
    donationPurpose: {
        type: String,
        required: true,
    },
    backgroundAffiliations: {
        type: String,
        required: true,
    },
    organization: {
        type: String,
        required: true,
    },
    linkedinProfile: {
        type: String,
    },
    facebookUsername: {
        type: String,
    },
    twitterHandle: {
        type: String,
    },
    amlAcknowledge: {
        type: Boolean,
        required: true,
    },
    identificationFile: {
        type: String,
        required: true,
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
}, {
    timestamps: true,
});

donorApplicationSchema.set("timestamps", true);

const notificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'applicationSource',
        required: true
    },
    applicationSource: {
        type: String,
        required: true,
        enum: ['user', 'Donors']
    },
    action: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false
    },
});

const raiseApplicationSchema = new mongoose.Schema({
    user: {
        type: mongoose.ObjectId,
        required: true,
        ref: "user",
    },
    title: {
        type: String,
        required: true,
    },
    category: {
        type: mongoose.ObjectId,
        required: true,
        ref: "RaiseCategory",
    },
    reason: {
        type: String,
        required: true,
    },
    amountRequest: {
        type: Number,
        required: true,
    },
    displayPersonalDetails: {
        type: Boolean,
        default: true,
    },
    dob: {
        type: Date,
        required: true,
    },
    phoneNo: {
        type: String,
        required: true,
    },
    contactAddress: {
        type: String,
        required: true,
    },
    semesterResultFile: {
        type: String, 
        required: true,
    },
    identificationFile: {
        type: String, 
        required: true,
    },
    bannerImageFile: {
        type: String,
        required: true,
    },
    agreement: {
        type: String,
    },
    agreementSigned: {
        type: Boolean,
        default: false
    },
    agreementSignedDate: {
        type: Date,
    },
    status: {
        type: String,
        enum: [
            "Application Submitted",
            "Under Review",
            "Pending Agreement",
            "Agreement Completed",
            "Approved",
            "Active",
            "Suspended",
            "Rejected",
            "Completed"
        ],
        default: "Application Submitted"
    },
    logs: [{
        action: {
            type: String,
        },
        date: {
            type: Date,
            default: Date.now
        }
    }],
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
});

raiseApplicationSchema.set('timestamps', true);

donorsSchema.methods.generateAuthToken = async function () {
    const token = jwt.sign({
        _id: this._id
    }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });
    this.token = token;
    await this.save();
    return token;
};

const raiseCategorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
});
raiseCategorySchema.set('timestamps', true);

module.exports = {
    Donors: mongoose.model('Donors', donorsSchema),
    DonorApplication: mongoose.model('DonorApplication', donorApplicationSchema),
    DonorNotification: mongoose.model('DonorNotification', notificationSchema),
    RaiseApplication: mongoose.model('RaiseApplication', raiseApplicationSchema),
    RaiseCategory: mongoose.model('RaiseCategory', raiseCategorySchema),
};
