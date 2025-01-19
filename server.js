const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let players = [];

io.on('connection', (socket) => {
  console.log('New player connected:', socket.id);
  
  // Create a new player
  players.push({
    id: socket.id,
    x: Math.random() * 500,
    y: Math.random() * 500,
    angle: Math.PI / 2.5,
    sprite: { x: Math.random() * 500, y: Math.random() * 500, size: 32, color: "yellow" },
    name: `Player ${players.length + 1}`
  });

  // Send the updated players list to all clients
  io.emit('playersUpdate', players);

  // Listen for player movement updates
  socket.on('move', (data) => {
    const player = players.find(p => p.id === socket.id);
    if (player) {
      player.x = data.x;
      player.y = data.y;
      player.angle = data.angle;
      io.emit('playersUpdate', players);
    }
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
    players = players.filter(p => p.id !== socket.id);
    io.emit('playersUpdate', players);
  });
});

app.use(express.static('public'));
server.listen(3000, () => {
  console.log('Server running on port 3000');
});
