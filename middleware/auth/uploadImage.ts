const multer = require("multer");
const path = require("path");
const storage = multer.memoryStorage();
const singleUpload = multer({ storage }).single("image");
module.exports = singleUpload;
export {};
