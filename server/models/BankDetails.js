const mongoose = require('mongoose');

const bankDetailsSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    bank: {
        name: { type: String, required: true },
        slug: { type: String, required: true },
        code: { type: String, required: true }
    },
    accountNumber: { type: String, required: true },
    bvn: { type: String, required: true },
    verified: { type: Boolean, default: false }, 
});

bankDetailsSchema.set('timestamps', true);

const BankDetails = mongoose.model('BankDetails', bankDetailsSchema);

module.exports = BankDetails;
