const mongoose = require ('mongoose');

const commentSchema = new mongoose.Schema ({
    user: {
        type:mongoose.ObjectId,
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
                type:mongoose.ObjectId,
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

const postSchema = new mongoose.Schema ({
    userId: {
        type: mongoose.ObjectId,
        ref: 'user',
        required: true
    },
    content: {
        type: String
    },
    media: [
        {
            url: {
                type: String,
                required: true
            },
            type: {
                type: String,
                required: true
            }
        },
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

const Post = mongoose.model ('Post', postSchema);

module.exports = Post;
