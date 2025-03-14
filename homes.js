


const houseSimple = new Image();
houseSimple.src = '/assets/tilesets/houses/simple.png';

const houseRed = new Image();
houseRed.src = '/assets/tilesets/houses/mint.png';

const housePurple = new Image();
housePurple.src = '/assets/tilesets/houses/purple.png';

const houseMint = new Image();
houseMint.src = '/assets/tilesets/houses/mint.png';

const houseBlack = new Image();
houseBlack.src = '/assets/tilesets/houses/black.png';

const stableHouse = new Image();
stableHouse.src = '/assets/tilesets/houses/stable.png';

const buildSound = new Audio('/assets/sounds/building_completed.wav');



// Create an array to hold the house images
const houseImages = [];

// Push all the house images into the array
houseImages.push(houseSimple);
houseImages.push(houseRed);
houseImages.push(housePurple);
houseImages.push(houseMint);
houseImages.push(houseBlack);
houseImages.push(stableHouse);

class House {
  constructor(x, y) {
    this.x = x * cellSize;
    this.y = y * cellSize;
    this.inhabitants = []; // Array to store NPCs living in this house
    this.upgrades = []; // Array to store home upgrades
    this.economicStatus = "Average"; // Economic status of the house
    this.homeValue = Math.floor(Math.random() * 100000) + 50000; // Random home value
    this.floors = 1;
    this.playBuildSound();
  }

  playBuildSound() {
    buildSound.play();
  }

   validateCells() {
    // Get the last placed house
    const lastHouse = houses[houses.length - 1];
  
    // Find the current cell coordinates of the last house
    const currentX = Math.floor(lastHouse.x );
    const currentY = Math.floor(lastHouse.y );
  
    // Define possible adjacent cell positions
    const adjacentCells = [
      { x: currentX - 1, y: currentY },
      { x: currentX + 1, y: currentY },
      { x: currentX, y: currentY - 1 },
      { x: currentX, y: currentY + 1 },
    ];
  
    // Filter out adjacent cells that are inside the pathCells array
    const validAdjacentCells = adjacentCells.filter((cell) =>
      pathCells.some((pathCell) =>
        pathCell.x === cell.x && pathCell.y === cell.y
      )
    );
  
    if (validAdjacentCells.length === 0) {
      console.log('Skipping house construction');
      return;
    }
  
    // Pick a random adjacent cell
    const randomIndex = Math.floor(Math.random() * validAdjacentCells.length);
    const selectedCell = validAdjacentCells[randomIndex];
  
    // Update the current house's position to the new cell
    this.x = selectedCell.x * cellSize;
    this.y = selectedCell.y * cellSize;
  
    console.error('House constructed at (x:', this.x / cellSize, ', y:', this.y / cellSize, ')');
  }
  
  
    // Helper function to find a random adjacent cell
    findRandomAdjacentCell() {
      const currentX = Math.floor(this.x / cellSize);
      const currentY = Math.floor(this.y / cellSize);
  
      const adjacentCells = [
        { x: currentX - 2, y: currentY },
        { x: currentX + 2, y: currentY },
        { x: currentX, y: currentY - 2 },
        { x: currentX, y: currentY + 2 },
      ];
  
      const validAdjacentCells = adjacentCells.filter((cell) =>
        availableHouseCells.some(
          (groundCell) =>
            groundCell.x === cell.x &&
            groundCell.y === cell.y &&
            !houses.some(
              (existingHouse) =>
                Math.floor(existingHouse.x / cellSize) === cell.x &&
                Math.floor(existingHouse.y / cellSize) === cell.y
            )
        )
      );
  
      if (validAdjacentCells.length > 0) {
        const randomIndex = Math.floor(
          Math.random() * validAdjacentCells.length
        );
        console.log(`Found a place for 🏠✅ `);
        
        return validAdjacentCells[randomIndex];
      }
  
      return null; // No valid adjacent cell found
    }
  

  // Method to draw the house on the ground canvas
  draw(ctx) {

    if (Math.random() < 0.4) {
      this.y -= 50;
    }


    // Randomly select an image from the houseImages array
    const randomIndex = Math.floor(Math.random() * houseImages.length);
    const selectedHouseImage = houseImages[randomIndex];

    //draw house
    ctx.drawImage(selectedHouseImage, this.x, this.y, cellSize * 2, cellSize * 2);

    // draw house shadow
   // drawCircle(pathCtx,  this.x,  this.y, 10, "rgba(227, 204, 162, 0.3)");

    // drawRectanglesBetweenHouses(houses, pathCtx);
    // drawSmallScatteredPaths(houses, pathCtx);

  }

  addInhabitant(npc) {
    this.inhabitants.push(npc);
  }
}



function drawSmallScatteredPaths(houses, ctx) {
  //log
 // console.log("drawPaths");

  const lineHeight = Math.floor(Math.random() * 7) + 1;
  const verticalSpacing = Math.floor(Math.random() * 50) + 1;

  for (let i = 0; i < houses.length - 1; i++) {
    const house1 = houses[i];
    const house2 = houses[i + 1];

    const x1 = house1.x;
    const y1 = house1.y;

    const x2 = house2.x;
    const y2 = house2.y;

    const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

    if (distance <= 9 * cellSize) {
      const baseAngle = Math.atan2(y2 - y1, x2 - x1);

      for (let y = 0; y <= distance; y += lineHeight + verticalSpacing) {
        const randomOffset = 3; //(Math.random() - 0.5) * lineHeight * 0.5;
        const angleVariation = ((Math.random() - 0.5) * Math.PI) / 72;
        const angle = baseAngle + angleVariation;

        const x = x1 + Math.cos(angle) * y + randomOffset;
        const yCoord = y1 + Math.sin(angle) * y;

        // Select a random color for the path
        const colorOptions = [
         /*  
         "#9ac558", // Muddy brown with low opacity
          "rgba(92, 128, 0, 0.5)",
          "rgba(240, 230, 140, 0.5)", // Yellowish sand with low opacity
          "rgba(208, 225, 208, 0.34)",
          
          "rgba(208, 225, 208, 0.34)",
          "rgba(208, 225, 208, 0.34)",
          */
"red",
        ];
        const randomColor =
          colorOptions[Math.floor(Math.random() * colorOptions.length)];

        drawRoundedRect(
          ctx,
          x,
          yCoord,
          lineHeight,
          lineHeight,
          9,
          "red"
        );
       // console.log( "drew house color: ",randomColor);
      }
    }
  }
}




function drawRectanglesBetweenHouses(houses, ctx) {
  //log
  console.log("drawRectanglesBetweenHouses");
  const lineHeight = Math.floor(Math.random() * 7) + 1;
  const verticalSpacing = Math.floor(Math.random() * 50) + 1;

  const borderRadius = Math.floor(Math.random() * 6) + 1;
  const occupiedCells = [];

  // Define an array of color options
  const colorOptions = [
/*     "#648a3b",
    "#9ac558",
    "#9ac558",
    "#9ac558", // Muddy brown with low opacity
    "rgba(92, 128, 0, 0.5)",
    "rgba(139, 69, 19, 0.5)", // Old grass green with low opacity
    "rgba(240, 230, 140, 0.5)", // Yellowish sand with low opacity */
    "grey",
  ];

  for (let i = 0; i < houses.length - 1; i++) {
    const house1 = houses[i];
    const house2 = houses[i + 1];

    const x1 = house1.x;
    const y1 = house1.y;

    const x2 = house2.x;
    const y2 = house2.y;

    const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    const baseAngle = Math.atan2(y2 - y1, x2 - x1);

    for (let y = 0; y <= distance; y += lineHeight + verticalSpacing) {
      const randomOffset = (Math.random() - 0.5) * lineHeight * 0.5; // Adjust the range and factor as needed
      const angleVariation = ((Math.random() - 0.5) * Math.PI) / 72; // Smaller angle variation range
      const angle = baseAngle + angleVariation;

      const x = x1 + Math.cos(angle) * y + randomOffset;
      const yCoord = y1 + Math.sin(angle) * y;

      // Select a random color from the colorOptions array
      const randomColor =
        colorOptions[Math.floor(Math.random() * colorOptions.length)];

      drawRoundedRect(
        pathCtx,
        x,
        yCoord,
        lineHeight,
        lineHeight,
        borderRadius,
        "grey"  //randomColor
      );

      // Calculate the cell coordinates based on x and y
      const cellX = Math.floor(x / cellSize);
      const cellY = Math.floor(yCoord / cellSize);

      // Check if the cell is already in the occupiedCells array
      if (!occupiedCells.some((cell) => cell.x === cellX && cell.y === cellY)) {
        occupiedCells.push({ x: cellX, y: cellY });
        // console.error("added:   ", cellX, cellY );
      }
    }
  }

 // console.error("busy cells: " + occupiedCells.length);
  // Remove trees that are in the same cells as the paths
  for (let i = trees.length - 1; i >= 0; i--) {
    const tree = trees[i];
    const treeCellX = Math.floor(tree.x / cellSize);
    const treeCellY = Math.floor(tree.y / cellSize);

    if (
      occupiedCells.some((cell) => cell.x === treeCellX && cell.y === treeCellY)
    ) {
      // Remove the tree from the trees array
      console.error("🌲❌ antes" + trees.length);
      trees.splice(i, 1);
      console.error("🌲❌  depois" + trees.length);
      drawTrees(treeCtx, cellSize, occupiedCells);
    }
  }
}

//commercial buildings

class Building {
  constructor(x, y, cellSize, owner) {
    this.x = x * cellSize;
    this.y = y * cellSize;
    this.owner = owner; // The NPC owner of the building
    this.type = owner.profession; // Type of the building based on owner's profession
    this.inhabitants = []; // Array to store NPCs or characters in the building
    this.upgrades = []; // Array to store building upgrades
    this.economicStatus = "Average"; // Economic status of the building
    this.value = Math.floor(Math.random() * 100000) + 50000; // Random building value
  }

  // Method to add an inhabitant (NPC) to this building
  addInhabitant(npc) {
    this.inhabitants.push(npc);
  }

  // Method to add an upgrade to the building
  addUpgrade(upgrade) {
    this.upgrades.push(upgrade);
  }

  // Method to draw the building on the canvas
  draw(buildingCtx, cellSize) {
    // Choose emoji character based on building type, economic status, and upgrades
    let emoji = "🏠"; // Default emoji for average house

    if (this.type === "House") {
      if (this.economicStatus === "Wealthy") {
        emoji = "🏡"; // Emoji for wealthy house
      } else if (this.economicStatus === "Poor") {
        emoji = "🏚"; // Emoji for poor house
      } else if (this.upgrades.length > 0) {
        emoji = "🏢"; // Emoji for house with upgrades
      }
    } else if (this.type === "Shop") {
      // Add emoji for shops based on their attributes or upgrades
      // Customize this part based on your game mechanics
    } else if (this.type === "Guild") {
      // Add emoji for guilds based on their attributes or upgrades
      // Customize this part based on your game mechanics
    }

    // Draw the emoji on the canvas
    buildingCtx.font = "bold 20px Arial";
    buildingCtx.fillText(emoji, this.x, this.y);

    //console.log(`✅ ${this.type} placed on map!\n\n  X: ${this.x}, Y: ${this.y}`);
  }
}


  // Convert waterCells to a Set for faster lookup
  const waterSet = new Set(waterCells.map((cell) => `${cell.x},${cell.y}`));

function bfsFindPath(waterCells, startCell) {

  let visited = new Set();
  let queue = [{ x: startCell.x, y: startCell.y, path: [] }];

  while (queue.length > 0) {
    let current = queue.shift();

    // If this cell is at the far right of the grid, return the path.
    if (current.x === gridSize - 1) {
      return current.path.concat([current]);
    }

    // Find all adjacent cells
    const adjCells = [
      { dx: -1, dy: 0 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: -1 },
      { dx: 0, dy: 1 },
    ];

    for (let { dx, dy } of adjCells) {
      const newX = current.x + dx;
      const newY = current.y + dy;

      // Check boundaries
      if (newX < 0 || newX >= gridSize || newY < 0 || newY >= gridSize) {
        continue;
      }

      const key = `${newX},${newY}`;

      // Check if this is a water cell and if it has not been visited yet
      if (waterSet.has(key) && !visited.has(key)) {
        visited.add(key);
        queue.push({
          x: newX,
          y: newY,
          path: current.path.concat([current]),
        });
      }
    }
  }

  // If we get here, no path was found
  return null;
}

let boat = {
  x: 0,
  y: 0,
};

let prevX = 0;
let prevY = 0;
let calculatedPath = null;
let pathIndex = 0;

const edgeWaterCells = waterCells.filter((cell) => cell.x === 0);

function initializeBoat() {
  // Filter water cells that are along the x = 0 edge
  const edgeWaterCells = waterCells.filter((cell) => cell.x === 0);
  //console.log(`Edge cells: ${edgeWaterCells.length}`);

  // If no water cells at x = 0, no need to proceed.
  if (edgeWaterCells.length === 0) {
    console.log("No water cells at x = 0. Not drawing the boat.");
    calculatedPath = null;
    return;
  }

  // Choose a random starting point from edge water cells
  const randomStartCell =
    edgeWaterCells[Math.floor(Math.random() * edgeWaterCells.length)];

  boat.x = randomStartCell.x;
  boat.y = randomStartCell.y;

  // Calculate a new path based on the current water cells
  calculatedPath = bfsFindPath(waterCells, randomStartCell); // pass randomStartCell to bfsFindPath

  if (calculatedPath !== null) {
    // console.log("Path found.");
    prevX = boat.x;
    prevY = boat.y;
    pathIndex = 0;
  } else {
    console.log("No path found. Not drawing the boat.");
  }
}

function moveAndDrawBoat(ctx, cellSize) {
  if (calculatedPath === null) return;

  if (pathIndex >= calculatedPath.length) {
    // Reinitialize for the next run
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    initializeBoat();
    return;
  }

  let nextStep = calculatedPath[pathIndex];

  // Clear previous boat drawing
  let extraPixels = 90;
  ctx.clearRect(
    prevX * cellSize - extraPixels,
    prevY * cellSize - extraPixels,
    cellSize + 2 * extraPixels,
    cellSize + 2 * extraPixels
  );

  // Update boat position based on the next step in the calculated path
  boat.x = nextStep.x;
  boat.y = nextStep.y;

  // Update previous coordinates for the next iteration
  prevX = boat.x;
  prevY = boat.y;

  // Draw boat emoji
  ctx.font = "bold 40px Arial";
  ctx.textAlign = "center";
  ctx.fillText("⛵", boat.x * cellSize, boat.y * cellSize);

  // Increment the path index for the next step
  pathIndex++;
}

// Initialize the boat and possibly calculate the path
initializeBoat();

// Move and draw the boat at intervals, only if a path exists
if (edgeWaterCells.length > 0) {
  setInterval(() => {
    moveAndDrawBoat(boatCtx, cellSize);
  }, 100);
}
