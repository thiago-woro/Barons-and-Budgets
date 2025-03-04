document.getElementById("gen2").addEventListener("click", function () {
  trees = [];
  treePositions = [];
  //startTrees(treeCtx, cellSize)
  generateTerrainMap();
});

//main terrain map generator function
function generateTerrainMap() {
  // Clear all arrays before generating new terrain
  terrainMap = [];
  groundCells = [];
  waterCells = [];
  noiseValues = [];
  availableHouseCells = [];
  flatLandCells = [];
  pathCells = [];
  trees = [];
  treePositions = [];
  houses = [];
  npcs = [];
  emptyCells = [];
  
  // Clear all canvases
  clearCanvas(groundCtx);
  clearCanvas(waterCtx);
  clearCanvas(pathCtx);
  clearCanvas(treeCtx);
  clearCanvas(npcCtx);
  clearCanvas(oreDepositsCtx);
  
  const perlinInstance = Object.create(perlin);
  noiseValues = new Array(gridSize);
  perlin.seed();

  const center = { x: rows / 2, y: rows / 2 };

  for (let y = 0; y < rows; y++) {
    terrainMap[y] = new Array(rows);

    for (let x = 0; x < rows; x++) {
      const noiseValue =
        perlinInstance.get(x * perlinNoiseScale, y * perlinNoiseScale) -
        0.5 +
        offset;

      // Calculate the distance from the center
      const distanceToCenter = Math.sqrt(
        Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2)
      );

      // Define a multiplier based on distance (higher distance, stronger smoothing)
      const distanceMultiplier = distanceToCenter / (rows / 2);

      // Apply smoothing to both land and water cells
      const smoothedNoiseValue = noiseValue - distanceMultiplier * 0.8; // Adjust the 0.8 as needed

      // Assign terrain type based on smoothed noise value
      if (smoothedNoiseValue > 0) {
        terrainMap[y][x] =
          LAND_SHADES[Math.floor(smoothedNoiseValue * LAND_SHADES.length)];
        groundCells.push({
          x,
          y,
          color: terrainMap[y][x],
          noise: smoothedNoiseValue.toFixed(5),
        });
      } else {
        terrainMap[y][x] =
          WATER_SHADES[Math.floor(-smoothedNoiseValue * WATER_SHADES.length)];
        waterCells.push({ x, y, color: terrainMap[y][x] });
      }
    }
  }
  console.log(
    `🟩 Ground cells: ${groundCells.length}, 🌊 water cells: ${waterCells.length}`
  );
  afterMapGen();
}

function drawTerrainLayer(ctx, cellArray, cellSize) {
  // Clear the canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  for (const cell of cellArray) {
    const x = cell.x;
    const y = cell.y;
    const color = cell.color;
    const noiseValue = parseFloat(cell.noise || 0);
    
    // For beach/sand cells (noise < 0.05), use a more rounded border
    if (cell.noise && noiseValue < 0.05) {
      // Use a larger border radius for beach/sand cells to make them more rounded
      drawRoundedRect(
        ctx,
        x * cellSize,
        y * cellSize,
        cellSize * 1.2,
        6, // Increased border radius for beach/sand cells
        color
      );
    } else {
      // Use the standard border radius for other cells
      drawRoundedRect(
        ctx,
        x * cellSize,
        y * cellSize,
        cellSize * 1.2,
        3.5,
        color
      );
    }
  }
}

function afterMapGen() {
  generateWavyWaterCanvas(waterCtx, rows);

  // Calculate the total number of cells
  const totalCells = groundCells.length + waterCells.length;
  maxLandPopulation = groundCells.length * usableLand;
  console.log(`Total cells generated: `, totalCells);
  console.log(`Max pop.: `, maxLandPopulation.toFixed(0));

  drawTerrainLayer(groundCtx, groundCells, cellSize);
  //drawTerrainLayer(waterCtx, waterCells, cellSize);
  distributeOreDeposits(oreDepositsCtx);
  
  // Draw sand texture after drawing the terrain layer
  drawSandTexture(groundCtx);
  
  // Draw mountain texture for high elevation cells
  drawMountainTexture(groundCtx);

  availableHouseCells = groundCells.filter((cell) => {
    const noiseValue = parseFloat(cell.noise);
    return noiseValue >= 0.17;
  });

  console.log(`Available House Cells: `, availableHouseCells.length);

  flatLandCells = groundCells.filter((cell) => {
    const noiseValue = parseFloat(cell.noise);
    return noiseValue >= 0.14 && noiseValue <= 0.445;
  });

  console.log(
    `From ${groundCells.length} ground cells, down to ${flatLandCells.length} usable, flat lands cells`
  );

  drawHousePaths(flatLandCells, 7, 2);
  //debugTerrain(npcCtx, gridSize, cellSize);
}

function drawHousePaths(cellArray, numRowsToSkip, pathCurveAmount) {
  // Base path color - now we'll adjust opacity dynamically
  const basePathColor = "197, 190, 172"; // RGB values without the alpha

  for (const cell of cellArray) {
    const x = cell.x;
    const y = cell.y;
    const noiseValue = parseFloat(cell.noise || 0);

    // Determine if this cell should be part of the path
    const isPathCell = y % numRowsToSkip === 0;

    if (isPathCell) {
      // Apply a sine wave pattern to the y position of path cells
      const yOffset =
        Math.sin((x / cellSize) * pathCurveAmount) * cellSize * 0.1; // Adjust the 0.1 factor as needed for the curve intensity

      // Create a new cell object with the adjusted y position
      const cellWithOffset = {
        x: x,
        y: y + yOffset,
        noise: cell.noise // Copy the noise value to use for houses later
      };

      // Calculate opacity based on noise value
      // Higher noise value = lower opacity (thinner path)
      // Start with 0.4 opacity at noise=0, decrease to 0.05 at noise=0.4+
      let opacity = 0.4 - (noiseValue * 0.9);
      
      // Ensure opacity doesn't go below 0.05 or above 0.4
      opacity = Math.max(0.05, Math.min(0.4, opacity));
      
      // Set the fill style with dynamic opacity
      pathCtx.fillStyle = `rgba(${basePathColor}, ${opacity})`;

      // Draw the path cell at the adjusted y position
      pathCtx.fillRect(
        x * cellSize,
        (y + yOffset) * cellSize,
        cellSize,
        cellSize * 0.4
      );

      // Push the cell with the offset into the pathCells array
      pathCells.push(cellWithOffset);
    }
  }

  //drawCellsInArray(pathCells, 'rgba(128, 59, 190, 0.52)', pathCtx);
}

//DO NOT DELETE, just use this fn to check cellarrays for debugginh
function drawCellsInArray(cellArray, color, context) {
  context.fillStyle = color;

  for (const cell of cellArray) {
    const x = cell.x;
    const y = cell.y;

    context.fillRect(x * cellSize, y * cellSize, cellSize, cellSize*0.4);
  }
}

function calculateAdjacentCells(x, y) {
  const adjacentCells = [];

  for (let xOffset = -1; xOffset <= 1; xOffset++) {
    for (let yOffset = -1; yOffset <= 1; yOffset++) {
      const adjacentX = x + xOffset;
      const adjacentY = y + yOffset;

      // Skip the center cell and check if the cell is valid (within bounds)
      if (isValidCell(adjacentX, adjacentY)) {
        adjacentCells.push({ x: adjacentX, y: adjacentY });
      }
    }
  }

  return adjacentCells;
}

function drawOreDeposit(ctx, x, y) {
  const offsetX = cellSize / 2;
  const offsetY = cellSize / 2;
  const xCoord = x * cellSize + offsetX;
  const yCoord = y * cellSize + offsetY;

  const oreEmojis = ["⛏", "🌘", "💎"];

  const randomEmojiIndex = Math.floor(Math.random() * oreEmojis.length);
  const selectedEmoji = oreEmojis[randomEmojiIndex];

  // Store ore deposit information
  oreDeposits.push({ x: xCoord, y: yCoord });

  // Draw ore deposit
  ctx.fillStyle = "rgba(0, 0, 0, 1)";
  ctx.textAlign = "center";
  ctx.font = "bold 12px Arial";
  ctx.fillText(selectedEmoji, xCoord, yCoord);
}

function showCellnumber(ctx, gridSize, cellSize) {
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const cellsInRow = Math.floor(ctx.canvas.width / cellSize);

  for (let row = 0; row < gridSize / cellSize; row++) {
    for (let col = 0; col < gridSize / cellSize; col++) {
      const cellIndex = row * cellsInRow + col;
      const x = col * cellSize + cellSize / 2;
      const y = row * cellSize + cellSize / 2;

      // Draw a low-opacity red rectangle behind the number
      ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);

      // Draw the number on top of the rectangle
      ctx.fillStyle = "black";
      ctx.fillText(cellIndex, x, y);
    }
  }
}

function isValidCell(x, y) {
  // Check if the cell (x, y) is in the groundCells array
  return groundCells.some((cell) => cell.x === x && cell.y === y);
}

/// FOR DEBUGGING ONLY - DO NOT DELETE
function debugTerrain(ctx, gridSize, cellSize) {
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.font = "18px Arial";

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cellIndex = row * gridSize + col;
      const x = col * cellSize + cellSize / 2;
      const y = row * cellSize + cellSize / 2;

      // Draw a low-opacity red rectangle behind the number
      ctx.fillStyle = "rgba(255, 0, 0, 0.0)";
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);

      // Draw the number on top of the rectangle
      ctx.fillStyle = "black";

      ctx.fillText(cellIndex, x, y);
    }
  }

  console.log("Finished drawing terrain with indices");
}

function drawRoundedRect(ctx, x, y, height, borderRadius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + borderRadius, y);
  ctx.lineTo(x + height - borderRadius, y);
  ctx.arc(
    x + height - borderRadius,
    y + borderRadius,
    borderRadius,
    -Math.PI / 2,
    0
  );
  ctx.lineTo(x + height, y + height - borderRadius);
  ctx.arc(
    x + height - borderRadius,
    y + height - borderRadius,
    borderRadius,
    0,
    Math.PI / 2
  );
  ctx.lineTo(x + borderRadius, y + height);
  ctx.arc(
    x + borderRadius,
    y + height - borderRadius,
    borderRadius,
    Math.PI / 2,
    Math.PI
  );
  ctx.lineTo(x, y + borderRadius);
  ctx.arc(
    x + borderRadius,
    y + borderRadius,
    borderRadius,
    Math.PI,
    -Math.PI / 2
  );
  ctx.closePath();
  ctx.fill();
}

clearGround.addEventListener("click", function () {
  //DO NO DELETE
  clearCanvas(groundCtx); // Clears the ground canvas
  clearCanvas(waterCtx); // Clears the water canvas
  clearCanvas(treeCtx); // Clears the tree canvas
});

function clearCanvas(ctx) {
  // DO NOT DELETE - super useful to clear any canvas before regen/redraw
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}

// Function to clear npcs array and npcCanvas
function clearNPC() {
  // Clear the npcs array
  npcs = [];

  // Clear the npcCanvas
  npcCtx.clearRect(0, 0, npcCanvas.width, npcCanvas.height);
  groundCtx.clearRect(0, 0, npcCanvas.width, npcCanvas.height);
  waterCtx.clearRect(0, 0, npcCanvas.width, npcCanvas.height);
}

// Function to draw sand texture on beach/sand tiles
function drawSandTexture(ctx) {
  // Get all sand cells (cells with noise below 0.06)
  const sandCells = groundCells.filter(cell => {
    return cell.noise && parseFloat(cell.noise) < 0.067;
  });
  
  // Base sand color from LAND_SHADES (typically the first element)
  const baseSandColor = "#dbd997"; // Light sand color
  
  // Create slightly darker and lighter variations for texture
  const darkerSandColor = "#c5c386"; // Slightly darker
  const lighterSandColor = "#e8e6b0"; // Slightly lighter
  
  // For each sand cell, add random texture pixels
  for (const cell of sandCells) {
    const x = cell.x * cellSize;
    const y = cell.y * cellSize;
    
    // Add between 10-20 texture pixels per cell
    const pixelCount = 0 + Math.floor(Math.random() * 10);
    
    for (let i = 0; i < pixelCount; i++) {
      // Random position within the cell
      const pixelX = x + Math.random() * cellSize;
      const pixelY = y + Math.random() * cellSize;
      
      // Randomly choose between darker and lighter colors
      const pixelColor = Math.random() > 0.5 ? darkerSandColor : lighterSandColor;
      
      // Draw a single pixel
      ctx.fillStyle = pixelColor;
      ctx.fillRect(pixelX, pixelY, 1, 1);
    }
  }
}

// Function to draw mountain texture on high elevation cells
function drawMountainTexture(ctx) {
  // Get all mountain/high elevation cells (cells with noise above 0.4)
  const mountainCells = groundCells.filter(cell => {
    return cell.noise && parseFloat(cell.noise) > 0.24;
  });
  
  // Colors for mountain texture - changed to shades of green
  const darkGreen = "#1a4d1a";  // Dark forest green
  const mediumGreen = "#2e7d32"; // Medium forest green
  const lightGreen = "#4caf50";  // Light forest green
  const lightGrey = "#aaaaaa";   // Light grey for occasional rocks
  
  // For each mountain cell, add very sparse random texture pixels
  for (const cell of mountainCells) {
    const x = cell.x * cellSize;
    const y = cell.y * cellSize;
    
    // Make it 10x more sparse - now only 0-1 pixels per several cells on average
    // This means the vast majority of cells will have no pixels at all
    if (Math.random() < 0.2) { // 20% chance to have any pixels at all
      // Add at most 1 texture pixel per cell (much more sparse than before)
      const pixelCount = Math.random() < 0.9 ? 1 : 2;
      
      for (let i = 0; i < pixelCount; i++) {
        // Random position within the cell
        const pixelX = x + Math.random() * cellSize;
        const pixelY = y + Math.random() * cellSize;
        
        // Randomly choose between colors with weighted distribution
        // 5% chance of light grey, rest are shades of green
        const random = Math.random();
        let pixelColor;
        
        if (random < 0.05) {
          pixelColor = lightGrey; // 5% chance of light grey
        } else if (random < 0.40) {
          pixelColor = darkGreen; // 35% dark green
        } else if (random < 0.75) {
          pixelColor = mediumGreen; // 35% medium green
        } else {
          pixelColor = lightGreen; // 25% light green
        }
        
        // Draw a pixel with more random variations in size
        const randomValue = Math.random();
        let pixelSize;
        if (randomValue < 0.3) {
          pixelSize = 0.5;  // 30% chance of 0.5px
        } else if (randomValue < 0.6) {
          pixelSize = 0.7;  // 30% chance of 1px
        } else if (randomValue < 0.85) {
          pixelSize = 1;  // 25% chance of 2px
        } else if (randomValue < 0.95) {
          pixelSize = 1.3;  // 10% chance of 3px
        } else {
          pixelSize = 2;  // 5% chance of 4px
        }
        ctx.fillStyle = pixelColor;
        ctx.fillRect(pixelX, pixelY, pixelSize, pixelSize);
      }
    }
  }
}
