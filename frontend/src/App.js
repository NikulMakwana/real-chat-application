import React from 'react';
import io from 'socket.io-client';

function App() {
  const [messages, setMessages] = React.useState([]);
  const socket = io('http://localhost:5000');

  socket.on('message', (msg) => {
    setMessages([...messages, msg]);
  });

  return (
    <div>
      <h1>Real Chat</h1>
      <ul>
        {messages.map((msg, i) => <li key={i}>{msg}</li>)}
      </ul>
    </div>
  );
}

export default App;