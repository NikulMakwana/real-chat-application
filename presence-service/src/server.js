require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const presenceRoutes = require('./routes/presenceRoutes');
const presenceController = require('./controllers/presenceController');
const socketAuth = require('./utils/socketAuth');

// Initialize app and server
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(express.json());

// REST API Routes
app.use('/api/presence', presenceRoutes);

// Socket.IO Authentication
io.use(socketAuth);

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  presenceController.handleConnection(socket, io);
  
  // Handle activity updates
  socket.on('activityUpdate', (activityType) => {
    presenceController.handleActivity(socket, activityType);
  });
  
  socket.on('disconnect', () => {
    presenceController.handleDisconnect(socket, io);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    connections: io.engine.clientsCount,
    timestamp: new Date()
  });
});

// Start server
const PORT = process.env.PORT || 3003;
server.listen(PORT, () => {
  console.log(`Presence service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down presence service...');
  server.close(() => {
    console.log('Presence service shut down');
    process.exit(0);
  });
});