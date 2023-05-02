const mongoose = require('mongoose');

const advertsSchema = new mongoose.Schema({
    banner_image: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    status: {
        type: String,
        required: true
    },
});

advertsSchema.set('timestamps', true);

module.exports = mongoose.model('adverts', advertsSchema);