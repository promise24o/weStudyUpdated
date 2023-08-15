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


const bookmarkSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    dateAdded: {
        type: Date,
        default: Date.now()
    },
});


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
        type: String,
        required: true
    },
    startTime: {
        type: String,
        required: true
    },
    endDate: {
        type: String,
    },
    endTime: {
        type: String,
    },
    attendanceType: {
        type: String,
        required: true
    },
    location: {
        type: String,
    },
    eventLink: {
        type: String,
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


const reportSchema = new mongoose.Schema({
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events',
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    explanation: {
        type: String,
        required: true
    },
    action: {
        type: String,
        enum: ['pending', 'hide', 'rejected'],
        default: 'pending'
    },
    dateReported: {
        type: Date,  
        default: Date.now
    },
    dateActionCarriedOut: {
        type: Date
    },
    admin: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'admins'  
    }
});


const eventNotificationSchema = new mongoose.Schema({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'events'
    },
    action: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isSystemNotification: {
        type: Boolean,
        default: false
    }
});

module.exports = {
    EventCategory: mongoose.model('EventCategory', eventCategorySchema),
    Event: mongoose.model('Event', eventSchema),
    EventBookmark: mongoose.model('EventBookmark', bookmarkSchema)  ,
    ReportEvent: mongoose.model('ReportEvent', reportSchema),
    EventNotification: mongoose.model('EventNotification', eventNotificationSchema),
};

