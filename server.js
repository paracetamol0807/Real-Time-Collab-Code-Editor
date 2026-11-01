const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");
const Y = require("yjs");
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

// Per-room metadata: roomId -> { language: string }
const roomDataMap = {};

// Per-room Yjs document: roomId -> Y.Doc
const roomYDocs = {};

const DEFAULT_CODE = `/**
 * ========================================================
 *  Welcome to CodeShare
 *  Real-Time Collaborative Code Editor
 * ========================================================
 * 
 *  Features:
 *    • Live multi-user peer synchronization (Yjs CRDT)
 *    • Real-time language & syntax switching
 *    • Instant room sharing & presence indicators
 * 
 *  Copy your Room ID from the sidebar to collaborate!
 */

function welcome() {
  console.log("Ready to code together in real-time!");
}

welcome();
`;

/** Return or create the shared Y.Doc for a room */
function getRoomDoc(roomId) {
  if (!roomYDocs[roomId]) {
    const ydoc = new Y.Doc();
    ydoc.getText("monaco").insert(0, DEFAULT_CODE);
    roomYDocs[roomId] = ydoc;
  }
  return roomYDocs[roomId];
}

function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => ({
      socketId,
      username: userSocketMap[socketId]?.username || "Anonymous",
    })
  );
}

io.on("connection", (socket) => {
  // ── JOIN: client enters a room ──────────────────────────────────────────
  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = { username, roomId };
    socket.join(roomId);

    // Send the current Yjs document state to the newcomer
    const ydoc = getRoomDoc(roomId);
    const fullUpdate = Y.encodeStateAsUpdate(ydoc);
    socket.emit(ACTIONS.YJS_SYNC_STEP2, { update: Array.from(fullUpdate) });

    // Send current language if already set
    if (roomDataMap[roomId]?.language) {
      socket.emit(ACTIONS.LANGUAGE_CHANGE, {
        language: roomDataMap[roomId].language,
      });
    }

    // Broadcast updated presence list
    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  // ── Yjs: receive document update from client ─────────────────────────────
  socket.on(ACTIONS.YJS_UPDATE, ({ roomId, update }) => {
    const targetRoomId = roomId || userSocketMap[socket.id]?.roomId;
    if (!targetRoomId || !update) return;

    const ydoc = getRoomDoc(targetRoomId);
    try {
      Y.applyUpdate(ydoc, new Uint8Array(update));
    } catch (err) {
      console.error("Error applying Yjs update on server:", err);
      return;
    }

    // Broadcast the update to all other peers in the room
    socket.to(targetRoomId).emit(ACTIONS.YJS_UPDATE, { update });
  });

  // ── Yjs: step-1 sync request (state vector) ──────────────────────────────
  socket.on(ACTIONS.YJS_SYNC_STEP1, ({ roomId, stateVector }) => {
    const targetRoomId = roomId || userSocketMap[socket.id]?.roomId;
    if (!targetRoomId || !stateVector) return;

    const ydoc = getRoomDoc(targetRoomId);
    const diff = Y.encodeStateAsUpdate(ydoc, new Uint8Array(stateVector));
    socket.emit(ACTIONS.YJS_SYNC_STEP2, { update: Array.from(diff) });
  });

  // ── Language change ───────────────────────────────────────────────────────
  socket.on(ACTIONS.LANGUAGE_CHANGE, ({ roomId, language }) => {
    const targetRoomId = roomId || userSocketMap[socket.id]?.roomId;
    if (!targetRoomId) return;

    if (!roomDataMap[targetRoomId]) roomDataMap[targetRoomId] = {};
    roomDataMap[targetRoomId].language = language;

    socket.to(targetRoomId).emit(ACTIONS.LANGUAGE_CHANGE, { language });
  });

  // ── Disconnect ────────────────────────────────────────────────────────────
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
