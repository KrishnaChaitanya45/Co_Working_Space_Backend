const e = require("express");
const router = e.Router();
const {
  login,
  register,
  logout,
  verifyOTP,
  resendOTP,
  resetPassword,
} = require("../../controllers/auth/AuthController.ts");
const { verifyJWT } = require("../../middleware/auth/verifyJWT.ts");
const {
  handleRefreshToken,
} = require("../../controllers/auth/refreshTokenController.ts");
router.route("/login").post(login);
router.route("/reset-password").post(resetPassword);
router.route("/register").post(register);
router.route("/logout").get(logout);
router.route("/otp/verify").post(verifyOTP);
router.route("/otp/resend").post(resendOTP);
router.route("/token").get(handleRefreshToken);
module.exports = router;
export {};
