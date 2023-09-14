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
const { Server } = require("socket.io");
const { RoomHandler } = require("./roomHandler");
const server = http.createServer(app);
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});
app.use(
  cors({
    origin: ["http://localhost:3000"],
    credentials: true,
  })
);
const users: any = {};
const socketToRoom: any = {};
app.use(express.json());
app.use(cookieParser());
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
const callsAndChats = io.of("/calls-and-chats");
const RealTimeUpdates = io.of("/realtime-updates");
RealTimeUpdates.on("connection", (socket: any) => {
  socket.join("In-App-Updates");
  socket.on("in-app-updates", (payload: any) => {
    const { servers, selectedServer, message } = payload;
    socket
      .to("In-App-Updates")
      .emit("in-app-updates-notify", { servers, selectedServer, message });
  });
  socket.on("join-server", (payload: any) => {
    const { serverId } = payload;
    console.log("JOINED", serverId);
    socket.join(serverId);
  });
  socket.on("user-promoted", (payload: any) => {
    const { serverId, server, message } = payload;
    socket.to(serverId).emit("user-promoted-notify", { server, message });
  });

  socket.on("user-removed", (payload: any) => {
    const { serverId, server, message, removedUser } = payload;
    socket
      .in(serverId)
      .emit("user-removed-notify", { server, message, serverId, removedUser });
  });
  socket.on("leave-server", (serverId: any) => {
    socket.leave(serverId);
  });

  socket.on("group-det-changed", (payload: any) => {
    const { serverId, server } = payload;
    console.log(serverId, server);
    socket.to(serverId).emit("group-det-changed-update", { server });
  });

  socket.on("user-added", (payload: any) => {
    const { serverId, server, message } = payload;
    socket.to(serverId).emit("user-added-notify", { server, message });
  });
});
callsAndChats.on("connection", (socket: any) => {
  console.log("USER CONNECTD", socket.id);
  socket.on("join room", (roomID: any) => {
    if (users[roomID]) {
      const length = users[roomID].length;
      if (length === 4) {
        socket.emit("room full");
        return;
      }
      users[roomID].push(socket.id);
    } else {
      users[roomID] = [socket.id];
    }
    socketToRoom[socket.id] = roomID;
    const usersInThisRoom = users[roomID].filter((id: any) => id !== socket.id);

    socket.emit("all users", usersInThisRoom);
  });

  socket.on("sending signal", (payload: any) => {
    io.to(payload.userToSignal).emit("user joined", {
      signal: payload.signal,
      callerID: payload.callerID,
    });
  });

  socket.on("returning signal", (payload: any) => {
    io.to(payload.callerID).emit("receiving returned signal", {
      signal: payload.signal,
      id: socket.id,
    });
  });

  socket.on("disconnect", () => {
    const roomID = socketToRoom[socket.id];
    let room = users[roomID];
    if (room) {
      room = room.filter((id: any) => id !== socket.id);
      users[roomID] = room;
    }
  });
});
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/user", userRoutes);
app.use("/api/v1/server", serverRoutes);
const start = async () => {
  try {
    await connectToDatabase(process.env.MONGO_URI);
    console.log("Connected to Database..!");
    server.listen(PORT);
  } catch (error) {
    console.log("working offline..!", error);
    server.listen(PORT);
  }
};
start();
