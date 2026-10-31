const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const ACTIONS = require("./src/Actions");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Map of socket.id -> { username, roomId }
const userSocketMap = {};

// In-memory room state: roomId -> { code: string, language: string }
const roomDataMap = {};

function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => ({
      socketId,
      username: userSocketMap[socketId]?.username || "Anonymous",
    })
  );
}

io.on("connection", (socket) => {
  // User joins a room
  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = { username, roomId };
    socket.join(roomId);

    // If the room already has stored state, immediately send to the new user
    if (roomDataMap[roomId]) {
      if (roomDataMap[roomId].code !== undefined && roomDataMap[roomId].code !== null) {
        socket.emit(ACTIONS.CODE_CHANGE, { code: roomDataMap[roomId].code });
      }
      if (roomDataMap[roomId].language) {
        socket.emit(ACTIONS.LANGUAGE_CHANGE, { language: roomDataMap[roomId].language });
      }
    }

    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  // Relay and persist code changes
  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    const targetRoomId = roomId || userSocketMap[socket.id]?.roomId;
    if (targetRoomId) {
      if (!roomDataMap[targetRoomId]) roomDataMap[targetRoomId] = {};
      roomDataMap[targetRoomId].code = code;
      socket.to(targetRoomId).emit(ACTIONS.CODE_CHANGE, { code });
    }
  });

  // Relay and persist language changes
  socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, language }) => {
    const targetRoomId = roomId || userSocketMap[socket.id]?.roomId;
    if (targetRoomId) {
      if (!roomDataMap[targetRoomId]) roomDataMap[targetRoomId] = {};
      roomDataMap[targetRoomId].language = language;
      socket.to(targetRoomId).emit(ACTIONS.LANGUAGE_CHANGE, { language });
    }
  });

  // Peer-to-peer fallback sync
  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code, language }) => {
    const targetRoomId = userSocketMap[socket.id]?.roomId;
    if (targetRoomId) {
      if (!roomDataMap[targetRoomId]) roomDataMap[targetRoomId] = {};
      if (code !== undefined && code !== null) roomDataMap[targetRoomId].code = code;
      if (language) roomDataMap[targetRoomId].language = language;
    }

    if (code !== undefined && code !== null) {
      io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
    }
    if (language) {
      io.to(socketId).emit(ACTIONS.LANGUAGE_CHANGE, { language });
    }
  });

  // Handle client disconnecting
  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.to(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id]?.username,
      });
    });

    delete userSocketMap[socket.id];
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`CodeShare socket server running on port ${PORT}`);
});
