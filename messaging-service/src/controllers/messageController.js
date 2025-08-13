const Message = require('../models/Message');

// Handle new messages
exports.handleNewMessage = async (socket, data) => {
  try {
    const { receiverId, content } = data;
    
    // Validate input
    if (!receiverId || !content || content.trim() === '') {
      throw new Error('Invalid message data');
    }

    // Create and save message
    const message = new Message({
      sender: socket.userId,
      receiver: receiverId,
      content
    });
    
    await message.save();
    
    // Return the saved message with populated sender info
    const populatedMessage = await Message.populate(message, {
      path: 'sender',
      select: 'username'
    });
    
    return populatedMessage;
  } catch (error) {
    console.error(`Error handling new message: ${error.message}`);
    socket.emit('messageError', { error: error.message });
  }
};

// Retrieve message history
exports.getMessageHistory = async (userId, receiverId) => {
  try {
    return await Message.find({
      $or: [
        { sender: userId, receiver: receiverId },
        { sender: receiverId, receiver: userId }
      ]
    })
    .sort({ timestamp: 1 })
    .populate('sender', 'username')
    .populate('receiver', 'username');
  } catch (error) {
    console.error(`Error retrieving message history: ${error.message}`);
    throw error;
  }
};

// Handle socket disconnections
exports.handleDisconnect = (socket) => {
  console.log(`User disconnected from messaging: ${socket.userId}`);
};