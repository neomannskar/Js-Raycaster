const map = document.getElementById("mapCanvas");
const map_ctx = map.getContext("2d");

const game = document.getElementById("gameCanvas");
const game_ctx = game.getContext("2d");

// Canvas and level setup
map.width = 512;
map.height = 512;

game.width = 512;
game.height = 512;

const levelX = 8, levelY = 8, cellSize = 64;
const level = [
  1, 1, 1, 1, 1, 1, 1, 1,
  1, 0, 1, 0, 0, 0, 0, 1,
  1, 0, 1, 0, 1, 0, 0, 1,
  1, 0, 1, 0, 0, 0, 0, 1,
  1, 0, 0, 0, 0, 1, 1, 1,
  1, 0, 0, 0, 0, 1, 0, 1,
  1, 0, 0, 0, 0, 0, 0, 1,
  1, 1, 1, 1, 1, 1, 1, 1
];

const players = [
  { 
    id: 1, 
    x: 100, 
    y: 100, 
    angle: Math.PI / 2.5, 
    speed: 0.75, 
    turnSpeed: 0.01, 
    sprite: { x: 100, y: 100, size: 32, color: "yellow" },
    name: "Player 1" 
  },
  { 
    id: 2, 
    x: 300, 
    y: 300, 
    angle: Math.PI / 2.5, 
    speed: 0.75, 
    turnSpeed: 0.01, 
    sprite: { x: 300, y: 300, size: 32, color: "blue" },
    name: "Player 2" 
  }
];

const player = {
  x: 100,
  y: 100,
  angle: Math.PI / 2.5,
  speed: 0.75,
  turnSpeed: 0.01
};

const PI = Math.PI;

// Draw the level grid
function drawLevel() {
  map_ctx.fillStyle = "black";
  map_ctx.fillRect(0, 0, map.width, map.height);

  for (let y = 0; y < levelY; y++) {
    for (let x = 0; x < levelX; x++) {
      if (level[y * levelX + x] === 1) {
        map_ctx.fillStyle = "gray";
        map_ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
      }
    }
  }
}

// Draw the player
function drawPlayer() {
  map_ctx.fillStyle = "red";
  map_ctx.beginPath();
  map_ctx.arc(player.x, player.y, 5, 0, 2 * PI);
  map_ctx.fill();
}

function renderPlayers() {
  players.forEach(player => {
    // Render sprite
    game_ctx.fillStyle = player.sprite.color;
    game_ctx.beginPath();
    game_ctx.arc(player.sprite.x, player.sprite.y, player.sprite.size / 2, 0, 2 * Math.PI);
    game_ctx.fill();

    // Render name tag above the player
    game_ctx.fillStyle = "white";
    game_ctx.font = "16px Arial";
    game_ctx.fillText(player.name, player.sprite.x - (game_ctx.measureText(player.name).width / 2), player.sprite.y - player.sprite.size / 2 - 5);
  });
}

// Render the 3D view
function render3DView() {
  const numRays = 150;
  const fov = Math.PI / 2;
  const rayStep = fov / numRays;
  const maxDepth = 700;

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
          const distance = Math.hypot(rayX - player.x, rayY - player.y); // More consistent distance
          const wallHeight = (cellSize / distance) * (game.height / 2); // Adjust wall height based on field of view

          // Ceiling
          game_ctx.fillStyle = "rgb(20, 50, 0)";
          game_ctx.fillRect(
            i * (game.width / numRays),
            0,
            game.width / numRays,
            (game.height - wallHeight) / 2
          );

          // Wall
          const shade = 255 - Math.min(255, distance * 1.5);
          game_ctx.fillStyle = `rgb(0, ${shade/2.5}, 0)`;
          game_ctx.fillRect(
            i * (game.width / numRays),
            (game.height - wallHeight) / 2,
            game.width / numRays,
            wallHeight
          );

          // Floor
          game_ctx.fillStyle = "rgb(0, 30, 0)";
          game_ctx.fillRect(
            i * (game.width / numRays),
            (game.height + wallHeight) / 2,
            game.width / numRays,
            game.height - (game.height + wallHeight) / 2
          );

          break;
        }
      }
    }
  }
}

// Draw rays for debugging
function drawRays() {
  const numRays = 100;
  const fov = Math.PI / 2;
  const rayStep = fov / numRays;

  for (let i = 0; i < numRays; i++) {
    const rayAngle = player.angle - fov / 2 + i * rayStep;

    let rayX = player.x;
    let rayY = player.y;

    for (let depth = 0; depth < 300; depth++) {
      rayX += Math.cos(rayAngle);
      rayY += Math.sin(rayAngle);

      const mapX = Math.floor(rayX / cellSize);
      const mapY = Math.floor(rayY / cellSize);

      if (mapX >= 0 && mapX < levelX && mapY >= 0 && mapY < levelY) {
        if (level[mapY * levelX + mapX] === 1) {
          map_ctx.strokeStyle = "rgba(255, 255, 0, 0.3)";
          map_ctx.beginPath();
          map_ctx.moveTo(player.x, player.y);
          map_ctx.lineTo(rayX, rayY);
          map_ctx.stroke();
          break;
        }
      }
    }
  }
}

// Player movement
function updatePlayer() {
  if (keys["ArrowUp"]) {
    player.x += Math.cos(player.angle) * player.speed;
    player.y += Math.sin(player.angle) * player.speed;
  }
  if (keys["ArrowDown"]) {
    player.x -= Math.cos(player.angle) * player.speed;
    player.y -= Math.sin(player.angle) * player.speed;
  }
  if (keys["ArrowLeft"]) {
    player.angle -= player.turnSpeed;
  }
  if (keys["ArrowRight"]) {
    player.angle += player.turnSpeed;
  }
}

// Handle keyboard input
const keys = {};
window.addEventListener("keydown", (e) => (keys[e.key] = true));
window.addEventListener("keyup", (e) => (keys[e.key] = false));

// Sprites array (to store all billboard sprites)
const sprites = [
  { x: 100, y: 100, size: 32, color: "blue" }, // Example sprite
  { x: 400, y: 150, size: 32, color: "red" } // Example sprite
];

// Draw sprites on the 2D map as blue dots
function drawSpritesOnMap() {
  for (const sprite of sprites) {
    map_ctx.fillStyle = "blue";
    map_ctx.beginPath();
    map_ctx.arc(sprite.x, sprite.y, 5, 0, 2 * Math.PI); // 5px radius for the dot
    map_ctx.fill();
  }
}

// Render a single billboard (sprite) in the 3D view
function renderBillboard(sprite) {
  const dx = sprite.x - player.x;
  const dy = sprite.y - player.y;

  const distance = Math.sqrt(dx * dx + dy * dy);
  const angleToSprite = Math.atan2(dy, dx);
  let relativeAngle = angleToSprite - player.angle;

  // Normalize angle to the range of -PI to PI
  if (relativeAngle > Math.PI) {
    relativeAngle -= 2 * Math.PI;
  } else if (relativeAngle < -Math.PI) {
    relativeAngle += 2 * Math.PI;
  }

  // Check if sprite is within FOV (Field of View)
  const halfFov = Math.PI / 8; // 22.5 degrees
  if (Math.abs(relativeAngle) > halfFov) {
    return; // Skip rendering the sprite if it is outside the FOV
  }

  // Check for sprite occlusion by wall
  if (isSpriteOccluded(sprite, distance, relativeAngle)) {
    return; // Skip rendering if the sprite is blocked by a wall
  }

  // Projection on the screen
  const screenX = Math.tan(relativeAngle) * (game.width / 2) + game.width / 2;
  const spriteHeight = (sprite.size / distance) * 200; // Scale sprite height based on distance
  const spriteWidth = spriteHeight;

  const top = (game.height / 2) - spriteHeight / 2;
  const left = screenX - spriteWidth / 2;

  game_ctx.fillStyle = sprite.color;
  game_ctx.fillRect(left, top, spriteWidth, spriteHeight);
}

// Check if a sprite is occluded by a wall (raycast style check)

function isSpriteOccluded(sprite, distance, relativeAngle) {
  const rayStep = 0.05; // Use smaller steps for precise occlusion
  const rayLength = distance;

  let rayX = player.x;
  let rayY = player.y;

  for (let i = 0; i < rayLength; i++) {
    rayX += Math.cos(player.angle + relativeAngle) * rayStep;
    rayY += Math.sin(player.angle + relativeAngle) * rayStep;

    const mapX = Math.floor(rayX / cellSize);
    const mapY = Math.floor(rayY / cellSize);

    if (mapX >= 0 && mapX < levelX && mapY >= 0 && mapY < levelY) {
      if (level[mapY * levelX + mapX] === 1) {
        return true;
      }
    }
  }
  return false;
}

// Sort and render all billboards (sprites)
function renderBillboards() {
  const sortedSprites = [...sprites].sort((a, b) => {
    const distA = Math.sqrt((a.x - player.x) ** 2 + (a.y - player.y) ** 2);
    const distB = Math.sqrt((b.x - player.x) ** 2 + (b.y - player.y) ** 2);
    return distB - distA; // Farther sprites render first
  });

  for (const sprite of sortedSprites) {
    renderBillboard(sprite);
  }
}

// Game loop
function gameLoop() {
  updatePlayer();
  drawLevel();
  drawRays();
  drawPlayer();
  render3DView();
  drawSpritesOnMap();
  renderBillboards();

  requestAnimationFrame(gameLoop);
}

gameLoop();
