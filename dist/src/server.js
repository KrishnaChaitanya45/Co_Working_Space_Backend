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
const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const userRoutes = require("../routes/user/User.ts");
const cookieParser = require("cookie-parser");
const PORT = process.env.PORT || 5000;
const authRoutes = require("../routes/auth/Auth.ts");
const serverRoutes = require("../routes/server/Server.ts");
const connectToDatabase = require("../utils/connectToDb.ts");
const cloudinary = require("cloudinary").v2;
const http = require("http");
const socket_io_1 = require("socket.io");
const server = http.createServer(app);
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
app.use(cors({
    origin: ["http://localhost:3000"],
    credentials: true,
}));
const users = {};
const socketToRoom = {};
app.use(express.json());
app.use(cookieParser());
const io = new socket_io_1.Server(server, {
    cors: {
        origin: "*",
    },
});
io.on("connection", (socket) => {
    console.log("USER CONNECTD", socket.id);
    socket.on("join room", (roomID) => {
        if (users[roomID]) {
            const length = users[roomID].length;
            if (length === 4) {
                socket.emit("room full");
                return;
            }
            users[roomID].push(socket.id);
        }
        else {
            users[roomID] = [socket.id];
        }
        socketToRoom[socket.id] = roomID;
        const usersInThisRoom = users[roomID].filter((id) => id !== socket.id);
        socket.emit("all users", usersInThisRoom);
    });
    socket.on("sending signal", (payload) => {
        io.to(payload.userToSignal).emit("user joined", {
            signal: payload.signal,
            callerID: payload.callerID,
        });
    });
    socket.on("returning signal", (payload) => {
        io.to(payload.callerID).emit("receiving returned signal", {
            signal: payload.signal,
            id: socket.id,
        });
    });
    socket.on("disconnect", () => {
        const roomID = socketToRoom[socket.id];
        let room = users[roomID];
        if (room) {
            room = room.filter((id) => id !== socket.id);
            users[roomID] = room;
        }
    });
});
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/server", serverRoutes);
const start = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield connectToDatabase(process.env.MONGO_URI);
        console.log("Connected to Database..!");
        server.listen(PORT);
    }
    catch (error) {
        console.log("working offline..!", error);
        server.listen(PORT);
    }
});
start();
