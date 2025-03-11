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
const harborWaterPortCell = new Map(); // Map to store water cells for harbors (harborId -> {x, y})

// Create a fast lookup map for water cells
const waterCellsMap = new Map();

// Additional cache for nearest water cells - to prevent repeated calculations
const nearestWaterCache = new Map();

// Pre-calculated data for performance
const preCalc = {
  harborFishingSpots: new Map(),
};

// Declare boat image variables
const boatImage = new Image();
let boatImageLoaded = false;
let boatImageFailed = false;

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
  
  // Calculate on the fly
  let nearestWater = null;
  let minDistance = Infinity;
  
  if (waterCells && Array.isArray(waterCells)) {
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
    
    // Save the result in cache for future use
    if (nearestWater) {
      nearestWaterCache.set(key, nearestWater);
    }
  }
  
  return nearestWater;
}

function generateFishingSpotsForHarbor(harbor) {
  const key = `${harbor.x},${harbor.y}`;
  if (preCalc.harborFishingSpots.has(key)) return preCalc.harborFishingSpots.get(key);

  const fishingSpots = [];
  const spotsToGenerate = 3;
  const maximumCellDistance = 30; // Maximum cell distance to search
  
  const harborGridX = Math.floor(harbor.x / cellSize);
  const harborGridY = Math.floor(harbor.y / cellSize);
  
  // Filter water cells within the maximum distance
  const nearbyWaterCells = waterCells.filter(cell => {
    if (!cell) return false;
    
    const distanceSquared = 
      Math.pow(cell.x - harborGridX, 2) + 
      Math.pow(cell.y - harborGridY, 2);
    
    return distanceSquared <= maximumCellDistance * maximumCellDistance;
  });
  
  if (nearbyWaterCells.length === 0) {
    console.warn(`No water cells found within ${maximumCellDistance} cells of harbor at (${harborGridX}, ${harborGridY})`);
    return [];
  }
  
  // Sort by noise value (lower = deeper water)
  const sortedByDepth = [...nearbyWaterCells].sort((a, b) => {
    // If noise property exists, use it (lower is deeper)
    if (a.noise !== undefined && b.noise !== undefined) {
      return a.noise - b.noise;
    }
    
    // Fallback: use distance from shore as approximation of depth
    // Cells further from shore are likely deeper
    const aShoreDistance = getDistanceFromShore(a);
    const bShoreDistance = getDistanceFromShore(b);
    return bShoreDistance - aShoreDistance; // Higher distance = deeper
  });
  
  // Select the deepest spots
  for (let i = 0; i < spotsToGenerate && i < sortedByDepth.length; i++) {
    const cell = sortedByDepth[i];
    fishingSpots.push({ x: cell.x, y: cell.y });
  }
  
  preCalc.harborFishingSpots.set(key, fishingSpots);
  return fishingSpots;
}

// Helper function to estimate cell depth by distance from shore
function getDistanceFromShore(waterCell) {
  let minDistance = Infinity;
  
  // Check all cardinal directions to find nearest non-water cell
  for (let dx = -10; dx <= 10; dx++) {
    for (let dy = -10; dy <= 10; dy++) {
      if (dx === 0 && dy === 0) continue;
      
      const checkX = waterCell.x + dx;
      const checkY = waterCell.y + dy;
      const checkKey = `${checkX},${checkY}`;
      
      if (!waterCellsMap.has(checkKey)) {
        const distance = Math.sqrt(dx*dx + dy*dy);
        if (distance < minDistance) {
          minDistance = distance;
        }
      }
    }
  }
  
  return minDistance;
}

function findWaterPath(start, target) {
  // Ensure start and target are valid
  if (!start || !target) {
    console.warn("Invalid start or target position for water path");
    return null;
  }
  
  const startX = Math.floor(start.x / cellSize);
  const startY = Math.floor(start.y / cellSize);
  const targetX = target.x;
  const targetY = target.y;
  
  // Check if waterCells is defined
  if (typeof waterCells === 'undefined' || !Array.isArray(waterCells) || waterCells.length === 0) {
    console.warn("No water cells defined for pathfinding");
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
    
    // Check all neighboring water cells
    const neighbors = getWaterNeighbors(current.x, current.y);
    
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

// Get neighbors that are water cells
function getWaterNeighbors(x, y) {
  const dirs = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: 0, y: 1 }, { x: -1, y: 0 }];
  return dirs.map(dir => ({ x: x + dir.x, y: y + dir.y }))
    .filter(pos => {
      const key = `${pos.x},${pos.y}`;
      return waterCellsMap.has(key);
    });
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
    
    // Get the water port cell for this harbor
    const portCell = harborWaterPortCell.get(this.harborId);
    if (portCell) {
      this.portCellX = portCell.x;
      this.portCellY = portCell.y;
      // Set initial position to the water port cell, not the harbor
      this.x = this.portCellX * cellSize;
      this.y = this.portCellY * cellSize;
    } else {
      // Fallback if not found
      const harborGridX = Math.floor(harbor.x / cellSize);
      const harborGridY = Math.floor(harbor.y / cellSize);
      const nearestWater = findNearestWaterCell(harborGridX, harborGridY);
      if (nearestWater) {
        this.portCellX = nearestWater.x;
        this.portCellY = nearestWater.y;
        // Set initial position to the water port cell
        this.x = this.portCellX * cellSize;
        this.y = this.portCellY * cellSize;
        // Save it for future use
        harborWaterPortCell.set(this.harborId, {
          x: nearestWater.x,
          y: nearestWater.y
        });
      } else {
        // Last resort fallback
        console.warn(`No water port cell found for harbor at (${harborGridX}, ${harborGridY})`);
        this.portCellX = harborGridX;
        this.portCellY = harborGridY;
        // Use harbor location as fallback
        this.x = harbor.x;
        this.y = harbor.y;
      }
    }
    
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
    
    // If no path exists, create a direct one (fallback) that stays in water
    if (!this.path) {
      console.warn(`No saved path found for boat ${this.id}. Creating direct path.`);
      if (this.state === "goingToFishSpot" || this.state === "idle") {
        this.path = [
          { x: this.portCellX * cellSize, y: this.portCellY * cellSize },
          { x: this.fishingSpotX * cellSize, y: this.fishingSpotY * cellSize }
        ];
      } else {
        this.path = [
          { x: this.fishingSpotX * cellSize, y: this.fishingSpotY * cellSize },
          { x: this.portCellX * cellSize, y: this.portCellY * cellSize }
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
        this.waitTime = 5; // Time to fish
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
      Math.abs(this.x - this.portCellX * cellSize) < cellSize &&
      Math.abs(this.y - this.portCellY * cellSize) < cellSize;
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
  boatImage.src = '/assets/buildings/boat3.png'; //DO NOT TOUCH   boat4.png is ok


  // Build the water cells lookup map for O(1) access
  waterCellsMap.clear();
  waterCells.forEach(cell => {
    if (!cell) return;
    const key = `${cell.x},${cell.y}`;
    waterCellsMap.set(key, cell);
  });
  
  if (typeof waterCells !== 'undefined') {
    console.log(`Fishing initialized with ${waterCells.length} water cells`);
    
    // Initialize water port cells for existing harbors
    if (buildings && Array.isArray(buildings)) {
      const harbors = buildings.filter(building => building.type === "Harbor");
      harbors.forEach(harbor => {
        // Make sure we have a harbor ID
        harbor.id = harbor.id || `${harbor.x}_${harbor.y}`;
        
        // Only initialize if we don't already have it
        if (!harborWaterPortCell.has(harbor.id)) {
          const harborGridX = Math.floor(harbor.x / cellSize);
          const harborGridY = Math.floor(harbor.y / cellSize);
          const nearestWater = findNearestWaterCell(harborGridX, harborGridY);
          
          if (nearestWater) {
            harborWaterPortCell.set(harbor.id, {
              x: nearestWater.x,
              y: nearestWater.y
            });
          }
        }
      });
    }
        preCalculateAllPaths();
  
  // Make these functions globally available
  console.log("Fisher functions available globally");
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
    console.warn(`No water cell found near harbor at (${harborGridX}, ${harborGridY})`);
    return;
  }
  
  // Store the water port cell for this harbor
  harborWaterPortCell.set(harbor.id, {
    x: nearestWaterCell.x,
    y: nearestWaterCell.y
  });
  
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
      // Store harbor to fishing spot path (water only)
      const pathKey = `${harbor.id}_to_${index}`;
      harborToFishingSpotPaths.set(pathKey, path);
      
      // Store fishing spot to harbor path (water only)
      const reversePathKey = `${index}_to_${harbor.id}`;
      harborToFishingSpotPaths.set(reversePathKey, path.slice().reverse());
      
      console.log(`Created permanent path for harbor ${harbor.id}, fishing spot ${index}: ${path.length} points`);
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
  
  // Make sure we have a harbor ID
  harbor.id = harbor.id || `${harbor.x}_${harbor.y}`;
  
  // Find and register the water port cell for this harbor
  const harborGridX = Math.floor(harbor.x / cellSize);
  const harborGridY = Math.floor(harbor.y / cellSize);
  const nearestWater = findNearestWaterCell(harborGridX, harborGridY);
  
  if (nearestWater) {
    harborWaterPortCell.set(harbor.id, {
      x: nearestWater.x,
      y: nearestWater.y
    });
  }
  
  onHarborBuilt(harbor);
  return harbor;
}

function updateAndDrawFishingBoats(ctx) {
  const deltaTime = 1.0;
  updateFishingBoats(deltaTime);
  drawFishingBoats(ctx);
}

function followWaterPath(boat) {
  if (!boat.currentPath || boat.currentPath.length === 0) {
    console.warn(`function followWaterPath: Boat ${boat.id} has no water path`);
    return true; // No path or empty path counts as completed
  }
  
  if (boat.pathIndex < boat.currentPath.length) {
    const nextPoint = boat.currentPath[boat.pathIndex];
    const nextX = Math.floor(nextPoint.x / cellSize);
    const nextY = Math.floor(nextPoint.y / cellSize);
    
    // Verify the next cell is still a valid water cell (or harbor for destination)
    if (!isWaterCell(nextX, nextY) && 
        // Allow harbor cells as valid destinations
        !(boat.pathIndex === boat.currentPath.length - 1 && 
          isHarborCell(nextX, nextY))) {
      console.log(`!isWaterCell: Boat ${boat.id} encountered invalid cell in path (${nextX},${nextY}), recalculating`);
      return true; // Path is invalid, consider it completed
    }
    
    // Move to the next point
    boat.x = nextPoint.x;
    boat.y = nextPoint.y;
    boat.pathIndex++;
    
    // Check if path is completed
    if (boat.pathIndex >= boat.currentPath.length) {
      return true;
    }
    return false;
  }
  
  return true; // Path completed
}

// Helper function to check if a cell is a water cell
function isWaterCell(x, y) {
  if (!waterCells || !Array.isArray(waterCells)) {
    return false;
  }
  return waterCells.some(cell => cell && cell.x === x && cell.y === y);
}

// Helper function to check if a cell is a harbor cell
function isHarborCell(x, y) {
  if (!buildings || !Array.isArray(buildings)) {
    return false;
  }
  return buildings.some(building => 
    building && 
    building.type === "Harbor" && 
    Math.floor(building.x / cellSize) === x && 
    Math.floor(building.y / cellSize) === y
  );
} }