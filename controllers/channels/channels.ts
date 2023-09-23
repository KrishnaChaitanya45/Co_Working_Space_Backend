const Server = require("../../models/serverModal");
const User = require("../../models/userModal");
const Channel = require("../../models/channelModal");
const getDataURI = require("../../utils/DataURI");
const createChannel = async (req: any, res: any) => {
  try {
    const {
      serverId,
      channelName,
      restrictAccess,
      channelDescription,
      channelIcon,
      channelBackground,
    } = req.body;
    const { type } = req.query;
    // ? BUSINESS LOGIC
    // ? 1. Check if the server exists
    // ? 2] To create a server the user must be the admin or the manager
    // ? 3] server can be restricted or public
    // ? 4] public channels can be joined by anyone and can be messaged by leads/ Managers/ Admins but can only be created by the manager or admin
    // ? 5] private channels can only be joined by the managers, leads and users but the channel can only be created by the admin and managers can join and leads, managers and admins can message and users needs to send the request to join the channel

    // ! IMPLEMENTATION : -
    if (!serverId || !channelName || !channelDescription) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }

    const server = await Server.find({ _id: serverId })
      .populate("users")
      .populate({
        path: "users.user",
        model: "User",
        select: "-password",
      });

    if (!server) {
      return res.status(404).json({
        title: "Server not found",
        message: "there is an issue while fetching the server..!",
        type: "error",
      });
    }
    console.log("=== SERVER ===", server[0].users);
    const ourUser = await User.find({ _id: req.user }).select("-password");
    if (!ourUser) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log("=== SERVER ===", ourUser[0]._id);
    const isAdmin = server[0].users.find((u: any) => {
      if (
        u.user._id.toString() === ourUser[0]._id.toString() &&
        u.roleId.Admin > 9000
      ) {
        return true;
      }
    });
    console.log("== IS ADMIN ==", isAdmin);
    if (restrictAccess && !isAdmin) {
      return res.status(403).json({
        title: "Not Authorized",
        message: "You are not allowed to create the channel",
        type: "error",
      });
    }
    const isManager = server[0].users.find((u: any) => {
      if (
        u.user._id.toString() === ourUser[0]._id.toString() &&
        u.roleId.Manager
      ) {
        return true;
      }
    });
    console.log("== IS MANAGER ==", isManager);
    if (!isAdmin && !isManager) {
      return res.status(403).json({
        title: "Not Authorized",
        message: "You are not allowed to create the channel",
        type: "error",
      });
    }
    let createChannel;
    if (type == "text" || type == undefined) {
      createChannel = await Channel.create({
        channelName,
        channelDescription,
        belongsToServer: server[0]._id,
        isTextChannel: true,
        isAudioChannel: false,
        isVideoChannel: false,
      });
    } else if (type == "video") {
      createChannel = await Channel.create({
        channelName,
        channelDescription,
        belongsToServer: server[0]._id,
        isVideoChannel: true,
        isAudioChannel: false,
        isTextChannel: false,
      });
    } else {
      createChannel = await Channel.create({
        channelName,
        channelDescription,
        belongsToServer: server[0]._id,
        isAudioChannel: true,
        isVideoChannel: false,
        isTextChannel: false,
      });
    }
    if (!createChannel) {
      return res.status(500).json({
        title: "Something went wrong",
        message: "there is an issue from our side ..! we'll fix it soon.>!",
        type: "error",
      });
    }
    if (restrictAccess && isAdmin) {
      createChannel.restrictAccess = true;
    }
    createChannel.users.push({
      user: ourUser[0]._id,
      roleId: {
        // @ts-ignore
        Admin: Object.values(isAdmin.roleId)[0],
      },
    });
    await createChannel.save();
    if (type == "text" || type == undefined) {
      server[0].textChannels.push(createChannel._id);
      await Server.findByIdAndUpdate(server[0]._id, {
        textChannels: server[0].textChannels,
      });
    } else if (type == "video") {
      server[0].videoChannels.push(createChannel._id);
      await Server.findByIdAndUpdate(server[0]._id, {
        videoChannels: server[0].videoChannels,
      });
    } else {
      server[0].audioChannels.push(createChannel._id);
      await Server.findByIdAndUpdate(server[0]._id, {
        audioChannels: server[0].audioChannels,
      });
    }

    const serverToRespond = await Server.find({ _id: server[0]._id })
      .populate({
        path: "textChannels",
        model: "Channel",
      })
      .populate("users")
      .populate({
        path: "users.user",
        model: "User",
        select: "-password",
      });
    const channelToRespond = await Channel.find({ _id: createChannel._id })
      .populate("users")
      .populate({
        path: "users.user",
        model: "User",
        select: "-password",
      });
    console.log("== TEXT CHANNELS ==", serverToRespond[0].textChannels);
    return res.status(201).json({
      title: "Channel created successfully",
      message: "Channel has been created successfully",
      type: "success",
      server: serverToRespond[0],
      channel: channelToRespond[0],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      title: "Something went wrong",
      message: "there is an issue from our side ..! we'll fix it soon.>!",
      type: "error",
    });
  }
};

const addUsersToChannel = async (req: any, res: any) => {};

const getAllTextChannelsOfServer = async (req: any, res: any) => {
  try {
    const { serverId } = req.params;
    const { type } = req.query;
    let filter = {
      isTextChannel: true,
      isAudioChannel: false,
      isVideoChannel: false,
    } as any;
    if (type == "video") {
      filter = {
        isVideoChannel: true,
        isAudioChannel: false,
        isTextChannel: false,
      };
    } else if (type == "audio") {
      filter = {
        isAudioChannel: true,
        isVideoChannel: false,
        isTextChannel: false,
      };
    }
    if (!serverId) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }
    const channels = await Channel.find({
      belongsToServer: serverId,
      ...filter,
    })
      .populate("users")
      .populate({
        path: "users.user",
        model: "User",
        select: "-password",
      });
    if (!channels) {
      return res.status(404).json({
        title: "Channel not found",
        message: "there is an issue while fetching the channel..!",
        type: "error",
      });
    }
    return res.status(200).json({
      title: "Channel fetched successfully",
      message: "Channel has been fetched successfully",
      type: "success",
      channels,
    });
  } catch (error) {
    return res.status(500).json({
      title: "Something went wrong",
      message: "there is an issue from our side ..! we'll fix it soon.>!",
      type: "error",
    });
  }
};

const createVoiceChannel = async (req: any, res: any) => {
  try {
    const {
      serverId,
      channelName,
      restrictAccess,
      channelDescription,
      channelIcon,
      channelBackground,
    } = req.body;
  } catch (error: any) {
    console.log(error);
    return res.status(500).json({
      title: "Something went wrong",
      message: "there is an issue from our side ..! we'll fix it soon.>!",
      type: "error",
    });
  }
};

const createVideoChannel = async (req: any, res: any) => {};

const createStreamChannel = async (req: any, res: any) => {};

const deleteChannel = async (req: any, res: any) => {};

const sendRequestToJoinChannel = async (req: any, res: any) => {
  try {
    const { message, userId } = req.body;
    const { channelId } = req.params;
    if (!channelId || !message || !userId) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }
    const user = await User.find({ _id: userId }).select("-password");
    if (!user) {
      return res.status(404).json({
        title: "User not found",
        message: "there is an issue while fetching the user..!",
        type: "error",
      });
    }
    const channel = await Channel.find({ _id: channelId })
      .populate("users")
      .populate({
        path: "users.user",
        model: "User",
        select: "-password",
      })
      .populate({
        path: "belongsToServer",
        model: "Server",
      });

    if (!channel) {
      return res.status(404).json({
        title: "Channel not found",
        message: "there is an issue while fetching the channel..!",
        type: "error",
      });
    }
    const isUserAlreadyInChannel = channel[0].users.find((u: any) => {
      if (u.user._id.toString() === user[0]._id.toString()) {
        return true;
      }
    });

    if (isUserAlreadyInChannel) {
      return res.status(400).json({
        title: "User already in channel",
        message: "User is already in the channel..!",
        type: "error",
      });
    }
    const requestExists = channel[0].requests.find((r: any) => {
      if (r.user.toString() === user[0]._id.toString()) {
        return true;
      }
    });
    if (requestExists) {
      return res.status(400).json({
        title: "Request already sent",
        message: "You have already sent the request to join the channel..!",
        type: "error",
      });
    }
    channel[0].requests.push({
      user: user[0]._id,
      message,
    });
    await Channel.findByIdAndUpdate(channel[0]._id, {
      requests: channel[0].requests,
    });

    const channelsWithRequests = await Channel.find({
      _id: channel[0]._id,
    })
      .populate("requests")
      .populate({
        path: "requests.user",
        model: "User",
        select: "-password",
      })
      .populate({
        path: "users.user",
        model: "User",
        select: "-password",
      });
    console.log("== FIND REQUEST ==", channelsWithRequests[0]);
    const findRequest = channelsWithRequests[0].requests.find((r: any) => {
      if (r.user._id.toString() === user[0]._id.toString()) {
        return true;
      }
    });

    console.log("== FIND REQUEST ==", findRequest);
    return res.status(201).json({
      title: "Request sent successfully",
      message: "Request has been sent successfully",
      type: "success",
      request: findRequest,
      channelName: channel[0],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      title: "Something went wrong",
      message: "there is an issue from our side ..! we'll fix it soon.>!",
      type: "error",
    });
  }
};

const fetchRequests = async (req: any, res: any) => {
  try {
    const { channelId } = req.params;
    console.log("== CHANNEL ID ==", channelId);
    const ourUser = await User.find({ _id: req.user }).select("-password");
    if (!ourUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!channelId) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }
    const channel = await Channel.find({ _id: channelId })
      .populate("users")
      .populate({
        path: "users.user",
        model: "User",
        select: "-password",
      })
      .populate("requests")
      .populate({
        path: "requests.user",
        model: "User",
        select: "-password",
      })
      .populate({
        path: "belongsToServer",
        model: "Server",
      });
    const Server = ourUser[0].servers.find((s: any) => {
      // @ts-ignore
      if (s.server.toString() === channel[0].belongsToServer._id.toString()) {
        return true;
      }
    });
    if (!Server) {
      return res.status(403).json({
        title: "Not Authorized",
        message: "You are not allowed to fetch the requests",
        type: "error",
      });
    }
    const Role = Server.role.id;
    if (Role.Admin < 9000) {
      return res.status(403).json({
        title: "Not Authorized",
        message: "You are not allowed to fetch the requests",
        type: "error",
      });
    }
    if (Role.Manager < 8000) {
      return res.status(403).json({
        title: "Not Authorized",
        message: "You are not allowed to fetch the requests",
        type: "error",
      });
    }

    if (!channel) {
      return res.status(404).json({
        title: "Channel not found",
        message: "there is an issue while fetching the channel..!",
        type: "error",
      });
    }

    const channelsWithRequests = await Channel.find({
      _id: channelId,
    })
      .populate("requests")
      .populate({
        path: "requests.user",
        model: "User",
        select: "-password",
      })
      .populate({
        path: "users.user",
        model: "User",
        select: "-password",
      });
    return res.status(200).json({
      title: "Requests fetched successfully",
      message: "Requests has been fetched successfully",
      type: "success",
      requests: channelsWithRequests[0].requests,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      title: "Something went wrong",
      message: "there is an issue from our side ..! we'll fix it soon.>!",
      type: "error",
    });
  }
};

const acceptOrReject = async (req: any, res: any) => {
  try {
    const { requestId, channelId, action, userId } = req.body;
    if (!req.user) {
      return res.status(403).json({
        title: "Not Authorized",
        message: "You are not allowed to fetch the requests",
        type: "error",
      });
    }
    const ourUser = await User.find({ _id: req.user }).select("-password");
    if (!ourUser) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!action) {
      return res.status(400).json({ message: "Please fill all the fields" });
    }
    const channel = await Channel.find({ _id: channelId })
      .populate("users")
      .populate({
        path: "users.user",
        model: "User",
        select: "-password",
      })
      .populate("requests")
      .populate({
        path: "requests.user",
        model: "User",
        select: "-password",
      });
    if (!channel) {
      return res.status(404).json({
        title: "Channel not found",
        message: "there is an issue while fetching the channel..!",
        type: "error",
      });
    }
    const user = await User.find({ _id: userId }).select("-password");
    if (action > 5000) {
      // accept request
      if (!user) {
        return res.status(404).json({
          title: "User not found",
          message: "there is an issue while fetching the user..!",
          type: "error",
        });
      }
      const isUserAlreadyInChannel = channel[0].users.find((u: any) => {
        if (u.user._id.toString() === user[0]._id.toString()) {
          return true;
        }
      });
      if (isUserAlreadyInChannel) {
        return res.status(400).json({
          title: "User already in channel",
          message: "User is already in the channel..!",
          type: "error",
        });
      }
      let serverRole = user[0].servers.find((s: any) => {
        // @ts-ignore
        if (s.server.toString() === channel[0].belongsToServer.toString()) {
          return true;
        }
      });
      if (!serverRole) {
        return res.status(403).json({
          title: "User not found",
          message: "We're unable to find the user in the server..!",
          type: "error",
        });
      }
      serverRole = serverRole.role.id;
      console.log("=== SERVER ROLE ===", serverRole);
      channel[0].users.push({
        user: user[0]._id,
        roleId: serverRole,
      });
      channel[0].requests = channel[0].requests.filter((r: any) => {
        if (r._id.toString() !== requestId) {
          return true;
        }
      });
      await Channel.findByIdAndUpdate(channel[0]._id, {
        users: channel[0].users,
        requests: channel[0].requests,
      });
      const ChannelWithUpdatedUsers = await Channel.find({
        _id: channel[0]._id,
      })

        .populate("users")
        .populate({
          path: "users.user",
          model: "User",
          select: "-password",
        })
        .populate("requests")
        .populate({
          path: "requests.user",
          model: "User",
          select: "-password",
        })
        .populate({
          path: "belongsToServer",
          model: "Server",
        });

      return res.status(201).json({
        title: "Request accepted successfully",
        message: "Request has been accepted successfully",
        type: "success",
        channel: ChannelWithUpdatedUsers[0],
        requests: channel[0].requests,
      });
    } else {
      // reject request
      channel[0].requests = channel[0].requests.filter((r: any) => {
        if (r._id.toString() !== requestId) {
          return true;
        }
      });
      await Channel.findByIdAndUpdate(channel[0]._id, {
        users: channel[0].users,
        requests: channel[0].requests,
      });
      const ChannelWithUpdatedUsers = await Channel.find({
        _id: channel[0]._id,
      })

        .populate("users")
        .populate({
          path: "users.user",
          model: "User",
          select: "-password",
        })
        .populate("requests")
        .populate({
          path: "requests.user",
          model: "User",
          select: "-password",
        })
        .populate({
          path: "belongsToServer",
          model: "Server",
        });

      return res.status(201).json({
        title: "Request rejected successfully",
        message: "Request has been rejected successfully",
        type: "success",
        channel: ChannelWithUpdatedUsers[0],
        requests: channel[0].requests,
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      title: "Something went wrong",
      message: "there is an issue from our side ..! we'll fix it soon.>!",
      type: "error",
    });
  }
};
export {
  createChannel,
  addUsersToChannel,
  createVoiceChannel,
  createVideoChannel,
  createStreamChannel,
  sendRequestToJoinChannel,
  getAllTextChannelsOfServer,
  deleteChannel,
  fetchRequests,
  acceptOrReject,
};
