// models/OtpModel.js
const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      index: true, // faster lookups
    },
    otp: {
      type: String,
      required: true, // store hashed OTP
    },
    name: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true, // raw password stored TEMPORARILY (hashed after OTP verify)
    },
    expiresAt: {
      type: Date,
      required: true, // explicit expiry date
    },
  },
  {
    timestamps: true, // createdAt & updatedAt
  }
);

// TTL index (MongoDB auto-deletes expired docs)
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Otp", otpSchema);
