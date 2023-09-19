const mongoose = require("mongoose");

const ChannelSchema = new mongoose.Schema({
  isTextChannel: {
    type: Boolean,
    default: false,
  },
  restrictAccess: {
    type: Boolean,
    default: false,
  },
  requests: [
    {
      user: {
        ref: "User",
        type: mongoose.Schema.Types.ObjectId,
      },
      message: {
        type: String,
        default: "I want to join this channel",
      },
    },
  ],
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
      user: {
        ref: "User",
        type: mongoose.Schema.Types.ObjectId,
      },
      roleId: {
        type: Object,
      },
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

const Channel = mongoose.model("Channel", ChannelSchema);
export = Channel;
