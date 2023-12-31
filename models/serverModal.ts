const mongoose = require("mongoose");
const ServerSchema = new mongoose.Schema({
  createdAt: {
    type: Date,
    default: Date.now().toString(),
  },
  textChannels: [
    {
      ref: "Channel",
      type: mongoose.Schema.Types.ObjectId,
    },
  ],
  videoChannels: [
    {
      ref: "Channel",
      type: mongoose.Schema.Types.ObjectId,
    },
  ],
  audioChannels: [
    {
      ref: "Channel",
      type: mongoose.Schema.Types.ObjectId,
    },
  ],
  serverName: {
    type: String,
    required: true,
  },
  serverDescription: {
    type: String,
  },
  serverProfilePhoto: {
    type: String,
    default:
      "https://res.cloudinary.com/deardiary/image/upload/v1693221898/DearDiary/Habits/Login_mxzaj8.png",
  },
  users: [
    {
      user: {
        ref: "User",
        type: mongoose.Schema.Types.ObjectId,
      },
      roleId: {
        type: Object,
      },
    },
  ],
});

const Server = mongoose.model("Server", ServerSchema);
export = Server;
