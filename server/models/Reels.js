const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.ObjectId,
        ref: 'user'
    },
    text: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    replies: [
        {
            user: {
                type: mongoose.ObjectId,
                ref: 'user'
            },
            text: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            }
        },
    ]
});

const reelSchema = new mongoose.Schema({
    user: {
        type: mongoose.ObjectId,
        required: true,
        ref: "user"
    },
    video: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    views: [
        {
            user: {
                type: mongoose.ObjectId,
                ref: 'user'
            }
        }
    ],
    likes: [
        {
            user: {
                type: mongoose.ObjectId,
                ref: 'user'
            }
        }
    ],
    comments: [commentSchema],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Reels = mongoose.model('Reels', reelSchema);

module.exports = Reels;
