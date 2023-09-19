const Message = require("../../models/messages");
const Channel = require("../../models/channelModal");
const cloudinaryV2 = require("cloudinary");
const cloudinary = cloudinaryV2.v2;
const User = require("../../models/userModal");
const getDataURI = require("../../utils/DataURI");
const Server = require("../../models/serverModal");

const sendMessage = async (req: any, res: any) => {
  try {
    const { message, media } = req.body;
    console.log("== MESSAGE ==", message);
    const channel = req.params.channelId;
    if (!req.user)
      return res.status(401).json({
        title: "Unauthorized",
        message: "You need to be logged in to send messages",
        type: "error",
      });
    if (!message && !media)
      return res.status(400).json({
        title: "Bad Request",
        message: "Message or Media is required",
        type: "error",
      });
    if (!channel)
      return res.status(400).json({
        title: "Bad Request",
        message: "Channel is required",
        type: "error",
      });
    const foundUser = await User.find({
      _id: req.user,
    })
      .populate("servers")
      .populate({
        path: "servers.channels",
        populate: {
          path: "channels",
          model: "Channel",
        },
      });
    if (!foundUser)
      return res
        .status(404)
        .json({ title: "Not Found", message: "User not found", type: "error" });
    const foundChannel = await Channel.find({ _id: channel })
      .populate("users")
      .populate({
        path: "users",
        populate: {
          path: "user",
          model: "User",
          select: "-password",
        },
      });
    if (!foundChannel)
      return res.status(404).json({
        title: "Not Found",
        message: "Channel not found",
        type: "error",
      });
    console.log("FOUND CHANNEL", foundChannel[0]);
    const fetchServer = await Server.find({
      _id: foundChannel[0].belongsToServer,
    })
      .populate("users")
      .populate({
        path: "users",
        populate: {
          path: "user",
          model: "User",
          select: "-password",
        },
      });
    if (!fetchServer) {
      return res.status(404).json({
        title: "Not Found",
        message: "Server not found",
        type: "error",
      });
    }
    console.log("FETCHED SERVER", fetchServer[0].users);
    // @ts-ignore
    const userRole = fetchServer[0].users.find(
      (user: any) => user.user._id.toString() === foundUser[0]._id.toString()
    ).roleId;
    if (!userRole) {
      return res
        .status(404)
        .json({ title: "Not Found", message: "User not found", type: "error" });
    }
    console.log("USER ROLE", userRole);

    if (foundChannel[0].restrictAccess) {
      if (!(userRole.Admin > 9000) && !(userRole.Manager > 8000)) {
        return res.status(401).json({
          title: "Unauthorized",
          message: "You are not authorized to send messages in this channel",
          type: "error",
        });
      }
    }
    let image_url = null;
    if (req.file) {
      const image = getDataURI(req.file) as any;

      image_url = await cloudinary.uploader.upload(image.content, {
        public_id: `CoWorkingSpace/${foundChannel[0].channelName}/media`,
        overwrite: true,
      });
    }

    const createdMessage = await Message.create({
      sender: foundUser[0]._id,
      message,
      media: req.file && image_url && image_url.secure_url,
      channel: foundChannel[0]._id,
    });
    if (!createdMessage) {
      return res.status(500).json({
        title: "Something went wrong",
        message: "some thing went wrong from our side..! we'll fix it soon..!",
        type: "error",
      });
    }
    foundChannel[0].latestMessage = createdMessage._id;
    await Channel.findByIdAndUpdate(foundChannel[0]._id, foundChannel[0]);
    const fetchedMessage = await Message.find({ _id: createdMessage._id })
      .populate("sender")
      .populate("channel");

    return res.status(201).json({
      title: "Message Sent",
      msg: "Message sent successfully",
      type: "success",
      message: fetchedMessage[0],
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      title: "Something went wrong",
      message: "some thing went wrong from our side..! we'll fix it soon..!",
      type: "error",
    });
  }
};

const getMessages = async (req: any, res: any) => {
  try {
    const { channelId } = req.params;
    if (!req.user) {
      return res.status(401).json({
        title: "Unauthorized",
        message: "You need to be logged in to get messages",
        type: "error",
      });
    }
    if (!channelId) {
      return res.status(400).json({
        title: "Bad Request",
        message: "Channel is required",
        type: "error",
      });
    }
    const foundChannel = await Channel.findOne({ _id: channelId });
    if (!foundChannel) {
      return res.status(404).json({
        title: "Not Found",
        message: "Channel not found",
        type: "error",
      });
    }

    const messages = await Message.find({ channel: foundChannel._id })
      .populate("sender")
      .populate("channel");
    return res.status(200).json({
      title: "Messages Fetched",
      msg: "Messages fetched successfully",
      type: "success",
      messages,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      title: "Something went wrong",
      message: "some thing went wrong from our side..! we'll fix it soon..!",
      type: "error",
    });
  }
};

export { sendMessage, getMessages };
