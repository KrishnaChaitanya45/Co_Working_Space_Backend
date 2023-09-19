"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.acceptOrReject = exports.fetchRequests = exports.deleteChannel = exports.getAllTextChannelsOfServer = exports.sendRequestToJoinChannel = exports.createStreamChannel = exports.createVideoChannel = exports.createVoiceChannel = exports.addUsersToChannel = exports.createTextChannel = void 0;
const Server = require("../../models/serverModal");
const User = require("../../models/userModal");
const Channel = require("../../models/channelModal");
const getDataURI = require("../../utils/DataURI");
const createTextChannel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { serverId, channelName, restrictAccess, channelDescription, channelIcon, channelBackground, } = req.body;
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
        const server = yield Server.find({ _id: serverId })
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
        const ourUser = yield User.find({ _id: req.user }).select("-password");
        if (!ourUser) {
            return res.status(404).json({ message: "User not found" });
        }
        console.log("=== SERVER ===", ourUser[0]._id);
        const isAdmin = server[0].users.find((u) => {
            if (u.user._id.toString() === ourUser[0]._id.toString() &&
                u.roleId.Admin > 9000) {
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
        const isManager = server[0].users.find((u) => {
            if (u.user._id.toString() === ourUser[0]._id.toString() &&
                u.roleId.Manager) {
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
        const createChannel = yield Channel.create({
            channelName,
            channelDescription,
            belongsToServer: server[0]._id,
            isTextChannel: true,
        });
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
        yield createChannel.save();
        server[0].textChannels.push(createChannel._id);
        yield Server.findByIdAndUpdate(server[0]._id, {
            textChannels: server[0].textChannels,
        });
        const serverToRespond = yield Server.find({ _id: server[0]._id })
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
        const channelToRespond = yield Channel.find({ _id: createChannel._id })
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
    }
    catch (error) {
        console.log(error);
    }
});
exports.createTextChannel = createTextChannel;
const addUsersToChannel = (req, res) => __awaiter(void 0, void 0, void 0, function* () { });
exports.addUsersToChannel = addUsersToChannel;
const getAllTextChannelsOfServer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { serverId } = req.params;
        if (!serverId) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }
        const channels = yield Channel.find({ belongsToServer: serverId })
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
    }
    catch (error) {
        return res.status(500).json({
            title: "Something went wrong",
            message: "there is an issue from our side ..! we'll fix it soon.>!",
            type: "error",
        });
    }
});
exports.getAllTextChannelsOfServer = getAllTextChannelsOfServer;
const createVoiceChannel = (req, res) => __awaiter(void 0, void 0, void 0, function* () { });
exports.createVoiceChannel = createVoiceChannel;
const createVideoChannel = (req, res) => __awaiter(void 0, void 0, void 0, function* () { });
exports.createVideoChannel = createVideoChannel;
const createStreamChannel = (req, res) => __awaiter(void 0, void 0, void 0, function* () { });
exports.createStreamChannel = createStreamChannel;
const deleteChannel = (req, res) => __awaiter(void 0, void 0, void 0, function* () { });
exports.deleteChannel = deleteChannel;
const sendRequestToJoinChannel = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { message, userId } = req.body;
        const { channelId } = req.params;
        if (!channelId || !message || !userId) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }
        const user = yield User.find({ _id: userId }).select("-password");
        if (!user) {
            return res.status(404).json({
                title: "User not found",
                message: "there is an issue while fetching the user..!",
                type: "error",
            });
        }
        const channel = yield Channel.find({ _id: channelId })
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
        const isUserAlreadyInChannel = channel[0].users.find((u) => {
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
        const requestExists = channel[0].requests.find((r) => {
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
        yield Channel.findByIdAndUpdate(channel[0]._id, {
            requests: channel[0].requests,
        });
        const channelsWithRequests = yield Channel.find({
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
        const findRequest = channelsWithRequests[0].requests.find((r) => {
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
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            title: "Something went wrong",
            message: "there is an issue from our side ..! we'll fix it soon.>!",
            type: "error",
        });
    }
});
exports.sendRequestToJoinChannel = sendRequestToJoinChannel;
const fetchRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { channelId } = req.params;
        console.log("== CHANNEL ID ==", channelId);
        const ourUser = yield User.find({ _id: req.user }).select("-password");
        if (!ourUser) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!channelId) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }
        const channel = yield Channel.find({ _id: channelId })
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
        const Server = ourUser[0].servers.find((s) => {
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
        const channelsWithRequests = yield Channel.find({
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
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            title: "Something went wrong",
            message: "there is an issue from our side ..! we'll fix it soon.>!",
            type: "error",
        });
    }
});
exports.fetchRequests = fetchRequests;
const acceptOrReject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { requestId, channelId, action, userId } = req.body;
        if (!req.user) {
            return res.status(403).json({
                title: "Not Authorized",
                message: "You are not allowed to fetch the requests",
                type: "error",
            });
        }
        const ourUser = yield User.find({ _id: req.user }).select("-password");
        if (!ourUser) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!action) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }
        const channel = yield Channel.find({ _id: channelId })
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
        const user = yield User.find({ _id: userId }).select("-password");
        if (action > 5000) {
            // accept request
            if (!user) {
                return res.status(404).json({
                    title: "User not found",
                    message: "there is an issue while fetching the user..!",
                    type: "error",
                });
            }
            const isUserAlreadyInChannel = channel[0].users.find((u) => {
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
            let serverRole = user[0].servers.find((s) => {
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
            channel[0].requests = channel[0].requests.filter((r) => {
                if (r._id.toString() !== requestId) {
                    return true;
                }
            });
            yield Channel.findByIdAndUpdate(channel[0]._id, {
                users: channel[0].users,
                requests: channel[0].requests,
            });
            const ChannelWithUpdatedUsers = yield Channel.find({
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
        }
        else {
            // reject request
            channel[0].requests = channel[0].requests.filter((r) => {
                if (r._id.toString() !== requestId) {
                    return true;
                }
            });
            yield Channel.findByIdAndUpdate(channel[0]._id, {
                users: channel[0].users,
                requests: channel[0].requests,
            });
            const ChannelWithUpdatedUsers = yield Channel.find({
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
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            title: "Something went wrong",
            message: "there is an issue from our side ..! we'll fix it soon.>!",
            type: "error",
        });
    }
});
exports.acceptOrReject = acceptOrReject;
