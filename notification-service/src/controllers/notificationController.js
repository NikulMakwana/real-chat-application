// Stores active user connections: { userId: socket }
const userConnections = new Map();

// Handle new socket connections
exports.handleConnection = (socket) => {
  console.log(`User connected to notifications: ${socket.userId}`);
  userConnections.set(socket.userId, socket);
};

// Handle disconnections
exports.handleDisconnect = (socket) => {
  console.log(`User disconnected from notifications: ${socket.userId}`);
  userConnections.delete(socket.userId);
};

// Send notification to a user
exports.sendNotification = (userId, notification) => {
  try {
    if (!userConnections.has(userId)) {
      throw new Error('User not connected');
    }
    
    const socket = userConnections.get(userId);
    socket.emit('notification', {
      ...notification,
      timestamp: new Date(),
      read: false
    });
    
    return true;
  } catch (error) {
    console.error(`Notification failed to ${userId}: ${error.message}`);
    throw error;
  }
};

// Get connection status
exports.getConnectionStatus = (userId) => {
  return userConnections.has(userId);
};