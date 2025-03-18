// Import Animation utility
// import { Animation } from './animations.js';
// Animation class will be loaded via script tag

class Animal {
  // Static speed settings
  static PREY_BASE_SPEED = 1000;  // Base movement interval for prey
  static PREDATOR_SPEED_MULTIPLIER = 2;  // How much faster predators are
  static KILL_DISTANCE = 1;  // Distance in cells required for a kill
  static REPRODUCTION_INTERVAL = 10000;  // Time between reproduction attempts (5 seconds)
  static MAX_AGE = 30000;  // Time until natural death (60 seconds)
  static PREDATOR_MAX_AGE = 20000;  // Predators die twice as fast (30 seconds)
  static MAX_ANIMALS = Math.floor(maxLandPopulation);  // Maximum number of animals allowed based on usable land

  // Add static method to pause/unpause all animals
  static setAllPaused(isPaused) {
    animals.forEach(animal => {
      animal.isPaused = isPaused;
    });
  }

  constructor(x, y, type) {
    this.x = x * cellSize;
    this.y = y * cellSize;
    this.type = type;
    this.isPredator = this.checkIfPredator();
    this.emoji = this.getEmoji();
    this.state = "idle";
    this.isAlive = true;
    this.age = 0;
    this.deathTime = 0;
    this.isDying = false;
    this.animation = null;
    this.isFrozen = false;
    this.freezeTime = 0;
    this.isPaused = false; // Add pause state flag
    
    //console.log(`Animal created at cell (${x}, ${y}), world position (${this.x}, ${this.y}), type: ${type}, emoji: ${this.emoji}`);
    
    // Set movement speed based on predator/prey status
    this.moveInterval = this.isPredator ? 
      Animal.PREY_BASE_SPEED / Animal.PREDATOR_SPEED_MULTIPLIER : 
      Animal.PREY_BASE_SPEED;
    
    this.timeSinceLastMove = 0;
    // Random initial reproduction timer to prevent sync
    this.timeSinceLastReproduction = Math.random() * Animal.REPRODUCTION_INTERVAL;
    // Direction: 0=right, 1=down, 2=left, 3=up
    this.currentDirection = Math.floor(Math.random() * 4);
    // Predators are more directed, prey more erratic
    this.directionChangeChance = this.isPredator ? 0.2 : 0.4;
    this.detectionRange = this.isPredator ? 5 : 4; // In cells

    // Additional speed modifiers for chase/flee
    this.normalSpeed = this.moveInterval;
    this.chaseSpeed = this.moveInterval * 0.8;  // 20% faster when chasing/fleeing
  }

  checkIfPredator() {
    return ['creaturesCardBear', 'creaturesCardCoyote'].includes(this.type);
  }

  getEmoji() {
    const emojiMap = {
      'creaturesCardSheep': '🐑',
      'creaturesCardCow': '🐄',
      'creaturesCardChicken': '🐔',
      'creaturesCardPig': '🐖',
      'creaturesCardBear': '🐻',
      'creaturesCardCoyote': '🐺'
    };
    return emojiMap[this.type] || '❓';
  }

  checkReproduction(deltaTime) {
    // Skip reproduction if moving at chase speed
    if (this.moveInterval === this.chaseSpeed) {
      return;
    }

    this.timeSinceLastReproduction += deltaTime;

    if (this.timeSinceLastReproduction >= Animal.REPRODUCTION_INTERVAL) {
      // Check global animal limit
      if (animals.length >= Animal.MAX_ANIMALS) {
        this.timeSinceLastReproduction = 0;
        return;
      }

      // Count how many of the same species are alive
      const sameSpecies = animals.filter(animal => 
        animal.type === this.type && animal.isAlive
      );

      // Only reproduce if there are at least 2 animals of the same species
      if (sameSpecies.length >= 2) {
        // Find a valid ground cell near the parent
        const currentX = Math.floor(this.x / cellSize);
        const currentY = Math.floor(this.y / cellSize);
        
        // Check adjacent cells
        const adjacentCells = [
          { x: currentX + 1, y: currentY },
          { x: currentX - 1, y: currentY },
          { x: currentX, y: currentY + 1 },
          { x: currentX, y: currentY - 1 }
        ];

        // Filter for valid ground cells
        const validCells = adjacentCells.filter(cell => 
          groundCells.some(groundCell => 
            groundCell.x === cell.x && groundCell.y === cell.y
          )
        );

        // If we found a valid cell, create a new animal there
        if (validCells.length > 0) {
          const birthCell = validCells[Math.floor(Math.random() * validCells.length)];
          const newAnimal = new Animal(birthCell.x, birthCell.y, this.type);
          animals.push(newAnimal);
          // Growth animation for new birth
          newAnimal.animateEmoji('getBig', newAnimal.emoji, 800);
        }
      }

      this.timeSinceLastReproduction = 0;
    }
  }

  detectNearbyAnimals() {
    const currentX = Math.floor(this.x / cellSize);
    const currentY = Math.floor(this.y / cellSize);
    
    // Find all animals within detection range
    return animals.filter(animal => {
      if (animal === this) return false;
      
      const animalX = Math.floor(animal.x / cellSize);
      const animalY = Math.floor(animal.y / cellSize);
      
      const distance = Math.sqrt(
        Math.pow(currentX - animalX, 2) + 
        Math.pow(currentY - animalY, 2)
      );
      
      return distance <= this.detectionRange;
    });
  }

  checkForKills() {
    if (!this.isPredator || !this.isAlive || this.isFrozen) return;

    const currentX = Math.floor(this.x / cellSize);
    const currentY = Math.floor(this.y / cellSize);
    
    // Check for prey in kill range
    const prey = animals.filter(animal => {
      if (animal === this || animal.isPredator || !animal.isAlive || animal.isFrozen) return false;
      
      const animalX = Math.floor(animal.x / cellSize);
      const animalY = Math.floor(animal.y / cellSize);
      
      const distance = Math.sqrt(
        Math.pow(currentX - animalX, 2) + 
        Math.pow(currentY - animalY, 2)
      );
      
      return distance <= 2; // Changed to 2 cells distance
    });

    // Kill the first prey found
    if (prey.length > 0) {
      this.killAnimal(prey[0]);
    }
  }

  animateEmoji(type, emoji, duration = 500) {
    this.animation = Animation.create(type, emoji, duration, this.x, this.y);
  }

  drawAnimation(ctx) {
    if (this.animation) {
      // Update animation position in case animal moved
      Animation.updatePosition(this.animation, this.x, this.y);
      
      // Draw the animation and check if it's still active
      const isActive = Animation.draw(ctx, this.animation);
      
      // Clear animation if complete
      if (!isActive) {
        this.animation = null;
      }
      
      return isActive;
    }
    return false;
  }

  killAnimal(prey) {
    // Freeze both animals
    this.isFrozen = true;
    prey.isFrozen = true;
    this.freezeTime = Date.now();
    prey.freezeTime = Date.now();

    // Start death sequence
    prey.isDying = true;
    prey.deathTime = Date.now();
    prey.animateEmoji('small', prey.emoji, 500);
    setTimeout(() => prey.animateEmoji('fade', '🥩', 1500), 500);
    this.animateEmoji('pop', this.emoji, 500);

    // Remove prey after animations
    setTimeout(() => {
      prey.isAlive = false;
      const index = animals.indexOf(prey);
      if (index > -1) {
        animals.splice(index, 1);
      }
    }, 2000);

    // Unfreeze predator after 3 seconds
    setTimeout(() => {
      this.isFrozen = false;
    }, 3000);
  }

  getDirectionTowardsOrAway(targetX, targetY, moveTowards) {
    const currentX = Math.floor(this.x / cellSize);
    const currentY = Math.floor(this.y / cellSize);
    
    // Calculate direction
    const dx = targetX - currentX;
    const dy = targetY - currentY;
    
    // Reverse direction if moving away
    const dirX = moveTowards ? Math.sign(dx) : -Math.sign(dx);
    const dirY = moveTowards ? Math.sign(dy) : -Math.sign(dy);
    
    // Convert to cardinal direction (0-3)
    if (Math.abs(dx) > Math.abs(dy)) {
      return dirX > 0 ? 0 : 2; // right or left
    } else {
      return dirY > 0 ? 1 : 3; // down or up
    }
  }

  evaluateCellDesirability(cell) {
    if (!cell || !cell.noise) return 0;
    const noiseValue = parseFloat(cell.noise);
    
    if (this.type === 'creaturesCardCoyote') {
      // Coyotes prefer low noise (beach/sand) cells
      return noiseValue < 0.09 ? 1 : 0.2;
    } else if (this.type === 'creaturesCardBear') {
      // Bears prefer high noise (elevated) cells
      return noiseValue > 0.24 ? 1 : 0.2;
    }
    return 0.5; // Neutral for non-predators
  }

  getNextCell(currentX, currentY) {
    // Check for nearby animals
    const nearbyAnimals = this.detectNearbyAnimals();
    let isChasing = false;
    
    if (nearbyAnimals.length > 0) {
      // Predators move towards prey, prey moves away from predators
      const relevantAnimal = nearbyAnimals.find(animal => 
        this.isPredator ? !animal.isPredator : animal.isPredator
      );
      
      if (relevantAnimal) {
        const targetX = Math.floor(relevantAnimal.x / cellSize);
        const targetY = Math.floor(relevantAnimal.y / cellSize);
        this.currentDirection = this.getDirectionTowardsOrAway(
          targetX, 
          targetY, 
          this.isPredator
        );
        isChasing = true;
      }
    }

    // Use chase speed if pursuing/fleeing, otherwise normal speed
    this.moveInterval = isChasing ? this.chaseSpeed : this.normalSpeed;

    // Define possible moves
    const moves = [
      { x: currentX + 1, y: currentY },     // right
      { x: currentX, y: currentY + 1 },     // down
      { x: currentX - 1, y: currentY },     // left
      { x: currentX, y: currentY - 1 }      // up
    ];

    if (!isChasing && this.isPredator) {
      // For predators not in chase mode, evaluate cell desirability
      const cellDesirability = moves.map(move => {
        const cell = groundCells.find(c => c.x === move.x && c.y === move.y);
        return {
          move,
          desirability: this.evaluateCellDesirability(cell)
        };
      });

      // Choose direction based on desirability (with some randomness)
      if (Math.random() < 0.85) { // 70% chance to choose based on desirability
        const bestMoves = cellDesirability.filter(m => 
          m.desirability === Math.max(...cellDesirability.map(c => c.desirability))
        );
        if (bestMoves.length > 0) {
          const chosen = bestMoves[Math.floor(Math.random() * bestMoves.length)];
          this.currentDirection = moves.findIndex(m => 
            m.x === chosen.move.x && m.y === chosen.move.y
          );
        }
      } else {
        // Random direction change for variety
        this.currentDirection = (this.currentDirection + (Math.random() < 0.5 ? 1 : -1) + 4) % 4;
      }
    } else if (!isChasing) {
      // Original random direction change logic for non-predators or chasing predators
      if (Math.random() < this.directionChangeChance) {
        const turnAmount = Math.random() < 0.7 ? 1 : 2;
        this.currentDirection = (this.currentDirection + (turnAmount * (Math.random() < 0.5 ? 1 : -1)) + 4) % 4;
      }
    }

    return moves[this.currentDirection];
  }

  ageDie() {
    const maxAge = this.isPredator ? Animal.PREDATOR_MAX_AGE : Animal.MAX_AGE;
    if (this.age >= maxAge) {
      this.isAlive = false;
      const index = animals.indexOf(this);
      if (index > -1) {
        animals.splice(index, 1);
      }
    }
  }

  move(deltaTime) {
    if (!this.isAlive || this.isPaused) return; // Check for pause state

    // Check if frozen
    if (this.isFrozen) {
      const timeFrozen = Date.now() - this.freezeTime;
      if (timeFrozen >= 3000) {
        this.isFrozen = false;
      } else {
        return;
      }
    }

    this.age += deltaTime;
    this.ageDie();
    
    this.timeSinceLastMove += deltaTime;
    this.checkReproduction(deltaTime);
    
    if (this.timeSinceLastMove >= this.moveInterval) {
      const currentX = Math.floor(this.x / cellSize);
      const currentY = Math.floor(this.y / cellSize);

      // Get preferred next cell based on current direction
      let nextCell = this.getNextCell(currentX, currentY);
      
      // Check if preferred cell is valid ground
      let isValidCell = groundCells.some(cell => 
        cell.x === nextCell.x && cell.y === nextCell.y
      );

      // If preferred cell is not valid, try other directions
      if (!isValidCell) {
        // Try all other directions in order
        for (let i = 0; i < 4; i++) {
          this.currentDirection = (this.currentDirection + 1) % 4;
          nextCell = this.getNextCell(currentX, currentY);
          isValidCell = groundCells.some(cell => 
            cell.x === nextCell.x && cell.y === nextCell.y
          );
          if (isValidCell) break;
        }
      }

      // Move if we found a valid cell
      if (isValidCell) {
        this.x = nextCell.x * cellSize;
        this.y = nextCell.y * cellSize;
        
        // Check for potential kills after moving
        this.checkForKills();
      }

      this.timeSinceLastMove = 0;
    }
  }

  draw(ctx) {
    if (!this.isAlive) return;
    
    if (this.isDying) {
      const timeSinceDeath = Date.now() - this.deathTime;
      if (timeSinceDeath >= 2000) {
        this.isAlive = false;
        const index = animals.indexOf(this);
        if (index > -1) {
          animals.splice(index, 1);
        }
        return;
      }
      
      if (!this.drawAnimation(ctx)) {
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.fillText(this.emoji, this.x, this.y);
      }
    } else {
      if (!this.drawAnimation(ctx)) {
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.fillText(this.emoji, this.x, this.y);
      }
    }
  }
} 


function starterAnimalPopulations(amount = 20) {
  // Clear existing animals
  animals = [];

  // Group cells by terrain type
  const sandCells = groundCells.filter(cell => parseFloat(cell.noise) < 0.05);
  const mountainCells = groundCells.filter(cell => parseFloat(cell.noise) > 0.4);
  const middleCells = groundCells.filter(cell => {
    const noise = parseFloat(cell.noise);
    return noise >= 0.15 && noise <= 0.2;
  });

  // Distribution percentages
  const coyotePercent = 0.10;  // 15% coyotes
  const bearPercent = 0.10;    // 15% bears
  const sheepPercent = 0.45;   // 35% sheep
  const chickenPercent = 0.35; // 35% chickens

  // Calculate counts
  const coyoteCount = Math.floor(amount * coyotePercent);
  const bearCount = Math.floor(amount * bearPercent);
  const sheepCount = Math.floor(amount * sheepPercent);
  const chickenCount = Math.floor(amount * chickenPercent);

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
  placeAnimals(coyoteCount, 'creaturesCardCoyote', sandCells);
  placeAnimals(bearCount, 'creaturesCardBear', mountainCells);

  // Place prey
  placeAnimals(sheepCount, 'creaturesCardSheep', middleCells);
  placeAnimals(chickenCount, 'creaturesCardChicken', middleCells);

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