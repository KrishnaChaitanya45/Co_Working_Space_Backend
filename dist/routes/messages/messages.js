"use strict";
const { getMessages, sendMessage, } = require("../../controllers/messages/messages");
const express = require("express");
const router = express.Router();
const { verifyJWT } = require("../../middleware/auth/verifyJWT");
router
    .route("/:channelId")
    .get(verifyJWT, getMessages)
    .post(verifyJWT, sendMessage);
module.exports = router;
module.exports = router;
