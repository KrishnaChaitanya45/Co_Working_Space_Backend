"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RoomHandler = void 0;
const uuid_1 = require("uuid");
const rooms = {};
const RoomHandler = (socket) => {
    const createRoom = () => {
        const roomId = (0, uuid_1.v4)();
        socket.join(roomId);
        rooms[roomId] = [];
        console.log("CREATED ", roomId);
        socket.emit("room-created", roomId);
    };
    const joinRoom = ({ id, peer }) => {
        console.log(id);
        console.log(rooms[id]);
        if (rooms[id]) {
            console.log("JOINING", peer);
            rooms[id].push(peer);
            socket.join(id);
            socket.to(id).emit("user-joined", { peer });
            socket.emit("get-users", {
                roomId: id,
                users: rooms[id],
            });
            socket.on("disconnect", () => {
                console.log("USER REMOVED");
                rooms[id] = rooms[id].filter((user) => user !== peer);
                socket.to(id).emit("user-disconnected", peer);
            });
        }
    };
    socket.on("create-room", () => {
        createRoom();
    });
    socket.on("join-room", ({ id, peer }) => {
        joinRoom({ id, peer });
    });
};
exports.RoomHandler = RoomHandler;
