const mongoose = require("mongoose");

const unverifiedUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  otp: {
    type: Number,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: "1h", // Document will automatically be removed after 1 hour
  },
});

module.exports = mongoose.model("UnverifiedUser", unverifiedUserSchema);
