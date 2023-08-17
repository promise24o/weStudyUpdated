const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.ObjectId,
        ref: 'user',
        required: true
    },
    text: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    likes: [
        {
            user: {
                type: mongoose.ObjectId,
                ref: 'user'
            }
        }
    ],
    dislikes: [
        {
            user: {
                type: mongoose.ObjectId,
                ref: 'user'
            }
        }
    ],
    replies: [
        {
            user: {
                type: mongoose.ObjectId,
                ref: 'user',
                required: true
            },
            text: {
                type: String,
                required: true
            },
            createdAt: {
                type: Date,
                default: Date.now
            },
            likes: [
                {
                    user: {
                        type: mongoose.ObjectId,
                        ref: 'user'
                    }
                }
            ],
            dislikes: [
                {
                    user: {
                        type: mongoose.ObjectId,
                        ref: 'user'
                    }
                }
            ]
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

const bookmarkSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    reel: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reels',
        required: true
    },
    dateAdded: {
        type: Date,
        default: Date.now()
    },
});


module.exports = {
    Reels: mongoose.model('Reels', reelSchema),
    ReelsBookmark: mongoose.model('ReelsBookmark', bookmarkSchema),
};

