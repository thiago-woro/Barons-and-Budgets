// Define the number of grass images available
const numGrassImages = 32;

let grassCells = []

// Function to get a random grass image file name
function getRandomGrassImage() {
  const randomIndex = Math.floor(Math.random() * numGrassImages) + 1;
  return `/assets/tilesets/grassAndFlowersByStyloo/transparentBackground/grassandflowers${randomIndex}.png`;
}

let grasslands = []

// Function to draw grass tiles inside ground cells
function drawGrass(ctx, grassDensity) {
  console.log(`function drawGrass`, ctx, grassDensity);
  
  // Reset the grassCells array for this new drawing
  grassCells = [];
  
  // Filter cells that are:
  // 1. In emptyCells (walkable)
  // 2. Have a noise value between 0.1 and 0.4 (appropriate terrain for grass)
  grasslands = emptyCells.filter((cell) => {
    const noiseValue = parseFloat(cell.noise);
    // Check that it's a valid land cell with appropriate noise range for grass
    return noiseValue >= 0.15 && noiseValue <= 0.37;
  });

  // Create a set of tree positions for faster lookups
  const treePositionsSet = new Set();
  if (treePositions && treePositions.length > 0) {
    treePositions.forEach(tree => {
      treePositionsSet.add(`${tree.gridX},${tree.gridY}`);
    });
  }

  // Create a set of water positions for faster lookups
  const waterCellsSet = new Set();
  if (waterCells && waterCells.length > 0) {
    waterCells.forEach(cell => {
      waterCellsSet.add(`${cell.x},${cell.y}`);
    });
  }

  // Additional check to make sure we're not drawing on water cells or tree positions
  grasslands = grasslands.filter(cell => {
    // Make sure this cell is not in waterCells and not where a tree is
    return !waterCellsSet.has(`${cell.x},${cell.y}`) && 
           !treePositionsSet.has(`${cell.x},${cell.y}`);
  });

  console.log(`Found ${grasslands.length} potential grass cells after filtering water and trees`);

  for (const cell of grasslands) {
    // Randomly determine whether to draw grass based on grassDensity
    if (Math.random() < grassDensity) {
      const x = cell.x;
      const y = cell.y;
      
      // Double-check this is a valid ground cell before drawing
      if (!groundCells.some(gc => gc.x === x && gc.y === y && parseFloat(gc.noise) > 0)) {
        continue; // Skip this cell if it's not valid ground
      }
      
      const grassImage = new Image();
      grassImage.src = getRandomGrassImage();
      
      // Create a grass cell entry with coordinates and image info
      const grassCell = {
        x: x,
        y: y,
        image: grassImage.src
      };
      
      // Add to grassCells array
      grassCells.push(grassCell);
      
      //console.log("" + grassImage.src);
      grassImage.onload = () => {
        ctx.drawImage(grassImage, x * cellSize, y * cellSize, cellSize, cellSize);
        //console.log(	`draw grass 3`);
      }
    }
  }
  
  console.log(`Added ${grassCells.length} grass patches out of ${grasslands.length} potential cells`);
}
