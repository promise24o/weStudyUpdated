const mongoose = require ("mongoose");

const verificationBadgeSchema = new mongoose.Schema ({
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    logo: {
        type: String,  
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const VerificationBadge = mongoose.model ("VerificationBadge", verificationBadgeSchema);

module.exports = VerificationBadge;

