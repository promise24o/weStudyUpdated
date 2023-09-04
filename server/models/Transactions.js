const mongoose = require('mongoose');

const transactionsSchema = new mongoose.Schema({
    id: String,
    data: Object,
});
transactionsSchema.set('timestamps', true);
const Transactions = mongoose.model('Transactions', transactionsSchema);

module.exports = Transactions;
