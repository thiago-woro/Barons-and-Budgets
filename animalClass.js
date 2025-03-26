let timesUsedPathFinderFunction = 0;
// Add at the top with other globals
let walkableCellsLookup = new Set(); // Will store walkable cell coordinates as "x,y" strings
let throttledPathfindingTimer = 0;
let maxPathfindingCallsPerFrame = 3; // Limit pathfinding calls per frame
let pathfindingCallsThisFrame = 0; // Track how many calls we've made this frame
let globalPathfindingEnabled = true; // Global switch to disable pathfinding when too intensive
let pathfindingDisabledUntil = 0; // Timestamp when to re-enable pathfinding
let pathfindingCooldown = 5000; // 5 seconds cooldown when pathfinding is disabled
const PATH_FINDING_COOLDOWN = 5000; // Constant for cooldown duration

// Constants for animal behavior
const THIRST_THRESHOLD = 60; // When to start seeking water
const HUNGER_THRESHOLD = 70; // When to start seeking food
const WANDER_CHANCE = 0.02; // Chance to wander when idle
const IDLE_ANIMATION_CHANCE = 0.01; // Chance to play idle animation
const DRINKING_RATE = 25; // How fast thirst is reduced when drinking
const EATING_RATE = 20; // How fast hunger is reduced when eating
const MIN_STATE_DURATION = 500; // Minimum time (ms) to stay in a state
const MAX_SEEKING_DURATION = 5000; // Maximum time to look for resources
const STATE_HISTORY_SIZE = 5; // How many recent states to track
const WANDER_MIN_DURATION = 3000; // Minimum time to stay in wandering state (ms)
const WANDER_MAX_DURATION = 8000; // Maximum time to stay in wandering state (ms)
const WANDER_RADIUS = 6; // Cell radius to wander within

// Function to initialize walkable cells lookup
function initWalkableCellsLookup() {
  walkableCellsLookup.clear();
  for (const cell of emptyCells) {
    walkableCellsLookup.add(`${cell.x},${cell.y}`);
  }
  console.log(`Initialized walkable cells lookup with ${walkableCellsLookup.size} cells`);
}

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

/**
 * Finds resources within a specified radius around the animal
 * @param {number} startX - Starting X grid position
 * @param {number} startY - Starting Y grid position
 * @param {number} radius - Radius to search within
 * @param {string} resourceType - Type of resource to look for: 'water', 'berries', 'grass'
 * @returns {object|null} - Returns the closest resource cell or null if none found
 */
function findResourceWithinRadius(startX, startY, radius, resourceType) {
  // Make sure radius is positive
  radius = Math.abs(radius);
  let targetCells = [];
  
  // Get appropriate cells based on resource type
  switch (resourceType) {
    case 'water':
      // Try puddles first (they're easier to access)
      if (potablePuddleCells && potablePuddleCells.length > 0) {
        targetCells = potablePuddleCells;
      }
      // If no puddles, try lakes
      else if (outsideRingLakeBorders && outsideRingLakeBorders.length > 0) {
        targetCells = outsideRingLakeBorders;
      }
      break;
    case 'berries':
      if (gBushesPositions && gBushesPositions.length > 0) {
        targetCells = gBushesPositions;
      }
      break;
    case 'grass':
      // For grass, we just find an empty cell
      targetCells = emptyCells;
      break;
    default:
      console.error(`Unknown resource type: ${resourceType}`);
      return null;
  }
  
  // If no targets, return null
  if (!targetCells || targetCells.length === 0) return null;
  
  // Find cells within the radius
  const cellsInRadius = [];
  
  for (const cell of targetCells) {
    // Extract grid coordinates - handle both formats
    const cellX = cell.gridX !== undefined ? cell.gridX : cell.x;
    const cellY = cell.gridY !== undefined ? cell.gridY : cell.y;
    
    // Calculate distance
    const distance = calcManhattanDistance(startX, startY, cellX, cellY);
    
    if (distance <= radius) {
      cellsInRadius.push({
        cell,
        distance,
        gridX: cellX,
        gridY: cellY
      });
    }
  }
  
  // If no cells found within radius, return null
  if (cellsInRadius.length === 0) return null;
  
  // Sort by distance and return the closest
  cellsInRadius.sort((a, b) => a.distance - b.distance);
  return cellsInRadius[0];
}

// Function to find a random cell within a radius
function findRandomCellWithinRadius(startX, startY, radius) {
  // Get all empty cells within the radius
  const cellsInRadius = [];
  
  for (const cell of emptyCells) {
    const distance = calcManhattanDistance(startX, startY, cell.x, cell.y);
    if (distance <= radius && distance > 0) { // Exclude the starting cell
      cellsInRadius.push({
        gridX: cell.x,
        gridY: cell.y,
        distance
      });
    }
  }
  
  // If no cells found, return null
  if (cellsInRadius.length === 0) return null;
  
  // Return a random cell from those in radius
  const randomIndex = Math.floor(Math.random() * cellsInRadius.length);
  return cellsInRadius[randomIndex];
}

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
    this.eatsGrass = ['Cow', 'Chicken'].includes(type); // Flag for animals that eat grass
    this.eatsPlants = !this.isPredator; // Non-predators eat plants
    this.eatsAnimals = this.isPredator; // Predators eat animals

    // Movement
    this.moveInterval = this.isPredator ? Animal.PREY_BASE_SPEED / Animal.PREDATOR_SPEED_MULTIPLIER : Animal.PREY_BASE_SPEED;
    this.normalSpeed = this.moveInterval;
    this.chaseSpeed = this.moveInterval * 0.8;
    this.timeSinceLastMove = 0;
    this.directionChangeChance = this.isPredator ? 0.2 : 0.4;
    this.detectionRange = this.isPredator ? 5 : 4;
    this.targetAnimal = null;
    this.targetCell = null;
    this.lastMoveFromX = undefined; // Track last position for better random movement
    this.lastMoveFromY = undefined;
    
    // State management for resources
    this.resourceCooldown = 0; // Cooldown timer for resource searches
    this.moveCooldown = 0; // Cooldown for direct movement
    this.wanderDuration = 0; // How long to stay in wandering state
    this.stateChangeCount = 0; // Track how many times we've changed state
    this.stateChangeLimit = 10; // Force random movement after this many state changes

    // Needs
    this.hunger = 65; // Start with some hunger
    this.thirst = 70; // Start with some thirst
    this.maxNeed = 100;
    this.hungerRate = this.isPredator ? 0.6 : 0.5;
    this.thirstRate = 0.3;

    // Reproduction
    this.timeSinceLastReproduction = Math.random() * Animal.REPRODUCTION_INTERVAL;

    // Behavior state
    this.state = this.isPredator ? "patrolling" : "idle"; // Different default states for predators vs prey
    this.lastState = this.state; // Track state changes
    this.stateTimer = 0;
    this.stateChangeTime = Date.now(); // Track when we last changed state
    this.stateHistory = [this.state]; // Track recent states to detect cycling
    this.attemptedTargets = new Set();
    this.noLakesNearby = false; // Flag to indicate if this animal can't find lakes
    
    // Animation properties
    this.idleAnimations = { 
      shake: true, 
      nod: true 
    }; // Different idle animations the animal can perform
    this.currentIdleAnimation = null; // Current animation playing
    this.idleAnimationStart = 0; // When the animation started
    this.idleAnimationDuration = 0; // How long the animation should play
  }

  setMovement(mode, targetAnimal = null, targetCell = null) {
    this.movementMode = mode;
    this.targetAnimal = targetAnimal;
    
    if (targetCell) {
      this.targetCell = targetCell;
    }
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

    // Update cooldowns
    if (this.resourceCooldown > 0) {
      this.resourceCooldown -= deltaTime;
    }
    if (this.moveCooldown > 0) {
      this.moveCooldown -= deltaTime;
    }

    if (this.age >= (this.isPredator ? Animal.PREDATOR_MAX_AGE : Animal.MAX_AGE)) {
      this.isAlive = false;
      animals.splice(animals.indexOf(this), 1);
      return;
    }

    // Basic idle state transitions based on needs
    if (this.state === 'idle') {
      // Check if we need water or food
      if (this.thirst > THIRST_THRESHOLD) {
        this.setState('seekingWater');
      } else if (this.hunger > HUNGER_THRESHOLD) {
        if (this.eatsPlants) {
          if (Math.random() < 0.5) {
            this.setState('seekingGrass');
          } else {
            this.setState('seekingBerries');
          }
        } else if (this.eatsAnimals) {
          this.setState('hunting');
        }
      } else if (Math.random() < WANDER_CHANCE) {
        this.setState('wandering');
        this.wanderDuration = Math.random() * (WANDER_MAX_DURATION - WANDER_MIN_DURATION) + WANDER_MIN_DURATION;
      }
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
    
    // Prevent state cycling by tracking the last few states
    if (this.state !== this.lastState) {
      // Don't add duplicate states
      if (this.stateHistory.length === 0 || this.stateHistory[this.stateHistory.length - 1] !== this.state) {
        this.stateHistory.push(this.state);
        while (this.stateHistory.length > STATE_HISTORY_SIZE) {
          this.stateHistory.shift();
        }
      }
      this.lastState = this.state;
      this.stateChangeTime = Date.now();
    }
    
    // Check for state cycling and enforce min state duration
    const currentTime = Date.now();
    const stateTimeDelta = currentTime - this.stateChangeTime;
    
    // Don't allow rapid state changes
    if (stateTimeDelta < MIN_STATE_DURATION) {
      return; // Skip state update this frame
    }
    
    // Detect and handle state cycling
    if (this.isStateLooping()) {
      console.log(`${this.type} is cycling states: ${this.stateHistory.join(' -> ')}`);
      // If we're in a loop, pick a different random state
      const randomState = this.getRandomNonLoopingState();
      this.setState(randomState);
      return;
    }
    
    // Skip full behavior update occasionally when there are many animals
    // to reduce processing load
    if (animals.length > 30 && Math.random() < 0.3) {
      // Only process critical behaviors like fleeing from predators
      const predator = nearby.find(a => a.isPredator && a.isAlive);
      if (predator && this.state !== "fleeing" && !this.isPredator) {
        this.setState("fleeing");
        this.targetAnimal = predator;
        this.stateTimer = 0;
        return;
      }
      return;
    }

    // Check if we're stuck in a state loop
    if (this.stateChangeCount >= this.stateChangeLimit && !this.isPredator) {
      console.log(`🔄 ${this.type} (${this.gridX}, ${this.gridY}) detected potential state loop, forcing wandering`);
      this.setState("wandering");
      this.targetCell = null;
      this.stateTimer = 0;
      this.stateChangeCount = 0;
      this.wanderDuration = Math.random() * (WANDER_MAX_DURATION - WANDER_MIN_DURATION) + WANDER_MIN_DURATION;
    }

    // Check for predator threat - this takes highest priority for prey
    if (!this.isPredator) {
      const predator = nearby.find(a => a.isPredator && a.isAlive);
      if (predator && this.state !== "fleeing") {
        this.setState("fleeing");
        this.targetAnimal = predator;
        this.stateTimer = 0;
        return;
      }
    }
    
    // Handle resource seeking behaviors using simplified approach

    // Search for water if in seekingWater state
    if (this.state === "seekingWater" && !this.targetCell) {
      // If our resource cooldown is done, look for water
      if (this.resourceCooldown <= 0) {
        console.log(`🔍 ${this.type} (${this.gridX}, ${this.gridY}) looking for water`);
        
        // Try to find water within radius
        const waterResource = findResourceWithinRadius(this.gridX, this.gridY, 10, 'water');
        
        if (waterResource) {
          // Water found, move toward it
          this.targetCell = { 
            gridX: waterResource.gridX, 
            gridY: waterResource.gridY
          };
          console.log(`${this.type} found water at (${waterResource.gridX}, ${waterResource.gridY})`);
        } else {
          // No water found, go to wandering state
          this.noLakesNearby = true;
          console.log(`😢 ${this.type} (${this.gridX}, ${this.gridY}) couldn't find water, going to wandering`);
          this.setState("wandering");
          this.wanderDuration = Math.random() * (WANDER_MAX_DURATION - WANDER_MIN_DURATION) + WANDER_MIN_DURATION;
          this.stateTimer = 0;
          this.stateChangeCount++;
        }
        
        // Set a cooldown to prevent excessive searches
        this.resourceCooldown = 2000; // 2 seconds between searches
      }
    }
    
    // Search for berries if in seekingBerries state
    if (this.state === "seekingBerries" && !this.targetCell) {
      // If our resource cooldown is done, look for berries
      if (this.resourceCooldown <= 0) {
        console.log(`🔍 ${this.type} (${this.gridX}, ${this.gridY}) looking for berries`);
        
        // Try to find berries within radius
        const berryResource = findResourceWithinRadius(this.gridX, this.gridY, 10, 'berries');
        
        if (berryResource) {
          // Berries found, move toward them
          this.targetCell = { 
            gridX: berryResource.gridX, 
            gridY: berryResource.gridY
          };
          console.log(`${this.type} found berries at (${berryResource.gridX}, ${berryResource.gridY})`);
        } else {
          // No berries found, try water if thirsty or wandering
          console.log(`😢 ${this.type} (${this.gridX}, ${this.gridY}) couldn't find berries`);
          
          if (this.thirst > THIRST_THRESHOLD) {
            this.setState("seekingWater");
          } else if (this.eatsGrass) {
            this.setState("seekingGrass");
          } else {
            this.setState("wandering");
            this.wanderDuration = Math.random() * (WANDER_MAX_DURATION - WANDER_MIN_DURATION) + WANDER_MIN_DURATION;
          }
          this.stateTimer = 0;
          this.stateChangeCount++;
        }
        
        // Set a cooldown to prevent excessive searches
        this.resourceCooldown = 2000; // 2 seconds between searches
      }
    }
    
    // Search for grass if in seekingGrass state
    if (this.state === "seekingGrass" && this.eatsGrass && !this.targetCell) {
      // If our resource cooldown is done, look for grass
      if (this.resourceCooldown <= 0) {
        console.log(`🔍 ${this.type} (${this.gridX}, ${this.gridY}) looking for grass`);
        
        // For grass, just find a random cell to move to within radius
        const grassCell = findResourceWithinRadius(this.gridX, this.gridY, 10, 'grass');
        
        if (grassCell) {
          // Grass cell found, move toward it
          this.targetCell = { 
            gridX: grassCell.gridX, 
            gridY: grassCell.gridY
          };
          console.log(`${this.type} found grass at (${grassCell.gridX}, ${grassCell.gridY})`);
        } else {
          // No suitable grass cell found, try berries
          console.log(`😢 ${this.type} (${this.gridX}, ${this.gridY}) couldn't find grass`);
          this.setState("seekingBerries");
          this.stateTimer = 0;
          this.stateChangeCount++;
        }
        
        // Set a cooldown to prevent excessive searches
        this.resourceCooldown = 2000; // 2 seconds between searches
      }
    }
    
    // Handle wandering behavior
    if (this.state === "wandering" && !this.targetCell) {
      // If we've been wandering too long or finished our duration, pick a target
      if (this.stateTimer >= this.wanderDuration || this.wanderDuration === 0) {
        console.log(`🚶 ${this.type} (${this.gridX}, ${this.gridY}) choosing wandering destination`);
        
        // Find a random cell within the wander radius
        const wanderCell = findRandomCellWithinRadius(this.gridX, this.gridY, WANDER_RADIUS);
        
        if (wanderCell) {
          this.targetCell = wanderCell;
          console.log(`${this.type} wandering to (${wanderCell.gridX}, ${wanderCell.gridY})`);
          
          // Set a new wander duration when we reach the target
          this.wanderDuration = Math.random() * (WANDER_MAX_DURATION - WANDER_MIN_DURATION) + WANDER_MIN_DURATION;
        } else {
          // If no wander cell found, just wait
          this.wanderDuration = 2000; // Wait and try again
          console.log(`${this.type} couldn't find place to wander, waiting`);
        }
      }
      
      // Even while wandering, check periodically if needs have grown urgent
      if (this.stateTimer > 5000) {
        if (this.thirst > THIRST_THRESHOLD + 10) {
          this.setState("seekingWater");
          this.targetCell = null;
        } else if (this.hunger > HUNGER_THRESHOLD + 10) {
          if (this.eatsPlants) {
            this.setState(Math.random() < 0.5 ? "seekingGrass" : "seekingBerries");
          } else if (this.eatsAnimals) {
            this.setState("hunting");
          }
          this.targetCell = null;
        }
      }
    }
    
    // If drinking but no longer on water, go back to seeking water
    if (this.state === "drinking" && !this.isOnWaterCell()) {
      this.setState("seekingWater");
      this.targetCell = null;
      this.stateTimer = 0;
      console.log(`❌ ${this.type} (${this.gridX}, ${this.gridY}) no longer on water cell, going back to seeking water`);
      return;
    }
    
    // If eating but no longer adjacent to berries, go back to seeking berries
    if (this.state === "eating" && !this.isOnBerryCell()) {
      this.setState("seekingBerries");
      this.targetCell = null;
      this.stateTimer = 0;
      console.log(`❌ ${this.type} (${this.gridX}, ${this.gridY}) no longer adjacent to a berry, going back to seeking berries`);
      return;
    }
    
    // If drinking for long enough, become satiated
    if (this.state === "drinking" && this.stateTimer >= 2000) {
      this.thirst = Math.max(0, this.thirst - DRINKING_RATE);
      console.log(`🚰 ${this.type} (${this.gridX}, ${this.gridY}) finished drinking, thirst: ${this.thirst.toFixed(1)}`);
      
      // Choose next state based on hunger
      if (this.hunger > HUNGER_THRESHOLD) {
        if (this.eatsGrass) {
          this.setState("seekingGrass");
        } else {
          this.setState("seekingBerries");
        }
      } else {
        this.setState("idle");
      }
      
      this.targetCell = null;
      this.stateTimer = 0;
      return;
    }
    
    // If eating for long enough, become satiated
    if (this.state === "eating" && this.stateTimer >= 2000) {
      this.hunger = Math.max(0, this.hunger - EATING_RATE);
      console.log(`🍽️ ${this.type} (${this.gridX}, ${this.gridY}) finished eating berries, hunger: ${this.hunger.toFixed(1)}`);
      
      // Choose next state based on thirst
      if (this.thirst > THIRST_THRESHOLD) {
        this.setState("seekingWater");
      } else {
        this.setState("idle");
      }
      
      this.targetCell = null;
      this.stateTimer = 0;
      return;
    }

    // If eating grass for long enough, become satiated
    if (this.state === "eatingGrass" && this.stateTimer >= 1500) {
      this.hunger = Math.max(0, this.hunger - EATING_RATE);
      console.log(`🌿 ${this.type} (${this.gridX}, ${this.gridY}) finished eating grass, hunger: ${this.hunger.toFixed(1)}`);
      
      // Choose next state based on thirst
      if (this.thirst > THIRST_THRESHOLD) {
        this.setState("seekingWater");
      } else {
        this.setState("idle");
      }
      
      this.targetCell = null;
      this.stateTimer = 0;
      return;
    }
  }

  handleMovement(deltaTime) {
    // Don't move while eating or drinking
    if (this.state === "eating" || this.state === "drinking" || this.state === "eatingGrass") {
      return;
    }
    
    this.timeSinceLastMove += deltaTime;
    
    // Only move when enough time has passed
    if (this.timeSinceLastMove < this.moveInterval) {
      return;
    }

    // Reset the move timer
    this.timeSinceLastMove = 0;
    
    // If we have a target cell to move toward
    if (this.targetCell) {
      // Calculate direction to target
      const dx = this.targetCell.gridX - this.gridX;
      const dy = this.targetCell.gridY - this.gridY;
      
      // Remember where we came from (for better movement logic)
      this.lastMoveFromX = this.gridX;
      this.lastMoveFromY = this.gridY;
      
      // Simple movement - move one step in the direction of the target
      if (Math.abs(dx) > Math.abs(dy)) {
        // Move horizontally
        this.gridX += Math.sign(dx);
      } else {
        // Move vertically
        this.gridY += Math.sign(dy);
      }
      
      // Update pixel position
      this.x = this.gridX * cellSize;
      this.y = this.gridY * cellSize;
      
      // Check if we've reached the target
      if (this.gridX === this.targetCell.gridX && this.gridY === this.targetCell.gridY) {
        console.log(`🏁 ${this.type} (${this.gridX}, ${this.gridY}) reached target`);
        
        // Check if we should transition to drinking
        if (this.state === "seekingWater" && this.isOnWaterCell()) {
          console.log(`💧 ${this.type} (${this.gridX}, ${this.gridY}) found water and started drinking`);
          this.setState("drinking");
          this.stateTimer = 0;
        }
        // Check if we should transition to eating berries
        else if (this.state === "seekingBerries" && this.isOnBerryCell()) {
          console.log(`🍒 ${this.type} (${this.gridX}, ${this.gridY}) found berries and started eating`);
          this.setState("eating");
          this.stateTimer = 0;
        }
        // Check if we should transition to eating grass
        else if (this.state === "seekingGrass" && this.eatsGrass) {
          console.log(`🌿 ${this.type} (${this.gridX}, ${this.gridY}) found grass and started eating`);
          this.setState("eatingGrass");
          this.stateTimer = 0;
        }
        
        this.targetCell = null;
      }
      
      // Check for kills if predator
      this.checkForKills();
    }
    // For fleeing from predators
    else if (this.state === "fleeing" && this.targetAnimal) {
      // Move away from predator
      const dx = this.gridX - this.targetAnimal.gridX;
      const dy = this.gridY - this.targetAnimal.gridY;
      
      // Get adjacent cells
      const adjacentCells = getAdjacentEmptyCells(this.gridX, this.gridY);
      
      if (adjacentCells.length > 0) {
        // Find the cell that moves us furthest from predator
        let bestCell = adjacentCells[0];
        let maxDistance = -Infinity;
        
        for (const cell of adjacentCells) {
          const newDist = calcManhattanDistance(cell.gridX, cell.gridY, 
                                            this.targetAnimal.gridX, this.targetAnimal.gridY);
          if (newDist > maxDistance) {
            maxDistance = newDist;
            bestCell = cell;
          }
        }
        
        // Move to best cell
        this.lastMoveFromX = this.gridX;
        this.lastMoveFromY = this.gridY;
        this.gridX = bestCell.gridX;
        this.gridY = bestCell.gridY;
        this.x = this.gridX * cellSize;
        this.y = this.gridY * cellSize;
      }
    }
    // For wandering or patrolling states
    else if (this.state === "wandering" || this.state === "patrolling") {
      // Get adjacent cells
      const adjacentCells = getAdjacentEmptyCells(this.gridX, this.gridY);
      
      if (adjacentCells.length > 0) {
        // Prefer cells we haven't just come from (for more natural wandering)
        const filteredCells = this.lastMoveFromX !== undefined ? 
          adjacentCells.filter(cell => 
            !(cell.gridX === this.lastMoveFromX && cell.gridY === this.lastMoveFromY)
          ) : adjacentCells;
        
        // If all cells filtered out, use original list
        const cellsToUse = filteredCells.length > 0 ? filteredCells : adjacentCells;
        
        // Pick a random adjacent cell
        const randomIndex = Math.floor(Math.random() * cellsToUse.length);
        const randomCell = cellsToUse[randomIndex];
        
        // Move to random cell
        this.lastMoveFromX = this.gridX;
        this.lastMoveFromY = this.gridY;
        this.gridX = randomCell.gridX;
        this.gridY = randomCell.gridY;
        this.x = this.gridX * cellSize;
        this.y = this.gridY * cellSize;
      }
    }
  }

  checkReproduction(deltaTime) {
    // Don't reproduce in these cases:
    // 1. While chasing (moveInterval === chaseSpeed)
    // 2. When at max animal capacity
    // 3. When eating or drinking (not moving)
    if (this.moveInterval === this.chaseSpeed || 
        animals.length >= Animal.MAX_ANIMALS ||
        this.state === "eating" ||
        this.state === "drinking" ||
        this.state === "eatingGrass") {
      return;
    }
    
    this.timeSinceLastReproduction += deltaTime;
    if (this.timeSinceLastReproduction < Animal.REPRODUCTION_INTERVAL) return;

    // Only allow reproduction during active movement states
    const movementStates = ["seekingWater", "seekingBerries", "seekingGrass", "patrolling", "random"];
    if (!movementStates.includes(this.state)) return;

    const sameSpecies = animals.filter(a => a.type === this.type && a.isAlive);
    if (sameSpecies.length < 2) return;

    const adjacent = [[this.gridX + 1, this.gridY], [this.gridX - 1, this.gridY], 
                    [this.gridX, this.gridY + 1], [this.gridX, this.gridY - 1]]
                    .map(([x, y]) => ({ x, y }))
                    .filter(c => emptyCells.some(g => g.x === c.x && g.y === c.y));
    
    if (adjacent.length) {
      // Reproduction happens in an adjacent cell
      const birthCell = adjacent[Math.floor(Math.random() * adjacent.length)];
      const newAnimal = new Animal(birthCell.x, birthCell.y, this.type);
      animals.push(newAnimal);
      newAnimal.animateEmoji('pulse', newAnimal.emoji, 800);
      console.log(`🐣 ${this.type} (${this.gridX}, ${this.gridY}) reproduced while ${this.state}`);
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
      // Draw the animal emoji
      ctx.fillStyle = 'black';
      ctx.font = `${this.getFontSize()}px Arial`;
      ctx.fillText(this.emoji, (this.x + cellSize/2), (this.y + cellSize/2));
      //ctx.moveTo(this.x + cellSize/2, this.y + cellSize/2);

      // Draw state text with background for readability
      ctx.font = "10px Arial";
      ctx.textAlign = "center";
      
      // Choose color based on state
      let stateColor;
      switch(this.state) {
        case "drinking":
          stateColor = "#00BFFF"; // Deep sky blue for drinking
          break;
        case "eating":
        case "eatingGrass":
          stateColor = "#32CD32"; // Lime green for eating
          break;
        case "fleeing":
          stateColor = "#FF0000"; // Red for fleeing
          break;
        case "hunting":
          stateColor = "#FF4500"; // Orange red for hunting
          break;
        case "seekingWater":
          stateColor = "#87CEEB"; // Sky blue for seeking water
          break;
        case "seekingBerries":
        case "seekingGrass":
          stateColor = "#9ACD32"; // Yellow green for seeking food
          break;
        case "wandering":
          stateColor = "#9932CC"; // Dark orchid for wandering
          break;
        default:
          stateColor = "#808080"; // Gray for other states
      }
      
      // Draw text background for better readability
      const stateText = this.state;
      const textWidth = ctx.measureText(stateText).width;
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(this.x - textWidth/2 - 2, this.y - 34, textWidth + 4, 12);
      
      // Draw state text
      ctx.fillStyle = stateColor;
      ctx.fillText(stateText, this.x, this.y - 24);
    }

    // Draw eating or drinking progress bar if applicable
    if (this.state === "eating" || this.state === "eatingGrass" || this.state === "drinking") {
      const progressText = this.state === "drinking" ? "Drinking" : 
                          (this.state === "eatingGrass" ? "Eating Grass" : "Eating Berries");
      const progressColor = this.state === "drinking" ? "#00BFFF" : 
                           (this.state === "eatingGrass" ? "#32CD32" : "#DA70D6");
      
      // Calculate progress as percentage of time elapsed
      const maxTime = this.state === "drinking" ? 2000 : 
                     (this.state === "eatingGrass" ? 1500 : 2000);
      const progress = Math.min(1, this.stateTimer / maxTime);
      
      // Draw progress bar with text
      drawInfoText(ctx, progressText, 
                  { text: progressText, color: progressColor }, 
                  { progress: progress });
    }
  }

  // Function to check if the animal is on a water cell
  isOnWaterCell() {
    if (!potablePuddleCells && !outsideRingLakeBorders) return false;
    
    // Check puddles first (they're easier to check)
    if (potablePuddleCells && potablePuddleCells.some(cell => {
        const cellX = cell.gridX !== undefined ? cell.gridX : cell.x;
        const cellY = cell.gridY !== undefined ? cell.gridY : cell.y;
        return cellX === this.gridX && cellY === this.gridY;
    })) {
      return true;
    }
    
    // Check lakes next
    if (outsideRingLakeBorders && outsideRingLakeBorders.some(cell => {
        const cellX = cell.gridX !== undefined ? cell.gridX : cell.x;
        const cellY = cell.gridY !== undefined ? cell.gridY : cell.y;
        return cellX === this.gridX && cellY === this.gridY;
    })) {
      return true;
    }
    
    return false;
  }
  
  // Function to check if the animal is on a berry cell
  isOnBerryCell() {
    // Check if we're directly on or adjacent to a berry bush
    if (!gBushesPositions) return false;
    
    // First check the current cell
    if (gBushesPositions.some(bush => 
        (bush.gridX === this.gridX && bush.gridY === this.gridY) || 
        (bush.x === this.gridX && bush.y === this.gridY))) {
      return true;
    }
    
    // Then check all adjacent cells
    const adjacentOffsets = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    
    for (const [dx, dy] of adjacentOffsets) {
      const checkX = this.gridX + dx;
      const checkY = this.gridY + dy;
      
      // Check if any berry bush is at this adjacent position
      if (gBushesPositions.some(bush => 
          (bush.gridX === checkX && bush.gridY === checkY) || 
          (bush.x === checkX && bush.y === checkY))) {
        return true;
      }
    }
    
    return false;
  }

  // Check if we're stuck in a state loop
  isStateLooping() {
    if (this.stateHistory.length < 4) return false;
    
    // Check for repeating patterns like A->B->A->B
    const recentStates = this.stateHistory.slice(this.stateHistory.length - 4);
    
    // Common problematic patterns
    const patternABAB = recentStates[0] === recentStates[2] && 
                        recentStates[1] === recentStates[3] && 
                        recentStates[0] !== recentStates[1];
                        
    const patternABCA = recentStates[0] === recentStates[3] && 
                        recentStates[0] !== recentStates[1] && 
                        recentStates[1] !== recentStates[2];
    
    return patternABAB || patternABCA;
  }
  
  // Get a random state that's not part of our current loop
  getRandomNonLoopingState() {
    // Pool of possible states based on animal type
    const possibleStates = ["wandering"];
    
    if (this.eatsPlants) {
      if (this.eatsGrass) {
        possibleStates.push("seekingGrass");
      }
      possibleStates.push("seekingBerries");
    }
    
    // Always add seekingWater as an option
    possibleStates.push("seekingWater");
    
    // Filter out states that appear in our recent history to break the loop
    const availableStates = possibleStates.filter(state => 
      !this.stateHistory.slice(this.stateHistory.length - 2).includes(state)
    );
    
    // If no states left after filtering, just use the full list
    const statePool = availableStates.length > 0 ? availableStates : possibleStates;
    
    // Pick a random state
    return statePool[Math.floor(Math.random() * statePool.length)];
  }
  
  // Set state with proper tracking
  setState(newState) {
    if (this.state === newState) return; // No change
    
    console.log(`${this.type} (${this.gridX}, ${this.gridY}) changing state: ${this.state} -> ${newState}`);
    this.lastState = this.state;
    this.state = newState;
    this.stateChangeTime = Date.now();
    this.stateTimer = 0;
    
    // Use a default value if STATE_HISTORY_SIZE is not defined
    const historySize = typeof STATE_HISTORY_SIZE !== 'undefined' ? STATE_HISTORY_SIZE : 5;
    
    // Track in history if not a duplicate of most recent
    if (this.stateHistory.length === 0 || this.stateHistory[this.stateHistory.length - 1] !== newState) {
      this.stateHistory.push(newState);
      if (this.stateHistory.length > historySize) {
        this.stateHistory.shift();
      }
    }
  }
}

// Add helper function to get a random empty cell
function getRandomEmptyCell() {
  if (!emptyCells || emptyCells.length === 0) return null;
  
  // Get a random cell from the empty cells list
  const randomIndex = Math.floor(Math.random() * emptyCells.length);
  return emptyCells[randomIndex];
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
    // Initialize walkable cells lookup if needed
    if (walkableCellsLookup.size === 0) {
        initWalkableCellsLookup();
    }
    
    // Update the spatial grid first so animals can use it
    updateAnimalSpatialGrid();
    
    // Update all animals
    for (const animal of animals) {
        animal.update(deltaTime);
    }
}

// Call this whenever the game world changes
function updateValidMovesLookup(changedCells) {
  // For each changed cell, update the walkable cells lookup
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
  }
  
  console.log(`Updated walkable cells lookup, now has ${walkableCellsLookup.size} cells`);
}
