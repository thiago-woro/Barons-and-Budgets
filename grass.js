// Define the number of grass images available
const numGrassImages = 32;

// Function to get a random grass image file name
function getRandomGrassImage() {
  const randomIndex = Math.floor(Math.random() * numGrassImages) + 1;
  return `/assets/tilesets/grassAndFlowersByStyloo/transparentBackground/grassandflowers${randomIndex}.png`;
}

let grasslands = []

// Function to draw grass tiles inside ground cells
function drawGrass(ctx, grassDensity) {
  //console.log(`draw grass 2`);
  

  grasslands = emptyCells.filter((cell) => {
    const noiseValue = parseFloat(cell.noise);
    return noiseValue >= 0.2;
  });

  for (const cell of grasslands) {
    // Randomly determine whether to draw grass based on grassDensity
    if (Math.random() < grassDensity) {
      const x = cell.x;
      const y = cell.y;
      const grassImage = new Image();
      grassImage.src = getRandomGrassImage();
      //console.log("" + grassImage.src);
      grassImage.onload = () => {
      ctx.drawImage(grassImage, x * cellSize, y * cellSize, cellSize, cellSize);
      //console.log(	`draw grass 3`);
      }
    }
  }
}
