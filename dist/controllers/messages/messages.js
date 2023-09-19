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
exports.getMessages = exports.sendMessage = void 0;
const Message = require("../../models/messages");
const Channel = require("../../models/channelModal");
const cloudinaryV2 = require("cloudinary");
const cloudinary = cloudinaryV2.v2;
const User = require("../../models/userModal");
const getDataURI = require("../../utils/DataURI");
const Server = require("../../models/serverModal");
const sendMessage = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const foundUser = yield User.find({
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
        const foundChannel = yield Channel.find({ _id: channel })
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
        const fetchServer = yield Server.find({
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
        const userRole = fetchServer[0].users.find((user) => user.user._id.toString() === foundUser[0]._id.toString()).roleId;
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
            const image = getDataURI(req.file);
            image_url = yield cloudinary.uploader.upload(image.content, {
                public_id: `CoWorkingSpace/${foundChannel[0].channelName}/media`,
                overwrite: true,
            });
        }
        const createdMessage = yield Message.create({
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
        yield Channel.findByIdAndUpdate(foundChannel[0]._id, foundChannel[0]);
        const fetchedMessage = yield Message.find({ _id: createdMessage._id })
            .populate("sender")
            .populate("channel");
        return res.status(201).json({
            title: "Message Sent",
            msg: "Message sent successfully",
            type: "success",
            message: fetchedMessage[0],
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            title: "Something went wrong",
            message: "some thing went wrong from our side..! we'll fix it soon..!",
            type: "error",
        });
    }
});
exports.sendMessage = sendMessage;
const getMessages = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const foundChannel = yield Channel.findOne({ _id: channelId });
        if (!foundChannel) {
            return res.status(404).json({
                title: "Not Found",
                message: "Channel not found",
                type: "error",
            });
        }
        const messages = yield Message.find({ channel: foundChannel._id })
            .populate("sender")
            .populate("channel");
        return res.status(200).json({
            title: "Messages Fetched",
            msg: "Messages fetched successfully",
            type: "success",
            messages,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({
            title: "Something went wrong",
            message: "some thing went wrong from our side..! we'll fix it soon..!",
            type: "error",
        });
    }
});
exports.getMessages = getMessages;
