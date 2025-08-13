import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import { FaPaperPlane, FaUser, FaSignInAlt } from 'react-icons/fa';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [receiverId, setReceiverId] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const socketRef = useRef();

  // Base URL for user service
  const API_URL = "http://localhost:3001/api/users";

  // Register a new user
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/register`, {
        username,
        email,
        password
      });
      alert('Registration successful! Please login.');
      setIsRegistering(false);
    } catch (error) {
      alert(`Registration failed: ${error.response?.data?.message || error.message}`);
    }
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_URL}/login`, {
        username,
        password
      });
      setUser(response.data.user);
      localStorage.setItem('token', response.data.token);

      // Connect to messaging and presence services
      connectToSocket(response.data.token);
    } catch (error) {
      alert(`Login failed: ${error.response?.data?.message || error.message}`);
    }
  };

  // Connect to Socket.IO servers
  const connectToSocket = (token) => {
    // Connect to messaging service
    const messagingSocket = io('http://localhost:3002', {
      auth: { token }
    });
    socketRef.current = messagingSocket;

    messagingSocket.on('newMessage', (message) => {
      setMessages(prev => [...prev, message]);
    });

    // Connect to presence service
    const presenceSocket = io('http://localhost:3003', {
      auth: { token }
    });

    presenceSocket.on('presenceUpdate', (update) => {
      console.log('Presence update:', update);
      // Update online users list
      if (update.status === 'online') {
        setOnlineUsers(prev => [...prev, { userId: update.userId, username: update.username }]);
      } else {
        setOnlineUsers(prev => prev.filter(u => u.userId !== update.userId));
      }
    });
  };

  // Send a message
  const sendMessage = () => {
    if (!message.trim() || !receiverId) return;
    
    socketRef.current.emit('sendMessage', {
      receiverId,
      content: message
    });
    setMessage('');
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setMessages([]);
    setOnlineUsers([]);
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  // Check if user is already logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Validate token by getting profile
      axios.get(`${API_URL}/profile/current`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        setUser(response.data);
        connectToSocket(token);
      })
      .catch(() => {
        localStorage.removeItem('token');
      });
    }
  }, []);

  if (!user) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1>Chat Application</h1>
          {isRegistering ? (
            <form onSubmit={handleRegister}>
              <h2>Register</h2>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit">Register</button>
              <button type="button" onClick={() => setIsRegistering(false)}>
                Back to Login
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin}>
              <h2>Login</h2>
              <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button type="submit">
                <FaSignInAlt /> Login
              </button>
              <button type="button" onClick={() => setIsRegistering(true)}>
                Create Account
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <header>
        <h1>DevOps Chat</h1>
        <div className="user-info">
          <FaUser /> {user.username}
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <div className="chat-layout">
        <div className="online-users">
          <h3>Online Users</h3>
          <ul>
            {onlineUsers.map(u => (
              <li 
                key={u.userId} 
                onClick={() => setReceiverId(u.userId)}
                className={u.userId === receiverId ? 'selected' : ''}
              >
                {u.username}
              </li>
            ))}
          </ul>
        </div>

        <div className="chat-area">
          <div className="messages">
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`message ${msg.sender === user.id ? 'sent' : 'received'}`}
              >
                <strong>{msg.sender === user.id ? 'You' : msg.senderUsername}: </strong>
                {msg.content}
              </div>
            ))}
          </div>

          <div className="message-input">
            <input
              type="text"
              placeholder="Type a message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              disabled={!receiverId}
            />
            <button onClick={sendMessage} disabled={!receiverId || !message.trim()}>
              <FaPaperPlane />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App; 