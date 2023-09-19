"use strict";
const express = require("express");
const { updateProfilePhoto } = require("../../controllers/auth/AuthController");
const uploadFile = require("../../middleware/auth/uploadImage");
const { verifyJWT } = require("../../middleware/auth/verifyJWT");
const router = express.Router();
router.route("/profile-photo").patch(verifyJWT, uploadFile, updateProfilePhoto);
module.exports = router;
module.exports = router;
