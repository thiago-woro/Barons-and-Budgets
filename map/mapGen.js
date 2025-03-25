document.getElementById("gen2").addEventListener("click", function () {
  startMapGeneration();
});

// Central function to start map generation with loading screen
function startMapGeneration(width, height, noiseScale) {
  trees = [];
  treePositions = [];
  
  showLoadingScreen().then(() => {
    generateTerrainMap(width, height, noiseScale);
  });
}

// Function to show loading screen
function showLoadingScreen() {
  return new Promise((resolve) => {
    // Create loading screen container
    const loadingContainer = document.createElement('div');
    loadingContainer.id = 'mapLoadingScreen';
    loadingContainer.style.position = 'fixed';
    loadingContainer.style.top = '0';
    loadingContainer.style.left = '0';
    loadingContainer.style.width = '100vw';
    loadingContainer.style.height = '100vh';
    loadingContainer.style.backgroundColor = '#0d0d0d';
    loadingContainer.style.zIndex = '9999';
    loadingContainer.style.display = 'flex';
    loadingContainer.style.alignItems = 'center';
    loadingContainer.style.justifyContent = 'center';

    // Fetch the loading.html content
    fetch('UI/loading.html')
      .then(response => response.text())
      .then(html => {
        // Extract the content between <body> tags
        const bodyContent = html.match(/<body>([\s\S]*?)<\/body>/i);
        if (bodyContent && bodyContent[1]) {
          loadingContainer.innerHTML = bodyContent[1];
        } else {
          // Fallback if we can't extract body content
          loadingContainer.innerHTML = '<div class="loader"></div><div style="position: absolute; top: 120px; width: 100%; text-align: center; color: #888; font-family: monospace; font-size: 1rem; letter-spacing: 2px; opacity: 0.6;">Generating World...</div>';
        }
        
        // Also add the styles from loading.html
        const styleContent = html.match(/<style>([\s\S]*?)<\/style>/i);
        if (styleContent && styleContent[1]) {
          const styleElement = document.createElement('style');
          styleElement.textContent = styleContent[1];
          document.head.appendChild(styleElement);
        }
        
        document.body.appendChild(loadingContainer);
        
        // Small delay to ensure the loading screen is visible before starting the heavy work
        setTimeout(resolve, 100);
      })
      .catch(error => {
        console.error('Error loading the loading screen:', error);
        // Create a simple fallback loading screen
        loadingContainer.innerHTML = '<div style="color: white; font-size: 24px;">Generating World...</div>';
        document.body.appendChild(loadingContainer);
        
        setTimeout(resolve, 100);
      });
  });
}

// Function to remove loading screen
function removeLoadingScreen() {
  const loadingScreen = document.getElementById('mapLoadingScreen');
  if (loadingScreen) {
    // Add fade-out effect
    loadingScreen.style.transition = 'opacity 0.9s ease-out';
    loadingScreen.style.opacity = '0';
    
    // Remove after transition
    setTimeout(() => {
      loadingScreen.remove();
    }, 500);
  }
}

//main terrain map generator function
function generateTerrainMap(width, height, customNoiseScale) {
  // Use parameters if provided, otherwise use default values
  const useWidth = width || gridSize;
  const useHeight = height || gridSize;
  const useNoiseScale = customNoiseScale || perlinNoiseScale;
  
  // Clear all arrays before generating new terrain
  terrainMap = [];
  groundCells = [];
  waterCells = [];
  noiseValues = [];
  flatLandCells = [];
  pathCells = [];
  trees = [];
  treePositions = [];
  houses = [];
  npcs = [];
  emptyCells = [];
  sandCells = []; // Add this line
  
  // Clear all canvases
  clearCanvas(groundCtx);
  clearCanvas(waterCtx);
  clearCanvas(pathCtx);
  clearCanvas(treeCtx);
  clearCanvas(npcCtx);
  clearCanvas(oreDepositsCtx);
  
  const perlinInstance = Object.create(perlin);
  noiseValues = new Array(useWidth);
  perlin.seed();

  const center = { x: rows / 2, y: rows / 2 };

  for (let y = 0; y < rows; y++) {
    terrainMap[y] = new Array(rows);

    for (let x = 0; x < rows; x++) {
      const noiseValue =
        perlinInstance.get(x * useNoiseScale, y * useNoiseScale) -
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
        // Modified color selection to reduce sand tiles (first color in LAND_SHADES)
        // Apply a bias to skip the first color (sand) more often
        let colorIndex;
        
        if (smoothedNoiseValue < 0.05) {
          // For very low noise values (near shore), still use sand color
          colorIndex = 0; // Sand color (first in LAND_SHADES)
        } else {
          // For higher noise values, use green colors (skip the first sand color)
          // Map the noise range 0.08-1.0 to the green colors (indices 1 to end of LAND_SHADES)
          const adjustedNoise = (smoothedNoiseValue - 0.08) / (1.0 - 0.08);
          colorIndex = 1 + Math.floor(adjustedNoise * (LAND_SHADES.length - 1));
          colorIndex = Math.min(colorIndex, LAND_SHADES.length - 1); // Ensure we don't exceed array bounds
        }
        
        terrainMap[y][x] = LAND_SHADES[colorIndex];
        groundCells.push({
          x,
          y,
          color: terrainMap[y][x],
          noise: smoothedNoiseValue.toFixed(5),
        });
        
        // After adding to groundCells, check if it's a sand cell
        if (smoothedNoiseValue < 0.09) {
          sandCells.push({
            x,
            y,
            color: terrainMap[y][x],
            noise: smoothedNoiseValue.toFixed(5),
          });
        }
      } else {
        // For water cells, use a non-linear mapping to create more variation in shallow water
        // and less variation in deep water
        const waterDepth = -smoothedNoiseValue; // Convert to positive value (0 = shore, higher = deeper)
        
        // Use a non-linear function to create more color variation in shallow water
        // Adjusted to create a more subtle gradient
        const colorIndex = Math.min(
          WATER_SHADES.length - 1,
          Math.floor(Math.pow(waterDepth * 8, 0.8) * (WATER_SHADES.length / Math.pow(4, 0.8)))
        );
        
        terrainMap[y][x] = WATER_SHADES[colorIndex];
        waterCells.push({ 
          x, 
          y, 
          color: terrainMap[y][x],
          noise: smoothedNoiseValue.toFixed(5) // Store the noise value for water cells too
        });
      }
    }
  }
  console.log(
    `🟩 Ground cells: ${groundCells.length}, 🌊 water cells: ${waterCells.length}`
  );
  console.log(`Empty Cells: `, emptyCells.length);
  emptyCells = groundCells;
  console.log(`Empty Cells: `, emptyCells.length);
  afterMapGen();
}

function drawTerrainLayer(ctx, cellArray, cellSize) {
  // Clear the canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  for (const cell of cellArray) {
    const x = cell.x;
    const y = cell.y;
    let color = cell.color;
    const noiseValue = parseFloat(cell.noise || 0);
    
    // Special handling for water cells (negative noise values)
    if (cell.noise && noiseValue < 0) {
      // Get the base color from the cell
      const baseColor = color;
      
      // Calculate how shallow the water is (0 = deepest, 1 = shallowest)
      // We know water noise values are negative, so we'll map from -0.5 to 0
      const shallowness = Math.min(1, Math.max(0, (noiseValue + 0.5) / 0.5));
      
      // More variation for shallow water (shallowness closer to 1)
      // Less variation for deep water (shallowness closer to 0)
      if (shallowness > 0.5) {
        // Very shallow water - add more color variation
        // Randomly adjust the color slightly for more variation
        const r = parseInt(baseColor.slice(1, 3), 16);
        const g = parseInt(baseColor.slice(3, 5), 16);
        const b = parseInt(baseColor.slice(5, 7), 16);
        
        // More variation for shallow water, scaled by shallowness
        // Reduced variation by lowering the multiplier from 20 to 12
        const variation = 12 * Math.pow(shallowness, 1.5);
        const rNew = Math.min(255, Math.max(0, r + (Math.random() * variation * 2 - variation)));
        const gNew = Math.min(255, Math.max(0, g + (Math.random() * variation * 2 - variation)));
        const bNew = Math.min(255, Math.max(0, b + (Math.random() * variation * 2 - variation)));
        
        color = `#${Math.floor(rNew).toString(16).padStart(2, '0')}${Math.floor(gNew).toString(16).padStart(2, '0')}${Math.floor(bNew).toString(16).padStart(2, '0')}`;
      }
      
      // Draw the water cell with a border radius based on depth
      // Shallower water gets more rounded corners
      const borderRadius = 3.5 + (shallowness * 3.5);
      
      drawRoundedRect(
        ctx,
        x * cellSize,
        y * cellSize,
        cellSize * 1.2,
        borderRadius,
        color
      );
      
      // Add subtle texture to shallow water
      if (shallowness > 0.7) { // Increased threshold from 0.6 to 0.7 to reduce ripples
        // Add small ripple dots for shallow water
        // Reduced ripple count by lowering the multiplier from 5 to 3
        const rippleCount = Math.floor(shallowness * 3); 
        
        for (let i = 0; i < rippleCount; i++) {
          // Random position within the cell
          const rippleX = x * cellSize + Math.random() * cellSize;
          const rippleY = y * cellSize + Math.random() * cellSize;
          
          // Slightly lighter color for ripples
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          
          // Make ripples slightly lighter - reduced brightness from +15 to +8
          const rippleColor = `#${Math.min(255, r + 8).toString(16).padStart(2, '0')}${Math.min(255, g + 8).toString(16).padStart(2, '0')}${Math.min(255, b + 8).toString(16).padStart(2, '0')}`;
          
          // Draw small ripple - reduced size from 1.5 to 1.2
          ctx.fillStyle = rippleColor;
          ctx.beginPath();
          ctx.arc(rippleX, rippleY, 0.8 + Math.random() * 1.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    } 
    // For beach/sand cells (noise < 0.035), use a more rounded border
    else if (cell.noise && noiseValue < 0.035) {
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

function afterMapGen() { //after basic terrain generation, adds enviromental details to map.
  generateWavyWaterCanvas(waterCtx, rows);

  // Calculate the total number of cells
  const totalCells = groundCells.length + waterCells.length;
  maxLandPopulation = groundCells.length * usableLand;
  console.log(`Total cells generated: `, totalCells);
  console.log(`Max pop.: `, maxLandPopulation.toFixed(0));

  drawTerrainLayer(groundCtx, groundCells, cellSize);
  drawTerrainLayer(waterCtx, waterCells, cellSize); //water map
  
  // Place ore deposits first
  distributeOreDeposits(oreDepositsCtx);
  
  // Place lakes BEFORE trees to prevent trees from being placed on water
  console.log("Placing lakes before trees...");
  placeLakes();
  
  // Generate trees AFTER lakes are placed to prevent trees on water
  console.log("Starting trees after lakes...");
  startTrees(treeCtx, cellSize);
  
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

  // Initialize animal populations after everything else is set up
  starterAnimalPopulations(50);  //animpop
    animalCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);
            animals.forEach(animal => animal.draw(animalCtx));
  
  // Draw grass patches at the end
  drawGrass(treeCtx, 0.45);


  // startNPCs(npcCtx, cellSize);
 // initializeFishingResources();

      gameLoopInterval = requestAnimationFrame(renderLoop);
    simulationInterval = setInterval(updateSimulation, simulationBaseInterval / (gameLoopSpeed / 90));
    startButton.textContent = "Pause Game";
   // isPaused = false;
  
  // Remove loading screen after everything is complete
  removeLoadingScreen();
  camera.reset();
}

function drawHousePaths(cellArray, numRowsToSkip, pathCurveAmount) {   //wavy house paths
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


initializeDebugPanel();
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
  // Get all sand cells (cells with noise below 0.04)
   sandCells = emptyCells.filter(cell => {
    return cell.noise && parseFloat(cell.noise) < 0.09;
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
  
  console.log(`Mountain Cells: ${mountainCells.length}`);
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
        if (randomValue < 0.5) {
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

function placeLakes() {
    // Filter empty cells to find suitable lake locations (noise > 0.035)
    const potentialLakeCells = emptyCells.filter(cell => cell.noise && parseFloat(cell.noise) > 0.4);

    if (potentialLakeCells.length === 0) {
        console.log("No suitable locations found for lakes.");
        return;
    }

    // Lake colors - from shallow to deep
    const LAKE_COLORS = [
        "#377993",  // Muddy shore color (greenish brown)
        "#5388a0",  // Shallow water (teal blue)
        "#4d7ea8",  // Medium depth (medium blue)
        //"#2d5a8a"   // Deep water (deep blue)
    ];

    // Select a random cell from the filtered list as the lake center
    const randomLakeCell = potentialLakeCells[Math.floor(Math.random() * potentialLakeCells.length)];
    const centerX = randomLakeCell.x;
    const centerY = randomLakeCell.y;
    
    // Determine lake size (random between small and medium)
    const lakeSize = 3 + Math.floor(Math.random() * 3); // Base radius of 3-5 cells
    
    // Determine oval shape by varying x and y radii
    // Randomly decide if wider or taller
    const isWider = Math.random() > 0.5;
    const xRadius = isWider ? lakeSize * 1.5 : lakeSize;
    const yRadius = isWider ? lakeSize : lakeSize * 1.5;
    
    // Get cells within the oval shape
    const lakeCells = [];
    
    // Scan a square area that would contain our oval
    const scanRadius = Math.ceil(Math.max(xRadius, yRadius));
    for (let y = centerY - scanRadius; y <= centerY + scanRadius; y++) {
        for (let x = centerX - scanRadius; x <= centerX + scanRadius; x++) {
            // Check if the cell is within the oval formula: (x-h)²/a² + (y-k)²/b² <= 1
            // Where (h,k) is the center, a is x-radius, b is y-radius
            const normalizedX = (x - centerX) / xRadius;
            const normalizedY = (y - centerY) / yRadius;
            const distanceFromCenter = Math.sqrt(normalizedX * normalizedX + normalizedY * normalizedY);
            const isInOval = distanceFromCenter <= 1;
            
            // Add some slight randomness to the edge to make it less perfect
            const edgeRandomness = Math.random() * 0.2 - 0.1; // -0.1 to 0.1
            const isInOvalWithNoise = distanceFromCenter <= (1 + edgeRandomness);
            
            if (isInOvalWithNoise) {
                // Check if this cell exists in groundCells
                const groundCell = groundCells.find(gc => gc.x === x && gc.y === y);
                if (groundCell) {
                    // Add to lake cells with distance info for gradient coloring
                    lakeCells.push({ 
                        x, 
                        y, 
                        distanceFromCenter: distanceFromCenter // Save for depth calculation
                    });
                }
            }
        }
    }

    // Find all lake borders first for depth calculation
    const lakeBorders = new Set();
    
    // Create a Set of lake cell coordinates for faster lookups
    const lakeCellSet = new Set(lakeCells.map(cell => `${cell.x},${cell.y}`));
    
    // Check each lake cell to find borders
    lakeCells.forEach(lakeCell => {
        // Check all 8 adjacent cells around this lake cell
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                // Skip the center cell (the lake cell itself)
                if (dx === 0 && dy === 0) continue;
                
                const neighborX = lakeCell.x + dx;
                const neighborY = lakeCell.y + dy;
                const neighborKey = `${neighborX},${neighborY}`;
                
                // If this neighbor is not part of the lake, then the original cell is a border
                if (!lakeCellSet.has(neighborKey)) {
                    lakeBorders.add(`${lakeCell.x},${lakeCell.y}`);
                    break; // Found a non-lake neighbor, so this is a border cell
                }
            }
            if (lakeBorders.has(`${lakeCell.x},${lakeCell.y}`)) break;
        }
    });

    // Update noise values and colors of the lake cells with depth gradient
    lakeCells.forEach(cell => {
        const groundCell = groundCells.find(gc => gc.x === cell.x && gc.y === cell.y);
        if (groundCell) {
            // Start with default deep value
            let depthLevel = -0.9;
            let colorIndex = 3; // Deep by default
            
            // Check if this is a border cell (shallow)
            if (lakeBorders.has(`${cell.x},${cell.y}`)) {
                depthLevel = -0.2; // Shallow water
                colorIndex = 0; // Muddy shore color
            } 
            // Otherwise calculate depth based on distance from center
            else {
                // Get normalized distance (0 to 1) where 0 is center, 1 is farthest edge
                const normalizedDistance = cell.distanceFromCenter;
                
                // For non-border cells in the inner areas
                if (normalizedDistance <= 0.3) {
                    // Deep middle
                    depthLevel = -0.9;
                    colorIndex = 3;
                } else if (normalizedDistance <= 0.6) {
                    // Medium depth
                    depthLevel = -0.7;
                    colorIndex = 2;
                } else {
                    // Shallow but not border
                    depthLevel = -0.4;
                    colorIndex = 1;
                }
                
                // Add slight randomness to depth
                depthLevel += (Math.random() * 0.1) - 0.05;
            }
            
            // Set new values
            groundCell.noise = depthLevel.toFixed(5);
            groundCell.color = LAKE_COLORS[colorIndex];
        }
    });

    // Update waterCells array
    lakeCells.forEach(cell => {
        const groundCell = groundCells.find(gc => gc.x === cell.x && gc.y === cell.y);
        if (groundCell) {
            waterCells.push({
                x: cell.x,
                y: cell.y,
                color: groundCell.color,
                noise: groundCell.noise
            });
        }
    });

    // 1. Find and store lake border cells (cells adjacent to lake)
     outsideRingLakeBorders = [];
    
    // Check each lake cell's neighbors to find borders
    lakeCells.forEach(lakeCell => {
        // Check all 8 adjacent cells around this lake cell
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                // Skip the center cell (the lake cell itself)
                if (dx === 0 && dy === 0) continue;
                
                const neighborX = lakeCell.x + dx;
                const neighborY = lakeCell.y + dy;
                const neighborKey = `${neighborX},${neighborY}`;
                
                // If this neighbor is not part of the lake
                if (!lakeCellSet.has(neighborKey)) {
                    // Check if it's a valid ground cell
                    const groundCell = groundCells.find(gc => 
                        gc.x === neighborX && 
                        gc.y === neighborY && 
                        parseFloat(gc.noise) > 0
                    );
                    
                    // If it's a valid ground cell and not already in our borders array
                    if (groundCell && !outsideRingLakeBorders.some(b => b.x === neighborX && b.y === neighborY)) {
                        outsideRingLakeBorders.push({
                            x: neighborX,
                            y: neighborY,
                            noise: groundCell.noise
                        });
                    }
                }
            }
        }
    });
    
    console.log(`Found ${outsideRingLakeBorders.length} border cells around the lake`);
    
    // Important: Remove all trees from lake borders BEFORE drawing grass
    // First, get all gridX/gridY positions as a Set for quick lookup
    const borderPositions = new Set();
    outsideRingLakeBorders.forEach(cell => {
        borderPositions.add(`${cell.x},${cell.y}`);
    });
    
    // Remove any trees at these positions - using a comprehensive approach
    if (treePositions && treePositions.length > 0) {
        console.log(`Before removing trees: ${treePositions.length} trees`);
        
        // Keep only trees that are NOT on border cells
        treePositions = treePositions.filter(tree => {
            return !borderPositions.has(`${tree.gridX},${tree.gridY}`);
        });
        
        console.log(`After removing trees: ${treePositions.length} trees`);
        
        // Redraw trees after filtering
        drawTrees(treeCtx, treePositions);
    }
    
    // Remove ore deposits from border cells
    if (adjacentOreCells && adjacentOreCells.length > 0) {
        adjacentOreCells = adjacentOreCells.filter(oreCell => {
            return !borderPositions.has(`${oreCell.x},${oreCell.y}`);
        });
    }
    
    // Add the border cells to modifyWalkableCells to ensure they're not used for future trees
    modifyWalkableCells(outsideRingLakeBorders.map(cell => ({ x: cell.x, y: cell.y })), "remove");
    
    // 4. Add grass to lake borders
    if (outsideRingLakeBorders.length > 0) {
        // Draw grass on ~85% of border cells
        const grassDensity = 0.85;
        
        for (const borderCell of outsideRingLakeBorders) {
            // Randomly determine whether to place grass based on density
            if (Math.random() < grassDensity) {
                const x = borderCell.x;
                const y = borderCell.y;
                
                const grassImage = new Image();
                grassImage.src = getRandomGrassImage();
                
                // Create a grass cell entry
                const grassCell = {
                    x: x,
                    y: y,
                    image: grassImage.src
                };
                
                // Add to grassCells array if it exists
                if (typeof grassCells !== 'undefined') {
                    grassCells.push(grassCell);
                }
                
                // Draw the grass when image loads
                grassImage.onload = () => {
                    treeCtx.drawImage(grassImage, x * cellSize, y * cellSize, cellSize, cellSize);
                };
            }
        }
        
        console.log(`Added grass to lake borders`);
    }

    // Re-filter emptyCells to exclude lake cells AND border cells
    emptyCells = groundCells.filter(cell => {
        // Not a lake cell AND not a border cell
        return !lakeCells.some(lakeCell => lakeCell.x === cell.x && lakeCell.y === cell.y) && 
               !borderPositions.has(`${cell.x},${cell.y}`);
    });

    // Redraw the terrain layer to reflect the changes
    drawTerrainLayer(groundCtx, groundCells, cellSize);
    drawTerrainLayer(waterCtx, waterCells, cellSize);
}
