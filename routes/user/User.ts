const express = require("express");
const {
  updateProfilePhoto,
} = require("../../controllers/auth/AuthController.ts");
const uploadFile = require("../../middleware/auth/uploadImage.ts");
const { verifyJWT } = require("../../middleware/auth/verifyJWT.ts");
const router = express.Router();

router.route("/profile-photo").patch(verifyJWT, uploadFile, updateProfilePhoto);

module.exports = router;
