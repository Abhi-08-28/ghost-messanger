const { createServer } = require("http");
const next = require("next");
const { Server } = require("socket.io");

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

const activeRooms = {};

app.prepare().then(() => {
  const httpServer = createServer((req, res) => {
    handle(req, res);
  });

  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join-room", (roomId) => {
      socket.join(roomId);

      if (!activeRooms[roomId]) {
        activeRooms[roomId] = 0;
      }

      activeRooms[roomId]++;
      console.log(`Room ${roomId} users: ${activeRooms[roomId]}`);
    });

    socket.on("send-message", ({ roomId, encryptedMessage }) => {
      io.to(roomId).emit("receive-message", encryptedMessage);
    });

    socket.on("disconnecting", () => {
      const rooms = socket.rooms;

      rooms.forEach((room) => {
        if (activeRooms[room]) {
          activeRooms[room]--;

          if (activeRooms[room] === 0) {
            delete activeRooms[room];
            console.log(`Room ${room} destroyed`);
          }
        }
      });
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });

 const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Ghost Server running on port ${PORT}`);
});
});