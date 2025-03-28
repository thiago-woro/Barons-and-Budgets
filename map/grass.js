// Define the number of grass images available
const numGrassImages = 32;
let grassCells = [];
let grasslands = [];
let grassImageCache = {}; // Cache for loaded grass images

//TODO copy the same sprite importer function from furniture.html

// Function to get a random grass image file name
function getRandomGrassImage() {
  const randomIndex = Math.floor(Math.random() * numGrassImages) + 1;
  return `/assets/tilesets/grassAndFlowersByStyloo/transparentBackground/grassandflowers${randomIndex}.png`;
}

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
  
  return new Promise((resolve) => {
    // Update puddle positions before filtering cells
    updatePuddlePositions();
    const puddleSet = new Set(Array.from(puddlePositions));
    
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
      { min: 0.2, max: 0.4, density: 0.7 },    // Medium elevation - medium density
      { min: 0.25, max: 0.99, density: 0.1 }   // High elevation - low density
    ];

    // Process cells in batches to avoid blocking the main thread
    const BATCH_SIZE = 500;
    let processedCount = 0;
    
    function processBatch(startIdx) {
      const endIdx = Math.min(startIdx + BATCH_SIZE, emptyCells.length);
      
      for (let i = startIdx; i < endIdx; i++) {
        const cell = emptyCells[i];
        const noiseValue = parseFloat(cell.noise);
        const x = cell.x;
        const y = cell.y;
        
        // Skip cells in puddles or where trees exist - combined check for performance
        if (puddleSet.has(`${x},${y}`) || treePositionsSet.has(`${x},${y}`)) {
          continue;
        }
        
        // Find applicable density band - performance optimization
        let grassDensity = 0;
        for (const band of densityBands) {
          if (noiseValue >= band.min && noiseValue <= band.max) {
            grassDensity = band.density;
            break;
          }
        }
        
        // Skip if no density band applies or random check fails
        if (grassDensity === 0 || Math.random() >= grassDensity) {
          continue;
        }
        
        // Add grass cell - store image path instead of loading it immediately
        const imagePath = getRandomGrassImage();
        grassCells.push({
          x: x,
          y: y,
          image: imagePath
        });
      }
      
      processedCount += (endIdx - startIdx);
      
      // Continue processing in batches
      if (processedCount < emptyCells.length) {
        setTimeout(() => processBatch(endIdx), 0);
      } else {
        console.log(`Generated ${grassCells.length} grass patches`);
        resolve(grassCells); // Resolve the promise when done
      }
    }
    
    // Start processing
    processBatch(0);
  });
}

// Function focused only on drawing grass tiles on canvas
function drawGrass(ctx = grassCtx) {
  return new Promise((resolve) => {
    if (!ctx) {
      resolve();
      return;
    }
    console.warn(`Drawing grass on canvas`);
    
    // Generate grass data if not already generated
    if (grassCells.length === 0) {
      generateGrass().then(() => {
        drawGrass(ctx).then(resolve);
      });
      return;
    }
    
    // Clear the canvas once before drawing
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // Use off-screen canvas for better performance
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = ctx.canvas.width;
    offscreenCanvas.height = ctx.canvas.height;
    const offCtx = offscreenCanvas.getContext('2d');
    
    // Track how many images have loaded
    let loadedImages = 0;
    const totalImages = grassCells.length;
    
    // Draw in batches for better performance
    const DRAW_BATCH_SIZE = 50;
    
    function drawBatch(startIdx) {
      const endIdx = Math.min(startIdx + DRAW_BATCH_SIZE, grassCells.length);
      
      for (let i = startIdx; i < endIdx; i++) {
        const grassCell = grassCells[i];
        const x = grassCell.x;
        const y = grassCell.y;
        const imageSrc = grassCell.image;
        
        // Use cached image if available
        if (grassImageCache[imageSrc]) {
          offCtx.drawImage(grassImageCache[imageSrc], x * cellSize, y * cellSize, cellSize, cellSize);
          loadedImages++;
          continue;
        }
        
        // Load image if not in cache
        const grassImage = new Image();
        grassImage.src = imageSrc;
        
        grassImage.onload = () => {
          // Cache the image for future use
          grassImageCache[imageSrc] = grassImage;
          offCtx.drawImage(grassImage, x * cellSize, y * cellSize, cellSize, cellSize);
          
          loadedImages++;
          
          // Copy to main canvas only when all images are loaded or at certain thresholds
          if (loadedImages === totalImages || loadedImages % 100 === 0) {
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.drawImage(offscreenCanvas, 0, 0);
          }
        };
      }
      
      // Process next batch if more grass cells remain
      if (endIdx < grassCells.length) {
        setTimeout(() => drawBatch(endIdx), 0);
      } else {
        // Final canvas update
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.drawImage(offscreenCanvas, 0, 0);
        resolve(); // Resolve when all batches are drawn
      }
    }
    
    // Start drawing the first batch
    drawBatch(0);
  });
}

// Function to clear and redraw the grass layer
function refreshGrass() {
  // Draw existing grass cells without regenerating
  drawGrass(grassCtx);
}
