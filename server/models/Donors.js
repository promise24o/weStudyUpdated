const mongoose = require ("mongoose");
const jwt = require ("jsonwebtoken");


const donorsSchema = new mongoose.Schema ({
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
            "Pending", "Active", "Suspended",
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

donorsSchema.set ("timestamps", true);

donorsSchema.methods.generateAuthToken = async function () {
    const token = jwt.sign ({
        _id: this._id
    }, process.env.JWT_SECRET_KEY, {expiresIn: "1d"});
    this.token = token;
    await this.save ();
    return token;
};

module.exports = mongoose.model ("Donors", donorsSchema);
