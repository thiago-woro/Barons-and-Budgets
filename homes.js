class House {
  constructor(x, y, cellSize) {
    this.x = x * cellSize;
    this.y = y * cellSize;
    this.inhabitants = []; // Array to store NPCs living in this house
    this.upgrades = []; // Array to store home upgrades
    this.economicStatus = "Average"; // Economic status of the house
    this.homeValue = Math.floor(Math.random() * 100000) + 50000; // Random home value
  }

  // Method to add an NPC to this house
  addInhabitant(npc) {
    this.inhabitants.push(npc);
  }

  // Method to draw the house on the ground canvas
  draw(treeCtx) {
    // Choose emoji character based on economic status and upgrades
    let emoji = "🏠"; // Default emoji for average house

    if (this.economicStatus === "Wealthy") {
      emoji = "🏡"; // Emoji for wealthy house
    } else if (this.economicStatus === "Poor") {
      emoji = "🏚"; // Emoji for poor house
    } else if (this.upgrades.length > 0) {
      emoji = "🏢"; // Emoji for house with upgrades
    }

    // Draw the emoji on the canvas
    treeCtx.font = "bold 20px Arial";
    treeCtx.fillText(emoji, this.x, this.y );

    console.log(
      `✅ House placed on map!\n\n  X: ${this.x}, Y: ${this.y}`
    );
    drawRectanglesBetweenHouses(houses, pathCtx)
  }
}

// Global array to store houses
let houses = [];

function startHouses(ctx, cellSize) {
  console.log('drawing homes with fn startHouses() 🏡')
  const houseCount = groundCells.length * 0.0003; // Replace with the desired number of houses

  for (let i = 0; i < houseCount && groundCells.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * groundCells.length);
    const selectedCell = groundCells.splice(randomIndex, 1)[0]; // Select and remove a ground cell

    const house = new House(selectedCell.x, selectedCell.y, cellSize);
    houses.push(house);
    house.draw(ctx, cellSize);
  }
}
 // startHouses(treeCtx, cellSize); //DO NOT USE, CHECK IF COUPLE MAKING IS MAKING HOUSES FIRST






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
  
      console.log(`✅ ${this.type} placed on map!\n\n  X: ${this.x}, Y: ${this.y}`);
    }
  }
  
  













    function bfsFindPath(waterCells, startCell) {

    // Convert waterCells to a Set for faster lookup
    const waterSet = new Set(waterCells.map(cell => `${cell.x},${cell.y}`));
    
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
        { dx: 0, dy: 1 }
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
            path: current.path.concat([current])
          });
        }
      }
    }
    
    // If we get here, no path was found
    return null;
  }


  
  let boat = {
    x: 0,
    y: 0
  };
  
  let prevX = 0;
  let prevY = 0;
  let calculatedPath = null;
  let pathIndex = 0;
  
  const edgeWaterCells = waterCells.filter(cell => cell.x === 0);


  function initializeBoat() {
     // Filter water cells that are along the x = 0 edge
  const edgeWaterCells = waterCells.filter(cell => cell.x === 0);
  //console.log(`Edge cells: ${edgeWaterCells.length}`);


    // If no water cells at x = 0, no need to proceed.
    if (edgeWaterCells.length === 0) {
      console.log("No water cells at x = 0. Not drawing the boat.");
      calculatedPath = null;
      return;
    }
  
    // Choose a random starting point from edge water cells
  const randomStartCell = edgeWaterCells[Math.floor(Math.random() * edgeWaterCells.length)];
  
  boat.x = randomStartCell.x;
  boat.y = randomStartCell.y;

   // Calculate a new path based on the current water cells
   calculatedPath = bfsFindPath(waterCells, randomStartCell);  // pass randomStartCell to bfsFindPath

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
    ctx.clearRect((prevX * cellSize) - extraPixels, (prevY * cellSize) - extraPixels, cellSize + (2 * extraPixels), cellSize + (2 * extraPixels));
  
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

  
  