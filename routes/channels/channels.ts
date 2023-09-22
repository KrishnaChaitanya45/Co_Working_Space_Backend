const express = require("express");
const router = express.Router();
const { verifyJWT } = require("../../middleware/auth/verifyJWT");
// @ts-ignore
const {
  getAllTextChannelsOfServer,
  createChannel,
  sendRequestToJoinChannel,
  fetchRequests,
  acceptOrReject,
} = require("../../controllers/channels/channels");
router.route("/").post(verifyJWT, createChannel);
router.route("/:serverId").get(verifyJWT, getAllTextChannelsOfServer);
router
  .route("/:channelId/requests")
  .post(verifyJWT, sendRequestToJoinChannel)
  .get(verifyJWT, fetchRequests)
  .patch(verifyJWT, acceptOrReject);

export = router;
