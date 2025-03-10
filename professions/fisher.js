// Fisher profession behaviors
// This file contains all the logic for fisher NPCs

// Don't destructure these functions since we have local versions with the same names
// Just use the global functions directly when needed

// Define updateFisher first to make it globally available
function updateFisher(npc) {
  switch (npc.state) {
    case "idle":
      // First, check if there's a harbor for our race or if we need to build one
      if (!harborsByRace[npc.race]) {
        // No harbor for our race yet, transition to building a harbor
        npc.transitionTo("buildingHarbor");
        return;
      }
      
      // If we already have a boat, just go to fishing state
      if (fishingBoats.some(boat => boat.owner === npc)) {
        npc.transitionTo("fishing");
        return;
      }
      
      // Create a new fishing boat for this NPC
      const harbor = harborsByRace[npc.race];
      const newBoat = new FishingBoat(harbor, npc);
      fishingBoats.push(newBoat);
      
      // Transition to fishing state
      npc.transitionTo("fishing");
      break;
      
    case "fishing":
      // Just wait and let the boat do its work
      // The fishing spot is handled by the boat
      npc.animationState = "working";
      
      // Check if our boat has returned with fish
      const myBoat = fishingBoats.find(boat => boat.owner === npc);
      if (myBoat && myBoat.hasReturnedWithFish()) {
        // Display a "Fish caught!" animation
        npc.animationState = "celebrating";
        
        // Trigger the harbor to show a fish collection animation
        const harbor = harborsByRace[npc.race];
        if (harbor && typeof harbor.animateEmoji === 'function') {
          harbor.animateEmoji("collecting", "🐟", 2000);
        }
      }
      break;
      
    case "buildingHarbor":
      // Only build if there isn't already a harbor for this race
      if (harborsByRace[npc.race]) {
        npc.transitionTo("idle");
        break;
      }
      
      // If we're waiting for another fisher to complete the harbor
      if (npc.stateData.waitingForHarbor) {
        // Check if the harbor is now built
        if (harborsByRace[npc.race]) {
          npc.transitionTo("idle"); // Will transition to fishing on next update
          break;
        }
        
        // Just wait near the construction site
        npc.animationState = "normal";
        // Don't show "Building harbor" for waiting fishers
        npc.stateData.isWaiting = true;
        break;
      }
      
      // If we're already building (construction phase)
      if (npc.stateData.isConstructing) {
        if (npc.waitTime > 0) {
          // Continue building
          npc.waitTime--;
          npc.animationState = "building";
          
          // Place harbor when construction is complete
          if (npc.waitTime === 0) {
            const spot = npc.stateData.harborSpot;
            const harbor = new Harbor(spot.x, spot.y, cellSize, npc);
            buildings.push(harbor);
            
            // Use our new registerHarbor function to register the harbor and calculate fishing paths
            registerHarbor(npc.race, harbor);
            
            npc.transitionTo("fishing");
          }
        }
        break;
      }
      
      const harborBeingBuilt = findHarborBeingBuilt(npc.race);
      if (harborBeingBuilt && harborBeingBuilt.builder !== npc) {
        npc.stateData.waitingForHarbor = true;
        npc.stateData.isWaiting = true;
        npc.stateData.harborSpot = { x: harborBeingBuilt.spotX, y: harborBeingBuilt.spotY };

        const path = findPathTo(npc, { x: harborBeingBuilt.spotX, y: harborBeingBuilt.spotY });
        if (path && path.length > 0) {
          npc.currentPath = path;
          npc.pathIndex = 0;
        }
        break;
      }

      if (npc.currentPath && npc.pathIndex < npc.currentPath.length) {
        const pathCompleted = followPath(npc);
        if (pathCompleted) {
          npc.stateData.isConstructing = true;
          npc.waitTime = 3;
          npc.maxWaitTime = 3;
          npc.animationState = "building";
        }
        break;
      }

      const harborSpot = findHarborLocation(npc);
      if (harborSpot) {
        npc.currentPath = findPathTo(npc, harborSpot);
        npc.pathIndex = 0;
        npc.stateData.harborSpot = harborSpot;
        registerHarborBeingBuilt(npc.race, harborSpot.x, harborSpot.y, npc);
      } else {
        npc.transitionTo("idle");
      }
      break;
  }
}

// Counter for total fish caught
let fishCount = 0;

// Track harbors by race to limit one per race
const harborsByRace = {
  "Elf": null,
  "Kurohi": null,
  "Purries": null
};

// Track harbors being built
const harborsBeingBuilt = {
  "Elf": null,
  "Kurohi": null,
  "Purries": null
};

// Track fishing boats
const fishingBoats = [];

// Store fishing spots for each harbor and pre-calculated paths
const fishingSpotsByHarbor = new Map();
const harborToFishingSpotPaths = new Map();

// Create a fast lookup map for water cells
const waterCellsMap = new Map();

// Additional cache for nearest water cells - to prevent repeated calculations
const nearestWaterCache = new Map();

// Pre-calculated data for performance
const preCalc = {
  waterNeighbors: new Map(),
  groundNeighbors: new Map(),
  groundToNearestWater: new Map(),
  harborFishingSpots: new Map(),
};

// Declare boat image variables
const boatImage = new Image();
let boatImageLoaded = false;
let boatImageFailed = false;

// Pre-calculate data for pathfinding
function preCalculateData() {
  // Skip if waterCells or groundCells are not defined
  if (!waterCells || !Array.isArray(waterCells) || !groundCells || !Array.isArray(groundCells)) {
    console.error("Cannot pre-calculate data - water or ground cells not defined");
    return;
  }

  // Build the water cells lookup map for O(1) access
  waterCellsMap.clear();
  waterCells.forEach(cell => {
    if (!cell) return;
    const key = `${cell.x},${cell.y}`;
    waterCellsMap.set(key, cell);
  });
  console.log(`Built water cells lookup map with ${waterCellsMap.size} entries`);

  const dirs = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];

  // Pre-calculate water neighbors
  waterCells.forEach(cell => {
    if (!cell) return; // Skip invalid cells
    
    const neighbors = dirs.map(dir => ({ x: cell.x + dir.x, y: cell.y + dir.y }))
      .filter(neighbor => isWaterCell(neighbor.x, neighbor.y));
    preCalc.waterNeighbors.set(`${cell.x},${cell.y}`, neighbors);
  });

  // Pre-calculate ground neighbors
  groundCells.forEach(cell => {
    if (!cell) return; // Skip invalid cells
    
    const neighbors = dirs.map(dir => ({ x: cell.x + dir.x, y: cell.y + dir.y }))
      .filter(neighbor => groundCells.some(c => c && c.x === neighbor.x && c.y === neighbor.y));
    preCalc.groundNeighbors.set(`${cell.x},${cell.y}`, neighbors);
  });

  // Pre-calculate nearest water cell for each ground cell
  groundCells.forEach(ground => {
    if (!ground) return; // Skip invalid cells
    
    let nearestWater = null;
    let minDistance = Infinity;
    
    waterCells.forEach(water => {
      if (!water) return; // Skip invalid cells
      
      const dist = Math.sqrt(Math.pow(ground.x - water.x, 2) + Math.pow(ground.y - water.y, 2));
      if (dist < minDistance) {
        minDistance = dist;
        nearestWater = water;
      }
    });
    
    if (nearestWater) {
      preCalc.groundToNearestWater.set(`${ground.x},${ground.y}`, nearestWater);
    }
  });
  
  console.log(`Pre-calculated data: ${preCalc.waterNeighbors.size} water neighbors, ${preCalc.groundNeighbors.size} ground neighbors`);
}

// Safe version of getNeighbors that won't fail if data isn't pre-calculated
function getNeighbors(x, y, isWater) {
  if (x === undefined || y === undefined) {
    return [];
  }
  
  const key = `${x},${y}`;
  let neighbors;
  
  // Try to get from pre-calculated data first
  if (isWater) {
    neighbors = preCalc.waterNeighbors.get(key);
  } else {
    neighbors = preCalc.groundNeighbors.get(key);
  }
  
  // If we have pre-calculated neighbors, return them
  if (neighbors && Array.isArray(neighbors)) {
    return neighbors;
  }
  
  // Fallback: calculate on the fly if pre-calculation failed
  const dirs = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
  
  if (isWater) {
    // Check if we have water cells
    if (!waterCells || !Array.isArray(waterCells)) {
      return [];
    }
    
    return dirs.map(dir => ({ x: x + dir.x, y: y + dir.y }))
      .filter(neighbor => isWaterCell(neighbor.x, neighbor.y));
  } else {
    // Check if we have ground cells
    if (!groundCells || !Array.isArray(groundCells)) {
      return [];
    }
    
    return dirs.map(dir => ({ x: x + dir.x, y: y + dir.y }))
      .filter(neighbor => groundCells.some(c => c && c.x === neighbor.x && c.y === neighbor.y));
  }
}

// Optimized function to check if a cell is water using the lookup map
function isWaterCell(x, y) {
  if (x === undefined || y === undefined) {
    return false;
  }
  
  // Use the map for O(1) lookup instead of O(n) array scan
  return waterCellsMap.has(`${x},${y}`);
}

function findNearestWaterCell(gridX, gridY) {
  if (gridX === undefined || gridY === undefined) {
    return null;
  }
  
  const key = `${gridX},${gridY}`;
  
  // First check the nearestWaterCache (persists across calculations)
  const cachedResult = nearestWaterCache.get(key);
  if (cachedResult) {
    return cachedResult;
  }
  
  // Then try to get from pre-calculated data
  const preCalcWater = preCalc.groundToNearestWater.get(key);
  if (preCalcWater) {
    // Store in the global cache too
    nearestWaterCache.set(key, preCalcWater);
    return preCalcWater;
  }
  
  // Fallback: calculate on the fly if pre-calculation failed
  let nearestWater = null;
  let minDistance = Infinity;
  
  if (waterCells && Array.isArray(waterCells)) {
    console.warn(`Calculating nearest water cell on the fly for (${gridX}, ${gridY})`);
    
    for (const cell of waterCells) {
      if (!cell) continue;
      
      const distance = Math.sqrt(
        Math.pow(cell.x - gridX, 2) + 
        Math.pow(cell.y - gridY, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestWater = cell;
      }
    }
    
    // Save the result in both caches for future use
    if (nearestWater) {
      nearestWaterCache.set(key, nearestWater);
      preCalc.groundToNearestWater.set(key, nearestWater);
    }
  }
  
  return nearestWater;
}

function generateFishingSpotsForHarbor(harbor) {
  const key = `${harbor.x},${harbor.y}`;
  if (preCalc.harborFishingSpots.has(key)) return preCalc.harborFishingSpots.get(key);

  const fishingSpots = [];
  const spotsToGenerate = 20;
  const harborGridX = Math.floor(harbor.x / cellSize);
  const harborGridY = Math.floor(harbor.y / cellSize);

  const sortedWater = [...waterCells].sort((a, b) => {
    const distA = Math.sqrt(Math.pow(a.x - harborGridX, 2) + Math.pow(a.y - harborGridY, 2));
    const distB = Math.sqrt(Math.pow(b.x - harborGridX, 2) + Math.pow(b.y - harborGridY, 2));
    return distA - distB;
  });

  const middleIndex = Math.floor(sortedWater.length / 2);
  const fishingArea = sortedWater.slice(middleIndex, middleIndex + 100);

  for (let i = 0; i < spotsToGenerate && i < fishingArea.length; i++) {
    const cell = fishingArea[i % fishingArea.length];
    fishingSpots.push({ x: cell.x, y: cell.y });
  }

  preCalc.harborFishingSpots.set(key, fishingSpots);
  return fishingSpots;
}

function findWaterPath(start, target) {
  // Ensure start and target are valid
  if (!start || !target) {
    console.error("Invalid start or target position for water path");
    return null;
  }
  
  const startX = Math.floor(start.x / cellSize);
  const startY = Math.floor(start.y / cellSize);
  const targetX = target.x;
  const targetY = target.y;
  
  // Check if waterCells is defined
  if (typeof waterCells === 'undefined' || !Array.isArray(waterCells) || waterCells.length === 0) {
    console.error("No water cells defined for pathfinding");
    return null;
  }
  
  // A* pathfinding implementation
  const openSet = [];
  const closedSet = new Set();
  const cameFrom = new Map();
  
  // Cost from start to current node
  const gScore = new Map();
  // Estimated total cost from start to goal through current node
  const fScore = new Map();
  
  // Initialize costs
  const startKey = `${startX},${startY}`;
  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(startX, startY, targetX, targetY));
  
  // Add start node to open set
  openSet.push({x: startX, y: startY});
  
  // Main loop
  while (openSet.length > 0) {
    // Sort the open set by fScore (lowest first)
    openSet.sort((a, b) => {
      const aKey = `${a.x},${a.y}`;
      const bKey = `${b.x},${b.y}`;
      return (fScore.get(aKey) || Infinity) - (fScore.get(bKey) || Infinity);
    });
    
    // Get the node with the lowest fScore
    const current = openSet.shift();
    if (!current) continue; // Skip if we somehow got an undefined value
    
    const currentKey = `${current.x},${current.y}`;
    
    // If we've reached the target, reconstruct and return the path
    if (current.x === targetX && current.y === targetY) {
      return reconstructPath(cameFrom, current);
    }
    
    // Add current node to closed set
    closedSet.add(currentKey);
    
    // Check all neighboring nodes - using our safer getNeighbors function
    const neighbors = getNeighbors(current.x, current.y, true);
    if (!neighbors || !Array.isArray(neighbors)) {
      continue; // Skip this iteration if neighbors isn't valid
    }
    
    for (const neighbor of neighbors) {
      if (!neighbor) continue; // Skip if neighbor is undefined
      
      const neighborKey = `${neighbor.x},${neighbor.y}`;
      
      // Skip if neighbor is in closed set
      if (closedSet.has(neighborKey)) continue;
      
      // Calculate tentative gScore
      const tentativeGScore = (gScore.get(currentKey) || 0) + 1;
      
      // Check if we need to add neighbor to open set
      if (!openSet.some(node => node && node.x === neighbor.x && node.y === neighbor.y)) {
        openSet.push(neighbor);
      } else if (tentativeGScore >= (gScore.get(neighborKey) || Infinity)) {
        // This is not a better path to neighbor
        continue;
      }
      
      // This is the best path so far, record it
      cameFrom.set(neighborKey, current);
      gScore.set(neighborKey, tentativeGScore);
      fScore.set(neighborKey, tentativeGScore + heuristic(neighbor.x, neighbor.y, targetX, targetY));
    }
  }
  
  // No path found
  return null;
}

// Pathfinding helper functions
function heuristic(x1, y1, x2, y2) {
  if (x1 === undefined || y1 === undefined || x2 === undefined || y2 === undefined) {
    return Infinity;
  }
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function reconstructPath(cameFrom, current) {
  if (!current || !cameFrom) {
    return [];
  }
  
  const path = [];
  let curr = current;
  
  while (curr) {
    path.push({ x: curr.x * cellSize, y: curr.y * cellSize });
    const currKey = `${curr.x},${curr.y}`;
    curr = cameFrom.get(currKey);
  }
  
  return path.reverse();
}

class FishingBoat {
  constructor(harbor, owner) {
    this.harbor = harbor;
    this.harborId = harbor.id || `${harbor.x}_${harbor.y}`;
    this.owner = owner;
    this.id = fishingBoats.length;
    
    this.x = harbor.x;
    this.y = harbor.y;
    this.path = null;
    this.pathIndex = 0;
    this.pathReversed = false;
    
    this.state = "idle";
    this.waitTime = 0;
    this.catchSize = 0;
    
    // Assign a permanent fishing spot
    this.assignFishingSpot();
    
    // Set initial target
    this.targetX = this.fishingSpotX;
    this.targetY = this.fishingSpotY;
    
    // Get the pre-calculated path
    this.useSavedPath();
    
    // Start in fishing state
    this.state = "goingToFishSpot";
  }
  
  // Use pre-calculated path instead of creating new ones
  useSavedPath() {
    if (this.state === "goingToFishSpot" || this.state === "idle") {
      // Use the path from harbor to fishing spot
      const pathKey = `${this.harborId}_to_${this.fishingSpotIndex}`;
      this.path = harborToFishingSpotPaths.get(pathKey);
      this.pathReversed = false;
    } else {
      // Use the path from fishing spot to harbor
      const pathKey = `${this.fishingSpotIndex}_to_${this.harborId}`;
      this.path = harborToFishingSpotPaths.get(pathKey);
      this.pathReversed = false;
    }
    
    this.pathIndex = 0;
    
    // If no path exists, create a direct one (fallback)
    if (!this.path) {
      console.warn(`No saved path found for boat ${this.id}. Creating direct path.`);
      if (this.state === "goingToFishSpot" || this.state === "idle") {
        this.path = [
          { x: this.harbor.x, y: this.harbor.y },
          { x: this.fishingSpotX * cellSize, y: this.fishingSpotY * cellSize }
        ];
      } else {
        this.path = [
          { x: this.fishingSpotX * cellSize, y: this.fishingSpotY * cellSize },
          { x: this.harbor.x, y: this.harbor.y }
        ];
      }
    }
  }
  
  // These methods are no longer needed - paths are pre-calculated
  createPathToFishingSpot() {
    this.useSavedPath();
  }
  
  createPathToHarbor() {
    this.useSavedPath();
  }
  
  assignFishingSpot() {
    const fishingSpots = generateFishingSpotsForHarbor(this.harbor);
    this.fishingSpotIndex = Math.floor(this.id % fishingSpots.length);
    const assignedSpot = fishingSpots[this.fishingSpotIndex];
    this.fishingSpotX = assignedSpot.x;
    this.fishingSpotY = assignedSpot.y;
  }

  update(deltaTime) {
    switch (this.state) {
      case "idle":
        this.x = this.harbor.x;
        this.y = this.harbor.y;
        break;

      case "goingToFishSpot":
        if (this.path && this.path.length > 0) {
          this.moveAlongPath();
        } else {
          this.createPathToFishingSpot();
        }
        break;

      case "fishing":
        if (this.waitTime > 0) {
          this.waitTime--;
        } else {
          this.catchSize = Math.floor(Math.random() * 5) + 1;
          this.state = "returningToHarbor";
          this.createPathToHarbor();
        }
        break;

      case "returningToHarbor":
        if (this.path && this.path.length > 0) {
          this.moveAlongPath();
        } else {
          this.createPathToHarbor();
        }
        break;
    }
  }

  moveAlongPath() {
    if (!this.path || this.path.length === 0 || this.pathIndex >= this.path.length) {
      return;
    }
    
    // Use the followWaterPath utility function for consistent boat movement
    const pathCompleted = followWaterPath(this);
    
    // Check if we've reached the end of the path
    if (pathCompleted) {
      if (this.state === "goingToFishSpot") {
        this.state = "fishing";
        this.waitTime = 20; // Time to fish
      } else if (this.state === "returningToHarbor") {
        // Process the catch
        this.processCatch();
        
        // Always go back to the same fishing spot
        this.targetX = this.fishingSpotX;
        this.targetY = this.fishingSpotY;
        
        // Use the saved path to fishing spot
        this.useSavedPath();
        
        // Change state to go back to fishing
        this.state = "goingToFishSpot";
      }
    }
  }

  processCatch() {
    fishCount++;
    if (Math.random() < 0.7) {
      this.owner.addToInventory('rawFish');
    }

    switch (this.owner.race) {
      case "Elf":
        elfFoodCount += this.catchSize;
        break;
      case "Kurohi":
        kurohiFoodCount += this.catchSize;
        break;
      case "Purries":
        purriesFoodCount += this.catchSize;
        break;
    }
  }

  draw(ctx) {
    // Draw the boat (with safer image handling)
    if (boatImageLoaded && !boatImageFailed && boatImage.complete) {
      try {
        const boatScale = 1.5;
        const boatWidth = cellSize * boatScale;
        const boatHeight = cellSize * boatScale;
        const boatX = this.x - (boatWidth - cellSize) / 2;
        const boatY = this.y - (boatHeight - cellSize) / 2;
        ctx.drawImage(boatImage, boatX, boatY, boatWidth, boatHeight);
      } catch(e) {
        console.warn("Error drawing boat image:", e);
        // If we get an error, mark the image as failed so we use the fallback in future
        boatImageFailed = true;
        // Draw fallback immediately this time
        this.drawFallbackBoat(ctx);
      }
    } else {
      // Image not successfully loaded, use fallback
      this.drawFallbackBoat(ctx);
    }

    // Draw path (unchanged)
    if (this.path && this.path.length > 0) {
      ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x + cellSize/2, this.y + cellSize/2);
      for (let i = this.pathIndex; i < this.path.length; i++) {
        const point = this.path[i];
        ctx.lineTo(point.x + cellSize/2, point.y + cellSize/2);
      }
      ctx.stroke();
      
      const targetPoint = this.path[this.path.length - 1];
      ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
      ctx.beginPath();
      ctx.arc(targetPoint.x + cellSize/2, targetPoint.y + cellSize/2, 5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Add a fallback method for drawing boats
  drawFallbackBoat(ctx) {
    // Draw a simple colored rectangle with a triangle sail
    ctx.fillStyle = "#8B4513"; // Brown boat hull
    ctx.fillRect(this.x, this.y + cellSize/2, cellSize, cellSize/2);
    
    // Draw a sail
    ctx.fillStyle = "#FFFFFF"; // White sail
    ctx.beginPath();
    ctx.moveTo(this.x + cellSize/2, this.y);
    ctx.lineTo(this.x + cellSize/2, this.y + cellSize/2);
    ctx.lineTo(this.x + cellSize * 0.8, this.y + cellSize/2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  hasReturnedWithFish() {
    return this.state === "returningToHarbor" &&
      Math.abs(this.x - this.harbor.x) < cellSize &&
      Math.abs(this.y - this.harbor.y) < cellSize;
  }
}

function updateFishingBoats(deltaTime) {
  fishingBoats.forEach(boat => boat.update(deltaTime));
}

function drawFishingBoats(ctx) {
  fishingBoats.forEach(boat => boat.draw(ctx));
}

function findRaceHarbor(npc) {
  return harborsByRace[npc.race];
}

function findHarborBeingBuilt(race) {
  return harborsBeingBuilt[race];
}

function registerHarborBeingBuilt(race, x, y, builder) {
  harborsBeingBuilt[race] = {
    spotX: x,
    spotY: y,
    builder: builder,
    startTime: Date.now()
  };
}

function clearHarborBeingBuilt(race) {
  harborsBeingBuilt[race] = null;
}

function findNearestHarbor(npc) {
  if (harborsByRace[npc.race]) {
    return harborsByRace[npc.race];
  }

  let nearestHarbor = null;
  let minDistance = Infinity;

  for (const race in harborsByRace) {
    const harbor = harborsByRace[race];
    if (!harbor) continue;

    const distance = Math.sqrt(
      Math.pow(npc.x - harbor.x, 2) +
      Math.pow(npc.y - harbor.y, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestHarbor = harbor;
    }
  }

  return nearestHarbor;
}

function findHarborLocation(npc) {
  if (!waterCells || waterCells.length === 0) {
    return null;
  }

  const waterEdgeCells = waterCells.filter(water => {
    const adjacentCells = [
      { x: water.x - 1, y: water.y },
      { x: water.x + 1, y: water.y },
      { x: water.x, y: water.y - 1 },
      { x: water.x, y: water.y + 1 }
    ];

    return adjacentCells.some(cell => {
      return groundCells.some(ground => ground.x === cell.x && ground.y === cell.y);
    });
  });

  if (waterEdgeCells.length === 0) {
    return null;
  }

  waterEdgeCells.sort((a, b) => {
    const distA = Math.sqrt(Math.pow(a.x - npc.x / cellSize, 2) + Math.pow(a.y - npc.y / cellSize, 2));
    const distB = Math.sqrt(Math.pow(b.x - npc.x / cellSize, 2) + Math.pow(b.y - npc.y / cellSize, 2));
    return distA - distB;
  });

  for (const waterEdge of waterEdgeCells) {
    const adjacentLand = [
      { x: waterEdge.x - 1, y: waterEdge.y },
      { x: waterEdge.x + 1, y: waterEdge.y },
      { x: waterEdge.x, y: waterEdge.y - 1 },
      { x: waterEdge.x, y: waterEdge.y + 1 }
    ].find(cell => {
      return groundCells.some(ground => ground.x === cell.x && ground.y === cell.y);
    });

    if (!adjacentLand) continue;

    const path = findPathTo(npc, adjacentLand);
    if (path && path.length > 0) {
      return adjacentLand;
    }
  }

  return null;
}

function drawFisherInfo(npc, ctx) {
  let text = "Fisher";
  if (npc.state === "fishing") {
    text = "Fishing";
  } else if (npc.state === "buildingHarbor" && !npc.stateData.isWaiting) {
    text = "Building Harbor";
  }

  ctx.font = "10px Arial";

  const textWidth = ctx.measureText(text).width;
  const textX = npc.x - textWidth / 2;

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillText(text, textX + 1, npc.y - 10 + 1);

  ctx.fillStyle = "white";
  ctx.fillText(text, textX, npc.y - 10);

  const myBoat = fishingBoats.find(boat => boat.owner === npc);
  if (myBoat) {
    let fillColor = "white";
    if (npc.race === "Elf") fillColor = "#88ff88";
    else if (npc.race === "Kurohi") fillColor = "#ff8888";
    else if (npc.race === "Purries") fillColor = "#8888ff";

    text = `🐟: ${npc.inventory.filter(item => item === 'rawFish').length}`;

    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillText(text, npc.x + 1, npc.y - 25 + 1);

    ctx.fillStyle = fillColor;
    ctx.fillText(text, npc.x, npc.y - 25);
  }

  if ((npc.state === "buildingHarbor") && npc.waitTime > 0) {
    const maxWidth = 20;
    const progress = npc.waitTime / npc.maxWaitTime;
    const barWidth = maxWidth * progress;

    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(npc.x - maxWidth / 2, npc.y - 15, maxWidth, 3);

    ctx.fillStyle = "orange";
    ctx.fillRect(npc.x - maxWidth / 2, npc.y - 15, barWidth, 3);
  }
}

// Initialize fishing resources
function initializeFishingResources() {
  // Set up boat image handling
  boatImage.onload = () => {
    console.log("Boat image loaded successfully");
    boatImageLoaded = true;
    boatImageFailed = false;
  };
  
  boatImage.onerror = () => {
    console.warn("Failed to load boat image, will use fallback");
    boatImageFailed = true;
    boatImageLoaded = false;
  };
  
  boatImage.src = 'assets/buildings/boat3png'; //DO NOT TOUCH   boat4.png is ok
  
  if (typeof waterCells !== 'undefined') {
    console.log(`Fishing initialized with ${waterCells.length} water cells`);
    
    // Run preCalculateData immediately to build all necessary caches
    preCalculateData();
    
    // Pre-calculate paths for existing harbors
    setTimeout(() => {
      if (buildings && buildings.length > 0) {
        preCalculateAllPaths();
      }
    }, 1000);
  } else {
    console.error("ERROR: waterCells is not defined!");
  }
  
  // Export other fisher functions that might be needed by other files
  // Make these functions globally available
  console.log("Fisher functions available globally");
}

// Make initializeFishingResources globally available
initializeFishingResources = initializeFishingResources;

// Auto-initialize fisher resources when this file loads
// This ensures all dependencies are properly set up
if (document.readyState === 'complete') {
  initializeFishingResources();
} else {
  addEventListener('load', initializeFishingResources);
}

function onHarborBuilt(harbor) {
  const fishingSpots = generateFishingSpotsForHarbor(harbor);
  fishingSpotsByHarbor.set(harbor.id, fishingSpots);
  calculatePathsForHarbor(harbor);
}

// Calculate paths ONE TIME for a harbor when it's built
function calculatePathsForHarbor(harbor) {
  console.log(`Calculating permanent paths for harbor ${harbor.id}`);
  
  const harborGridX = Math.floor(harbor.x / cellSize);
  const harborGridY = Math.floor(harbor.y / cellSize);
  
  // Check if we already have paths for this harbor
  const existingPaths = Array.from(harborToFishingSpotPaths.keys())
    .some(key => key.startsWith(`${harbor.id}_to_`));
  
  // Skip calculation if we already have paths for this harbor
  if (existingPaths) {
    console.log(`Paths already exist for harbor ${harbor.id}, skipping calculation`);
    return;
  }
  
  // Generate fishing spots for this harbor
  let fishingSpots = fishingSpotsByHarbor.get(harbor.id);
  if (!fishingSpots || fishingSpots.length === 0) {
    fishingSpots = generateFishingSpotsForHarbor(harbor);
    fishingSpotsByHarbor.set(harbor.id, fishingSpots);
  }
  
  // Find nearest water cell to the harbor
  let nearestWaterCell = findNearestWaterCell(harborGridX, harborGridY);
  if (!nearestWaterCell) {
    console.error(`No water cell found near harbor at (${harborGridX}, ${harborGridY})`);
    return;
  }
  
  // The starting point for all paths will be the nearest water cell
  const start = { 
    x: nearestWaterCell.x * cellSize, 
    y: nearestWaterCell.y * cellSize 
  };
  
  // Create paths from nearest water to each fishing spot
  fishingSpots.forEach((spot, index) => {
    const target = { x: spot.x, y: spot.y };
    const path = findWaterPath(start, target);
    
    if (path) {
      // Store harbor to fishing spot path
      const pathKey = `${harbor.id}_to_${index}`;
      // Add the harbor position at the beginning of the path
      const outboundPath = [{ x: harbor.x, y: harbor.y }, ...path];
      harborToFishingSpotPaths.set(pathKey, outboundPath);
      
      // Store fishing spot to harbor path
      const reversePathKey = `${index}_to_${harbor.id}`;
      // Add the harbor position at the end of the return path
      const returnPath = [...path.reverse(), { x: harbor.x, y: harbor.y }];
      harborToFishingSpotPaths.set(reversePathKey, returnPath);
      
      console.log(`Created permanent path for harbor ${harbor.id}, fishing spot ${index}: ${outboundPath.length} points`);
    }
  });
}

function preCalculateAllPaths() {
  if (buildings && Array.isArray(buildings)) {
    const harbors = buildings.filter(building => building.type === "Harbor");
    if (harbors.length > 0) {
      harbors.forEach(harbor => calculatePathsForHarbor(harbor));
    }
  }
}

function registerHarbor(race, harbor) {
  harborsByRace[race] = harbor;
  clearHarborBeingBuilt(race);
  onHarborBuilt(harbor);
  return harbor;
}

function updateAndDrawFishingBoats(ctx) {
  const deltaTime = 1.0;
  updateFishingBoats(deltaTime);
  drawFishingBoats(ctx);
}

preCalculateData();