const socket = io(); // Ensure socket is initialized after the script tag is loaded.
const map = document.getElementById("mapCanvas");
const map_ctx = map.getContext("2d");

const game = document.getElementById("gameCanvas");
const game_ctx = game.getContext("2d");

map.width = 512;
map.height = 512;

game.width = 512;
game.height = 512;

// Dynamic level size setup
let levelX = 32, levelY = 32; // Default level size (could be 8, 16, 24, 7, etc.)
let cellSize = 16; // Default cell size
let level = [];

// Function to generate a random level with walls (1 = wall, 0 = empty space)
function generateLevel(levelX, levelY) {
  level = [];
  for (let y = 0; y < levelY; y++) {
    for (let x = 0; x < levelX; x++) {
      if (x === 0 || y === 0 || x === levelX - 1 || y === levelY - 1) {
        level.push(1); // Set outer borders as walls
      } else {
        level.push(Math.random() > 0.2 ? 0 : 1); // Random walls with 20% chance
      }
    }
  }
}

generateLevel(levelX, levelY);

// Player setup
const player = {
  x: 100,
  y: 100,
  angle: Math.PI / 2.5,
  speed: 0.5,
  turnSpeed: 0.03
};

const PI = Math.PI;

let players = [];

const weaponImage = new Image();
weaponImage.src = 'media/stupid gun.png'; // Replace with the actual path to the image
// On image load event
weaponImage.onload = function() {
  console.log('Weapon image loaded successfully!');
  // You can now render it in your main game loop
};

// Handle error loading the image
weaponImage.onerror = function(err) {
  console.error('Failed to load the image:', err);
  // You could provide a fallback image or handle the error accordingly
  weaponImage.src = 'fallback_image.png'; // Optional fallback
};

const weaponBangImage = new Image();
weaponBangImage.src = 'media/bang.png'; // Replace with the actual path to the image
// On image load event
weaponBangImage.onload = function() {
  console.log('Weapon image loaded successfully!');
  // You can now render it in your main game loop
};

// Handle error loading the image
weaponImage.onerror = function(err) {
  console.error('Failed to load the image:', err);
  // You could provide a fallback image or handle the error accordingly
  weaponImage.src = 'fallback_image.png'; // Optional fallback
};

// Function to render the weapon image as a pixelated overlay
function renderWeaponOverlay() {
  // Set image smoothing to false to achieve the pixelated effect
  game_ctx.imageSmoothingEnabled = false;

  // Define the position where the weapon should be drawn (this can be player-based or fixed)
  const weaponSize = game.width / 1.5; // Adjust the size of the weapon image
  const weaponX = game.width - weaponSize; // Adjust as needed to position it relative to player
  const weaponY = game.height - weaponSize; // Adjust as needed to position it relative to player
  
  // Draw the weapon image onto the canvas
  game_ctx.drawImage(weaponImage, weaponX, weaponY, weaponSize, weaponSize);
  
  // Reset image smoothing to true after rendering
  game_ctx.imageSmoothingEnabled = true;
}

function renderWeaponBangOverlay() {
  // Set image smoothing to false to achieve the pixelated effect
  game_ctx.imageSmoothingEnabled = false;

  // Define the position where the weapon should be drawn (this can be player-based or fixed)
  const weaponSize = game.width / 4; // Adjust the size of the weapon image
  const weaponX = game.width - weaponSize - 80; // Adjust as needed to position it relative to player
  const weaponY = game.height - weaponSize * 2.7; // Adjust as needed to position it relative to player
  
  // Draw the weapon image onto the canvas 
  game_ctx.drawImage(weaponBangImage, weaponX, weaponY, weaponSize, weaponSize);
  
  // Reset image smoothing to true after rendering
  game_ctx.imageSmoothingEnabled = true;
}

function renderRaysOnMap() {
  const numRays = 150;
  const fov = Math.PI / 2;
  const rayStep = fov / numRays;
  const maxDepth = 700;

  // Clear the map canvas (optional, you can choose to keep the map background intact)
  map_ctx.clearRect(0, 0, map.width, map.height);

  for (let i = 0; i < numRays; i++) {
    const rayAngle = player.angle - fov / 2 + i * rayStep;
    let rayX = player.x;
    let rayY = player.y;

    // Variable to store the ray's end point
    let hitX = -1;
    let hitY = -1;

    for (let depth = 0; depth < maxDepth; depth++) {
      rayX += Math.cos(rayAngle);
      rayY += Math.sin(rayAngle);

      const mapX = Math.floor(rayX / cellSize);
      const mapY = Math.floor(rayY / cellSize);

      if (mapX >= 0 && mapX < levelX && mapY >= 0 && mapY < levelY) {
        if (level[mapY * levelX + mapX] === 1) {
          // Store the hit position for ray visualization
          hitX = rayX;
          hitY = rayY;
          break; // Stop tracing the ray when it hits a wall
        }
      }
    }

    // If the ray hit something, draw it in orange
    if (hitX !== -1 && hitY !== -1) {
      map_ctx.beginPath();
      map_ctx.moveTo(player.x, player.y);
      map_ctx.lineTo(hitX, hitY);
      map_ctx.strokeStyle = "orange"; // Set ray color to orange
      map_ctx.lineWidth = 2; // Make the line thicker
      map_ctx.stroke();
    }
  }
}

function drawLevel() {
  map_ctx.fillStyle = "black";
  map_ctx.fillRect(0, 0, map.width, map.height);

  renderRaysOnMap();

  for (let y = 0; y < levelY; y++) {
    for (let x = 0; x < levelX; x++) {
      if (level[y * levelX + x] === 1) {
        map_ctx.fillStyle = "gray";
        map_ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }
}

function drawPlayer() {
  map_ctx.fillStyle = "red";
  map_ctx.beginPath();
  map_ctx.arc(player.x, player.y, 5, 0, 2 * PI);
  map_ctx.fill();
}

const sprites = [
  { x: 100, y: 100, size: 32, color: "blue" },
  { x: 400, y: 150, size: 32, color: "red" }
];

function drawSpritesOnMap() {
  for (const sprite of sprites) {
    map_ctx.fillStyle = sprite.color;
    map_ctx.beginPath();
    map_ctx.arc(sprite.x, sprite.y, 5, 0, 2 * Math.PI);
    map_ctx.fill();
  }
}

function render3DView() {
  const numRays = 200;
  const fov = Math.PI / 2;
  const rayStep = fov / numRays;
  const maxDepth = 500;

  game_ctx.clearRect(0, 0, game.width, game.height);

  for (let i = 0; i < numRays; i++) {
    const rayAngle = player.angle - fov / 2 + i * rayStep;
    let rayX = player.x;
    let rayY = player.y;

    for (let depth = 0; depth < maxDepth; depth++) {
      rayX += Math.cos(rayAngle);
      rayY += Math.sin(rayAngle);

      const mapX = Math.floor(rayX / cellSize);
      const mapY = Math.floor(rayY / cellSize);

      if (mapX >= 0 && mapX < levelX && mapY >= 0 && mapY < levelY) {
        if (level[mapY * levelX + mapX] === 1) {
          const distance = Math.hypot(rayX - player.x, rayY - player.y);
          const wallHeight = (cellSize / distance) * (game.height / 2);

          game_ctx.fillStyle = "rgb(40, 40, 40)";
          game_ctx.fillRect(i * (game.width / numRays), 0, game.width / numRays, (game.height - wallHeight) / 2);

          const shade = 255 - Math.min(255, distance * 1.5);
          game_ctx.fillStyle = `rgb(${shade/2.5}, ${shade/2.5}, ${shade/2.5})`;
          game_ctx.fillRect(i * (game.width / numRays), (game.height - wallHeight) / 2, game.width / numRays, wallHeight);

          game_ctx.fillStyle = "rgb(30, 30, 30)";
          game_ctx.fillRect(i * (game.width / numRays), (game.height + wallHeight) / 2, game.width / numRays, game.height - (game.height + wallHeight) / 2);

          break;
        }
      }
    }
  }
}

function renderBillboards() {
  const sortedSprites = [...sprites].sort((a, b) => {
    const distA = Math.sqrt((a.x - player.x) ** 2 + (a.y - player.y) ** 2);
    const distB = Math.sqrt((b.x - player.x) ** 2 + (b.y - player.y) ** 2);
    return distB - distA;
  });

  sortedSprites.forEach(sprite => {
    const dx = sprite.x - player.x;
    const dy = sprite.y - player.y;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const angleToSprite = Math.atan2(dy, dx);
    let relativeAngle = angleToSprite - player.angle;

    if (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI;
    else if (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI;

    const halfFov = Math.PI / 8;
    if (Math.abs(relativeAngle) > halfFov) return;

    const rayStep = 0.05;
    const rayLength = distance;

    let rayX = player.x;
    let rayY = player.y;
    for (let i = 0; i < rayLength; i++) {
      rayX += Math.cos(player.angle + relativeAngle) * rayStep;
      rayY += Math.sin(player.angle + relativeAngle) * rayStep;

      const mapX = Math.floor(rayX / cellSize);
      const mapY = Math.floor(rayY / cellSize);

      if (mapX >= 0 && mapX < levelX && mapY >= 0 && mapY < levelY) {
        if (level[mapY * levelX + mapX] === 1) return;
      }
    }

    const screenX = Math.tan(relativeAngle) * (game.width / 2) + game.width / 2;
    const spriteHeight = (sprite.size / distance) * 200;
    const spriteWidth = spriteHeight;

    const top = (game.height / 2) - spriteHeight / 2;
    const left = screenX - spriteWidth / 2;

    game_ctx.fillStyle = sprite.color;
    game_ctx.fillRect(left, top, spriteWidth, spriteHeight);
  });
}

// Send player movement to the server
function updatePlayerPosition() {
  socket.emit('move', {
    x: player.x,
    y: player.y,
    angle: player.angle
  });
}

// Listen for updates to the player list
socket.on('playersUpdate', (updatedPlayers) => {
  players = updatedPlayers; // Update players with the latest data from the server
});

// Player input handling
const keys = {};
window.addEventListener("keydown", (e) => {
  keys[e.key] = true;
});

window.addEventListener("keyup", (e) => {
  keys[e.key] = false;
});

// Update player position based on input keys
function updatePlayer() {
  let nextX = player.x;
  let nextY = player.y;

  if (keys["ArrowUp"]) {
    nextX += Math.cos(player.angle) * player.speed;
    nextY += Math.sin(player.angle) * player.speed;
  }
  if (keys["ArrowDown"]) {
    nextX -= Math.cos(player.angle) * player.speed;
    nextY -= Math.sin(player.angle) * player.speed;
  }

  // Check for collisions with walls
  const mapX = Math.floor(nextX / cellSize);
  const mapY = Math.floor(nextY / cellSize);

  if (mapX >= 0 && mapX < levelX && mapY >= 0 && mapY < levelY) {
    if (level[mapY * levelX + mapX] === 0) {
      // Only update position if there's no wall
      player.x = nextX;
      player.y = nextY;
    }
  }

  if (keys["ArrowLeft"]) {
    player.angle -= player.turnSpeed;
  }
  if (keys["ArrowRight"]) {
    player.angle += player.turnSpeed;
  }
}

function renderPlayers() {
  // Draw each player in the players list
  players.forEach((player) => {
    map_ctx.fillStyle = "yellow"; // Color for the player
    map_ctx.beginPath();
    map_ctx.arc(player.x, player.y, 3, 0, 2 * Math.PI);
    map_ctx.fill();
  });
}

function renderPlayerBillboards() {
  const sortedPlayers = [...players].sort((a, b) => {
    const distA = Math.sqrt((a.x - player.x) ** 2 + (a.y - player.y) ** 2);
    const distB = Math.sqrt((b.x - player.x) ** 2 + (b.y - player.y) ** 2);
    return distB - distA;
  });

  sortedPlayers.forEach((p, index) => {
    const dx = p.x - player.x - 1;
    const dy = p.y - player.y - 1;

    const distance = Math.sqrt(dx * dx + dy * dy);
    const angleToPlayer = Math.atan2(dy, dx);
    let relativeAngle = angleToPlayer - player.angle;

    if (relativeAngle > Math.PI) relativeAngle -= 2 * Math.PI;
    else if (relativeAngle < -Math.PI) relativeAngle += 2 * Math.PI;

    const halfFov = Math.PI / 8;
    if (Math.abs(relativeAngle) > halfFov) return;

    const rayStep = 0.05;
    const rayLength = distance;

    let rayX = player.x;
    let rayY = player.y;
    for (let i = 0; i < rayLength; i++) {
      rayX += Math.cos(player.angle + relativeAngle) * rayStep;
      rayY += Math.sin(player.angle + relativeAngle) * rayStep;

      const mapX = Math.floor(rayX / cellSize);
      const mapY = Math.floor(rayY / cellSize);

      if (mapX >= 0 && mapX < levelX && mapY >= 0 && mapY < levelY) {
        if (level[mapY * levelX + mapX] === 1) return;
      }
    }

    const screenX = Math.tan(relativeAngle) * (game.width / 2) + game.width / 2;
    const playerHeight = (50 / distance) * 200;  // Adjust height of player sprite based on distance
    const playerWidth = playerHeight;  // Keeping the sprite width same as height for simplicity

    const top = (game.height / 2) - playerHeight / 2;
    const left = screenX - playerWidth / 2;

    // Render the player sprite
    game_ctx.fillStyle = "yellow";  // Example color for the player
    game_ctx.fillRect(left, top, playerWidth, playerHeight);

    // Render player name above the sprite
    const playerName = `Player ${index + 1}`; // Display Player 1, Player 2, etc.
    game_ctx.font = "16px Arial";
    game_ctx.fillStyle = "white";
    const textWidth = game_ctx.measureText(playerName).width;
    game_ctx.fillText(playerName, left + playerWidth / 2 - textWidth / 2, top - 10);
  });
}

// Game loop combining old and new logic
function gameLoop() {
  updatePlayer(); // Update the player based on input
  updatePlayerPosition(); // Send the updated position to the server
  
  // Render the game elements
  drawLevel();
  drawPlayer();
  
  render3DView();
  drawSpritesOnMap();
  renderBillboards();
  renderPlayers(); // Draw all players on the game canvas
  renderPlayerBillboards();
  
  if (keys[" "]) {
    renderWeaponBangOverlay();
  }
  
  renderWeaponOverlay();

  requestAnimationFrame(gameLoop);
}

gameLoop(); // Start the game loop
