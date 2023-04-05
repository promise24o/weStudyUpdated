const mongoose = require('mongoose');

const gpaSchema = new mongoose.Schema({
    userId: {
        type: mongoose.ObjectId,
        required: true,
        ref: "users"
    },
    level: {
        type: String
    },
    institution: {
        type: String
    },
    semester: {
        type: String
    },
    courses: [{
        title: {
            type: String
        },
        code: {
            type: String
        },
        unit: {
            type: Number
        },
        grade: {
            type: Number
        },
        symbol: {
            type: String
        },
        createdAt: {
            type: Date,
            default: Date.now(),
        }

    }]
});

gpaSchema.set('timestamps', true);

module.exports = mongoose.model('gpa', gpaSchema);