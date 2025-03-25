let timesUsedPathFinderFunction = 0;
// Add at the top with other globals
let walkableCellsLookup = new Set(); // Will store walkable cell coordinates as "x,y" strings
let throttledPathfindingTimer = 0;
let maxPathfindingCallsPerFrame = 3; // Limit pathfinding calls per frame
let currentPathfindingCalls = 0;

// Function to initialize walkable cells lookup
function initWalkableCellsLookup() {
  walkableCellsLookup.clear();
  for (const cell of emptyCells) {
    walkableCellsLookup.add(`${cell.x},${cell.y}`);
  }
  console.log(`Initialized walkable cells lookup with ${walkableCellsLookup.size} cells`);
}

// A* pathfinding algorithm to find a path between two cells
function findPath(start, target, targetIsTree = false) {
    timesUsedPathFinderFunction++;
    console.warn(`timesUsedPathFinderFunction: ${timesUsedPathFinderFunction} - had animals: ${animals.length} - game loop: ${year}`);
    
    // Initialize walkable cells lookup if not already done
    if (walkableCellsLookup.size === 0) {
      initWalkableCellsLookup();
    }
    
    // Helper function to calculate Manhattan distance heuristic
    const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    
    // Helper function to check if a cell is walkable - now using Set lookup
    const isWalkable = (x, y) => {
        // If this cell is the target and targetIsTree is true, always make it walkable
        if (x === target.x && y === target.y && targetIsTree) {
            return true;
        }
        // Use Set lookup instead of array search
        return walkableCellsLookup.has(`${x},${y}`);
    };
    
    //console.warn(`⏳´... finding path between \nX:${start.x} , Y:${start.y} and \nX:${target.x} , Y:${target.y}`);
    
    // Create open and closed sets
    const openSet = [];
    const closedSet = [];
    
    // Add start node to open set
    openSet.push({
        x: start.x,
        y: start.y,
        g: 0,                          // Cost from start to current node
        h: heuristic(start, target),   // Estimated cost from current to target
        f: heuristic(start, target),   // Total cost (g + h)
        parent: null                   // Reference to parent node
    });
    
    // While there are nodes to explore
    while (openSet.length > 0) {
        // Sort openSet by f score (lowest first)
        openSet.sort((a, b) => a.f - b.f);
        
        // Get the node with lowest f score
        const current = openSet.shift();
        
        // Add current to closed set
        closedSet.push(current);
        
        // If reached the target
        if (current.x === target.x && current.y === target.y) {
            // Reconstruct the path
            const path = [];
            let temp = current;
            
            while (temp !== null) {
                path.push({ x: temp.x, y: temp.y });
                temp = temp.parent;
            }
            
            let finalPath = path.reverse();

            if (targetIsTree) {
                // Remove the last cell (the tree cell) from the path
                finalPath.pop();
            }
            
            // Return the path in reverse (from start to target)
            return finalPath;
        }
        
        // Get neighboring cells
        const neighbors = [
            { x: current.x - 1, y: current.y },     // Left
            { x: current.x + 1, y: current.y },     // Right
            { x: current.x, y: current.y - 1 },     // Up
            { x: current.x, y: current.y + 1 }      // Down
        ];
        
        for (const neighbor of neighbors) {
            // Skip if not walkable or in closed set
            if ( !isWalkable(neighbor.x, neighbor.y) ||  
                closedSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) {
                continue;
            }
            
            // Calculate g score for this neighbor
            const gScore = current.g + 1; // Assuming cost of 1 to move to adjacent cell
            
            // Check if neighbor is already in open set
            const existingNeighborIndex = openSet.findIndex(n => 
                n.x === neighbor.x && n.y === neighbor.y
            );
            
            if (existingNeighborIndex === -1) {
                // Not in open set, add it
                openSet.push({
                    x: neighbor.x,
                    y: neighbor.y,
                    g: gScore,
                    h: heuristic(neighbor, target),
                    f: gScore + heuristic(neighbor, target),
                    parent: current
                });
            } else if (gScore < openSet[existingNeighborIndex].g) {
                // Already in open set, but this path is better
                openSet[existingNeighborIndex].g = gScore;
                openSet[existingNeighborIndex].f = gScore + openSet[existingNeighborIndex].h;
                openSet[existingNeighborIndex].parent = current;
            }
        }
    }
    
    // No path found
    return null;
}

// Add this after the findPath function and before the Animal class
function findPathToNearestCell(startX, startY, targetCells) {
    // Throttle excessive pathfinding calls
    if (currentPathfindingCalls >= maxPathfindingCallsPerFrame) {
        return null;
    }
    currentPathfindingCalls++;
    
    if (!targetCells || targetCells.length === 0) return null;
    
    // Sort target cells by Manhattan distance to start position
    const sortedTargets = targetCells
        .map(cell => ({
            cell,
            distance: calcManhattanDistance(startX, startY, cell.gridX || cell.x, cell.gridY || cell.y)
        }))
        .sort((a, b) => a.distance - b.distance);
    
    // Only try the closest target to reduce pathfinding calls
    const target = sortedTargets[0].cell;
    const path = findPath(
        { x: startX, y: startY },
        { x: target.gridX || target.x, y: target.gridY || target.y }
    );
    
    return path;
}

/* end of movement logic */












// Euclidean distance - most accurate for real-world movement but computationally expensive
// Use when visual appearance of diagonal and straight movement should look natural
const calcDistance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

// Squared Euclidean distance - much faster than Euclidean because it avoids the square root
// Perfect for comparisons (e.g., "is this closer than that?") since relative ordering is preserved
// Use when comparing distances or when exact distance isn't needed
const calcDistanceSquared = (x1, y1, x2, y2) => (x2 - x1) ** 2 + (y2 - y1) ** 2;

// Manhattan distance (taxicab geometry) - fastest calculation, perfect for grid-based movement
// Distance is measured along axes at right angles (like city blocks)
// Use for grid-based pathfinding or when diagonal movement costs the same as straight movement
const calcManhattanDistance = (x1, y1, x2, y2) => Math.abs(x2 - x1) + Math.abs(y2 - y1);

// Add after calcManhattanDistance function
function getAdjacentEmptyCells(gridX, gridY) {
  const adjacentCells = [];
  const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  
  for (const [dx, dy] of offsets) {
    const newX = gridX + dx;
    const newY = gridY + dy;
    const key = `${newX},${newY}`;
    
    // Check if the cell is walkable using our lookup
    if (walkableCellsLookup.has(key)) {
      adjacentCells.push({ gridX: newX, gridY: newY });
    }
  }
  
  return adjacentCells;
}

// Add a spatial grid for faster animal lookups
let animalSpatialGrid = {};
const GRID_CELL_SIZE = 10; // Size of each spatial grid cell (in game grid cells)

// Add this at the top of the file with other globals
let validMovesLookup = {}; // Will store valid moves for each grid cell

// Path cache to avoid redundant pathfinding calculations
// Format: { "startX,startY-endX,endY": { path: [...], timestamp: 123456789 } }
let pathCache = {};
const PATH_CACHE_SIZE = 100; // Maximum number of paths to cache
const PATH_CACHE_TTL = 10000; // Time to live for cached paths (10 seconds)

// Function to precompute valid moves for all cells
function precomputeValidMoves() {
  console.log("Precomputing valid moves for animal movement...");
  validMovesLookup = {};
  
  // For each empty cell, calculate all valid adjacent moves
  for (const cell of emptyCells) {
    const key = `${cell.x},${cell.y}`;
    
    // Check all adjacent cells (including diagonals for more natural movement)
    const possibleMoves = [
      { x: cell.x + 1, y: cell.y },     // right
      { x: cell.x - 1, y: cell.y },     // left
      { x: cell.x, y: cell.y + 1 },     // down
      { x: cell.x, y: cell.y - 1 },     // up
      { x: cell.x + 1, y: cell.y + 1 }, // diagonal down-right
      { x: cell.x - 1, y: cell.y - 1 }, // diagonal up-left
      { x: cell.x + 1, y: cell.y - 1 }, // diagonal up-right
      { x: cell.x - 1, y: cell.y + 1 }  // diagonal down-left
    ];
    
    // Filter to only valid moves (those that exist in emptyCells)
    validMovesLookup[key] = possibleMoves.filter(move => 
      emptyCells.some(emptyCell => emptyCell.x === move.x && emptyCell.y === move.y)
    );
  }
  
  console.log(`Precomputed valid moves for ${Object.keys(validMovesLookup).length} cells`);
}

// Call this after map generation and whenever the map changes
// Example: after trees are cut, buildings are placed, etc.
// precomputeValidMoves();

// Function to update the spatial grid
function updateAnimalSpatialGrid() {
  // Clear the existing grid
  animalSpatialGrid = {};
  
  // Add all living animals to the grid
  for (const animal of animals) {
    if (!animal.isAlive) continue;
    
    // Calculate the grid cell coordinates
    const gridCellX = Math.floor(animal.gridX / GRID_CELL_SIZE);
    const gridCellY = Math.floor(animal.gridY / GRID_CELL_SIZE);
    const key = `${gridCellX},${gridCellY}`;
    
    // Create the grid cell if it doesn't exist
    if (!animalSpatialGrid[key]) {
      animalSpatialGrid[key] = [];
    }
    
    // Add the animal to the cell
    animalSpatialGrid[key].push(animal);
  }
}

// Cleanup old path cache entries periodically
function cleanupPathCache() {
  const now = Date.now();
  const keys = Object.keys(pathCache);
  
  // If cache is getting too large, remove oldest entries first
  if (keys.length > PATH_CACHE_SIZE) {
    const sortedEntries = keys
      .map(key => ({ key, timestamp: pathCache[key].timestamp }))
      .sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove oldest entries to get back to cache size limit
    const entriesToRemove = sortedEntries.slice(0, keys.length - PATH_CACHE_SIZE);
    entriesToRemove.forEach(entry => delete pathCache[entry.key]);
  }
  
  // Remove expired entries
  keys.forEach(key => {
    if (now - pathCache[key].timestamp > PATH_CACHE_TTL) {
      delete pathCache[key];
    }
  });
}

class Animal {
  static PREY_BASE_SPEED = 2000;
  static PREDATOR_SPEED_MULTIPLIER = 2;
  static KILL_DISTANCE = 1;
  static REPRODUCTION_INTERVAL = 15000;
  static MAX_AGE = 60000;
  static PREDATOR_MAX_AGE = 20000;
  static MAX_ANIMALS = Math.floor(maxLandPopulation);
  static BABY_EMOJI_DURATION = 5000;
  static PATH_RECALC_COOLDOWN = 2000; // 2 seconds cooldown between path recalculations

  static setAllPaused(isPaused) {
    animals.forEach(animal => animal.isPaused = isPaused);
  }

  constructor(x, y, type, age = 0) {
    this.x = x * cellSize;
    this.y = y * cellSize;
    this.gridX = x;
    this.gridY = y;
    this.type = type;
    this.isPredator = ['Bear', 'Coyote'].includes(type);
    this.emoji = this.getEmoji();
    this.isAlive = true;
    this.age = age;
    this.birthDate = Date.now();
    this.fontSize = this.getSpeciesFontSize();
    this.isPaused = false;
    this.isFrozen = false;
    this.id = Math.random().toString(36).substring(2, 15);

    // Movement
    this.moveInterval = this.isPredator ? Animal.PREY_BASE_SPEED / Animal.PREDATOR_SPEED_MULTIPLIER : Animal.PREY_BASE_SPEED;
    this.normalSpeed = this.moveInterval;
    this.chaseSpeed = this.moveInterval * 0.8;
    this.timeSinceLastMove = 0;
    this.currentDirection = Math.floor(Math.random() * 4);
    this.directionChangeChance = this.isPredator ? 0.2 : 0.4;
    this.detectionRange = this.isPredator ? 5 : 4;
    this.movementMode = "random";
    this.targetAnimal = null;
    this.targetPosition = null;

    // Path finding
    this.currentPath = null;
    this.pathIndex = 0;
    this.inaccessibleTargets = new Set();
    this.pathCooldown = 0; // Cooldown timer for path recalculations
    this.lastPathTarget = null; // Remember last path target for comparison

    // Needs
    this.hunger = 0;
    this.thirst = 0;
    this.maxNeed = 100;
    this.hungerRate = this.isPredator ? 0.6 : 0.5;
    this.thirstRate = 0.3;

    // Reproduction
    this.timeSinceLastReproduction = Math.random() * Animal.REPRODUCTION_INTERVAL;

    // Behavior state
    this.state = "idle"; // idle, fleeing, hunting, seekingWater, seekingBerries, drinking, eating
    this.stateTimer = 0;
    this.targetCell = null;
    this.attemptedTargets = new Set();
    this.noLakesNearby = false; // Flag to indicate if this animal can't find lakes
  }

  setMovement(mode, targetAnimal = null, targetCell = null) {
    this.movementMode = mode;
    this.targetAnimal = targetAnimal;
    this.targetPosition = targetCell ? { x: targetCell.gridX * cellSize, y: targetCell.gridY * cellSize } : null;
    
    // Clear any existing path when setting a new movement target
    this.currentPath = null;
    this.pathIndex = 0;
  }

  getSpeciesFontSize() {
    return { Sheep: 20, Cow: 21, Chicken: 17, Pig: 19, Bear: 23, Coyote: 19 }[this.type] || 20;
  }

  getFontSize() {
    return (Date.now() - this.birthDate < Animal.BABY_EMOJI_DURATION) ? Math.floor(this.fontSize * 0.65) : this.fontSize;
  }

  getEmoji() {
    return { Sheep: '🐑',Cow: '🐄', Chicken: '🐔', Pig: '🐖', Bear: '🐻', Coyote: '🐺' }[this.type] || '❓';
  }

  update(deltaTime) {
    if (!this.isAlive || this.isPaused || this.isFrozen) return;

    // Update needs and age
    this.age = Math.min(this.age + deltaTime, this.isPredator ? Animal.PREDATOR_MAX_AGE : Animal.MAX_AGE);
    this.hunger = Math.min(this.hunger + this.hungerRate * (deltaTime / 1000), this.maxNeed);
    this.thirst = Math.min(this.thirst + this.thirstRate * (deltaTime / 1000), this.maxNeed);

    // Update path cooldown
    if (this.pathCooldown > 0) {
      this.pathCooldown -= deltaTime;
    }

    if (this.age >= (this.isPredator ? Animal.PREDATOR_MAX_AGE : Animal.MAX_AGE)) {
      this.isAlive = false;
      animals.splice(animals.indexOf(this), 1);
      return;
    }

    this.updateBehavior(deltaTime);
    this.handleMovement(deltaTime);
    this.checkReproduction(deltaTime);
  }

  detectNearbyAnimals() {
    if (!this.isAlive) return [];
    
    const nearbyAnimals = [];
    
    // Using Manhattan distance is more appropriate for a grid-based game
    // For animals to detect each other within a certain grid range
    const detectionRange = this.detectionRange * 1.5; // Adjust the multiplier to account for Manhattan vs Euclidean
    
    // Get the grid cell this animal is in
    const gridCellX = Math.floor(this.gridX / GRID_CELL_SIZE);
    const gridCellY = Math.floor(this.gridY / GRID_CELL_SIZE);
    
    // Check the animal's cell and all adjacent cells
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        const checkKey = `${gridCellX + dx},${gridCellY + dy}`;
        const cellAnimals = animalSpatialGrid[checkKey] || [];
        
        // Check each animal in this cell
        for (const animal of cellAnimals) {
          if (animal === this || !animal.isAlive) continue;
          
          // Use Manhattan distance for grid-based detection - much faster than squared calculations
          const manhattanDist = calcManhattanDistance(
            this.gridX, this.gridY, animal.gridX, animal.gridY
          );
          
          if (manhattanDist <= detectionRange) {
            nearbyAnimals.push(animal);
          }
        }
      }
    }
    
    return nearbyAnimals;
  }

  updateBehavior(deltaTime) {
    const nearby = this.detectNearbyAnimals();
    this.stateTimer += deltaTime;

    // Predator behavior (hunt or patrol)
    if (this.isPredator) {
      switch (this.state) {
        case "idle":
        case "patrolling":
          // Always look for prey first
          const prey = nearby.find(a => !a.isPredator && a.isAlive);
          if (prey) {
            this.state = "hunting";
            this.targetAnimal = prey;
            this.stateTimer = 0;
            this.currentPath = null; // Clear any existing path
          } else {
            // No prey, so patrol (move with purpose)
            this.state = "patrolling";
            
            // If no target or target reached, set new target and move toward it
            if (!this.targetCell || this.hasReachedTarget() || this.stateTimer > 3000) {
              // Pick a random direction to patrol
              const angle = Math.random() * Math.PI * 2;
              const distance = this.detectionRange;
              const targetX = Math.floor(this.gridX + Math.cos(angle) * distance);
              const targetY = Math.floor(this.gridY + Math.sin(angle) * distance);
              
              // Set as target for visualization/reference, but don't use pathfinding
              this.targetCell = { gridX: targetX, gridY: targetY };
              this.currentPath = null;
              this.stateTimer = 0;
            }
            
            // If we have a move timer ready, move toward target
            if (this.timeSinceLastMove >= this.moveInterval) {
              const cellKey = `${this.gridX},${this.gridY}`;
              const validMoves = validMovesLookup[cellKey] || [];
              
              // If we have valid moves from this position
              if (validMoves.length > 0) {
                // Calculate direction toward patrol point
                const dx = this.targetCell.gridX - this.gridX;
                const dy = this.targetCell.gridY - this.gridY;
                
                // Score each move based on how well it moves toward the target
                // Higher score = better move
                const scoredMoves = validMoves.map(move => {
                  // How much closer to target this move gets us
                  const newDx = this.targetCell.gridX - move.x;
                  const newDy = this.targetCell.gridY - move.y;
                  
                  // Manhattan distance improvement
                  const currentDist = Math.abs(dx) + Math.abs(dy);
                  const newDist = Math.abs(newDx) + Math.abs(newDy);
                  const improvement = currentDist - newDist;
                  
                  // Add some randomness (0-0.3) for natural movement
                  const randomFactor = Math.random() * 0.3;
                  
                  return {
                    move,
                    score: improvement + randomFactor
                  };
                });
                
                // Sort by score (highest first)
                scoredMoves.sort((a, b) => b.score - a.score);
                
                // Choose first move, or a random move from top 3 with diminishing probability
                let selectedMove;
                if (Math.random() < 0.7) {
                  // 70% chance to take best move
                  selectedMove = scoredMoves[0].move;
                } else if (scoredMoves.length > 1 && Math.random() < 0.8) {
                  // 24% chance (0.3 * 0.8) to take second best move
                  selectedMove = scoredMoves[1].move;
                } else if (scoredMoves.length > 2) {
                  // 6% chance to take third best move
                  selectedMove = scoredMoves[2].move;
                } else {
                  // Fallback to first move if not enough options
                  selectedMove = scoredMoves[0].move;
                }
                
                // Apply the movement
                this.x = selectedMove.x * cellSize;
                this.y = selectedMove.y * cellSize;
                this.gridX = selectedMove.x;
                this.gridY = selectedMove.y;
                
                // Reset move timer
                this.timeSinceLastMove = 0;
              }
            }
          }
          break;

        case "hunting":
          if (!this.targetAnimal?.isAlive) {
            this.state = "patrolling";
            this.targetAnimal = null;
            this.currentPath = null;
          } else {
            // Calculate direction toward prey
            const dx = this.targetAnimal.gridX - this.gridX;
            const dy = this.targetAnimal.gridY - this.gridY;
            
            // Use Manhattan distance for hunting checks - faster and grid-appropriate
            const manhattanDistance = calcManhattanDistance(
              this.gridX, this.gridY, this.targetAnimal.gridX, this.targetAnimal.gridY
            );
            
            // Set movement speed to chase speed
            this.moveInterval = this.chaseSpeed;
            
            // If we've reached the prey, try to kill it
            if (manhattanDistance <= Animal.KILL_DISTANCE) {
              this.checkForKills();
              if (!this.targetAnimal?.isAlive) {
                this.hunger = Math.max(0, this.hunger - 70);
                this.state = "patrolling";
                this.targetAnimal = null;
                this.currentPath = null;
                console.log(`${this.type} (${this.gridX}, ${this.gridY}) killed prey and reduced hunger to ${this.hunger.toFixed(1)}`);
              }
            } 
            // If prey is too far, give up chase
            else if (manhattanDistance > this.detectionRange * 2 || this.stateTimer >= 5000) {
              console.log(`${this.type} (${this.gridX}, ${this.gridY}) gave up chase after ${Math.floor(this.stateTimer/1000)}s`);
              this.state = "patrolling";
              this.targetAnimal = null;
              this.currentPath = null;
            }
            // Otherwise continue the chase
            else {
              // Similar approach but prioritize moves toward prey
              const cellKey = `${this.gridX},${this.gridY}`;
              const validMoves = validMovesLookup[cellKey] || [];
              
              if (validMoves.length > 0) {
                // Sort moves by how much closer they get us to the prey
                const scoredMoves = validMoves.map(move => {
                  // Calculate Manhattan distance to prey after this move
                  const newDist = calcManhattanDistance(
                    move.x, move.y, 
                    this.targetAnimal.gridX, this.targetAnimal.gridY
                  );
                  
                  // Lower distance = better move (higher score)
                  return {
                    move,
                    score: 100 - newDist // Invert so higher is better
                  };
                });
                
                // Sort by score (highest first)
                scoredMoves.sort((a, b) => b.score - a.score);
                
                // Take the best move (predators are more direct)
                const selectedMove = scoredMoves[0].move;
                
                // Apply the movement
                this.x = selectedMove.x * cellSize;
                this.y = selectedMove.y * cellSize;
                this.gridX = selectedMove.x;
                this.gridY = selectedMove.y;
                
                // Reset move timer
                this.timeSinceLastMove = 0;
              }
            }
          }
          break;
      }
    } 
    // Prey behavior (seek berries/water or flee)
    else {
      switch (this.state) {
        case "idle":
          // Prey alternates between seeking water and berries based on needs
          if (this.thirst >= this.hunger) {
            this.state = "seekingWater";
            this.targetCell = null;
            this.attemptedTargets = new Set();
          } else {
            this.state = "seekingBerries";
            this.targetCell = null;
          }
          this.stateTimer = 0;
          this.currentPath = null;
          break;

        case "fleeing":
          const predator = nearby.find(a => a.isPredator && a.isAlive);
          // Use Manhattan distance for the predator distance check - faster and grid-appropriate
          const predatorDistance = predator ? 
              calcManhattanDistance(this.gridX, this.gridY, predator.gridX, predator.gridY) : Infinity;
          
          // Adjusted threshold for Manhattan distance (which is usually larger than Euclidean)
          const fleeThreshold = this.detectionRange * 2;
          
          if (!predator || predatorDistance > fleeThreshold) {
            // Resume previous activity or find new one
            this.state = this.thirst >= this.hunger ? "seekingWater" : "seekingBerries";
            this.targetCell = null;
            this.targetAnimal = null;
            this.currentPath = null;
          } else {
            // Find a direction away from the predator
            this.targetAnimal = predator;
            this.findEscapePath(predator);
          }
          break;

        case "seekingWater":
          // Check if a predator is nearby - flee takes priority
          const nearbyPredatorWater = nearby.find(a => a.isPredator && a.isAlive);
          if (nearbyPredatorWater) {
            this.state = "fleeing";
            this.targetAnimal = nearbyPredatorWater;
            this.stateTimer = 0;
            this.currentPath = null;
            break;
          }

          // If we already know there are no lakes nearby, don't waste time searching
          if (this.noLakesNearby) {
            this.state = "seekingBerries";
            this.targetCell = null;
            this.stateTimer = 0;
            this.currentPath = null;
            break;
          }

          // Handle case where outsideRingLakeBorders doesn't exist or is empty
          if (!outsideRingLakeBorders || outsideRingLakeBorders.length === 0) {
            console.log(`🏝️ ${this.type} (${this.gridX}, ${this.gridY}) no lakes exist on this map`);
            this.noLakesNearby = true;
            this.state = "seekingBerries";
            this.targetCell = null;
            this.stateTimer = 0;
            this.currentPath = null;
            break;
          }

          // If we already have a path, follow it instead of finding a new target
          if (this.currentPath && this.pathIndex < this.currentPath.length) {
            // Path exists and is being followed, no need to do anything here
            // The handleMovement method will follow the path
          }
          // If we have a target but no path, we need to switch to berries
          else if (this.targetCell && !this.currentPath) {
            console.log(`🔄 ${this.type} (${this.gridX}, ${this.gridY}) no valid path to water, switching to berries`);
            this.state = "seekingBerries";
            this.targetCell = null;
            this.stateTimer = 0;
            break;
          }
          // If we don't have a target, find one
          else if (!this.targetCell) {
            // Try to find path to lake first
            const pathToLake = findPathToNearestCell(this.gridX, this.gridY, outsideRingLakeBorders);
            
            if (!pathToLake) {
                // Fallback 1: Check for potable puddles in 6 cell radius
                const nearbyPuddles = potablePuddleCells?.filter(cell => 
                    calcDistance(this.gridX, this.gridY, cell.gridX || cell.x, cell.gridY || cell.y) <= 6
                );
                
                if (nearbyPuddles && nearbyPuddles.length > 0) {
                    // Move to closest puddle
                    const closestPuddle = nearbyPuddles.reduce((closest, current) => {
                        const currentDist = calcDistance(this.gridX, this.gridY, current.gridX || current.x, current.gridY || current.y);
                        const closestDist = calcDistance(this.gridX, this.gridY, closest.gridX || closest.x, closest.gridY || closest.y);
                        return currentDist < closestDist ? current : closest;
                    });
                    this.targetCell = closestPuddle;
                    console.log(`🌊 ${this.type} (${this.gridX}, ${this.gridY}) found nearby puddle`);
                } else {
                    // Fallback 2: No water sources found, switch to random movement
                    this.state = "random";
                    console.log(`🎲 ${this.type} (${this.gridX}, ${this.gridY}) no water found, moving randomly`);
                }
            } else {
                // Set the path from lake pathfinding
                this.currentPath = pathToLake;
                this.pathIndex = 0;
                
                // Set target to the end of the path
                const endPoint = pathToLake[pathToLake.length - 1];
                this.targetCell = { gridX: endPoint.x, gridY: endPoint.y };
            }
          }

          if (this.hasReachedTarget()) {
            this.state = "drinking";
            this.stateTimer = 0;
            console.log(`💧 ${this.type} (${this.gridX}, ${this.gridY}) reached water`);
          }
          break;

        case "drinking":
          // Check if a predator is nearby - flee takes priority
          const nearbyPredatorDrinking = nearby.find(a => a.isPredator && a.isAlive);
          if (nearbyPredatorDrinking) {
            this.state = "fleeing";
            this.targetAnimal = nearbyPredatorDrinking;
            this.stateTimer = 0;
            this.currentPath = null;
            break;
          }

          if (this.stateTimer >= 2000) {
            this.thirst = Math.max(0, this.thirst - 60);
            console.warn(`🚰 ${this.type} (${this.gridX}, ${this.gridY}) finished drinking, thirst: ${this.thirst.toFixed(1)}`);
            // Always go to berries after drinking
            this.state = "seekingBerries";
            this.targetCell = null;
            this.attemptedTargets.clear();
            this.stateTimer = 0;
            this.currentPath = null;
          }
          break;

        case "seekingBerries":
          // Check if a predator is nearby - flee takes priority
          const nearbyPredatorBerries = nearby.find(a => a.isPredator && a.isAlive);
          if (nearbyPredatorBerries) {
            this.state = "fleeing";
            this.targetAnimal = nearbyPredatorBerries;
            this.stateTimer = 0;
            this.currentPath = null;
            break;
          }

          // If we already have a path, follow it instead of finding a new target
          if (this.currentPath && this.pathIndex < this.currentPath.length) {
            // Path exists and is being followed, no need to do anything here
            // The handleMovement method will follow the path
          }
          // If we have a target but no path, we need to switch to water
          else if (this.targetCell && !this.currentPath) {
            console.log(`🔄 ${this.type} (${this.gridX}, ${this.gridY}) no valid path to berries, switching to water`);
            this.state = "seekingWater";
            this.targetCell = null;
            this.stateTimer = 0;
            break;
          }
          // If we don't have a target, find one
          else if (!this.targetCell) {
            if (!gBushesPositions.length) {
              console.log(`${this.type} (${this.gridX}, ${this.gridY}) failed to find berries - none exist on map`);
              this.state = "seekingWater"; // Try water instead
              this.targetCell = null;
              this.stateTimer = 0;
              this.currentPath = null;
              break;
            }
            
            // Find berries within 6 cell radius using Manhattan distance
            const BERRY_SEARCH_RADIUS = 6;
            const nearbyBerries = gBushesPositions.filter(bush => {
              if (!bush.gridX || !bush.gridY) return false;
              const distance = calcManhattanDistance(this.gridX, this.gridY, bush.gridX, bush.gridY);
              return distance <= BERRY_SEARCH_RADIUS;
            });

            // If found nearby berries, pick the closest one
            if (nearbyBerries.length > 0) {
              // Sort by distance and take the closest
              this.targetCell = nearbyBerries.sort((a, b) => {
                const distA = calcManhattanDistance(this.gridX, this.gridY, a.gridX, a.gridY);
                const distB = calcManhattanDistance(this.gridX, this.gridY, b.gridX, b.gridY);
                return distA - distB;
              })[0];

              // Try to find a path to the closest berry
              const berryPathResult = this.findPathToTarget({x: this.targetCell.gridX, y: this.targetCell.gridY});
              if (!berryPathResult) {
                console.log(`🚫 ${this.type} (${this.gridX}, ${this.gridY}) couldn't find path to nearby berries`);
                this.state = "seekingWater";
                this.targetCell = null;
                this.stateTimer = 0;
                this.currentPath = null;
                break;
              }
              console.log(`✅ ${this.type} (${this.gridX}, ${this.gridY}) found path to nearby berries. Length: ${this.currentPath.length} steps`);
            } else {
              // No berries within radius, switch to water
              console.log(`🔍 ${this.type} (${this.gridX}, ${this.gridY}) no berries within ${BERRY_SEARCH_RADIUS} cells`);
              this.state = "seekingWater";
              this.targetCell = null;
              this.stateTimer = 0;
              this.currentPath = null;
              break;
            }
          }
          
          if (this.hasReachedTarget()) {
            this.state = "eating";
            this.stateTimer = 0;
            console.log(`🍓 ${this.type} (${this.gridX}, ${this.gridY}) reached berries`);
          }
          break;

        case "eating":
          // Check if a predator is nearby - flee takes priority
          const nearbyPredatorEating = nearby.find(a => a.isPredator && a.isAlive);
          if (nearbyPredatorEating) {
            this.state = "fleeing";
            this.targetAnimal = nearbyPredatorEating;
            this.stateTimer = 0;
            this.currentPath = null;
            break;
          }

          if (this.stateTimer >= 2000) {
            this.hunger = Math.max(0, this.hunger - 50);
            console.log(`🍽️ ${this.type} (${this.gridX}, ${this.gridY}) finished eating, hunger: ${this.hunger.toFixed(1)}`);
            // Always go to water after eating
            this.state = "seekingWater";
            this.targetCell = null;
            this.stateTimer = 0;
            this.currentPath = null;
          }
          break;

        case "random":
          // Get all empty adjacent cells that are walkable
          const adjacentCells = [];
          const offsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
          
          for (const [dx, dy] of offsets) {
              const newX = this.gridX + dx;
              const newY = this.gridY + dy;
              const key = `${newX},${newY}`;
              
              // Check if the cell is walkable using our lookup
              if (walkableCellsLookup.has(key)) {
                  adjacentCells.push({ gridX: newX, gridY: newY });
              }
          }
          
          if (adjacentCells.length > 0) {
              // Pick a random empty adjacent cell
              const randomCell = adjacentCells[Math.floor(Math.random() * adjacentCells.length)];
              this.targetCell = randomCell;
              
              // Apply movement immediately
              this.x = randomCell.gridX * cellSize;
              this.y = randomCell.gridY * cellSize;
              this.gridX = randomCell.gridX;
              this.gridY = randomCell.gridY;
              
              // After random movement, go back to seeking needs
              this.state = this.thirst >= this.hunger ? "seekingWater" : "seekingBerries";
          } else {
              // If no walkable cells, try again next update
              console.log(`⚠️ ${this.type} (${this.gridX}, ${this.gridY}) trapped with no walkable cells`);
              this.state = "idle";
          }
          break;
      }
    }
  }

  // Check if the animal has reached its current target
  hasReachedTarget() {
    if (!this.targetCell) return false;
    
    // Get target coordinates regardless of format
    const targetX = this.targetCell.x || this.targetCell.gridX || 0;
    const targetY = this.targetCell.y || this.targetCell.gridY || 0;
    
    if (targetX === 0 && targetY === 0) return false; // Invalid target
    
    // Use Manhattan distance for grid-based "reached target" check
    // An animal is considered to have reached the target if within 1 cell
    return calcManhattanDistance(this.gridX, this.gridY, targetX, targetY) <= 1;
  }

  // Find a path to the target using the pathfinding algorithm
  findPathToTarget(target) {
    if (!target) return false;
    
    // Get target coordinates regardless of format
    const targetX = target.x || target.gridX || 0;
    const targetY = target.y || target.gridY || 0;
    
    if (targetX === 0 && targetY === 0) {
      console.log(`Invalid target coordinates for ${this.type}: `, target);
      return false;
    }
    
    // If path is on cooldown and we already have a path, keep using it
    if (this.pathCooldown > 0 && this.currentPath && this.currentPath.length > 0) {
      return true;
    }
    
    // Skip if the target hasn't changed and we still have a valid path
    if (this.lastPathTarget && 
        this.lastPathTarget.x === targetX && 
        this.lastPathTarget.y === targetY &&
        this.currentPath && 
        this.pathIndex < this.currentPath.length) {
      return true;
    }
    
    const start = { x: this.gridX, y: this.gridY };
    const end = { x: targetX, y: targetY };
    
    // Generate cache key
    const cacheKey = `${start.x},${start.y}-${end.x},${end.y}`;
    
    // Check if we have a valid cached path
    if (pathCache[cacheKey] && 
        Date.now() - pathCache[cacheKey].timestamp < PATH_CACHE_TTL) {
      this.currentPath = pathCache[cacheKey].path;
      this.pathIndex = 0;
      this.lastPathTarget = { x: targetX, y: targetY };
      return true;
    }
    
    // Use existing findPath function from the game
    const path = findPath(start, end, true);
    
    if (path && path.length > 0) {
      // Cache the result
      pathCache[cacheKey] = {
        path: path,
        timestamp: Date.now()
      };
      
      // Set the current path
      this.currentPath = path;
      this.pathIndex = 0;
      this.lastPathTarget = { x: targetX, y: targetY };
      
      // Set cooldown to prevent recalculating too often
      this.pathCooldown = Animal.PATH_RECALC_COOLDOWN;
      
      return true;
    } else {
      console.log(`No path found for ${this.type} from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);
      // Still set a cooldown to prevent hammering the pathfinding
      this.pathCooldown = Animal.PATH_RECALC_COOLDOWN * 0.5; // Half cooldown for failed paths
      return false;
    }
  }

  // Find a path away from a predator
  findEscapePath(predator) {
    const cellKey = `${this.gridX},${this.gridY}`;
    const validMoves = validMovesLookup[cellKey] || [];
    
    if (validMoves.length === 0) {
      console.log(`${this.type} (${this.gridX}, ${this.gridY}) tried to flee but is trapped!`);
      return false;
    }
    
    // Calculate direction away from predator
    const dx = this.gridX - predator.gridX;
    const dy = this.gridY - predator.gridY;
    
    // Score each move based on how well it moves away from the predator
    const scoredMoves = validMoves.map(move => {
      // How much further from predator this move gets us
      const newDx = move.x - predator.gridX;
      const newDy = move.y - predator.gridY;
      
      // Manhattan distance from predator after move
      const distFromPredator = Math.abs(newDx) + Math.abs(newDy);
      
      return {
        move,
        score: distFromPredator // Higher distance = better move
      };
    });
    
    // Sort by score (highest first)
    scoredMoves.sort((a, b) => b.score - a.score);
    
    // Always choose the best escape path
    const bestMove = scoredMoves[0].move;
    
    // Apply the movement immediately
    this.targetCell = { gridX: bestMove.x, gridY: bestMove.y };
    this.currentPath = null; // Clear any existing path
    
    this.x = bestMove.x * cellSize;
    this.y = bestMove.y * cellSize;
    this.gridX = bestMove.x;
    this.gridY = bestMove.y;
    
    console.log(`${this.type} (${this.gridX}, ${this.gridY}) fleeing from predator at (${predator.gridX}, ${predator.gridY})`);
    return true;
  }

  handleMovement(deltaTime) {
    this.timeSinceLastMove += deltaTime;
    
    // For states that still use pathfinding (everything except hunting and fleeing),
    // the movement is still handled here
    if (this.currentPath && this.pathIndex < this.currentPath.length && 
        this.timeSinceLastMove >= this.moveInterval) {
      const nextCell = this.currentPath[this.pathIndex];
      this.x = nextCell.x * cellSize;
      this.y = nextCell.y * cellSize;
      this.gridX = nextCell.x;
      this.gridY = nextCell.y;
      this.pathIndex++;
      this.checkForKills();
      this.timeSinceLastMove = 0;
    }
    // For hunting and fleeing states, the movement is applied directly in the state handlers
    // just reset the timer to prevent multiple movements in the same frame
    else if (this.timeSinceLastMove >= this.moveInterval && ["hunting", "fleeing", "patrolling"].includes(this.state)) {
      this.timeSinceLastMove = 0;
    }
  }














  checkReproduction(deltaTime) {
    if (this.moveInterval === this.chaseSpeed || animals.length >= Animal.MAX_ANIMALS) return;
    this.timeSinceLastReproduction += deltaTime;
    if (this.timeSinceLastReproduction < Animal.REPRODUCTION_INTERVAL) return;

    const sameSpecies = animals.filter(a => a.type === this.type && a.isAlive);
    if (sameSpecies.length < 2) return;

    const adjacent = [[this.gridX + 1, this.gridY], [this.gridX - 1, this.gridY], 
                    [this.gridX, this.gridY + 1], [this.gridX, this.gridY - 1]]
                    .map(([x, y]) => ({ x, y }))
                    .filter(c => emptyCells.some(g => g.x === c.x && g.y === c.y));
    
    if (adjacent.length) {
      const birthCell = adjacent[Math.floor(Math.random() * adjacent.length)];
      const newAnimal = new Animal(birthCell.x, birthCell.y, this.type);
      animals.push(newAnimal);
      newAnimal.animateEmoji('pulse', newAnimal.emoji, 800);
    }
    this.timeSinceLastReproduction = 0;
  }

  checkForKills() {
    if (!this.isPredator || !this.isAlive || this.isFrozen) return;
    
    // Use Manhattan distance for grid-based kill checks
    // Animal is considered within kill range if Manhattan distance <= KILL_DISTANCE
    const killRange = Animal.KILL_DISTANCE;
    
    const prey = animals.find(a => 
      a !== this && 
      !a.isPredator && 
      a.isAlive && 
      calcManhattanDistance(this.gridX, this.gridY, a.gridX, a.gridY) <= killRange
    );
    
    if (prey) this.killAnimal(prey);
  }

  killAnimal(prey) {
    [this, prey].forEach(a => { a.isFrozen = true; a.freezeTime = Date.now(); });
    prey.isDying = true;
    prey.deathTime = Date.now();
    prey.animateEmoji('small', prey.emoji, 500);
    setTimeout(() => prey.animateEmoji('fade', '🥩', 500), 500);
    this.animateEmoji('fade', this.emoji, 500);
    setTimeout(() => { prey.isAlive = false; animals.splice(animals.indexOf(prey), 1); }, 2000);
    setTimeout(() => this.isFrozen = false, 3000);
  }

  animateEmoji(type, emoji, duration = 500) {
    if (type === 'drown') {
      this.animation = Animation.create('small', emoji, duration * 0.3, this.x, this.y);
      setTimeout(() => this.isAlive && (this.animation = Animation.create('fade', '💦', duration * 0.7, this.x, this.y)), duration * 0.4);
    } else {
      this.animation = Animation.create(type, emoji, duration, this.x, this.y);
    }
  }

  drawAnimation(ctx) {
    if (!this.animation) return false;
    Animation.updatePosition(this.animation, this.x, this.y);
    const isActive = Animation.draw(ctx, this.animation);
    if (!isActive) this.animation = null;
    return isActive;
  }

  draw(ctx) {
    if (!this.isAlive || (this.isDying && Date.now() - this.deathTime >= 2000)) return;
    if (!this.drawAnimation(ctx)) {
      ctx.fillStyle = 'black';
      ctx.font = `${this.getFontSize()}px Arial`;
      ctx.fillText(this.emoji, this.x, this.y);
    }
    
    // Optionally visualize the current path for debugging
    if (this.currentPath && this.currentPath.length > 0) {
      ctx.strokeStyle = this.isPredator ? "rgba(255,0,0,0.5)" : "rgba(0,255,0,0.5)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      
      // Start from current position
      ctx.moveTo(this.x + cellSize/2, this.y + cellSize/2);
      
      // Draw path from current index to target
      for (let i = this.pathIndex; i < this.currentPath.length && i; i++) {
        const cell = this.currentPath[i];
          ctx.lineTo(cell.x * cellSize + cellSize/2, cell.y * cellSize + cellSize/2);
        
      }
      ctx.stroke();
      
      // Draw a circle at the target
      if (this.targetCell) {
        const targetX = this.targetCell.x || this.targetCell.gridX || 0;
        const targetY = this.targetCell.y || this.targetCell.gridY || 0;
        if (targetX !== 0 || targetY !== 0) {
          ctx.beginPath();
          ctx.arc(targetX * cellSize + cellSize/2, targetY * cellSize + cellSize/2, cellSize/3, 0, Math.PI * 2);
          ctx.fillStyle = this.isPredator ? "rgba(255,0,0,0.3)" : "rgba(0,255,0,0.3)";
          ctx.fill();
        }
      }
    }
  }
}

function starterAnimalPopulations(amount = 20) {
  // Clear existing animals
  animals = [];
  //clear animalsctx
  

  // Group cells by terrain type
  const sandCells = emptyCells.filter(cell => parseFloat(cell.noise) < 0.05);
  const mountainCells = emptyCells.filter(cell => parseFloat(cell.noise) > 0.4);
  const middleCells = emptyCells.filter(cell => {
    const noise = parseFloat(cell.noise);
    return noise >= 0.15 && noise <= 0.2;
  });

  // Distribution percentages
  const coyotePercent = 0.10;  // 15% coyotes
  const bearPercent = 0.10;    // 15% bears
  const sheepPercent = 0.2;   // 35% sheep
  const chickenPercent = 0.2; // 35% chickens
  const cowPercent = 0.2; // 5% cows
  const pigPercent = 0.2; // 5% pigs

  // Calculate counts
  const coyoteCount = Math.floor(amount * coyotePercent);
  const bearCount = Math.floor(amount * bearPercent);
  const sheepCount = Math.floor(amount * sheepPercent);
  const chickenCount = Math.floor(amount * chickenPercent);
  const cowCount = Math.floor(amount * cowPercent);
  const pigCount = Math.floor(amount * pigPercent);



  // Helper function to place animals
  function placeAnimals(count, type, cells) {
    for (let i = 0; i < count; i++) {
      if (cells.length === 0) return;
      const randomIndex = Math.floor(Math.random() * cells.length);
      const cell = cells[randomIndex];
      // Remove used cell to prevent overlap
      cells.splice(randomIndex, 1);
      
      const animal = new Animal(cell.x, cell.y, type);
      animals.push(animal);
    }
  }

  // Place predators
  placeAnimals(coyoteCount, 'Coyote', sandCells);
  placeAnimals(bearCount, 'Bear', mountainCells);

  // Place prey
  placeAnimals(sheepCount, 'Sheep', middleCells);
  placeAnimals(chickenCount, 'Chicken', middleCells);
  placeAnimals(cowCount, 'Cow', middleCells);
  placeAnimals(pigCount, 'Pig', middleCells);

  console.log(`Distributed ${animals.length} animals:`,
    `${coyoteCount} coyotes,`,
    `${bearCount} bears,`,
    `${sheepCount} sheep,`,
    `${chickenCount} chickens`
  );
  //camera.centerCanvasOnMap();
 // camera.centerCanvasOnMap();


} 


/* 
function moveCoyote(coyote, prey = null) {
  // If chasing prey, use normal movement logic
  if (prey) {
    // Use existing movement logic
    return moveAnimal(coyote);
  }

  // If no sand cells available, use normal movement
  if (sandCells.length === 0) {
    return moveAnimal(coyote);
  }

  // Find nearby sand cells within movement range
  const nearbySteps = 3; // How far the coyote can move
  const nearbySand = sandCells.filter(cell => {
    const distance = Math.sqrt(
      Math.pow(cell.x - coyote.x, 2) + 
      Math.pow(cell.y - coyote.y, 2)
    );
    return distance <= nearbySteps;
  });

  // If no nearby sand cells, stay in place
  if (nearbySand.length === 0) {
    return false;
  }

  // Choose a random nearby sand cell
  const targetCell = nearbySand[Math.floor(Math.random() * nearbySand.length)];
  
  // Update coyote position
  coyote.x = targetCell.x;
  coyote.y = targetCell.y;
  
  return true;
}
 */

// Add this to the updateGameState function
function updateGameState(deltaTime) {
  // Reset pathfinding call counter each frame
  currentPathfindingCalls = 0;
  
  // Initialize lookups if needed
  if (!validMovesLookup || Object.keys(validMovesLookup).length === 0) {
    precomputeValidMoves();
    initWalkableCellsLookup(); // Initialize walkable cells lookup
  }
  
  // Clean up path cache periodically (every ~5 seconds based on 60 FPS)
  if (Math.random() < 0.01) {
    cleanupPathCache();
  }
  
  // Update the spatial grid first so animals can use it
  updateAnimalSpatialGrid();
  
  // Update all animals
  for (const animal of animals) {
    animal.update(deltaTime);
  }
  
  // Rest of game update logic...
}

// Call this whenever the game world changes
function updateValidMovesLookup(changedCells) {
  // For each changed cell, update both lookups
  for (const cell of changedCells) {
    const key = `${cell.x},${cell.y}`;
    
    // Check if this cell is now empty or not
    const isEmpty = emptyCells.some(c => c.x === cell.x && c.y === cell.y);
    
    // Update walkable cells lookup
    if (isEmpty) {
      walkableCellsLookup.add(key);
    } else {
      walkableCellsLookup.delete(key);
    }
    
    // Rest of the existing updateValidMovesLookup function...
    if (isEmpty) {
      const possibleMoves = [
        { x: cell.x + 1, y: cell.y }, { x: cell.x - 1, y: cell.y },
        { x: cell.x, y: cell.y + 1 }, { x: cell.x, y: cell.y - 1 },
        { x: cell.x + 1, y: cell.y + 1 }, { x: cell.x - 1, y: cell.y - 1 },
        { x: cell.x + 1, y: cell.y - 1 }, { x: cell.x - 1, y: cell.y + 1 }
      ];
      
      validMovesLookup[key] = possibleMoves.filter(move => 
        walkableCellsLookup.has(`${move.x},${move.y}`) // Use new lookup here too
      );
    } else {
      delete validMovesLookup[key];
    }
    
    // Update adjacent cells
    const adjacentOffsets = [
      [1, 0], [-1, 0], [0, 1], [0, -1], 
      [1, 1], [-1, -1], [1, -1], [-1, 1]
    ];
    
    for (const [dx, dy] of adjacentOffsets) {
      const adjacentX = cell.x + dx;
      const adjacentY = cell.y + dy;
      const adjacentKey = `${adjacentX},${adjacentY}`;
      
      // If this adjacent cell is walkable, update its valid moves
      if (walkableCellsLookup.has(adjacentKey)) {
        const possibleMoves = [
          { x: adjacentX + 1, y: adjacentY }, { x: adjacentX - 1, y: adjacentY },
          { x: adjacentX, y: adjacentY + 1 }, { x: adjacentX, y: adjacentY - 1 },
          { x: adjacentX + 1, y: adjacentY + 1 }, { x: adjacentX - 1, y: adjacentY - 1 },
          { x: adjacentX + 1, y: adjacentY - 1 }, { x: adjacentX - 1, y: adjacentY + 1 }
        ];
        
        validMovesLookup[adjacentKey] = possibleMoves.filter(move => 
          walkableCellsLookup.has(`${move.x},${move.y}`) // Use new lookup here too
        );
      }
    }
  }
}

// Add function to analyze map connectivity
function analyzeMapConnectivity() {
  const regions = new Map();
  let regionId = 0;
  
  // Flood fill to identify disconnected regions
  for (const cell of emptyCells) {
    if (!regions.has(`${cell.x},${cell.y}`)) {
      const region = floodFill(cell);
      regions.set(regionId++, region);
    }
  }
  
  // Log connectivity info
  console.log(`Map has ${regions.size} disconnected regions`);
  regions.forEach((region, id) => {
    console.log(`Region ${id}: ${region.size} cells, ${countWaterSources(region)} water sources`);
  });
}