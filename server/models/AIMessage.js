const mongoose = require("mongoose");

const AIMessageSchema = new mongoose.Schema({
    text: {
        type: String,
        required: true
    },
    isAi: {
        type: Boolean,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    }
});

module.exports = mongoose.model("AIMessage", AIMessageSchema);