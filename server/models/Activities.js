const mongoose = require('mongoose');

const activitiesSchema = new mongoose.Schema({
    userId: {
        type: mongoose.ObjectId,
        required: true,
        ref: "users",
    },
    browser: {
        type: String,
    },
    ip_address: {
        type: String,
    },
    os: {
        type: String,
    },
    source: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
    }
});

module.exports = mongoose.model('activities', activitiesSchema);