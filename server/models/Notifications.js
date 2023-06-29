const mongoose = require ('mongoose');

const notificationSchema = new mongoose.Schema ({
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    recipient2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Mentors'
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
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

const Notification = mongoose.model ('Notification', notificationSchema);

module.exports = Notification;

