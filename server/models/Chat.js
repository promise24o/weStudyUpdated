const mongoose = require ('mongoose');

const chatSchema = new mongoose.Schema ({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'senderModel'
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        refPath: 'receiverModel'
    },
    senderModel: {
        type: String,
        required: true,
        enum: ['user', 'Mentors']
    },
    receiverModel: {
        type: String,
        required: true,
        enum: ['user', 'Mentors']
    },
    messages: [
        {
             
            sender: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                refPath: 'senderModel'
            },
            receiver: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
                refPath: 'receiverModel'
            },
            messageType:{
                type: String,
                required: true
            },
            content: {
                type: String,
            },
            media: [
                {
                    mediaUrl: {
                        type: String,
                    },
                    mimeType: {
                        type: String,
                    }
                }
            ],
            timeSent: {
                type: Date,
                default: Date.now
            },
            status: {
                type: String,
                enum: [
                    'sent', 'delivered', 'seen'
                ],
                default: 'sent'
            }, 
            deleted:{
                type: Boolean,
                default: false
            }
        },
    ]
});

const Chat = mongoose.model ('Chat', chatSchema);

module.exports = Chat;
