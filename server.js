const express = require("express");
const app = express();
const http = require("http").createServer(app); // Use HTTP instead of HTTPS
const io = require("socket.io")(http);

const PORT = 3000;

// Serve static files from the "public" directory
app.use(express.static("public"));

// Start the server on localhost
http.listen(PORT, "127.0.0.1", () => {
  console.log(`Server running at http://127.0.0.1:${PORT}`);
});

let players = [];

io.on("connection", (socket) => {
  console.log("New player connected:", socket.id);

  // Create a new player
  players.push({
    id: socket.id,
    x: Math.random() * 512,
    y: Math.random() * 512,
    angle: Math.PI / 2.5,
    sprite: { x: Math.random() * 512, y: Math.random() * 512, size: 32, color: "yellow" },
    name: `Player ${players.length + 1}`,
  });

  // Send the updated players list to all clients
  io.emit("playersUpdate", players);

  // Listen for player movement updates
  socket.on("move", (data) => {
    const player = players.find((p) => p.id === socket.id);
    if (player) {
      player.x = data.x;
      player.y = data.y;
      player.angle = data.angle;
      io.emit("playersUpdate", players);
    }
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    players = players.filter((p) => p.id !== socket.id);
    io.emit("playersUpdate", players);
  });
});
