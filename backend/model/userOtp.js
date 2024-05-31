// models/otpModel.js
const mongoose = require("mongoose");
const sendMail = require("../utilis/sendMail");

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
    expires: 60 * 5, // The document will be automatically deleted after 5 minutes of its creation time
  },
});
// Define a function to send emails
async function sendVerificationEmail(email, otp) {
  try {
    const mailResponse = await sendMail({
      email: user.email,
      subject: "Verify your new Raregem account",
      message: `<p>To verify your email address, please use the following One Time Password (OTP): </p> <p style="color:tomato; font-size:25px; letter-spacing:2px;"><b>${generatedOTP}</b> for</p><p>This code expires in ${duration} hour(s).</p>`,
    });
    res.status(201).json({
      success: true,
      message: `Please check your email:- ${user.email} to activate your account`,
    });
  } catch (error) {
    console.log("Error occurred while sending email: ", error);
    throw error;
  }
}
otpSchema.pre("save", async function (next) {
  console.log("New document saved to the database");
  // Only send an email when a new document is created
  if (this.isNew) {
    await sendVerificationEmail(this.email, this.otp);
  }
  next();
});
module.exports = mongoose.model("OTP", otpSchema);
