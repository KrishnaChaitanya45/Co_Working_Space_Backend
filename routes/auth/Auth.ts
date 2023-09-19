const express = require("express");
const router = express.Router();
const {
  login,
  register,
  logout,
  verifyOTP,
  resendOTP,
  getAllUsers,
  resetPassword,
} = require("../../controllers/auth/AuthController");

const { verifyJWT } = require("../../middleware/auth/verifyJWT");
const {
  handleRefreshToken,
} = require("../../controllers/auth/refreshTokenController");

router.route("/login").post(login);
router.route("/reset-password").post(resetPassword);
router.route("/register").post(register);
router.route("/logout").get(logout);
router.route("/users").get(verifyJWT, getAllUsers);
router.route("/otp/verify").post(verifyOTP);
router.route("/otp/resend").post(resendOTP);
router.route("/token").get(handleRefreshToken);
module.exports = router;
export = router;
