require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const notificationRoutes = require('./routes/notificationRoutes');
const notificationController = require('./controllers/notificationController');
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
app.use('/api/notifications', notificationRoutes);

// Socket.IO Authentication
io.use(socketAuth);

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  notificationController.handleConnection(socket);
  
  socket.on('disconnect', () => {
    notificationController.handleDisconnect(socket);
  });
  
  // Optional: Client can mark notifications as read
  socket.on('markAsRead', (notificationId) => {
    // Implement if storing notifications in DB
    console.log(`Notification ${notificationId} marked as read by ${socket.userId}`);
  });
});

// Start server
const PORT = process.env.PORT || 3004;
server.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    connections: io.engine.clientsCount,
    timestamp: new Date()
  });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down notification service...');
  server.close(() => {
    console.log('Notification service shut down');
    process.exit(0);
  });
});