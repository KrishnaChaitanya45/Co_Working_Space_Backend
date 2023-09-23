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
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const userRoutes = require("../routes/user/User");
const cookieParser = require("cookie-parser");
const http = require("http");
const { Server } = require("socket.io");
const { RoomHandler } = require("./roomHandler");
const connectToDatabase = require("../utils/connectToDb");
const cloudinary = require("cloudinary");
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
const channelRoutes = require("../routes/channels/channels");
const messageRoutes = require("../routes/messages/messages");
const authRoutes = require("../routes/auth/Auth");
const serverRoutes = require("../routes/server/Server");
// @ts-ignore
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const users = {};
const socketToRoom = {};
const audioCallUsers = {};
const socketToRoomAudio = {};
app.use(cors({
    origin: "https://co-working-space-frontend.vercel.app",
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
    },
});
const callsAndChats = io.of("/calls-and-chats");
const RealTimeUpdates = io.of("/realtime-updates");
RealTimeUpdates.on("connection", (socket) => {
    socket.join("In-App-Updates");
    socket.on("in-app-updates", (payload) => {
        const { servers, selectedServer, message } = payload;
        socket
            .to("In-App-Updates")
            .emit("in-app-updates-notify", { servers, selectedServer, message });
    });
    socket.on("join-server", (payload) => {
        const { serverId } = payload;
        console.log("JOINED", serverId);
        socket.join(serverId);
    });
    socket.on("user-promoted", (payload) => {
        const { serverId, server, message } = payload;
        socket.to(serverId).emit("user-promoted-notify", { server, message });
    });
    socket.on("user-removed", (payload) => {
        const { serverId, server, message, removedUser } = payload;
        socket
            .in(serverId)
            .emit("user-removed-notify", { server, message, serverId, removedUser });
    });
    socket.on("leave-server", (serverId) => {
        socket.leave(serverId);
    });
    socket.on("group-det-changed", (payload) => {
        const { serverId, server } = payload;
        console.log(serverId, server);
        socket.to(serverId).emit("group-det-changed-update", { server });
    });
    socket.on("user-added", (payload) => {
        const { serverId, server, message } = payload;
        socket.to(serverId).emit("user-added-notify", { server, message });
    });
    socket.on("channel-created", (payload) => {
        const { server, serverId, message, channel } = payload;
        console.log("CHANNEL CREATED", serverId, server);
        socket
            .to(serverId)
            .emit("channel-created-notify", { server, message, channel });
    });
    socket.on("channel-requested", (payload) => {
        const { serverId, server, request, channelName } = payload;
        socket.to(serverId).emit("channel-requested-notify", {
            serverId,
            request,
            channel: channelName,
        });
    });
    socket.on("channel-accepted-or-rejected", (payload) => {
        const { serverId, server, request, action, channelName } = payload;
        socket.to(serverId).emit("channel-accepted-or-rejected-notify", {
            serverId,
            request,
            action,
            channelName,
        });
    });
});
callsAndChats.on("connection", (socket) => {
    socket.on("join-room", (roomID) => {
        socket.join(roomID);
        console.log("ROOM ID", roomID);
    });
    socket.on("join-mesh-audio-call", ({ channelId, userId }) => {
        console.log("USER JOINED", channelId, userId);
        socket.join(channelId);
        if (audioCallUsers[channelId]) {
            const length = audioCallUsers[channelId].length;
            if (length === 4) {
                console.log("ROOM FULL");
                socket.emit("room full");
                return;
            }
            if (audioCallUsers &&
                audioCallUsers.length > 0 &&
                audioCallUsers.find((user) => user.userId === userId)) {
                console.log("USER ALREADY IN ROOM");
                return;
            }
            audioCallUsers[channelId].push({ userId, socketId: socket.id });
        }
        else {
            audioCallUsers[channelId] = [{ userId, socketId: socket.id }];
        }
        socketToRoom[userId] = channelId;
        const audioCallUsersInThisRoomWithOtherProperties = audioCallUsers[channelId].filter((id) => {
            return id.userId !== userId;
        });
        const audioCallUsersInThisRoom = [];
        audioCallUsersInThisRoomWithOtherProperties.map((id) => {
            audioCallUsersInThisRoom.push(id.userId);
        });
        console.log("USERS IN THIS ROOM SENDING", audioCallUsersInThisRoom);
        console.log("USERS IN THIS ROOM", audioCallUsers);
        socket.emit("all-users-in-audio-call", audioCallUsersInThisRoom);
    });
    socket.on("sending signal-audio", (payload) => {
        console.log("SENDING SIGNAL", payload);
        socket.to(payload.userToSignal).emit("user-joined-audio", {
            signal: payload.signal,
            userDet: payload.userDet,
            callerID: payload.callerID,
        });
    });
    socket.on("returning signal-audio", (payload) => {
        socket.to(payload.callerID).emit("receiving returned signal-audio", {
            signal: payload.signal,
            userDet: payload.userDet,
            id: socket.id,
        });
    });
    socket.on("disconnect", () => {
        const roomID = socketToRoom[socket.id];
        let room = audioCallUsers[roomID];
        if (room) {
            room = room.filter((id) => id.socketId !== socket.id);
            audioCallUsers[roomID] = room;
        }
    });
    socket.on("send-message", (payload) => {
        console.log("MESSAGE RECEIVED", payload);
        socket.to(payload.channelId).emit("message-received", payload);
    });
});
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/channel", channelRoutes);
app.use("/api/v1/message", messageRoutes);
app.use("/api/v1/server", serverRoutes);
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        // @ts-ignore
        yield connectToDatabase(process.env.MONGO_URI);
        console.log("Connected to Database..!");
        server.listen(PORT);
    }
    catch (error) {
        console.log("Working offline..!", error);
        server.listen(PORT);
    }
});
start();
