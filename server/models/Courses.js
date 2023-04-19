const mongoose = require('mongoose');

const courseCategorySchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.ObjectId,
        required: true,
        ref: "admin"
    },
    createdAt: {
        type: Date,
        default: Date.now()
    }
});

const courseSchema = new mongoose.Schema({
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
    lessons: {
        type: Number,
        default: 0
    },
    students: {
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
    CourseCategory: mongoose.model('CourseCategory', courseCategorySchema),
    Course: mongoose.model('Course', courseSchema)
};