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

// Add pre and post middleware to cascade nullify userId reference in Post schema when a user is deleted
// postSchema.pre ('findOneAndRemove', async function (next) {
//     const post = this;
//     try { // Check if the post has a userId
//         if (post.userId) { // Use the userId to find the corresponding user
//             const user = await mongoose.model ('Users').findOne ({_id: post.userId});

//             // If the user is found, remove the post reference from their posts array
//             if (user) {
//                 user.posts.pull (post._id);
//                 await user.save ();
//             }
//         }
//         next ();
//     } catch (error) {
//         next (error);
//     }
// });


const Post = mongoose.model ('Post', postSchema);

module.exports = Post;
