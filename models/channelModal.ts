const mongoose = require("mongoose");

const ServerSchema = new mongoose.Schema({
  isTextChannel: {
    type: Boolean,
    default: false,
  },
  channelName: {
    type: String,
    default: "",
  },
  channelDescription: {
    type: String,
    default: "",
  },
  channelIcon: {
    type: String,
    default:
      "https://www.pngitem.com/pimgs/m/30-307416_profile-icon-png-image-free-download-searchpng-employee.png",
  },
  channelBackground: {
    type: String,
    default:
      "https://w0.peakpx.com/wallpaper/958/256/HD-wallpaper-black-bull-black-clover-anime-black-bulls-magic-knights-emblems.jpg",
  },
  users: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  latestMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Message",
  },
  belongsToServer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Server",
  },
});

const Server = mongoose.model("Server", ServerSchema);
module.exports = Server;
