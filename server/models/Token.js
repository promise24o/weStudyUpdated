const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
    userId: {
        type: mongoose.ObjectId,
        required: true,
        ref: "users",
    },
    token: {
        type: String,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        expires: 300
    }
});

module.exports = mongoose.model('tokens', tokenSchema);