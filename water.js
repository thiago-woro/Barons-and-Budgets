
//basic color, bottom water layer
function generateWavyWaterCanvas(waterCtx) {
  // Clear the canvas and set it to a solid blue color
  waterCtx.clearRect(0, 0, waterCtx.canvas.width, waterCtx.canvas.height);
  waterCtx.fillStyle = "#0c2957"; // Solid blue color
  waterCtx.fillRect(0, 0, waterCtx.canvas.width, waterCtx.canvas.height);
  // Start the animation
  //drawWaterTexture();

}




//waves layer




// Load the water texture image
const waterTexture = new Image();
waterTexture.src = '/assets/tilesets/water-texture.png';


// Set the canvas size to match your desired dimensions
const canvasWidth = wavesCtx.canvas.width;
const canvasHeight = wavesCtx.canvas.height;

// Calculate the initial positions for diagonal scrolling
let textureX1 = canvasWidth;
let textureY1 = 0;
let textureX2 = 0;
let textureY2 = canvasHeight;

// Function to draw the water texture diagonally
function drawWaterTexture() {
// Clear the canvas
wavesCtx.clearRect(0, 0, canvasWidth, canvasHeight);

// Draw the two instances of the water texture diagonally
wavesCtx.drawImage(waterTexture, textureX1, textureY1, canvasWidth, canvasHeight);
wavesCtx.drawImage(waterTexture, textureX2, textureY2, canvasWidth, canvasHeight);

let speed = 20

// Update the positions for the next frame to move diagonally
textureX1 -= speed; // Adjust the speed as needed
textureY1 += speed;
textureX2 += speed
textureY2 -= speed

// Check if the first texture has scrolled completely off-screen
if (textureX1 + canvasWidth <= 0 || textureY1 >= canvasHeight) {
  // Reset its position to start at the top right corner
  textureX1 = canvasWidth;
  textureY1 = 0;
}

// Check if the second texture has scrolled completely off-screen
if (textureX2 >= canvasWidth || textureY2 + canvasHeight <= 0) {
  // Reset its position to start at the bottom left corner
  textureX2 = 0;
  textureY2 = canvasHeight;
}

// Request the next animation frame
requestAnimationFrame(drawWaterTexture);
}

