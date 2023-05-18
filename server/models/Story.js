const mongoose = require('mongoose');

const storySchema = new mongoose.Schema({
    id: {
        type: String,
        required: true
    },
    photo: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    time: {
        type: Date,
        default: Date.now,
        required: true,
        expires: '12h'
    },
    items: [{
        id: {
            type: String,
            required: true
        },
        type: {
            type: String,
            required: true
        },
        src: {
            type: String,
            required: true
        },
        preview: {
            type: String,
            required: true
        },
        link: {
            type: String,
            required: true
        },
        linkText: {
            type: String,
            required: true
        },
        time: {
            type: Date,
            default: Date.now,
            required: true
        }
    }]
});

const Story = mongoose.model('Story', storySchema);
module.exports = Story;