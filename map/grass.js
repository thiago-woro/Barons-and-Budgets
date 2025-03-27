// Define the number of grass images available
const numGrassImages = 32;

let grassCells = []


//TODO copy the same sprite importer function from furniture.html


// Function to get a random grass image file name
function getRandomGrassImage() {
  const randomIndex = Math.floor(Math.random() * numGrassImages) + 1;
  return `/assets/tilesets/grassAndFlowersByStyloo/transparentBackground/grassandflowers${randomIndex}.png`;
}

let grasslands = []

// Move updatePuddlePositions to be more explicit
function updatePuddlePositions() {
  puddlePositions = new Set(
    potablePuddleCells
      .filter(puddle => puddle.opacity > 0)
      .map(puddle => `${puddle.x},${puddle.y}`)
  );
}

// Function to draw grass tiles inside ground cells
function drawGrass(ctx, grassDensity) {
  console.log(`function drawGrass`, ctx, grassDensity);
  
  // Reset the grassCells array
  grassCells = [];
  
  // Update puddle positions before filtering cells
  updatePuddlePositions();

  // Filter ground cells to exclude puddle locations more efficiently
  const puddleSet = new Set(Array.from(puddlePositions));
  
  // Initialize availableGrassCells from groundCells, excluding puddles
  const availableGrassCells = groundCells.filter(cell => {
    const cellKey = `${cell.x},${cell.y}`;
    return !puddleSet.has(cellKey);
  });
  
  // Filter cells that are suitable for grass
  grasslands = emptyCells.filter((cell) => {
    const noiseValue = parseFloat(cell.noise);
    const cellKey = `${cell.x},${cell.y}`;
    
    // Check terrain suitability and ensure no puddle exists here
    return noiseValue >= 0.15 && 
           noiseValue <= 0.37 && 
           !puddleSet.has(cellKey);
  });

  // Create a set of tree positions for faster lookups
  const treePositionsSet = new Set();
  if (treePositions && treePositions.length > 0) {
    treePositions.forEach(tree => {
      treePositionsSet.add(`${tree.gridX},${tree.gridY}`);
    });
  }

  // Additional check to make sure we're not drawing on water cells or tree positions
  grasslands = grasslands.filter(cell => {
    // Make sure this cell is not in potablePuddleCells and not where a tree is
    return !treePositionsSet.has(`${cell.x},${cell.y}`) && 
           !potablePuddleCells.some(puddle => puddle.x === cell.x && puddle.y === cell.y);
  });

  console.log(`Found ${grasslands.length} potential grass cells after filtering water and trees`);

  for (const cell of grasslands) {
    // Randomly determine whether to draw grass based on grassDensity
    if (Math.random() < grassDensity) {
      const x = cell.x;
      const y = cell.y;
      
      // Double-check this is a valid ground cell before drawing
      if (!availableGrassCells.some(gc => gc.x === x && gc.y === y && parseFloat(gc.noise) > 0)) {
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
