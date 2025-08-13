// Store online users: { userId: { socketId, username, lastActive } }
const onlineUsers = new Map();

// Handle new connections
exports.handleConnection = (socket, io) => {
  console.log(`User connected to presence: ${socket.userId}`);
  
  // Add user to online map
  onlineUsers.set(socket.userId, {
    socketId: socket.id,
    username: socket.username,
    lastActive: new Date(),
    status: 'online'
  });
  
  // Broadcast presence update
  io.emit('presenceUpdate', {
    userId: socket.userId,
    status: 'online',
    username: socket.username
  });
};

// Handle disconnections
exports.handleDisconnect = (socket, io) => {
  console.log(`User disconnected from presence: ${socket.userId}`);
  
  if (onlineUsers.has(socket.userId)) {
    onlineUsers.delete(socket.userId);
    
    // Broadcast presence update
    io.emit('presenceUpdate', {
      userId: socket.userId,
      status: 'offline',
      username: socket.username
    });
  }
};

// Handle activity updates (e.g., idle/active)
exports.handleActivity = (socket, activityType) => {
  if (onlineUsers.has(socket.userId)) {
    const user = onlineUsers.get(socket.userId);
    user.status = activityType;
    user.lastActive = new Date();
    onlineUsers.set(socket.userId, user);
  }
};

// Get user status
exports.getUserStatus = (userId) => {
  if (onlineUsers.has(userId)) {
    const { status, lastActive } = onlineUsers.get(userId);
    return { 
      userId, 
      online: true, 
      status, 
      lastActive 
    };
  }
  return { 
    userId, 
    online: false, 
    status: 'offline', 
    lastActive: null 
  };
};

// Get all online users
exports.getOnlineUsers = () => {
  const users = [];
  for (const [userId, data] of onlineUsers) {
    users.push({
      userId,
      username: data.username,
      status: data.status,
      lastActive: data.lastActive
    });
  }
  return users;
};