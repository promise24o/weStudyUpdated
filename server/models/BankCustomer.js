const mongoose = require('mongoose');

const bankCustomerSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user',
        required: true
    },
    customerCode: { type: String, required: true },
});

bankCustomerSchema.set('timestamps', true);

const BankCustomer = mongoose.model('BankCustomer', bankCustomerSchema);

module.exports = BankCustomer;
