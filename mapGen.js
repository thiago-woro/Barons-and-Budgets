document.getElementById("gen2").addEventListener("click", function () {
   trees = [];
 treePositions = []; 
  //startTrees(treeCtx, cellSize)
  generateTerrainMap();
});


//main terrain map generator function
function generateTerrainMap() {
  const perlinInstance = Object.create(perlin);
  noiseValues = new Array(gridSize);
  perlin.seed();

  const center = { x: rows / 2, y: rows / 2 };

  for (let y = 0; y < rows; y++) {
    terrainMap[y] = new Array(rows);

    for (let x = 0; x < rows; x++) {
      const noiseValue =
        perlinInstance.get(x * perlinNoiseScale, y * perlinNoiseScale) - 0.5 + offset;

      // Calculate the distance from the center
      const distanceToCenter = Math.sqrt(
        Math.pow(x - center.x, 2) + Math.pow(y - center.y, 2)
      );

      // Define a multiplier based on distance (higher distance, stronger smoothing)
      const distanceMultiplier = distanceToCenter / (rows / 2);

      // Apply smoothing to both land and water cells
      const smoothedNoiseValue = noiseValue - (distanceMultiplier * 0.8); // Adjust the 0.8 as needed

      // Assign terrain type based on smoothed noise value
      if (smoothedNoiseValue > 0) {
        terrainMap[y][x] = LAND_SHADES[Math.floor(smoothedNoiseValue * LAND_SHADES.length)];
        groundCells.push({ x, y, color: terrainMap[y][x], noise: smoothedNoiseValue.toFixed(5) });
      } else {
        terrainMap[y][x] = WATER_SHADES[Math.floor(-smoothedNoiseValue * WATER_SHADES.length)];
        waterCells.push({ x, y, color: terrainMap[y][x] });
      }
    }
  }
  console.log(
    `🟩 Ground cells: ${groundCells.length}, 🌊 water cells: ${waterCells.length}`
  );
  afterMapGen()
}





function afterMapGen() {
 // Calculate the total number of cells
 const totalCells = groundCells.length + waterCells.length;
 maxLandPopulation = groundCells.length * usableLand;
 console.log(`Total cells generated: `, totalCells);
 console.log(`Max pop.: `, maxLandPopulation.toFixed(0));

 drawTerrainLayer(groundCtx, groundCells, cellSize);
 drawTerrainLayer(waterCtx, waterCells, cellSize);
 distributeOreDeposits(oreDepositsCtx);

 availableHouseCells = groundCells.filter((cell) => {
   const noiseValue = parseFloat(cell.noise);
   return noiseValue >= 0.17;
 });

 console.log(`Available House Cells: `, availableHouseCells.length);

 flatLandCells = groundCells.filter((cell) => {
   const noiseValue = parseFloat(cell.noise);
   return noiseValue >= 0.2 && noiseValue <= 0.245;
 });

 console.log(`From ${groundCells.length} ground cells, down to ${flatLandCells.length} usable, flat lands cells`);

 //debugTerrain(npcCtx, gridSize, cellSize);
}


function drawTerrainLayer(ctx, cellArray, cellSize) {
  // Clear the canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  for (const cell of cellArray) {
    const x = cell.x;
    const y = cell.y;
    const color = cell.color;
    //console.log(cell.x)

    //console.log(`cell  X: ${cell.x}, Y: ${cell.y}, ${cell.color}`)
    drawRoundedRect(ctx, x * cellSize, y * cellSize, cellSize * 1.2, 3.5, color);
  }
}


function startTrees(ctx, cellSize) {
  clearCanvas(ctx);
  let treeCount = 0;

  // Define the tree emojis based on noise values
  const treeEmojis = {
    "🌴": [],   // For lower noise values
    "🌵": [],   // For medium noise values
    "🌳": [],   // For higher noise values
    "🌲": [],   // For the highest noise values
  };

  treeCount = groundCells.length * treePercentageofLand;
  //console.log("will draw " + treeCount.toFixed(0) + " trees");
 // console.log( adjacentOreCells);

 // Filter out cells with ore deposits from groundCells
groundCellswithoutOres = groundCells.filter((cell) => {
  // Check if the cell coordinates are occupied by an ore deposit
  return !adjacentOreCells.some(
    (coords) =>
      coords.x === cell.x && coords.y === cell.y
  );
});

    treeCount = groundCells.length * treePercentageofLand;


  // Assign tree emojis based on noise values
  groundCellswithoutOres.forEach((cell) => {
    let selectedEmoji

    if (cell.noise > 0.05) {
      selectedEmoji = "🌴";  // Lower noise values
    }  if (cell.noise > 0.13) {
      selectedEmoji = "🌳";  // Medium noise values
    }  if (cell.noise > 0.45) {
      selectedEmoji = "🌲";  // Higher noise values
    } 

    if (treeEmojis[selectedEmoji]) {
      treeEmojis[selectedEmoji].push(cell);
    }
    
  });

  // Generate tree positions
  for (let i = 0; i < treeCount; i++) {
    const selectedEmoji = Object.keys(treeEmojis)[i % 4]; // Rotate through emojis

    if (treeEmojis[selectedEmoji].length > 0) {
      const randomIndex = Math.floor(Math.random() * treeEmojis[selectedEmoji].length);
      const selectedCell = treeEmojis[selectedEmoji].splice(randomIndex, 1)[0];

      const x = selectedCell.x * cellSize;
      const y = selectedCell.y * cellSize;

      // Store tree positions
      treePositions.push({ x, y, emoji: selectedEmoji });
    }
  }

  drawTrees(treeCtx, treePositions);
  return treePositions;
}

function drawTrees(ctx, treePositions) {
  clearCanvas(ctx);

  console.log('drawing trees 🌵🌵')

  treePositions.sort((a, b) => {
    if (a.y === b.y) {
      // If Y coordinates are the same, sort by X coordinates in descending order
      return b.x - a.x;
    }
    // Otherwise, sort by Y coordinates in ascending order
    return a.y - b.y;
  });

  treePositions.forEach((tree) => {
    const x = tree.x;
    const y = tree.y;

    // Draw shadow
    ctx.beginPath();
    ctx.arc(x, y + 5, 7, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fill();

    // Draw tree
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.textAlign = "center";
    ctx.font = "bold 20px Arial";
    ctx.fillText(tree.emoji, x, y);
  });
  drawGrass(treeCtx, 0.05);
  console.log(	`draw grass 1`);

}



// Call drawGrass function with your desired parameters and groundCells




function distributeOreDeposits(ctx) {
  clearCanvas(oreDepositsCtx);
  oreDeposits = [];


  betterOreCellsDistribution = groundCells.filter((cell) => {
    const noiseValue = parseFloat(cell.noise);
    return noiseValue >= 0.42;
  });


  const clusterCount = 5; // Number of ore deposit clusters
  const depositsPerCluster = 3;

  for (let cluster = 0; cluster < clusterCount; cluster++) {
    const randomGroundCell =
    betterOreCellsDistribution[Math.floor(Math.random() * betterOreCellsDistribution.length)];

    // Calculate the starting coordinates for the cluster within the selected ground cell
    const randomClusterX = randomGroundCell.x;
    const randomClusterY = randomGroundCell.y;

   // console.error("writing ore deposits at: ", randomClusterX, randomClusterY);

    let color = 'rgba(127, 115, 121, 0.4)'
    //drawNearCells(groundCtx, randomClusterX, randomClusterY, color, 5)
     drawCircle(groundCtx, randomClusterX * cellSize, randomClusterY *cellSize, 70, color);
    

    // Draw the first ore deposit in the random cluster X, Y
    drawOreDeposit(ctx, randomClusterX, randomClusterY);

    // Calculate and draw the remaining ore deposits in adjacent cells
    const adjacentCells = calculateAdjacentCells(
      randomClusterX,
      randomClusterY
    );

       // Store the adjacent cells in the global variable
       adjacentOreCells = [...adjacentOreCells, ...adjacentCells];

    const depositsToDraw = Math.min(depositsPerCluster, adjacentCells.length);

    for (let i = 0; i < depositsToDraw; i++) {
      const { x, y } = adjacentCells[i];
      drawOreDeposit(ctx, x, y);
    }
  }

  startTrees(treeCtx, cellSize);

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