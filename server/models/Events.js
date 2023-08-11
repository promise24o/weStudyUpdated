const mongoose = require('mongoose');

const eventCategorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        unique: true   
    },
    banner_image: {
        type: String
    },
});
eventCategorySchema.set('timestamps', true);

const commentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
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
                type: mongoose.Schema.Types.ObjectId,
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

const interestedParticipantsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    dateAdded: {
        type: Date,
        default: Date.now()
    },
});

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    banner_image: {
        type: String
    },
    category: {
        type: mongoose.ObjectId,
        ref: "EventCategory",
        required: true
    },
    details: {
        type: String
    },
    startDate: {
        type: Date,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endDate: {
        type: Date,
    },
    endTime: {
        type: String,
    },
    location: {
        type: String,
        required: true
    },
    interestedParticipants: [interestedParticipantsSchema],
    goingParticipants: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'user'
            },
            dateAdded: {
                type: Date,
                default: Date.now()
            },
        }
    ],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'user',
    },
    visibility: {
        type: Boolean,
        default: true
    },
    comments: [commentSchema],
});
eventSchema.set('timestamps', true);

module.exports = {
    EventCategory: mongoose.model('EventCategory', eventCategorySchema),
    Event: mongoose.model('Event', eventSchema),
};
