const express = require("express");
const router = express.Router();
import { verifyJWT } from "../../middleware/auth/verifyJWT";
//@ts-ignore
import {
  getAllTextChannelsOfServer,
  createTextChannel,
  sendRequestToJoinChannel,
  fetchRequests,
  acceptOrReject,
} from "../../controllers/channels/channels";
router.route("/").post(verifyJWT, createTextChannel);
router.route("/:serverId").get(verifyJWT, getAllTextChannelsOfServer);
router
  .route("/:channelId/requests")
  .post(verifyJWT, sendRequestToJoinChannel)
  .get(verifyJWT, fetchRequests)
  .patch(verifyJWT, acceptOrReject);

export = router;
