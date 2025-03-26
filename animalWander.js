// animalWander.js - Handles animal wandering behavior
// This file provides specialized wandering functionality for herbivores

// Minimum distance (in cells) for wandering
const MIN_WANDER_DISTANCE = 6;
// Maximum attempts to find a valid cell
const MAX_FIND_ATTEMPTS = 100;

/**
 * Finds a random empty cell that is exactly MIN_WANDER_DISTANCE away from the starting position
 * @param {number} startX - Starting X grid position
 * @param {number} startY - Starting Y grid position 
 * @returns {object|null} - Returns a target cell or null if none found
 */
function findWanderDestination(startX, startY) {
  // Track attempts to avoid infinite loops
  let attempts = 0;
  
  // Get all cells that are exactly MIN_WANDER_DISTANCE away (Manhattan distance)
  const candidateCells = [];
  
  // Only search through emptyCells that are exactly MIN_WANDER_DISTANCE away
  for (const cell of emptyCells) {
    // Calculate Manhattan distance
    const distance = Math.abs(cell.x - startX) + Math.abs(cell.y - startY);
    
    // Only consider cells that are exactly MIN_WANDER_DISTANCE away
    if (distance === MIN_WANDER_DISTANCE) {
      candidateCells.push({
        gridX: cell.x,
        gridY: cell.y
      });
    }
    
    attempts++;
    if (attempts >= MAX_FIND_ATTEMPTS) break;
  }
  
  // If no suitable cells found, return null
  if (candidateCells.length === 0) return null;
  
  // Return a random cell from the candidates
  const randomIndex = Math.floor(Math.random() * candidateCells.length);
  return candidateCells[randomIndex];
}

/**
 * Creates a direct path between two points
 * @param {number} startX - Starting X grid position
 * @param {number} startY - Starting Y grid position
 * @param {number} endX - Ending X grid position
 * @param {number} endY - Ending Y grid position
 * @returns {Array} - Array of points forming the path
 */
function createDirectPath(startX, startY, endX, endY) {
  const path = [];
  
  // Current position
  let currentX = startX;
  let currentY = startY;
  
  // Add starting point
  path.push({ gridX: currentX, gridY: currentY });
  
  // Generate path using Bresenham's line algorithm adjusted for grid
  while (currentX !== endX || currentY !== endY) {
    // Calculate direction to move in X and Y
    const dx = Math.sign(endX - currentX);
    const dy = Math.sign(endY - currentY);
    
    // Decide whether to move in X or Y direction
    const absDx = Math.abs(endX - currentX);
    const absDy = Math.abs(endY - currentY);
    
    if (absDx > absDy || (absDx === absDy && Math.random() < 0.5)) {
      // Move in X direction
      currentX += dx;
    } else {
      // Move in Y direction
      currentY += dy;
    }
    
    // Check if the new position is walkable
    const key = `${currentX},${currentY}`;
    if (!walkableCellsLookup.has(key)) {
      // Try the alternative direction
      if (absDx > absDy) {
        // Try Y direction instead
        currentX -= dx;
        currentY += dy;
      } else {
        // Try X direction instead
        currentX += dx;
        currentY -= dy;
      }
      
      // Check if this alternative is walkable
      const altKey = `${currentX},${currentY}`;
      if (!walkableCellsLookup.has(altKey)) {
        // If still not walkable, try to go back and choose another direction
        currentX = path[path.length - 1].gridX;
        currentY = path[path.length - 1].gridY;
        
        // Try a different direction next time
        continue;
      }
    }
    
    // Add point to path
    path.push({ gridX: currentX, gridY: currentY });
  }
  
  return path;
}

/**
 * Immediately moves the animal along a path to the destination in one game loop
 * @param {object} animal - The animal object to move
 * @param {object} destination - The target cell to move to
 * @returns {boolean} - Whether the movement was successful
 */
function wanderToDestination(animal, destination) {
  if (!animal || !destination) return false;
  
  // Create a direct path
  const path = createDirectPath(animal.gridX, animal.gridY, destination.gridX, destination.gridY);
  
  // No valid path found
  if (path.length <= 1) return false;
  
  // Skip the first point (starting position)
  for (let i = 1; i < path.length; i++) {
    const point = path[i];
    
    // Move the animal to this point
    animal.gridX = point.gridX;
    animal.gridY = point.gridY;
    animal.x = animal.gridX * cellSize;
    animal.y = animal.gridY * cellSize;
    
    // Check for resources at each step
    if (animal.checkResourcesAfterQuickMove && animal.checkResourcesAfterQuickMove()) {
      // If the animal found resources, stop movement
      return true;
    }
  }
  
  console.log(`🚶 ${animal.type} completed wander to (${destination.gridX}, ${destination.gridY})`);
  return true;
}

/**
 * Main function to handle animal wandering
 * @param {object} animal - The animal to handle wandering for
 * @returns {boolean} - Whether wandering was successful
 */
function handleWandering(animal) {
  if (!animal || animal.isPredator) return false;
  
  // Find a destination exactly 6 cells away
  const destination = findWanderDestination(animal.gridX, animal.gridY);
  
  if (!destination) {
    console.log(`${animal.type} couldn't find a place to wander`);
    return false;
  }
  
  // Move to the destination immediately
  const success = wanderToDestination(animal, destination);
  
  // Set the animal back to idle state after wandering
  if (success && animal.setState) {
    animal.setState("idle");
  }
  
  return success;
}

// Export the main function
window.AnimalWander = {
  handleWandering
}; 