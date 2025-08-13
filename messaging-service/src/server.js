require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const messageRoutes = require('./routes/messageRoutes');
const messageController = require('./controllers/messageController');
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

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Messaging DB connected'))
.catch(err => console.error('DB connection error:', err));

// REST API Routes
app.use('/api/messages', messageRoutes);

// Socket.IO Authentication
io.use(socketAuth);

// Socket.IO Connection Handling
io.on('connection', (socket) => {
  console.log(`User connected to messaging: ${socket.userId}`);
  
  // Join user-specific room
  socket.join(socket.userId);
  
  // Message event handlers
  socket.on('sendMessage', async (data) => {
    try {
      const message = await messageController.handleNewMessage(socket, data);
      if (message) {
        // Send to receiver
        io.to(data.receiverId).emit('newMessage', message);
        // Also send back to sender for UI update
        socket.emit('newMessage', message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });
  
  socket.on('getHistory', async (receiverId) => {
    try {
      const messages = await messageController.getMessageHistory(
        socket.userId, 
        receiverId
      );
      socket.emit('messageHistory', messages);
    } catch (error) {
      socket.emit('historyError', { error: error.message });
    }
  });
  
  socket.on('disconnect', () => {
    messageController.handleDisconnect(socket);
  });
});

// Start server
const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Messaging service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.disconnect();
  server.close(() => {
    console.log('Messaging service shut down');
    process.exit(0);
  });
});