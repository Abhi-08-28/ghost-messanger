import { Server } from "socket.io";

export async function GET(req) {
  if (!global.io) {
    const io = new Server({
      cors: {
        origin: "*",
      },
    });

    io.on("connection", (socket) => {
      console.log("User connected:", socket.id);

      socket.on("joinRoom", (room) => {
        socket.join(room);
      });

      socket.on("sendMessage", ({ room, message, user }) => {
        io.to(room).emit("receiveMessage", { message, user });
      });

      socket.on("disconnect", () => {
        console.log("User disconnected:", socket.id);
      });
    });

    global.io = io;
  }

  return new Response("Socket running");
}