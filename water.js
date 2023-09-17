
//basic color, bottom water layer
function generateWavyWaterCanvas(waterCtx) {
    // Clear the canvas and set it to a solid blue color
    waterCtx.clearRect(0, 0, waterCtx.canvas.width, waterCtx.canvas.height);
    waterCtx.fillStyle = "#4389e9"; // Solid blue color
    waterCtx.fillRect(0, 0, waterCtx.canvas.width, waterCtx.canvas.height);
    // Start the animation
    drawWaterTexture();
  
  }




//waves layer



  
  // Load the water texture image
  const waterTexture = new Image();
  waterTexture.src = '/assets/tilesets/water-texture.png';
 

// Set the canvas size to match your desired dimensions
const canvasWidth = waterCtx.canvas.width;
const canvasHeight = waterCtx.canvas.height;

// Calculate the initial positions for seamless looping
let textureX1 = 0;
let textureX2 = canvasWidth;

// Function to draw the water texture
function drawWaterTexture() {
  // Clear the canvas
  waterCtx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Draw the two instances of the water texture
  waterCtx.drawImage(waterTexture, textureX1, 0, canvasWidth, canvasHeight);
  waterCtx.drawImage(waterTexture, textureX2, 0, canvasWidth, canvasHeight);

  // Update the positions for the next frame
  textureX1 -= 2; // Adjust the speed as needed
  textureX2 -= 2;

  // Check if the first texture has scrolled completely off-screen
  if (textureX1 + canvasWidth <= 0) {
    // Reset its position to start at the end of the second texture
    textureX1 = textureX2 + canvasWidth;
  }

  // Check if the second texture has scrolled completely off-screen
  if (textureX2 + canvasWidth <= 0) {
    // Reset its position to start at the end of the first texture
    textureX2 = textureX1 + canvasWidth;
  }

  // Request the next animation frame
  requestAnimationFrame(drawWaterTexture);
}






