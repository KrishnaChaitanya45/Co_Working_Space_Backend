const e = require("express");
const {
  createServer,
  addToServer,
  getAllServersOfUser,
  deleteServer,
  updateServer,
  getServer,
  getAllServers,
  promoteOrDemoteUser,
} = require("../../controllers/server/Server.ts");
const router = e.Router();
const singleUpload = require("../../middleware/auth/uploadImage");
const { verifyJWT } = require("../../middleware/auth/verifyJWT");
router
  .route("/")
  .post(singleUpload, verifyJWT, createServer)
  .get(verifyJWT, getAllServersOfUser);

router.route("/get-all").get(verifyJWT, getAllServers);
router
  .route("/:serverId/promote-or-demote")
  .post(verifyJWT, promoteOrDemoteUser);
router
  .route("/:serverId")
  .post(verifyJWT, addToServer)
  .patch(verifyJWT, updateServer)
  .delete(verifyJWT, deleteServer)
  .get(verifyJWT, getServer);
module.exports = router;
export {};
