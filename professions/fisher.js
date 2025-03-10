// Fisher profession behaviors
// This file contains all the logic for fisher NPCs

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

// Store fishing spots for each harbor
const fishingSpotsByHarbor = new Map();

// Add a map to store pre-calculated paths between harbors and fishing spots
const harborToFishingSpotPaths = new Map();

// Declare boat image but don't load it yet
const boatImage = new Image();

// Pathfinding function specifically for water cells, similar to findPathTo in utils.js
function findWaterPath(start, target) {
  const startX = Math.floor(start.x / cellSize);
  const startY = Math.floor(start.y / cellSize);
  const targetX = target.x;
  const targetY = target.y;
  
  console.warn(`Finding water path from (${startX}, ${startY}) to (${targetX}, ${targetY})`);
  
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
  
  const startKey = `${startX},${startY}`;
  const targetKey = `${targetX},${targetY}`;
  
  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(startX, startY, targetX, targetY));
  
  openSet.push({
    x: startX,
    y: startY,
    key: startKey,
    f: fScore.get(startKey)
  });
  
  while (openSet.length > 0) {
    // Sort by fScore and get the node with lowest fScore
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift();
    
    // If we reached the target
    if (current.key === targetKey) {
      return reconstructPath(cameFrom, current);
    }
    
    closedSet.add(current.key);
    
    // Get neighbors (adjacent cells)
    const neighbors = getNeighbors(current.x, current.y);
    
    for (const neighbor of neighbors) {
      const neighborKey = `${neighbor.x},${neighbor.y}`;
      
      // Skip if already evaluated or not a water cell or harbor
      if (closedSet.has(neighborKey) || !isWaterOrHarborCell(neighbor.x, neighbor.y)) {
        continue;
      }
      
      // Distance from start to neighbor through current
      const tentativeGScore = gScore.get(current.key) + 1;
      
      // Add neighbor to open set if not there
      const neighborInOpenSet = openSet.find(node => node.key === neighborKey);
      if (!neighborInOpenSet) {
        openSet.push({
          x: neighbor.x,
          y: neighbor.y,
          key: neighborKey,
          f: tentativeGScore + heuristic(neighbor.x, neighbor.y, targetX, targetY)
        });
      } else if (tentativeGScore >= gScore.get(neighborKey)) {
        // Not a better path
        continue;
      }
      
      // This is the best path so far
      cameFrom.set(neighborKey, current);
      gScore.set(neighborKey, tentativeGScore);
      fScore.set(neighborKey, tentativeGScore + heuristic(neighbor.x, neighbor.y, targetX, targetY));
      
      // Update f-score in openSet if neighbor is already there
      if (neighborInOpenSet) {
        neighborInOpenSet.f = fScore.get(neighborKey);
      }
    }
  }
  
  // No path found
  console.error(`Could not find a water path from (${startX}, ${startY}) to (${targetX}, ${targetY})`);
  return null;
}

// Helper functions for water pathfinding
function heuristic(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

function getNeighbors(x, y) {
  return [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 }
  ];
}

function isWaterOrHarborCell(x, y) {
  // Check if it's a water cell
  const isWater = waterCells.some(cell => cell.x === x && cell.y === y);
  
  // Check if it's a harbor location (using buildings array)
  let isHarbor = false;
  if (typeof buildings !== 'undefined' && Array.isArray(buildings)) {
    isHarbor = buildings.some(building => 
      building.type === "Harbor" && 
      Math.floor(building.x / cellSize) === x && 
      Math.floor(building.y / cellSize) === y
    );
  }
  
  return isWater || isHarbor;
}

function reconstructPath(cameFrom, current) {
  const path = [{ x: current.x, y: current.y }];
  let currentKey = current.key;
  
  while (cameFrom.has(currentKey)) {
    current = cameFrom.get(currentKey);
    currentKey = current.key;
    path.unshift({ x: current.x, y: current.y });
  }
  
  return path;
}

// Fishing Boat class
class FishingBoat {
  constructor(harbor, owner) {
    this.id = Date.now() + Math.random();
    this.owner = owner;
    this.harbor = harbor;
    
    // Set initial position in grid coordinates
    this.x = Math.floor(harbor.x / cellSize) * cellSize;
    this.y = Math.floor(harbor.y / cellSize) * cellSize;
    
    console.log(`New boat created at harbor (${this.x/cellSize}, ${this.y/cellSize})`);
    
    // Assign a permanent fishing spot to this boat
    this.assignFishingSpot();
    
    // Set initial target to the fishing spot
    this.targetX = this.fishingSpotX;
    this.targetY = this.fishingSpotY;
    
    // Create a path to the fishing spot using water pathfinding
    this.createPathToFishingSpot();
    
    this.state = "goingToFishSpot";
    this.currentDirection = Math.floor(Math.random() * 4); // 0=right, 1=down, 2=left, 3=up
    this.timeSinceLastMove = 0;
    this.moveInterval = 500; // Move every 0.5 seconds (faster for testing)
    this.waitTime = 0;
    this.pathIndex = 0;
  }
  
  // Create a path to the fishing spot using water pathfinding
  createPathToFishingSpot() {
    // Use the pre-calculated path instead of calculating it each time
    const pathKey = `${this.harbor.id}_to_${this.fishingSpotIndex}`;
    const cachedPath = harborToFishingSpotPaths.get(pathKey);
    
    if (cachedPath) {
      console.log(`Using pre-calculated path from harbor to fishing spot ${this.fishingSpotIndex}`);
      this.path = cachedPath;
      this.pathIndex = 0;
      return;
    }
    
    // Fallback to calculating the path if not pre-calculated
    console.warn(`No pre-calculated path found for ${pathKey}, calculating new path`);
    
    // Create a start object
    const start = {
      x: this.x,
      y: this.y
    };
    
    // Find nearest water cell to the harbor (starting position)
    const startGridX = Math.floor(this.x / cellSize);
    const startGridY = Math.floor(this.y / cellSize);
    let nearestWaterCell = findNearestWaterCell(startGridX, startGridY);
    
    // Use nearest water cell as start if found
    if (nearestWaterCell) {
      console.log(`Adjusted path start from land (${startGridX},${startGridY}) to nearest water (${nearestWaterCell.x},${nearestWaterCell.y})`);
      start.x = nearestWaterCell.x * cellSize;
      start.y = nearestWaterCell.y * cellSize;
    }
    
    // Create a target object
    const target = {
      x: this.fishingSpotX,
      y: this.fishingSpotY
    };
    
    // Generate path
    this.path = findWaterPath(start, target);
    
    // If no path was found, create a direct path
    if (!this.path) {
      console.warn("No water path found, creating direct path");
      this.path = [
        { x: start.x, y: start.y },
        { x: target.x * cellSize, y: target.y * cellSize }
      ];
    }
    
    this.pathIndex = 0;
  }
 
  
  // Create a path to return to harbor
  createPathToHarbor() {
    // Use the pre-calculated path instead of calculating it each time
    const pathKey = `${this.fishingSpotIndex}_to_${this.harbor.id}`;
    const cachedPath = harborToFishingSpotPaths.get(pathKey);
    
    if (cachedPath) {
      console.log(`Using pre-calculated path from fishing spot ${this.fishingSpotIndex} to harbor`);
      this.path = cachedPath;
      this.pathIndex = 0;
      return;
    }
    
    // Fallback to calculating the path if not pre-calculated
    console.warn(`No pre-calculated path found for ${pathKey}, calculating new path`);
    
    // Create a start object
    const start = {
      x: this.x,
      y: this.y
    };
    
    // Find nearest water cell to the current position
    const startGridX = Math.floor(this.x / cellSize);
    const startGridY = Math.floor(this.y / cellSize);
    let nearestWaterCell = findNearestWaterCell(startGridX, startGridY);
    
    // Use nearest water cell as start if found
    if (nearestWaterCell) {
      console.log(`Adjusted path start from land (${startGridX},${startGridY}) to nearest water (${nearestWaterCell.x},${nearestWaterCell.y})`);
      start.x = nearestWaterCell.x * cellSize;
      start.y = nearestWaterCell.y * cellSize;
    }
    
    // Create a target object for the harbor
    const target = {
      x: Math.floor(this.harbor.x / cellSize),
      y: Math.floor(this.harbor.y / cellSize)
    };
    
    // Generate path
    this.path = findWaterPath(start, target);
    
    // If no path was found, create a direct path
    if (!this.path) {
      console.warn("No water path found, creating direct path to harbor");
      this.path = [
        { x: start.x, y: start.y },
        { x: this.harbor.x, y: this.harbor.y }
      ];
    }
    
    this.pathIndex = 0;
  }
  
  // Assign a permanent fishing spot to this boat
  assignFishingSpot() {
    // Check if fishing spots exists for this harbor
    if (!fishingSpotsByHarbor.has(this.harbor.id)) {
      // Create fishing spots for this harbor if they don't exist
      const fishingSpots = generateFishingSpotsForHarbor(this.harbor);
      fishingSpotsByHarbor.set(this.harbor.id, fishingSpots);
      console.log(`Generated ${fishingSpots.length} fishing spots for harbor ${this.harbor.id}`);
    }
    
    // Get fishing spots for this harbor
    const fishingSpots = fishingSpotsByHarbor.get(this.harbor.id);
    
    if (!fishingSpots || fishingSpots.length === 0) {
      console.error("No fishing spots available for assignment");
      // Fallback to default fishing spot if none available
      this.fishingSpotX = Math.floor(this.harbor.x / cellSize) + 10;
      this.fishingSpotY = Math.floor(this.harbor.y / cellSize) + 10;
      this.fishingSpotIndex = 0;
      return;
    }
    
    // Assign a fishing spot based on boat ID
    this.fishingSpotIndex = Math.floor(this.id % fishingSpots.length);
    const assignedSpot = fishingSpots[this.fishingSpotIndex];
    
    this.fishingSpotX = assignedSpot.x;
    this.fishingSpotY = assignedSpot.y;
    
    console.log(`Boat ${this.id} assigned fishing spot ${this.fishingSpotIndex} at (${this.fishingSpotX}, ${this.fishingSpotY})`);
  }
  
  // Update boat position and state
  update(deltaTime) {
    if (!deltaTime) deltaTime = 100; // Default value if not provided
    
    this.timeSinceLastMove += deltaTime;
    
    switch (this.state) {
      case "goingToFishSpot":
        if (this.timeSinceLastMove >= this.moveInterval) {
          this.moveAlongPath();
          this.timeSinceLastMove = 0;
        }
        break;
        
      case "fishing":
        if (this.waitTime > 0) {
          this.waitTime--;
        } else {
          // Done fishing, return to harbor
          this.state = "returningToHarbor";
          this.createPathToHarbor();
          console.log(`Boat finished fishing, returning to harbor`);
        }
        break;
        
      case "returningToHarbor":
        if (this.timeSinceLastMove >= this.moveInterval) {
          this.moveAlongPath();
          this.timeSinceLastMove = 0;
        }
        break;
    }
  }
  
  // Move along the current path
  moveAlongPath() {
    if (!this.path || this.path.length === 0) {
      console.error("No path to follow!");
      return;
    }
    
    if (this.pathIndex < this.path.length) {
      // Get the next point in the path
      const nextPoint = this.path[this.pathIndex];
      
      // Move to the next point
      this.x = nextPoint.x * cellSize;
      this.y = nextPoint.y * cellSize;
      
      
      // Increment path index
      this.pathIndex++;
      
      // Check if we've reached the end of the path
      if (this.pathIndex >= this.path.length) {
        if (this.state === "goingToFishSpot") {
          this.state = "fishing";
          this.waitTime = 20; // Time to fish
          console.log(`Boat reached fishing spot at (${nextPoint.x}, ${nextPoint.y})`);
        } else if (this.state === "returningToHarbor") {
          // Process the catch and go back to fishing
          this.processCatch();
          
          // Always go back to the same fishing spot
          this.targetX = this.fishingSpotX;
          this.targetY = this.fishingSpotY;
          
          // Create a new path to the fishing spot
          this.createPathToFishingSpot();
          
          // Change state to go back to fishing
          this.state = "goingToFishSpot";
          console.log(`Boat delivered catch and heading back to its fishing spot at (${this.fishingSpotX}, ${this.fishingSpotY})`);
        }
      }
    }
  }
  
  // Process the caught fish
  processCatch() {
    fishCount++;
    
    // Add fish to personal inventory
    if (Math.random() < 0.7) { // 70% chance to catch a fish
      this.owner.addToInventory('rawFish');
    }
    
    // Increment appropriate race's food count
    switch(this.owner.race) {
      case "Elf":
        elfFoodCount++;
        break;
      case "Kurohi":
        kurohiFoodCount++;
        break;
      case "Purries":
        purriesFoodCount++;
        break;
    }
    
    // Update display
    document.getElementById("fishCount").textContent = fishCount;
    document.getElementById("foodCount").textContent = elfFoodCount + purriesFoodCount + kurohiFoodCount;
  }
  
  // Draw the boat
  draw(ctx) {
    const x = Math.floor(this.x / cellSize) * cellSize;
    const y = Math.floor(this.y / cellSize) * cellSize;
    
    // Draw path with red line (same as woodcutters and miners)
    if (this.path && this.path.length > 0) {
      ctx.beginPath();
      ctx.strokeStyle = "rgba(255, 0, 0, 0.3)";
      ctx.lineWidth = 2;
      
      // Start at the current position
      ctx.moveTo(x + cellSize/2, y + cellSize/2);
      
      // Draw line to each remaining point in the path
      for (let i = this.pathIndex; i < this.path.length; i++) {
        const pathPoint = this.path[i];
        ctx.lineTo(pathPoint.x * cellSize + cellSize/2, pathPoint.y * cellSize + cellSize/2);
      }
      
      ctx.stroke();
      
      // Draw target point (end of path)
      if (this.path.length > 0) {
        const lastPoint = this.path[this.path.length - 1];
        ctx.fillStyle = "rgba(88, 62, 176, 0.54)";
        ctx.beginPath();
        ctx.arc(lastPoint.x * cellSize + cellSize/2, lastPoint.y * cellSize + cellSize/2, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    
   
      // Draw the boat image with proper size
      const scale = 1.5; // Smaller scale for better visibility
      const width = cellSize * scale;
      const height = cellSize * scale;
      
      // Center the boat on the cell
      const drawX = x + (cellSize - width) / 2;
      const drawY = y + (cellSize - height) / 2;
      
      ctx.drawImage(
        boatImage, 
        drawX, 
        drawY, 
        width, 
        height
      );
      
   
  }
  
  // Check if the boat has returned with fish
  hasReturnedWithFish() {
    return this.state === "returningToHarbor";
  }
}

// State machine for fisher behavior
function updateFisher(npc) {
  switch (npc.state) {
    case "idle":
      // First check if we have a harbor for this race, if not, try to build one
      const harbor = findRaceHarbor(npc);
      if (!harbor) {
        // Check if another fisher is already building a harbor for this race
        const harborBeingBuilt = findHarborBeingBuilt(npc.race);
        if (harborBeingBuilt) {
          // Try to move to the harbor being built
          const harborSpotX = harborBeingBuilt.spotX;
          const harborSpotY = harborBeingBuilt.spotY;
          const path = findPathTo(npc, {x: harborSpotX, y: harborSpotY});
          
          if (path && path.length > 0) {
            // Path exists, move to the harbor being built
            npc.currentPath = path;
            npc.pathIndex = 0;
            npc.stateData.harborSpot = {x: harborSpotX, y: harborSpotY};
            npc.stateData.waitingForHarbor = true;
            npc.transitionTo("buildingHarbor");
          } else {
            // No path to the harbor being built, stay idle
            console.log(`Fisher ${npc.name} can't reach harbor being built, staying idle`);
            // Set a flag to prevent constant rechecking
            npc.stateData.noPathToHarbor = true;
          }
        } else {
          npc.transitionTo("buildingHarbor");
        }
      } else {
        // Move to the harbor
        const harborX = Math.floor(harbor.x / cellSize);
        const harborY = Math.floor(harbor.y / cellSize);
        npc.currentPath = findPathTo(npc, {x: harborX, y: harborY});
        npc.pathIndex = 0;
        npc.stateData.targetHarbor = harbor;
        npc.transitionTo("fishing");
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
          
          // Log progress
          if (npc.waitTime % 10 === 0) {
            console.log(`Fisher ${npc.name} building harbor: ${npc.waitTime} time left`);
          }
          
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
      
      // Check if another fisher is already building a harbor for this race
      const harborBeingBuilt = findHarborBeingBuilt(npc.race);
      if (harborBeingBuilt && harborBeingBuilt.builder !== npc) {
        // Another fisher is already building, wait for them
        npc.stateData.waitingForHarbor = true;
        npc.stateData.isWaiting = true;
        npc.stateData.harborSpot = {x: harborBeingBuilt.spotX, y: harborBeingBuilt.spotY};
        
        // Try to move to the harbor being built
        const path = findPathTo(npc, {x: harborBeingBuilt.spotX, y: harborBeingBuilt.spotY});
        if (path && path.length > 0) {
          npc.currentPath = path;
          npc.pathIndex = 0;
        }
        break;
      }
      
      // If we have a path, follow it
      if (npc.currentPath && npc.pathIndex < npc.currentPath.length) {
        const pathCompleted = followPath(npc);
        if (pathCompleted) {
          // We've reached the harbor spot, start building
          npc.stateData.isConstructing = true;
          npc.waitTime = 3;
          npc.maxWaitTime = 3;
          npc.animationState = "building";
          console.log(`Fisher ${npc.name} reached harbor spot, starting construction`);
        }
        break;
      }
      
      // Find suitable water edge location for harbor
      const harborSpot = findHarborLocation(npc);
      if (harborSpot) {
        // Move to the harbor spot
        npc.currentPath = findPathTo(npc, harborSpot);
        npc.pathIndex = 0;
        npc.stateData.harborSpot = harborSpot;
        
        // Register that we're building a harbor for this race
        registerHarborBeingBuilt(npc.race, harborSpot.x, harborSpot.y, npc);
        console.log(`Fisher ${npc.name} found harbor spot at (${harborSpot.x}, ${harborSpot.y}), moving there`);
      } else {
        npc.transitionTo("idle");
      }
      break;
      
    case "fishing":
      // Check if we have a boat
      if (!npc.stateData.currentBoat) {
        const harbor = npc.stateData.targetHarbor || findRaceHarbor(npc);
        if (!harbor) {
          npc.transitionTo("idle");
          break;
        }
        
        // Create a new fishing boat
        const boat = new FishingBoat(harbor, npc);
        fishingBoats.push(boat);
        npc.stateData.currentBoat = boat;
        
        // Hide the NPC while fishing
        npc.isVisible = false;
      }
      
      // Check if boat still exists
      const boat = npc.stateData.currentBoat;
      if (!boat || !fishingBoats.includes(boat)) {
        npc.stateData.currentBoat = null;
        npc.isVisible = true;
        npc.transitionTo("idle");
        break;
      }
      
      // If boat returned with fish, send a new one
      if (boat.hasReturnedWithFish()) {
        // Remove the boat
        const boatIndex = fishingBoats.indexOf(boat);
        if (boatIndex !== -1) {
          fishingBoats.splice(boatIndex, 1);
        }
        npc.stateData.currentBoat = null;
        
        // Create a new boat
        const harbor = npc.stateData.targetHarbor || findRaceHarbor(npc);
        if (harbor) {
          const newBoat = new FishingBoat(harbor, npc);
          fishingBoats.push(newBoat);
          npc.stateData.currentBoat = newBoat;
        } else {
          npc.isVisible = true;
          npc.transitionTo("idle");
        }
      }
      break;
  }
}

// Update all fishing boats
function updateFishingBoats(deltaTime) {
  // Check if waterCells is defined, if not create a default array
  if (typeof waterCells === 'undefined' || !Array.isArray(waterCells)) {
    console.warn("waterCells not defined, creating default water cells array");
    window.waterCells = [];
    
    // Create a grid of water cells (simple 50x50 grid)
    for (let x = 100; x < 150; x++) {
      for (let y = 100; y < 150; y++) {
        window.waterCells.push({ x, y });
      }
    }
    
    console.log(`Created ${window.waterCells.length} default water cells`);
  }
  
  for (let i = fishingBoats.length - 1; i >= 0; i--) {
    const boat = fishingBoats[i];
    boat.update(deltaTime);
    
    // Don't remove boats - let them continue fishing
  }
}

// Draw all fishing boats
function drawFishingBoats(ctx) {
  fishingBoats.forEach(boat => {
    boat.draw(ctx);
  });
}

// Helper function to find harbor for this race
function findRaceHarbor(npc) {
  return harborsByRace[npc.race];
}

// Helper function to find harbor being built for this race
function findHarborBeingBuilt(race) {
  return harborsBeingBuilt[race];
}

// Helper function to register a harbor being built
function registerHarborBeingBuilt(race, x, y, builder) {
  harborsBeingBuilt[race] = {
    spotX: x,
    spotY: y,
    builder: builder,
    startTime: Date.now()
  };
  console.log(`Registered harbor being built for ${race} at (${x}, ${y}) by ${builder.name}`);
}

// Helper function to clear a harbor being built
function clearHarborBeingBuilt(race) {
  harborsBeingBuilt[race] = null;
  console.log(`Cleared harbor being built for ${race}`);
}

// Helper function to find nearest harbor
function findNearestHarbor(npc) {
  let nearestHarbor = null;
  let minDistance = Infinity;
  
  buildings.forEach(building => {
    if (building instanceof Harbor) {
      const buildingX = Math.floor(building.x / cellSize);
      const buildingY = Math.floor(building.y / cellSize);
      
      const npcX = Math.floor(npc.x / cellSize);
      const npcY = Math.floor(npc.y / cellSize);
      
      const distance = Math.sqrt(
        Math.pow(buildingX - npcX, 2) + 
        Math.pow(buildingY - npcY, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestHarbor = building;
      }
    }
  });
  
  return nearestHarbor;
}

// Helper function to find suitable harbor location
function findHarborLocation(npc) {
  // Convert NPC position to grid coordinates
  const npcX = Math.floor(npc.x / cellSize);
  const npcY = Math.floor(npc.y / cellSize);
  
  // Find all valid harbor locations (sand cells adjacent to water)
  const validHarborLocations = [];
  
  for (const sandCell of sandCells) {
    const x = sandCell.x;
    const y = sandCell.y;
    
    // Check adjacent cells for water
    const hasAdjacentWater = waterCells.some(waterCell => 
      Math.abs(waterCell.x - x) <= 1 && Math.abs(waterCell.y - y) <= 1
    );
    
    if (hasAdjacentWater) {
      // Calculate distance from NPC to this potential harbor location
      const distance = Math.sqrt(
        Math.pow(x - npcX, 2) + 
        Math.pow(y - npcY, 2)
      );
      
      validHarborLocations.push({
        x, 
        y, 
        distance
      });
    }
  }
  
  // If no valid locations found, return null
  if (validHarborLocations.length === 0) {
    return null;
  }
  
  // Sort by distance (closest first)
  validHarborLocations.sort((a, b) => a.distance - b.distance);
  
  // Return the closest valid harbor location
  return {
    x: validHarborLocations[0].x,
    y: validHarborLocations[0].y
  };
}

// Draw fisher info based on state
function drawFisherInfo(npc, ctx) {
  // Don't draw info if NPC is not visible (fishing)
  if (npc.isVisible === false) return;
  
  const font = "12px Arial";
  const fillColor = "black";
  
  ctx.font = font;
  ctx.fillStyle = fillColor;
  ctx.textAlign = "center";
  
  let text = "";
  let bgColor = "rgba(255, 255, 255, 0.7)";
  
  switch (npc.state) {
    case "idle": 
      text = "🔍 Idle"; 
      bgColor = "rgba(200, 200, 200, 0.7)";
      break;
    case "buildingHarbor": 
      if (npc.stateData.isWaiting) {
        text = "⏳ Waiting"; 
        bgColor = "rgba(200, 200, 200, 0.7)";
      } else {
        text = "🏗️ Building harbor"; 
        bgColor = "rgba(152, 251, 152, 0.7)";
      }
      break;
    case "fishing": 
      text = "🎣 Fishing"; 
      bgColor = "rgba(0, 191, 255, 0.7)";
      break;
    default: 
      text = npc.state;
  }
  
  const textWidth = ctx.measureText(text).width;
  const padding = 4;
  ctx.fillStyle = bgColor;
  ctx.fillRect(npc.x - textWidth/2 - padding, npc.y - 35, textWidth + padding*2, 16);
  
  ctx.fillStyle = "white";
  ctx.fillText(text, npc.x, npc.y - 25);
  ctx.fillStyle = fillColor;
  ctx.fillText(text, npc.x, npc.y - 24);
  
  if ((npc.state === "buildingHarbor") && npc.waitTime > 0) {
    const maxWidth = 20;
    const progress = npc.waitTime / npc.maxWaitTime;
    const barWidth = maxWidth * progress;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(npc.x - maxWidth/2, npc.y - 15, maxWidth, 3);
    
    ctx.fillStyle = "orange";
    ctx.fillRect(npc.x - maxWidth/2, npc.y - 15, barWidth, 3);
  }
}

// After startNPCs is called, initialize fishing resources
function initializeFishingResources() {
  // Load the boat image
  boatImage.src = 'assets/buildings/boat.jpg';
  
  // Add an onload handler to log when the image is loaded
  boatImage.onload = function() {
    console.log("Boat image loaded successfully");
  };
  
  // Add debug code to check waterCells
  console.log("Initializing fishing resources, checking waterCells:");
  if (typeof waterCells !== 'undefined') {
    console.log(`waterCells is defined with ${waterCells.length} cells`);
    console.log("First 5 water cells:", waterCells.slice(0, 5));
    
    // Pre-calculate paths for any existing harbors (for saved games)
    setTimeout(() => {
      if (buildings && buildings.length > 0) {
        preCalculateAllPaths();
      }
    }, 1000); // Wait a second to ensure everything is loaded
  } else {
    console.error("ERROR: waterCells is not defined!");
  }
}

// Export the initialize function to be called after startNPCs
window.initializeFishingResources = initializeFishingResources;

// Make sure to call updateFishingBoats and drawFishingBoats in the game loop
if (typeof window !== 'undefined') {
  // Create a global function to update and draw fishing boats
  window.updateAndDrawFishingBoats = function(ctx, deltaTime) {
    // Update boat positions with proper deltaTime
    if (typeof updateFishingBoats === 'function') {
      // Ensure deltaTime is a reasonable value
      const safeDeltaTime = deltaTime && deltaTime > 0 && deltaTime < 1000 ? deltaTime : 100;
      updateFishingBoats(safeDeltaTime);
    }
    
    // Draw boats - this should happen after the canvas is cleared in the main game loop
    if (typeof drawFishingBoats === 'function' && ctx) {
      drawFishingBoats(ctx);
    }
  };
  
  // Hook into the existing game loop if available
  if (typeof window.gameLoop === 'function') {
    const originalGameLoop = window.gameLoop;
    window.gameLoop = function(timestamp) {
      // Calculate deltaTime if not already done in the original game loop
      const deltaTime = timestamp - (window.lastTimestamp || timestamp);
      window.lastTimestamp = timestamp;
      
      // Call the original game loop
      originalGameLoop(timestamp);
      
      // Update and draw fishing boats after the original game loop
      if (typeof window.updateAndDrawFishingBoats === 'function' && npcCtx) {
        window.updateAndDrawFishingBoats(npcCtx, deltaTime);
      }
    };
    
    console.log("Fishing boat system integrated with game loop");
  }
}

// Function to be called when a harbor is built
function onHarborBuilt(harbor) {
  console.log(`Harbor built at (${Math.floor(harbor.x/cellSize)}, ${Math.floor(harbor.y/cellSize)}), calculating fishing paths`);
  
  // Generate fishing spots for this harbor
  const fishingSpots = generateFishingSpotsForHarbor(harbor);
  fishingSpotsByHarbor.set(harbor.id, fishingSpots);
  
  // Calculate paths for this harbor and its fishing spots
  calculatePathsForHarbor(harbor);
}

// Calculate paths for a specific harbor and its fishing spots
function calculatePathsForHarbor(harbor) {
  const harborGridX = Math.floor(harbor.x / cellSize);
  const harborGridY = Math.floor(harbor.y / cellSize);
  
  // Get fishing spots for this harbor
  let fishingSpots = fishingSpotsByHarbor.get(harbor.id);
  
  // If no fishing spots exist yet, generate them
  if (!fishingSpots || fishingSpots.length === 0) {
    fishingSpots = generateFishingSpotsForHarbor(harbor);
    fishingSpotsByHarbor.set(harbor.id, fishingSpots);
  }
  
  // Find nearest water cell to the harbor (starting position)
  let nearestWaterCell = findNearestWaterCell(harborGridX, harborGridY);
  
  // Create a start object using the nearest water cell
  const start = nearestWaterCell ? 
    { x: nearestWaterCell.x * cellSize, y: nearestWaterCell.y * cellSize } : 
    { x: harbor.x, y: harbor.y };
  
  // Calculate paths to each fishing spot
  fishingSpots.forEach((spot, index) => {
    const target = { x: spot.x, y: spot.y };
    const path = findWaterPath(start, target);
    
    // Store the calculated path
    const pathKey = `${harbor.id}_to_${index}`;
    const reversePathKey = `${index}_to_${harbor.id}`;
    
    harborToFishingSpotPaths.set(pathKey, path);
    
    // Also store the reverse path (fishing spot to harbor)
    // We can just reverse the existing path rather than calculating again
    const reversePath = path ? [...path].reverse() : null;
    harborToFishingSpotPaths.set(reversePathKey, reversePath);
    
    console.log(`Calculated path for harbor ${harbor.id} to fishing spot ${index}: ${path ? path.length + ' points' : 'no path found'}`);
  });
}

// Function to pre-calculate all harbor-to-fishing-spot paths (only used for existing harbors on game load)
function preCalculateAllPaths() {
  console.log("Pre-calculating paths for all existing harbors");
  
  // For each harbor
  if (buildings && Array.isArray(buildings)) {
    const harbors = buildings.filter(building => building.type === "Harbor");
    
    if (harbors.length > 0) {
      console.log(`Found ${harbors.length} existing harbors, calculating paths`);
      harbors.forEach(harbor => calculatePathsForHarbor(harbor));
    } else {
      console.log("No existing harbors found");
    }
  }
}

// When a harbor is done being constructed, register it and calculate paths
function registerHarbor(race, harbor) {
  // Register the harbor
  harborsByRace[race] = harbor;
  
  // Clear the harbor being built flag
  clearHarborBeingBuilt(race);
  
  // Calculate paths for the new harbor
  onHarborBuilt(harbor);
  
  console.log(`Registered harbor for ${race} and calculated fishing paths`);
  return harbor;
}

// Helper function to find nearest water cell to a grid position
function findNearestWaterCell(gridX, gridY) {
  let nearestWaterCell = null;
  let minDistance = Infinity;
  
  // Check if waterCells exists
  if (waterCells && waterCells.length > 0) {
    for (const cell of waterCells) {
      const distance = Math.sqrt(
        Math.pow(cell.x - gridX, 2) + 
        Math.pow(cell.y - gridY, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestWaterCell = cell;
      }
    }
  }
  
  return nearestWaterCell;
}

// Helper function to generate fishing spots for a harbor
function generateFishingSpotsForHarbor(harbor) {
  const fishingSpots = [];
  const spotsToGenerate = 20; // Generate 20 fishing spots
  
  // Check if waterCells is defined
  if (typeof waterCells !== 'undefined' && Array.isArray(waterCells) && waterCells.length > 0) {
    // Create a copy of waterCells to work with
    const waterCellsCopy = [...waterCells];
    
    // Get harbor position
    const harborGridX = Math.floor(harbor.x / cellSize);
    const harborGridY = Math.floor(harbor.y / cellSize);
    
    // Sort water cells by distance from harbor
    waterCellsCopy.sort((a, b) => {
      const distA = Math.sqrt(Math.pow(a.x - harborGridX, 2) + Math.pow(a.y - harborGridY, 2));
      const distB = Math.sqrt(Math.pow(b.x - harborGridX, 2) + Math.pow(b.y - harborGridY, 2));
      return distA - distB;
    });
    
    // Get water cells that are a good distance away
    const middleIndex = Math.floor(waterCellsCopy.length / 2);
    const fishingArea = waterCellsCopy.slice(middleIndex, middleIndex + 100);
    
    // Randomly select fishing spots from this area
    for (let i = 0; i < spotsToGenerate && i < fishingArea.length; i++) {
      const randomIndex = Math.floor(Math.random() * fishingArea.length);
      const cell = fishingArea[randomIndex];
      fishingSpots.push({ x: cell.x, y: cell.y });
      
      // Remove this cell to avoid duplicates
      fishingArea.splice(randomIndex, 1);
    }
  } else {
    console.error("No water cells available for fishing spots generation");
  }
  
  return fishingSpots;
} 