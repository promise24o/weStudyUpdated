const mongoose = require ('mongoose');

const institutionsSchema = new mongoose.Schema ({
    institution: {
        type: String,
        required: true
    },
    logo: {
        type: String,
        required: true
    },
    type: {
        type: String,
        required: true
    },
    region: {
        type: String,
        required: true
    },
    country: {
        type: String,
        required: true
    },
    state: {
        type: String,
    },
    summary: {
        type: String,
    },
    updatedAt: {
        type: Date,
        default: Date.now ()
    }
});

institutionsSchema.set ('timestamps', true);
module.exports = mongoose.model ('institutions', institutionsSchema);
