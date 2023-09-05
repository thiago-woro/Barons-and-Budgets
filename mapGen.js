document.getElementById("gen2").addEventListener("click", function () {
  generateTerrainMap(gridSize, gridSize, perlinNoiseScale);
});

console.log(
  `ground cells: ${groundCells.length}, water cells: ${waterCells.length}`
);

function generateTerrainMap(width, height, noiseScale) {
  console.log("Running generateTerrainMap() in mapGen.js");

  // Clear arrays and variables from previous run
  waterCells = [];
  groundCells = [];
  trees = [];

  // Initialize variables
  const perlinInstance = Object.create(perlin);
  terrainMap = new Array(height);
  noiseValues = new Array(height);



  // Reseed the Perlin noise generator
  perlin.seed();

  for (let y = 0; y < height; y++) {
    terrainMap[y] = new Array(width);
   // noiseValues[y] = new Array(width); // Initialize noiseValues for this row

    for (let x = 0; x < width; x++) {
      const noiseValue =
        perlinInstance.get(x * noiseScale, y * noiseScale) - 0.5 + offset;

      // Store the noise value
     // noiseValues[y][x] = noiseValue;  //not needed anymore bc its saved on ground cells

      // Determine terrain type based on noise value
      let shadeIndex;
      if (noiseValue < 0) {
        shadeIndex = Math.floor(-noiseValue * WATER_SHADES.length);
        terrainMap[y][x] = WATER_SHADES[shadeIndex];
        waterCells.push({ x, y, color: WATER_SHADES[shadeIndex] }); // Store color here
      } else {
        shadeIndex = Math.floor(noiseValue * LAND_SHADES.length);
        terrainMap[y][x] = LAND_SHADES[shadeIndex];
        if (noiseValue > 0) {
          groundCells.push({ x, y, color: LAND_SHADES[shadeIndex], noise: noiseValue.toFixed(5) });
        }
      }
    }
  }
  console.log(
    `2) ground cells: ${groundCells.length}, water cells: ${waterCells.length}`
  );

  // Calculate the total number of cells
  const totalCells = groundCells.length + waterCells.length;
  maxLandPopulation = groundCells.length * usableLand;
  console.log(`Total cells generated: `, totalCells);
  console.log(`Max pop.: `, maxLandPopulation.toFixed(0));

  

  // Call the modified function to draw ground and water cells
  console.log('drawing ground cells: \n\n 🌍')

  drawTerrainLayer(groundCtx, groundCells, cellSize);
  console.log('drawing water cells: \n\n 🌊')

  drawTerrainLayer(waterCtx, waterCells, cellSize);
  startTrees(treeCtx, cellSize);
  distributeOreDeposits(oreDepositsCtx);

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
    drawRoundedRect(ctx, x * cellSize, y * cellSize, cellSize * 1.2, cellSize * 1.2, 3.5, color);
  }
}

function animateWater() {
  for (let cell of waterCells) {
    let currentShadeIndex = WATER_SHADES.indexOf(cell.color);
    let nextShadeIndex = (currentShadeIndex + 1) % WATER_SHADES.length;
    cell.color = WATER_SHADES[nextShadeIndex];
  }

  // Redraw water layer
  drawTerrainLayer(waterCtx, waterCells, cellSize);
}
//setInterval(animateWater, 3000);  // Call animateWater() every 1000 milliseconds (1 second)

// Call fn to generate the terrain map with Perlin noise
//var generatedMap = generateTerrainMap(gridSize, gridSize, perlinNoiseScale);

//logs map to console
function logMap(terrainMap) {
  const landSymbol = "🟫";
  const waterSymbol = "🟦";
  for (let y = 0; y < terrainMap.length; y++) {
    let row = "";
    for (let x = 0; x < terrainMap[y].length; x++) {
      if (terrainMap[y][x] === WATER_SHADES[0]) {
        row += waterSymbol;
      } else {
        row += landSymbol;
      }
    }
    console.log(row);
  }
}


function drawRoundedRect(ctx, x, y, width, height, borderRadius, color) {
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

/* 
function drawValidCells(ctx, validCells) {
  // Loop through the array of valid cells and draw each one
  validCells.forEach((cell) => {
    const x = cell.x * cellSize;
    const y = cell.y * cellSize;

    // Draw a square or any shape at this position
    ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
    ctx.fillRect(x, y, cellSize, cellSize);
  });

  console.log(
    `Finished drawing %c${validCells.length} %cvalid cells.`,
    "font-weight: bold; color: green;",
    "font-weight: normal; color: inherit;"
  );
}

drawValidCellsButton.addEventListener("click", function () {
  console.log(validCells, cellSize, cellSize);
  drawValidCells(validCellsCtx, validCells);
});
 */

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
  console.log("will draw " + treeCount.toFixed(0) + " trees");

  const treePositions = [];

  // Sort groundCells by noise value from lowest to highest
  groundCells.sort((a, b) => a.noise - b.noise);

  // Assign tree emojis based on noise values
  groundCells.forEach((cell) => {
    let selectedEmoji

    if (cell.noise > 0.0) {
      selectedEmoji = "🌴";  // Lower noise values
    }  if (cell.noise > 0.13) {
      selectedEmoji = "🌳";  // Medium noise values
    }  if (cell.noise > 0.45) {
      selectedEmoji = "🌲";  // Higher noise values
    } 


      
    treeEmojis[selectedEmoji].push(cell);
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

  occupiedCells = [];
  drawTrees(treeCtx, cellSize, treePositions, occupiedCells);
  return treePositions;
}


function drawTrees(ctx, cellSize, treePositions, occupiedCells) {
  clearCanvas(ctx);

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

    // Skip trees in occupied cells
    if (
      occupiedCells.some(
        (cell) =>
          cell.x === Math.floor(x / cellSize) &&
          cell.y === Math.floor(y / cellSize)
      )
    ) {
      return;
    }

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
}

function distributeOreDeposits(ctx) {
  clearCanvas(oreDepositsCtx);
  oreDeposits = [];

  oreDepositsCount = groundCells.length * 0.001;
  console.error("ore count : ", oreDepositsCount);

  const clusterCount = 5; // Number of ore deposit clusters
  const depositsPerCluster = 3;

  for (let cluster = 0; cluster < clusterCount; cluster++) {
    const randomGroundCell =
      groundCells[Math.floor(Math.random() * groundCells.length)];

    // Calculate the starting coordinates for the cluster within the selected ground cell
    const randomClusterX = randomGroundCell.x;
    const randomClusterY = randomGroundCell.y;

   // console.error("writing ore deposits at: ", randomClusterX, randomClusterY);

    let color = 'rgba(127, 115, 121, 0.9)'
    drawNearCells(groundCtx, randomClusterX, randomClusterY, color, 5)


    // Draw the first ore deposit in the random cluster X, Y
    drawOreDeposit(ctx, randomClusterX, randomClusterY);

    // Calculate and draw the remaining ore deposits in adjacent cells
    const adjacentCells = calculateAdjacentCells(
      randomClusterX,
      randomClusterY
    );
    const depositsToDraw = Math.min(depositsPerCluster, adjacentCells.length);

    for (let i = 0; i < depositsToDraw; i++) {
      const { x, y } = adjacentCells[i];
      drawOreDeposit(ctx, x, y);
    }
  }
}

function calculateAdjacentCells(x, y) {
  const adjacentCells = [];

  for (let xOffset = -1; xOffset <= 1; xOffset++) {
    for (let yOffset = -1; yOffset <= 1; yOffset++) {
      const adjacentX = x + xOffset;
      const adjacentY = y + yOffset;

      // Skip the center cell and check if the cell is valid (within bounds)
      if (xOffset === 0 && yOffset === 0) continue;
      if (isValidCell(adjacentX, adjacentY)) {
        adjacentCells.push({ x: adjacentX, y: adjacentY });
      }
    }
  }

  return adjacentCells;
}

function isValidCell(x, y) {
  // Check if the cell (x, y) is in the groundCells array
  return groundCells.some((cell) => cell.x === x && cell.y === y);
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

  //console.log("ore: ", oreDeposits.length, " X: ", xCoord.toFixed(0), "Y: ", yCoord.toFixed(0))
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
