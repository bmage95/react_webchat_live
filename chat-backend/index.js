const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let messages = [];

// Allow all origins for CORS
app.use(cors());

io.on('connection', (socket) => {
  console.log('New client connected');

  // Send all previous messages to the newly connected client
  socket.emit('initialize', messages);

  socket.on('sendMessage', (message) => {
    messages.push(message);
    io.emit('receiveMessage', message); // Broadcast message to all clients
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

server.listen(4000, () => console.log('Listening on port 4000'));
