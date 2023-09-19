const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
  },
  expiresAt: {
    type: Date,
  },

  user: {
    type: String,
  },
  otp: {
    type: String,
  },
});

const User = mongoose.model("UserOTP", UserSchema);
module.exports = User;
export = User;
