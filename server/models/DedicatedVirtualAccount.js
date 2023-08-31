const mongoose = require('mongoose');

const dedicatedVirtualAccountSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    bank: Object,
    account_number: { type: String, required: true },
    account_name: { type: String, required: true },
});

dedicatedVirtualAccountSchema.set('timestamps', true);

const DedicatedVirtualAccount = mongoose.model('DedicatedVirtualAccount', dedicatedVirtualAccountSchema);

module.exports = DedicatedVirtualAccount;
