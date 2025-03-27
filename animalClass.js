// Global variables for animal behavior
let walkableCellsLookup = new Set(); // Will store walkable cell coordinates as "x,y" strings



// Function to initialize walkable cells lookup
function initWalkableCellsLookup() {
  walkableCellsLookup.clear();
  for (const cell of emptyCells) {
    walkableCellsLookup.add(`${cell.x},${cell.y}`);
  }
  console.warn(`Initialized walkable cells lookup with ${walkableCellsLookup.size} cells`);
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
    this.id = animals.length + 1;
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
    

    // Reproduction
    this.timeSinceLastReproduction = Math.random() * Animal.REPRODUCTION_INTERVAL;

    // Behavior state
    this.state = this.isPredator ? "patrolling" : "idle"; // Different default states for predators vs prey

    
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

  update(deltaTime) {}


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

  }

 handleMovement(deltaTime) {
  return;
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
      let x = this.x + cellSize/2;
      let y = this.y + cellSize/2;
      // Draw the animal emoji
      ctx.fillStyle = 'black';
      ctx.font = `${this.getFontSize()}px Arial`;
      ctx.fillText(this.emoji, x, y);
      //ctx.moveTo(this.x + cellSize/2, this.y + cellSize/2);

      // Draw state text with background for readability
      ctx.font = "10px Arial";
      ctx.textAlign = "center";
 
      // Draw state text
      ctx.fillStyle = 'black';
      ctx.fillText(this.state, x, y + 10);
    }


  }

  
 

}


function starterAnimalPopulations(amount = 20) {
  initWalkableCellsLookup();

  // Clear existing animals
  animals = [];

  // Filter for usable cells
  const groundCells = emptyCells.filter(cell => { //renamed usableCells to groundCells
    const noise = parseFloat(cell.noise);
    return noise >= 0 && noise <= 0.4; // Using a wider range of suitable cells
  });

  // Group cells by terrain type
  const sandCells = groundCells.filter(cell => parseFloat(cell.noise) < 0.05);   //PUT COYOTES HERE
  const mountainCells = groundCells.filter(cell => parseFloat(cell.noise) > 0.4); //PUT BEARS HERE
  const middleCells = groundCells.filter(cell => {  //PUT ALL OTHER ANIMALS HERE
    const noise = parseFloat(cell.noise);
    return noise >= 0.15 && noise <= 0.2;
  }); 

  // Animal types and their distribution percentages
  const animalTypes = [
    { type: 'Coyote', percent: 0.10, cluster: false, cells: sandCells }, // No cluster, sand cells
    { type: 'Bear', percent: 0.10, cluster: false, cells: mountainCells },   // No cluster, mountain cells
    { type: 'Sheep', percent: 0.2, cluster: true, cells: middleCells }, // Middle cells
    { type: 'Chicken', percent: 0.2, cluster: true, cells: middleCells }, // Middle cells
    { type: 'Cow', percent: 0.2, cluster: true, cells: middleCells }, // Middle cells
    { type: 'Pig', percent: 0.2, cluster: true, cells: middleCells }  // Middle cells
  ];

  // Calculate counts for each animal type
  animalTypes.forEach(animal => {
    animal.count = Math.floor(amount * animal.percent);
  });

  // Divide map into regions for each animal type
  const regionCount = animalTypes.length;

  for (let typeIndex = 0; typeIndex < animalTypes.length; typeIndex++) {
    const animal = animalTypes[typeIndex];
    const availableCells = animal.cells; // Use the specified cells for this animal type

    if (animal.cluster) {
      // Clustered distribution logic
      // Pick a single random starting point for this species cluster
      const randomCellIndex = Math.floor(Math.random() * availableCells.length);
      const centerCell = availableCells[randomCellIndex];

      // Find cells close to this center point
      const clusterCells = [];

      // Sort cells by distance to center cell (creates tighter clusters)
      const sortedCells = [...availableCells].sort((a, b) => {
        const distA = calcManhattanDistance(centerCell.x, centerCell.y, a.x, a.y);
        const distB = calcManhattanDistance(centerCell.x, centerCell.y, b.x, b.y);
        return distA - distB;
      });

      // Take just enough cells for this animal type, starting from closest
      const clusterSize = Math.min(animal.count * 3, Math.floor(sortedCells.length / regionCount));
      const speciesCells = sortedCells.slice(0, clusterSize);

      // Place this animal type in their tight cluster
      for (let i = 0; i < animal.count; i++) {
        if (speciesCells.length === 0) break;

        // Pick a random cell from the cluster region
        const randomIndex = Math.floor(Math.random() * speciesCells.length);
        const cell = speciesCells[randomIndex];

        // Remove the cell to prevent overlap
        speciesCells.splice(randomIndex, 1);

        // Create and add the animal
        const newAnimal = new Animal(cell.x, cell.y, animal.type);
        animals.push(newAnimal);
      }

      // Remove the used cells from the pool to prevent overlap between species
      for (const cell of speciesCells) {
        const index = availableCells.findIndex(c => c.x === cell.x && c.y === cell.y);
        if (index !== -1) {
          availableCells.splice(index, 1);
        }
      }
    } else {
      // Non-clustered distribution logic
      for (let i = 0; i < animal.count; i++) {
        if (availableCells.length === 0) break;

        // Pick a random cell from all usable cells
        const randomIndex = Math.floor(Math.random() * availableCells.length);
        const cell = availableCells[randomIndex];

        // Remove the cell to prevent overlap
        availableCells.splice(randomIndex, 1);

        // Create and add the animal
        const newAnimal = new Animal(cell.x, cell.y, animal.type);
        animals.push(newAnimal);
      }
    }
  }

  // Log the distribution
  console.log(`Distributed ${animals.length} animals`);
  animalTypes.forEach(animal => {
    const actualCount = animals.filter(a => a.type === animal.type).length;
    console.log(`${actualCount} ${animal.type}s`);
  });
}




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
