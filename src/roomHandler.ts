const { Socket } = require("socket.io");
const { v4 } = require("uuid");
const rooms: Record<string, string[]> = {};
interface Room {
  id: string;
  peer: any;
}
export const RoomHandler = (socket: Socket) => {
  const createRoom = () => {
    const roomId = v4();
    socket.join(roomId);
    rooms[roomId] = [];
    console.log("CREATED ", roomId);
    socket.emit("room-created", roomId);
  };
  const joinRoom = ({ id, peer }: Room) => {
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
  socket.on("join-room", ({ id, peer }: Room) => {
    joinRoom({ id, peer });
  });
};
