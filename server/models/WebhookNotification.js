const mongoose = require('mongoose');

const webhookNotificationSchema = new mongoose.Schema({
    event: String,
    data: Object,
    timestamp: Date,
});

const WebhookNotification = mongoose.model('WebhookNotification', webhookNotificationSchema);

module.exports = WebhookNotification;
