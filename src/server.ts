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
const users = {};
const socketToRoom = {};
app.use(express.json());
app.use(cookieParser());
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});
//@ts-ignore
io.on("connection", (socket) => {
  console.log("USER CONNECTD", socket.id);
  socket.on("join room", (roomID: any) => {
    //@ts-ignore
    if (users[roomID]) {
      //@ts-ignore
      const length = users[roomID].length;

      //@ts-ignore
      users[roomID].push(socket.id);
    } else {
      //@ts-ignore
      users[roomID] = [socket.id];
    }
    //@ts-ignore
    socketToRoom[socket.id] = roomID;
    //@ts-ignore
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
    //@ts-ignore
    const roomID = socketToRoom[socket.id];
    //@ts-ignore
    let room = users[roomID];
    if (room) {
      room = room.filter((id: any) => id !== socket.id);
      //@ts-ignore
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
