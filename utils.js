// utils.js - Common utility functions for NPCs and professions


/**
 * Finds the nearest home to an NPC
 * @param {Object} npc - The NPC object
 * @returns {Object|null} - The nearest home or null if none found
 */
function findNearestHome(npc) {
  let nearestHome = null;
  let minDistance = Infinity;
  
  // Check if houses exists and has elements
  if (typeof houses === 'undefined' || !houses || houses.length === 0) {
   // console.log(`utils: ${npc.name} couldn't find any homes - houses array is empty or undefined`);
    return null;
  }
  
  houses.forEach(house => {
    // Convert house coordinates to grid coordinates
    const houseX = Math.floor(house.x / cellSize);
    const houseY = Math.floor(house.y / cellSize);
    
    const npcX = Math.floor(npc.x / cellSize);
    const npcY = Math.floor(npc.y / cellSize);
    
    const distance = Math.sqrt(
      Math.pow(houseX - npcX, 2) + 
      Math.pow(houseY - npcY, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestHome = {
        x: houseX,
        y: houseY,
        originalHouse: house
      };
    }
  });
  
  //console.log(`utils: ${npc.name} found nearest home at distance ${minDistance.toFixed(2)}`);
  return nearestHome;
}

/**
 * Checks if a cell is a valid land cell
 * @param {number} x - The x coordinate
 * @param {number} y - The y coordinate
 * @returns {boolean} - True if the cell is a valid land cell
 */
function isLandCell(x, y) {
  return groundCells.some(cell => cell.x === x && cell.y === y);
}

/**
 * Finds a path from NPC to target using A* pathfinding algorithm
 * Only allows movement over land cells
 * @param {Object} npc - The NPC object
 * @param {Object} target - The target coordinates {x, y}
 * @returns {Array|null} - Array of path coordinates or null if no path found
 */
function findPathTo(npc, target) {
  const startX = Math.floor(npc.x / cellSize);
  const startY = Math.floor(npc.y / cellSize);
  
  // Check if start or target is not on land
  if (!isLandCell(startX, startY) || !isLandCell(target.x, target.y)) {
   // console.log(`utils: ${npc.name} cannot find path - start or target is not on land`);
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
  const targetKey = `${target.x},${target.y}`;
  
  gScore.set(startKey, 0);
  fScore.set(startKey, heuristic(startX, startY, target.x, target.y));
  
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
      
      // Skip if already evaluated or not a land cell
      if (closedSet.has(neighborKey) || !isLandCell(neighbor.x, neighbor.y)) {
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
          f: tentativeGScore + heuristic(neighbor.x, neighbor.y, target.x, target.y)
        });
      } else if (tentativeGScore >= gScore.get(neighborKey)) {
        // Not a better path
        continue;
      }
      
      // This is the best path so far
      cameFrom.set(neighborKey, current);
      gScore.set(neighborKey, tentativeGScore);
      fScore.set(neighborKey, tentativeGScore + heuristic(neighbor.x, neighbor.y, target.x, target.y));
      
      // Update f-score in openSet if neighbor is already there
      if (neighborInOpenSet) {
        neighborInOpenSet.f = fScore.get(neighborKey);
      }
    }
  }
  
  // No path found
  //console.log(`utils: ${npc.name} could not find a path to target`);
  return null;
}

/**
 * Heuristic function for A* (Manhattan distance)
 */
function heuristic(x1, y1, x2, y2) {
  return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Get valid neighboring cells (4-directional)
 */
function getNeighbors(x, y) {
  return [
    { x: x + 1, y },
    { x: x - 1, y },
    { x, y: y + 1 },
    { x, y: y - 1 }
  ];
}

/**
 * Reconstruct path from A* result
 */
function reconstructPath(cameFrom, current) {
  const path = [{ x: current.x, y: current.y }];
  let currentKey = current.key;
  
  while (cameFrom.has(currentKey)) {
    current = cameFrom.get(currentKey);
    currentKey = current.key;
    path.unshift({ x: current.x, y: current.y });
  }
  
  // Remove the starting position from the path
  path.shift();
  
  return path;
}

/**
 * Follows a path one step at a time
 * @param {Object} npc - The NPC object
 * @returns {boolean} - True if path is completed, false otherwise
 */
function followPath(npc) {
  if (!npc.currentPath || npc.currentPath.length === 0) {
    return true; // No path or empty path counts as completed
  }
  
  if (npc.pathIndex < npc.currentPath.length) {
    const nextCell = npc.currentPath[npc.pathIndex];
    
    // Verify the next cell is still a valid land cell
    if (!isLandCell(nextCell.x, nextCell.y)) {
      console.log(`function followPath: ${npc.name} encountered invalid cell in path, recalculating`);
      npc.currentPath = null;
      return true; // Path is invalid, consider it completed
    }
    
    npc.x = nextCell.x * cellSize;
    npc.y = nextCell.y * cellSize;
    npc.pathIndex++;
    
    // Check if path is completed
    if (npc.pathIndex >= npc.currentPath.length) {
      npc.currentPath = null;
      return true;
    }
    return false;
  }
  
  return true; // Path completed
} 
