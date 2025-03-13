// Fisher profession behaviors
// This file contains all the logic for fisher NPCs

// Don't destructure these functions since we have local versions with the same names
// Just use the global functions directly when needed

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

// Helper function to find nearest water cell
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

// Define helper functions first
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
  
  console.log(`Finding water path from (${start.x/cellSize}, ${start.y/cellSize}) to (${target.x}, ${target.y})`);
  
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

function generateFishingSpotsForHarbor(harbor) {
  const key = `${harbor.x},${harbor.y}`;
  if (preCalc.harborFishingSpots.has(key)) return preCalc.harborFishingSpots.get(key);

  console.log(`Generating fishing spots for harbor at (${harbor.x}, ${harbor.y})`);
  if (!waterCells || !Array.isArray(waterCells)) {
    console.warn("waterCells is not defined or not an array when generating fishing spots");
    return [];
  }
  
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

// Define onHarborBuilt function
function onHarborBuilt(harbor) {
  const fishingSpots = generateFishingSpotsForHarbor(harbor);
  fishingSpotsByHarbor.set(harbor.id, fishingSpots);
  calculatePathsForHarbor(harbor);
}

// Register harbor function definition moved here
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

// Define updateFisher first to make it globally available
function updateFisher(npc) {
  switch (npc.state) {
    case "idle":
      // First, check if there's a harbor for our race or if we need to build one
      if (!harborsByRace[npc.race]) {
        // No harbor for our race yet, transition to building a harbor
        npc.setState("buildingHarbor");
        return;
      }
      
      // If we already have a boat, just go to fishing state
      if (fishingBoats.some(boat => boat.owner === npc)) {
        npc.setState("fishing");
        return;
      }
      
      // Create a new fishing boat for this NPC
      const harbor = harborsByRace[npc.race];
      const newBoat = new FishingBoat(harbor, npc);
      fishingBoats.push(newBoat);
      
      // Transition to fishing state
      npc.setState("fishing");
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
        npc.setState("idle");
        break;
      }
      
      // If we're waiting for another fisher to complete the harbor
      if (npc.stateData.waitingForHarbor) {
        // Check if the harbor is now built
        if (harborsByRace[npc.race]) {
          npc.setState("idle"); // Will transition to fishing on next update
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
            
            npc.setState("fishing");
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
        npc.setState("idle");
      }
      break;
  }
}

class FishingBoat {
  constructor(harbor, owner) {
    console.log(`Creating new fishing boat for ${owner.name || 'unknown'} NPC at harbor (${harbor.x}, ${harbor.y})`);
    this.harbor = harbor;
    this.harborId = harbor.id || `${harbor.x}_${harbor.y}`;
    this.owner = owner;
    this.id = fishingBoats.length;
    
    // Get the water port cell for this harbor
    const portCell = harborWaterPortCell.get(this.harborId);
    if (portCell) {
      console.log(`Using existing port cell (${portCell.x}, ${portCell.y}) for boat ${this.id}`);
      this.portCellX = portCell.x;
      this.portCellY = portCell.y;
      // Set initial position to the water port cell, not the harbor
      this.x = this.portCellX * cellSize;
      this.y = this.portCellY * cellSize;
    } else {
      // Fallback if not found
      console.log(`No port cell found for harbor ${this.harborId}, finding nearest water cell`);
      const harborGridX = Math.floor(harbor.x / cellSize);
      const harborGridY = Math.floor(harbor.y / cellSize);
      const nearestWater = findNearestWaterCell(harborGridX, harborGridY);
      if (nearestWater) {
        console.log(`Found nearest water at (${nearestWater.x}, ${nearestWater.y})`);
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
    console.log(`Boat ${this.id}: Trying to use saved path for state ${this.state}`);
    
    let pathKey = '';
    if (this.state === "goingToFishSpot" || this.state === "idle") {
      // Use the path from harbor to fishing spot
      pathKey = `${this.harborId}_to_${this.fishingSpotIndex}`;
      console.log(`Boat ${this.id}: Looking for harbor->fishing path with key: ${pathKey}`);
    } else {
      // Use the path from fishing spot to harbor
      pathKey = `${this.fishingSpotIndex}_to_${this.harborId}`;
      console.log(`Boat ${this.id}: Looking for fishing->harbor path with key: ${pathKey}`);
    }
    
    this.path = harborToFishingSpotPaths.get(pathKey);
    this.pathIndex = 0;
    
    console.log(`Boat ${this.id}: Path found? ${this.path ? 'Yes, length: ' + this.path.length : 'No'}`);
    
    // If no path exists, create a direct one (fallback) that stays in water
    if (!this.path) {
      console.warn(`No saved path found for boat ${this.id}. Creating direct path.`);
      
      // Create a simple direct path
      if (this.state === "goingToFishSpot" || this.state === "idle") {
        console.log(`Boat ${this.id}: Creating direct path from port (${this.portCellX}, ${this.portCellY}) to fishing spot (${this.fishingSpotX}, ${this.fishingSpotY})`);
        
        // Try to find a water path
        const start = { 
          x: this.portCellX * cellSize, 
          y: this.portCellY * cellSize 
        };
        const target = { 
          x: this.fishingSpotX, 
          y: this.fishingSpotY 
        };
        
        const waterPath = findWaterPath(start, target);
        if (waterPath && waterPath.length > 0) {
          console.log(`Boat ${this.id}: Found water path with ${waterPath.length} points`);
          this.path = waterPath;
          
          // Save this path for future use
          harborToFishingSpotPaths.set(pathKey, waterPath);
        } else {
          console.warn(`Boat ${this.id}: Could not find water path, using simple direct path`);
          this.path = [
            { x: this.portCellX * cellSize, y: this.portCellY * cellSize },
            { x: this.fishingSpotX * cellSize, y: this.fishingSpotY * cellSize }
          ];
        }
      } else {
        console.log(`Boat ${this.id}: Creating direct path from fishing spot (${this.fishingSpotX}, ${this.fishingSpotY}) to port (${this.portCellX}, ${this.portCellY})`);
        
        // Try to find a water path
        const start = { 
          x: this.fishingSpotX * cellSize, 
          y: this.fishingSpotY * cellSize 
        };
        const target = { 
          x: this.portCellX, 
          y: this.portCellY 
        };
        
        const waterPath = findWaterPath(start, target);
        if (waterPath && waterPath.length > 0) {
          console.log(`Boat ${this.id}: Found water path with ${waterPath.length} points`);
          this.path = waterPath;
          
          // Save this path for future use
          harborToFishingSpotPaths.set(pathKey, waterPath);
        } else {
          console.warn(`Boat ${this.id}: Could not find water path, using simple direct path`);
          this.path = [
            { x: this.fishingSpotX * cellSize, y: this.fishingSpotY * cellSize },
            { x: this.portCellX * cellSize, y: this.portCellY * cellSize }
          ];
        }
      }
    }
  }
  
  // These methods are no longer needed - paths are pre-calculated
  createPathToFishingSpot() {
    this.useSavedPath();
  }
  
  createPathToHarbor() {
    console.log(`Boat ${this.id}: Creating path to harbor`);
    
    // First check if we have a path from harbor to fishing spot that we could reverse
    const pathKey = `${this.harborId}_to_${this.fishingSpotIndex}`;
    const existingPath = harborToFishingSpotPaths.get(pathKey);
    
    if (existingPath && existingPath.length > 0) {
      // Use the existing path but reversed
      console.log(`Boat ${this.id}: Reusing existing harbor->fishing path in reverse`);
      this.path = [...existingPath].reverse();
      this.pathIndex = 0;
      return;
    }
    
    // If no existing path, use the standard method
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
        //console.log(`Boat ${this.id}: Going to fishing spot, path: ${this.path ? this.path.length : 'none'}, index: ${this.pathIndex}`);
        if (this.path && this.path.length > 0) {
          this.moveAlongPath();
        } else {
          console.log(`Boat ${this.id}: No path, creating path to fishing spot`);
          this.createPathToFishingSpot();
        }
        break;

      case "fishing":
        if (this.waitTime > 0) {
          this.waitTime--;
          if (this.waitTime % 10 === 0) { // Only log every 10 ticks to reduce spam
            console.log(`Boat ${this.id}: Fishing, waiting ${this.waitTime} more ticks`);
          }
        } else {
          console.log(`Boat ${this.id}: Caught fish! Returning to harbor`);
          this.catchSize = Math.floor(Math.random() * 5) + 1;
          this.state = "returningToHarbor";
          this.createPathToHarbor();
          
          // Force a path to be created if none exists
          if (!this.path || this.path.length === 0) {
            console.error(`Boat ${this.id}: No path after createPathToHarbor, forcing path creation`);
            
            // Create a direct path as fallback
            const start = { 
              x: this.x, 
              y: this.y 
            };
            const target = { 
              x: this.portCellX, 
              y: this.portCellY 
            };
            
            const waterPath = findWaterPath(start, target);
            if (waterPath && waterPath.length > 0) {
              console.log(`Boat ${this.id}: Created direct water path with ${waterPath.length} points`);
              this.path = waterPath;
            } else {
              console.error(`Boat ${this.id}: Could not find water path after createPathToHarbor!!!`);
             
            }
            
            this.pathIndex = 0;
          }
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
        //set fishing boat animation
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
      //TODO: add more catch rates for different kinds of fish/seafood, also add items to item library.
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
   
      const boatScale = 1.5;
      const boatWidth = cellSize * boatScale;
      const boatHeight = cellSize * boatScale;
      const boatX = this.x - (boatWidth - cellSize) / 2;
      const boatY = this.y - (boatHeight - cellSize) / 2;
      ctx.drawImage(boatImage, boatX, boatY, boatWidth, boatHeight);
    

    // Draw orange circle at harbor starting point
    ctx.strokeStyle = "orange";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.portCellX * cellSize + cellSize/2, this.portCellY * cellSize + cellSize/2, cellSize/2, 0, Math.PI * 2);
    ctx.stroke();
    
    // Draw cyan circle at fishing spot
    ctx.strokeStyle = "cyan";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(this.fishingSpotX * cellSize, this.fishingSpotY * cellSize, cellSize/2, 0, Math.PI * 2);
    ctx.stroke();

    // Draw path (unchanged)
    if (this.path && this.path.length > 0) {
      ctx.strokeStyle = "rgba(61, 37, 147, 0.34)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(this.x + cellSize/2, this.y + cellSize/2);
      for (let i = this.pathIndex; i < this.path.length; i++) {
        const point = this.path[i];
        ctx.lineTo(point.x + cellSize/2, point.y + cellSize/2);
      }
      ctx.stroke();
      
    
    }
    
    // Draw state text above boat
    ctx.font = "10px Arial";
    ctx.fillStyle = "black";
    ctx.textAlign = "center";
    ctx.fillText(this.state, this.x + cellSize/2, this.y - 5);
  }

  hasReturnedWithFish() {
    return this.state === "returningToHarbor" &&
      Math.abs(this.x - this.portCellX * cellSize) < cellSize &&
      Math.abs(this.y - this.portCellY * cellSize) < cellSize;
  }
}

function updateFishingBoats(deltaTime) {
  //console.log(`Updating ${fishingBoats.length} fishing boats`);
  fishingBoats.forEach(boat => boat.update(deltaTime));
}

function drawFishingBoats(ctx) {
  //console.log(`Drawing ${fishingBoats.length} fishing boats`);
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
  let infoText = "Fisher";
  if (npc.state === "fishing") {
    infoText = "Fishing";
  } else if (npc.state === "buildingHarbor" && !npc.stateData.isWaiting) {
    infoText = "Building Harbor";
  }

  // Get fish count for additional info
  const myBoat = fishingBoats.find(boat => boat.owner === npc);
  let additionalInfo = null;
  
  if (myBoat) {
    additionalInfo = {
      text: `🐟: ${npc.inventory.filter(item => item === 'rawFish').length}`
      // No need to specify color - NPC class will handle it
    };
  }

  // Progress bar data for building harbor
  let progressBar = null;
  if ((npc.state === "buildingHarbor") && npc.waitTime > 0) {
    progressBar = {
      progress: npc.waitTime / npc.maxWaitTime,
      width: 20,
      color: "orange",
      bgColor: "rgba(0, 0, 0, 0.3)"
    };
  }

  // Call the common NPC method for displaying info
  npc.drawInfoText(ctx, infoText, additionalInfo, progressBar);
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
  
  console.log(`${waterCellsMap.size} water cells added to lookup map`);
  
  // Initialize water port cells for existing harbors
  if (buildings && Array.isArray(buildings)) {
    const harbors = buildings.filter(building => building.type === "Harbor");
    console.log(`Found ${harbors.length} existing harbors`);
    
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
          console.log(`Set water port cell for harbor ${harbor.id}: (${nearestWater.x}, ${nearestWater.y})`);
        }
      }
    });
  }
  
  // Initialize paths for harbors
  preCalculateAllPaths();
  
  // Make these functions globally available
  console.log("Fisher functions available globally");
}

function preCalculateAllPaths() {
  if (buildings && Array.isArray(buildings)) {
    const harbors = buildings.filter(building => building.type === "Harbor");
    if (harbors.length > 0) {
      harbors.forEach(harbor => calculatePathsForHarbor(harbor));
    }
  }
}

function updateAndDrawFishingBoats(ctx) {
  const deltaTime = 1.0;
  updateFishingBoats(deltaTime);
  drawFishingBoats(ctx);
}

function followWaterPath(boat) {
  if (!boat.path || boat.path.length === 0) {
    console.warn(`function followWaterPath: Boat ${boat.id} has no water path`);
    
    // Try to create a new path
    if (boat.state === "goingToFishSpot") {
      boat.createPathToFishingSpot();
    } else if (boat.state === "returningToHarbor") {
      boat.createPathToHarbor();
    }
    
    // If we still don't have a path, consider it completed
    if (!boat.path || boat.path.length === 0) {
      return true;
    }
  }
  
  if (boat.pathIndex < boat.path.length) {
    const nextPoint = boat.path[boat.pathIndex];
    const nextX = Math.floor(nextPoint.x / cellSize);
    const nextY = Math.floor(nextPoint.y / cellSize);
    
    // Verify the next cell is still a valid water cell (or harbor for destination)
    if (!isWaterCell(nextX, nextY) && 
        // Allow harbor cells as valid destinations
        !(boat.pathIndex === boat.path.length - 1 && 
          isHarborCell(nextX, nextY))) {
      console.log(`!isWaterCell: Boat ${boat.id} encountered invalid cell in path (${nextX},${nextY}), recalculating`);
      
      // Try to create a new path
      if (boat.state === "goingToFishSpot") {
        boat.createPathToFishingSpot();
      } else if (boat.state === "returningToHarbor") {
        boat.createPathToHarbor();
      }
      
      return true; // Path is invalid, consider it completed
    }
    
    // Move to the next point
    boat.x = nextPoint.x;
    boat.y = nextPoint.y;
    boat.pathIndex++;
    
    // Check if path is completed
    if (boat.pathIndex >= boat.path.length) {
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
}