//basic color, bottom water layer

// Configurable variables for water texture
const WATER_TEXTURE_SPEED = 0.05; // Very slow movement (lower = slower)
const WATER_TEXTURE_OPACITY = 0.15; // Very subtle opacity (lower = more transparent)

function generateWavyWaterCanvas(waterCtx, rows) {
  // Clear the canvas and set it to a solid blue color
  waterCtx.clearRect(0, 0, waterCtx.canvas.width, waterCtx.canvas.height);
  
  // Set canvas dimensions to match the game area
  if (wavesCtx) {
    wavesCtx.canvas.width = waterCtx.canvas.width;
    wavesCtx.canvas.height = waterCtx.canvas.height;
    
    // Reset texture positions when regenerating
    textureX1 = 0;
    textureY1 = 0;
    textureX2 = wavesCtx.canvas.width / 2;
    textureY2 = wavesCtx.canvas.height / 2;
    
    // Start the animation if it's not already running
    if (!animationRunning) {
      animationRunning = true;
      drawWaterTexture();
    }
  }
}

// Track if animation is running
let animationRunning = false;

//waves layer

// Load the water texture image
const waterTexture = new Image();
waterTexture.src = '/assets/tilesets/water-texture.png';

// Calculate the texture size based on canvas size
// We'll use smaller textures that tile nicely
let textureSize = 200; // Much smaller texture size

// Calculate the initial positions for gentle movement
let textureX1 = 0;
let textureY1 = 0;
let textureX2 = textureSize / 2;
let textureY2 = textureSize / 2;

// Track animation frame for subtle pixel timing
let frameCount = 0;

// Function to draw the water texture with gentle movement
function drawWaterTexture() {
  // Clear the canvas - make sure to clear the entire canvas
  wavesCtx.clearRect(0, 0, wavesCtx.canvas.width, wavesCtx.canvas.height);
  
  // Use the configurable speed variable
  const speed = WATER_TEXTURE_SPEED;
  
  // Update positions with very slow movement
  textureX1 = (textureX1 + speed) % textureSize;
  textureY1 = (textureY1 + speed) % textureSize;
  textureX2 = (textureX2 - speed) % textureSize;
  textureY2 = (textureY2 - speed) % textureSize;
  
  // Make sure we don't have negative positions
  if (textureX1 < 0) textureX1 += textureSize;
  if (textureY1 < 0) textureY1 += textureSize;
  if (textureX2 < 0) textureX2 += textureSize;
  if (textureY2 < 0) textureY2 += textureSize;
  
  // Calculate how many tiles we need to cover the canvas
  const tilesX = Math.ceil(wavesCtx.canvas.width / textureSize) + 1;
  const tilesY = Math.ceil(wavesCtx.canvas.height / textureSize) + 1;
  
  // Set opacity using the configurable variable
  wavesCtx.globalAlpha = WATER_TEXTURE_OPACITY;
  
  // Draw the texture tiled across the canvas with offset
  for (let x = -1; x < tilesX; x++) {
    for (let y = -1; y < tilesY; y++) {
      // First layer - very subtle movement
      wavesCtx.drawImage(
        waterTexture,
        x * textureSize + textureX1,
        y * textureSize + textureY1,
        textureSize,
        textureSize
      );
    }
  }
  
  // Reset opacity
  wavesCtx.globalAlpha = 1.0;
  
  // Add subtle pixel texture
  frameCount++;
  if (frameCount % 3 === 0) { // Only add pixels every 3 frames
    addSubtleWaterPixels(wavesCtx);
  }
  
  // Update FPS once per second
  let now = performance.now();
  if (now - fpsUpdateTime >= 1000) {
    fps = fpsFrameCounter;
    fpsFrameCounter = 0;
    fpsUpdateTime = now;
    console.log(`FPS: ${fps}`);
  }


  // Request the next animation frame
  requestAnimationFrame(drawWaterTexture);
}

let fpsUpdateTime = 0;
let lastFrameTime = performance.now();
let fps = 0;
let fpsFrameCounter = 0;

/* 
// Global variables


// Call this inside your main game loop
function updateFPS() {
  let now = performance.now();
  frameCount++;

  if (now - fpsUpdateTime >= 1000) {
    fps = frameCount;
    frameCount = 0;
    fpsUpdateTime = now;
    console.log(`FPS: ${fps}`); // Log FPS once per second
  }

  lastFrameTime = now;
}

 */










// Function to add subtle pixel texture to water
function addSubtleWaterPixels(ctx) {
  // Color similar to the deepest blue but slightly darker
  const deepBlueColor = "#285da8"; // Slightly darker than #3068bb
  
  // Add more pixels to make them more visible
  const pixelCount = 50 + Math.floor(Math.random() * 30); // 50-80 pixels total
  
  ctx.fillStyle = deepBlueColor;
  
  for (let i = 0; i < pixelCount; i++) {
    // Random position within the canvas
    const pixelX = Math.random() * ctx.canvas.width;
    const pixelY = Math.random() * ctx.canvas.height;
    
    // Randomly choose pixel size (1 or 2 pixels)
    const pixelSize = Math.random() < 0.7 ? 1 : 2;
    
    // Draw the pixel
    ctx.fillRect(pixelX, pixelY, pixelSize, pixelSize);
  }
}

