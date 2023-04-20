const mongoose = require('mongoose');

const communityCenterCategorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    banner_image: {
        type: String
    },
});
communityCenterCategorySchema.set('timestamps', true);

const scholarshipSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    banner_image: {
        type: String
    },
    brief: {
        type: String
    },
    category: {
        type: String,
        required: true
    },
    editorContent: {
        type: String
    },
    read_time: {
        type: Number,
        min: 1,
        max: 10
    },
    slug: {
        type: String,
        unique: true,
        required: true
    },
    views: {
        type: Number,
        default: 0
    },
    comments: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = {
    CommunityCategory: mongoose.model('CommunityCategory', communityCenterCategorySchema),
};