const mongoose = require('mongoose');

const webhookNotificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
    },
    event: String,
    reference: String,
    data: Object,
});
webhookNotificationSchema.set('timestamps', true);
const WebhookNotification = mongoose.model('WebhookNotification', webhookNotificationSchema);

module.exports = WebhookNotification;
