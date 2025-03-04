// utils.js - Common utility functions for NPCs and professions

/**
 * Finds the nearest tree to an NPC
 * @param {Object} npc - The NPC object
 * @returns {Object|null} - The nearest tree or null if none found
 */
function findNearestTree(npc) {
  let nearestTree = null;
  let minDistance = Infinity;
  
  // Check if treePositions exists and has elements
  if (typeof treePositions === 'undefined' || !treePositions || treePositions.length === 0) {
    console.log(`utils: ${npc.name} couldn't find any trees - treePositions is empty or undefined`);
    return null;
  }
  
  treePositions.forEach(tree => {
    // Convert tree coordinates to grid coordinates
    const treeX = Math.floor(tree.x / cellSize);
    const treeY = Math.floor(tree.y / cellSize);
    
    const npcX = Math.floor(npc.x / cellSize);
    const npcY = Math.floor(npc.y / cellSize);
    
    const distance = Math.sqrt(
      Math.pow(treeX - npcX, 2) + 
      Math.pow(treeY - npcY, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestTree = {
        x: treeX,
        y: treeY,
        originalTree: tree
      };
    }
  });
  
  console.log(`utils: ${npc.name} found nearest tree at distance ${minDistance.toFixed(2)}`);
  return nearestTree;
}

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
    console.log(`utils: ${npc.name} couldn't find any homes - houses array is empty or undefined`);
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
  
  console.log(`utils: ${npc.name} found nearest home at distance ${minDistance.toFixed(2)}`);
  return nearestHome;
}

/**
 * Creates a simple path from NPC to target
 * @param {Object} npc - The NPC object
 * @param {Object} target - The target object with x and y coordinates
 * @returns {Array} - Array of path points
 */
function findPathTo(npc, target) {
  // Simple pathfinding - just move horizontally then vertically
  const path = [];
  const currentX = Math.floor(npc.x / cellSize);
  const currentY = Math.floor(npc.y / cellSize);
  
  // Move horizontally first
  for (let x = currentX; x !== target.x; x += (target.x > currentX ? 1 : -1)) {
    path.push({x, y: currentY});
  }
  
  // Then move vertically
  for (let y = currentY; y !== target.y; y += (target.y > currentY ? 1 : -1)) {
    path.push({x: target.x, y});
  }
  
  return path;
}

/**
 * Follows a path one step at a time
 * @param {Object} npc - The NPC object
 * @returns {boolean} - True if path is completed, false otherwise
 */
function followPath(npc) {
  if (npc.currentPath && npc.pathIndex < npc.currentPath.length) {
    const nextCell = npc.currentPath[npc.pathIndex];
    npc.x = nextCell.x * cellSize;
    npc.y = nextCell.y * cellSize;
    npc.pathIndex++;
    
    // Check if path is completed
    if (npc.pathIndex >= npc.currentPath.length) {
      console.log(`utils: ${npc.name} completed path`);
      npc.currentPath = null;
      return true;
    }
    return false;
  }
  return true; // No path or empty path counts as completed
} 