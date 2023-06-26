const mongoose = require('mongoose');

// Define the OTP schema
const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
  },
  otp: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '5m', // Set the expiration time for OTPs (e.g., 5 minutes)
  },
});

// Create the OTP model
const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
