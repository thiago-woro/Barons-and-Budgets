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

// Function to generate grass cells data without drawing
function generateGrass() {
  console.log("Generating grass cells data");
  
  // Update puddle positions before filtering cells
  updatePuddlePositions();

  // Filter ground cells to exclude puddle locations more efficiently
  const puddleSet = new Set(Array.from(puddlePositions));
  
  // Initialize availableGrassCells from groundCells, excluding puddles
  const availableGrassCells = groundCells.filter(cell => {
    const cellKey = `${cell.x},${cell.y}`;
    return !puddleSet.has(cellKey);
  });
  
  // Create a set of tree positions for faster lookups
  const treePositionsSet = new Set();
  if (treePositions && treePositions.length > 0) {
    treePositions.forEach(tree => {
      treePositionsSet.add(`${tree.gridX},${tree.gridY}`);
    });
  }

  // Clear the existing grass cells array
  grassCells = [];

  // Define density bands based on noise value ranges
  const densityBands = [
    { min: 0.05, max: 0.15, density: 0.3 },  // Low elevation - high density
    { min: 0.2, max: 0.4, density: 0.7 },  // Medium elevation - medium density
    { min: 0.25, max: 0.99, density: 0.1 }   // High elevation - low density
  ];

  // Process all ground cells for potential grass placement
  for (const cell of emptyCells) {
    const noiseValue = parseFloat(cell.noise);
    const x = cell.x;
    const y = cell.y;
    const cellKey = `${x},${y}`;
    
    // Skip if outside noise range or in a puddle or tree position
    if (noiseValue < 0.0 || noiseValue > 0.99 || 
        puddleSet.has(cellKey) || 
        treePositionsSet.has(`${x},${y}`) ||
        potablePuddleCells.some(puddle => puddle.x === x && puddle.y === y)) {
      continue;
    }
    
    // Determine which density band applies to this cell
    let grassDensity = 0;
    for (const band of densityBands) {
      if (noiseValue >= band.min && noiseValue <= band.max) {
        grassDensity = band.density;
        break;
      }
    }
    
    // Randomly determine whether to generate grass based on the appropriate density
    if (Math.random() < grassDensity) {
      // Double-check this is a valid ground cell
      if (!availableGrassCells.some(gc => gc.x === x && gc.y === y && parseFloat(gc.noise) > 0)) {
        continue; // Skip this cell if it's not valid ground
      }
      
      // Create a grass cell entry with coordinates and image info
      const grassCell = {
        x: x,
        y: y,
        image: getRandomGrassImage()
      };
      
      // Add to grassCells array
      grassCells.push(grassCell);
    }
  }
  
  console.log(`Generated ${grassCells.length} grass patches`);
  return grassCells;
}

// Function focused only on drawing grass tiles on canvas
function drawGrass(ctx = grassCtx) {
  console.warn(`Drawing grass on canvas`);
  
  // Generate grass data if not already generated
  if (grassCells.length === 0) {
    generateGrass();
  }
  
  // Draw each grass cell on the canvas
  grassCells.forEach(grassCell => {
    const x = grassCell.x;
    const y = grassCell.y;
    
    const grassImage = new Image();
    grassImage.src = grassCell.image;
    
    grassImage.onload = () => {
      ctx.drawImage(grassImage, x * cellSize, y * cellSize, cellSize, cellSize);
    };
  });
}

// Function to clear and redraw the grass layer
function refreshGrass() {
  // Clear the grass canvas
  grassCtx.clearRect(0, 0, grassCtx.canvas.width, grassCtx.canvas.height);
  
  // Draw existing grass cells without regenerating
  drawGrass(grassCtx);
}
