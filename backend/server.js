require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const helmet = require('helmet');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const server = http.createServer(app);

// Security & Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST']
}));
app.use(express.json());

// WebSocket Setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST']
  }
});

// Temporary in-memory state (In production, replace with Redis)
const designStates = new Map();

io.on('connection', (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on('join-design', (designId) => {
    socket.join(designId);
    if (designStates.has(designId)) {
      socket.emit('sync-canvas', designStates.get(designId));
    }
  });

  socket.on('canvas-update', ({ designId, state }) => {
    designStates.set(designId, state);
    // Broadcast to everyone else in the room
    socket.to(designId).emit('sync-canvas', state);
  });

  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Enterprise Design Server running on port ${PORT}`);
});
