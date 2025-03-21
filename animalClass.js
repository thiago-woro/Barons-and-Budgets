// Base Task class
class Task {
  constructor(animal) {
    this.animal = animal;
    this.isComplete = false;
  }

  update(deltaTime) {
    // To be overridden by specific tasks
  }

  onComplete() {
    this.isComplete = true;
  }
}

// Simple WanderTask reusing existing random movement
class WanderTask extends Task {
  constructor(animal) {
    super(animal);
  }

  update(deltaTime) {
    // Set movement mode to random, letting getNextCell handle wandering
    this.animal.movementMode = "random";
    this.animal.targetPosition = null;
    this.animal.targetAnimal = null;

    // Optional: We could add a duration or condition to complete the task later
    // For now, it runs indefinitely until interrupted
  }
}

// FleeTask for prey animals escaping from predators
class FleeTask extends Task {
  constructor(animal, predator) {
    super(animal);
    this.predator = predator;
    this.fleeingTime = 0;
    this.maxFleeingTime = 3000; // 3 seconds of fleeing before reevaluating
  }
  
  update(deltaTime) {
    // If predator no longer exists or is dead, stop fleeing
    if (!this.predator || !this.predator.isAlive) {
      this.onComplete();
      return;
    }
    
    // Calculate distance to predator
    const myX = Math.floor(this.animal.x / cellSize);
    const myY = Math.floor(this.animal.y / cellSize);
    const predatorX = Math.floor(this.predator.x / cellSize);
    const predatorY = Math.floor(this.predator.y / cellSize);
    
    const distanceToThreat = Math.sqrt(
      Math.pow(predatorX - myX, 2) + 
      Math.pow(predatorY - myY, 2)
    );
    
    // If we're far enough away, stop fleeing
    if (distanceToThreat > this.animal.detectionRange * 1.5) {
      this.onComplete();
      return;
    }
    
    // Set movement mode to away from predator
    this.animal.movementMode = "away";
    this.animal.targetAnimal = this.predator;
    this.animal.targetPosition = null;
    
    // Increment fleeing time
    this.fleeingTime += deltaTime;
    
    // After a while, consider task complete to let animal reevaluate priorities
    if (this.fleeingTime >= this.maxFleeingTime) {
      this.onComplete();
    }
  }
}

// HuntTask for predator animals hunting prey
class HuntTask extends Task {
  constructor(animal, prey) {
    super(animal);
    this.prey = prey;
    this.huntingTime = 0;
    this.maxHuntingTime = 5000; // 5 seconds of hunting before reevaluating
    this.isChasing = true;
  }
  
  update(deltaTime) {
    // If prey no longer exists or is dead, stop hunting
    if (!this.prey || !this.prey.isAlive) {
      this.onComplete();
      return;
    }
    
    // Calculate distance to prey
    const myX = Math.floor(this.animal.x / cellSize);
    const myY = Math.floor(this.animal.y / cellSize);
    const preyX = Math.floor(this.prey.x / cellSize);
    const preyY = Math.floor(this.prey.y / cellSize);
    
    const distanceToPrey = Math.sqrt(
      Math.pow(preyX - myX, 2) + 
      Math.pow(preyY - myY, 2)
    );
    
    // If we're close enough, try to kill
    if (distanceToPrey <= Animal.KILL_DISTANCE) {
      // Let the animal's checkForKills handle the actual killing
      this.animal.checkForKills();
      
      // If kill was successful, reduce hunger
      if (!this.prey.isAlive) {
        this.animal.hunger = Math.max(0, this.animal.hunger - 70);
        this.onComplete();
        return;
      }
    }
    
    // If prey is too far, stop hunting
    if (distanceToPrey > this.animal.detectionRange * 1.3) {
      this.isChasing = false;
      this.onComplete();
      return;
    }
    
    // Set movement mode to towards prey
    this.animal.movementMode = "towards";
    this.animal.targetAnimal = this.prey;
    this.animal.targetPosition = null;
    
    // Increment hunting time
    this.huntingTime += deltaTime;
    
    // After a while, consider task complete to let animal reevaluate priorities
    if (this.huntingTime >= this.maxHuntingTime) {
      this.onComplete();
    }
  }
}

// FindWaterTask for animals seeking water
class FindWaterTask extends Task {
  constructor(animal) {
    super(animal);
    this.targetWaterCell = null;
    this.drinkingTime = 0;
    this.maxDrinkingTime = 2000; // 2 seconds to drink
    this.isDrinking = false;
  }
  
  update(deltaTime) {
    const myX = Math.floor(this.animal.x / cellSize);
    const myY = Math.floor(this.animal.y / cellSize);
    
    // If we're already drinking
    if (this.isDrinking) {
      this.drinkingTime += deltaTime;
      
      // When done drinking, reduce thirst and complete task
      if (this.drinkingTime >= this.maxDrinkingTime) {
        this.animal.thirst = Math.max(0, this.animal.thirst - 60);
        this.onComplete();
      }
      return;
    }
    
    // If we don't have a target water cell, find the closest one
    if (!this.targetWaterCell) {
      // Sort water cells by distance to animal
      const sortedWaterCells = waterCells.slice(0, 50).sort((a, b) => {
        const distanceA = Math.sqrt(Math.pow(a.x - myX, 2) + Math.pow(a.y - myY, 2));
        const distanceB = Math.sqrt(Math.pow(b.x - myX, 2) + Math.pow(b.y - myY, 2));
        return distanceA - distanceB;
      });
      
      if (sortedWaterCells.length > 0) {
        this.targetWaterCell = sortedWaterCells[0];
      } else {
        // No water cells found, complete the task
        this.onComplete();
        return;
      }
    }
    
    // Calculate distance to water cell
    const distanceToWater = Math.sqrt(
      Math.pow(this.targetWaterCell.x - myX, 2) + 
      Math.pow(this.targetWaterCell.y - myY, 2)
    );
    
    // If we've reached the water, start drinking
    if (distanceToWater <= 1) {
      this.isDrinking = true;
      this.animal.movementMode = "random"; // Stop moving
      return;
    }
    
    // Set movement mode to towards water
    this.animal.movementMode = "towards";
    this.animal.targetAnimal = null;
    this.animal.targetPosition = {
      x: this.targetWaterCell.x * cellSize,
      y: this.targetWaterCell.y * cellSize
    };
  }
}

// FindBerriesTask for herbivores seeking food
class FindBerriesTask extends Task {
  constructor(animal) {
    super(animal);
    this.targetBerryCell = null;
    this.eatingTime = 0;
    this.maxEatingTime = 2000; // 2 seconds to eat
    this.isEating = false;
  }
  
  update(deltaTime) {
    const myX = Math.floor(this.animal.x / cellSize);
    const myY = Math.floor(this.animal.y / cellSize);
    
    // If we're already eating
    if (this.isEating) {
      this.eatingTime += deltaTime;
      
      // When done eating, reduce hunger and complete task
      if (this.eatingTime >= this.maxEatingTime) {
        this.animal.hunger = Math.max(0, this.animal.hunger - 50);
        this.onComplete();
      }
      return;
    }
    
    // If we don't have a target berry cell, find a suitable one
    if (!this.targetBerryCell) {
      // Use greenest cells as berry sources (could be replaced with actual berry objects)
      // Take a sample of cells to avoid sorting the entire map
      const sampleCells = emptyCells.slice(0, 100);
      const suitableCells = sampleCells.filter(cell => {
        // Consider cells with noise between 0.15 and 0.25 as berry-rich
        const noise = parseFloat(cell.noise || 0);
        return noise >= 0.15 && noise <= 0.25;
      });
      
      // Sort by distance to animal
      const sortedCells = suitableCells.sort((a, b) => {
        const distanceA = Math.sqrt(Math.pow(a.x - myX, 2) + Math.pow(a.y - myY, 2));
        const distanceB = Math.sqrt(Math.pow(b.x - myX, 2) + Math.pow(b.y - myY, 2));
        return distanceA - distanceB;
      });
      
      if (sortedCells.length > 0) {
        this.targetBerryCell = sortedCells[0];
      } else {
        // No suitable cells found, complete the task
        this.onComplete();
        return;
      }
    }
    
    // Calculate distance to berry cell
    const distanceToBerries = Math.sqrt(
      Math.pow(this.targetBerryCell.x - myX, 2) + 
      Math.pow(this.targetBerryCell.y - myY, 2)
    );
    
    // If we've reached the berries, start eating
    if (distanceToBerries <= 1) {
      this.isEating = true;
      this.animal.movementMode = "random"; // Stop moving
      return;
    }
    
    // Set movement mode to towards berries
    this.animal.movementMode = "towards";
    this.animal.targetAnimal = null;
    this.animal.targetPosition = {
      x: this.targetBerryCell.x * cellSize,
      y: this.targetBerryCell.y * cellSize
    };
  }
}

class Animal {
  // Static speed settings
  static PREY_BASE_SPEED = 1000;  // Base movement interval for prey
  static PREDATOR_SPEED_MULTIPLIER = 2;  // How much faster predators are
  static KILL_DISTANCE = 1;  // Distance in cells required for a kill
  static REPRODUCTION_INTERVAL = 15000;  // Time between reproduction attempts (15 seconds)
  static MAX_AGE = 30000;  // Time until natural death (30 seconds)
  static PREDATOR_MAX_AGE = 20000;  // Predators die faster (20 seconds)
  static MAX_ANIMALS = Math.floor(maxLandPopulation);  // Max animals based on usable land
  static BABY_EMOJI_DURATION = 5000; // Duration for baby emoji size (5 seconds)

  // Static method to pause/unpause all animals
  static setAllPaused(isPaused) {
    animals.forEach(animal => {
      animal.isPaused = isPaused;
    });
  }

  constructor(x, y, type, age = 0) {
    this.x = x * cellSize;
    this.y = y * cellSize;
    this.type = type;
    this.isPredator = this.checkIfPredator();
    this.emoji = this.getEmoji();
    this.isAlive = true;
    this.age = age;
    this.deathTime = 0;
    this.isDying = false;
    this.isFrozen = false; // For kill animations
    this.animation = null;
    this.isPaused = false; // Pause state flag
    this.birthDate = Date.now(); // For baby size tracking
    this.fontSize = this.getSpeciesFontSize();

    // Movement properties
    this.moveInterval = this.isPredator
      ? Animal.PREY_BASE_SPEED / Animal.PREDATOR_SPEED_MULTIPLIER
      : Animal.PREY_BASE_SPEED;
    this.normalSpeed = this.moveInterval;
    this.chaseSpeed = this.moveInterval * 0.8; // 20% faster when chasing/fleeing
    this.timeSinceLastMove = 0;
    this.currentDirection = Math.floor(Math.random() * 4); // 0=right, 1=down, 2=left, 3=up
    this.directionChangeChance = this.isPredator ? 0.2 : 0.4;
    this.detectionRange = this.isPredator ? 5 : 4; // In cells

    // Reproduction
    this.timeSinceLastReproduction = Math.random() * Animal.REPRODUCTION_INTERVAL;

    // Task system
    this.hunger = 0;          // 0 to 100
    this.thirst = 0;          // 0 to 100
    this.maxNeed = 100;       // Threshold for action
    this.hungerRate = this.isPredator ? 0.6 : 0.5; // Predators get hungry faster
    this.thirstRate = 0.3;    // Thirst increases slower
    this.currentTask = null;  // Current task object
    this.movementMode = "random"; // "random", "towards", "away"
    this.targetPosition = null;   // {x, y} in pixels
    this.targetAnimal = null;     // Reference to another animal
  }

  // Species-specific font size
  getSpeciesFontSize() {
    const fontSizeMap = {
      'creaturesCardSheep': 20,
      'creaturesCardCow': 21,
      'creaturesCardChicken': 17,
      'creaturesCardPig': 19,
      'creaturesCardBear': 23,
      'creaturesCardCoyote': 19
    };
    return fontSizeMap[this.type] || 20;
  }

  // Font size with baby adjustment
  getFontSize() {
    const isBaby = Date.now() - this.birthDate < Animal.BABY_EMOJI_DURATION;
    return isBaby ? Math.floor(this.fontSize * 0.65) : this.fontSize;
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

  update(deltaTime) {
    if (!this.isAlive || this.isPaused || this.isFrozen) return;

    // Update age and needs
    this.age += deltaTime;
    this.hunger += this.hungerRate * (deltaTime / 1000);
    this.thirst += this.thirstRate * (deltaTime / 1000);

    // Check for death by age
    if (this.age >= (this.isPredator ? Animal.PREDATOR_MAX_AGE : Animal.MAX_AGE)) {
      this.isAlive = false;
      const index = animals.indexOf(this);
      if (index > -1) animals.splice(index, 1);
      return;
    }

    // Manage tasks
    this.updateTask(deltaTime);

    // Handle movement
    this.timeSinceLastMove += deltaTime;
    if (this.timeSinceLastMove >= this.moveInterval) {
      const currentX = Math.floor(this.x / cellSize);
      const currentY = Math.floor(this.y / cellSize);
      const nextCell = this.getNextCell(currentX, currentY);
      if (emptyCells.some(cell => cell.x === nextCell.x && cell.y === nextCell.y)) {
        this.x = nextCell.x * cellSize;
        this.y = nextCell.y * cellSize;
        this.checkForKills();
      }
      this.timeSinceLastMove = 0;
    }

    // Handle reproduction
    this.checkReproduction(deltaTime);
  }

  // Detect nearby animals within the detection range
  detectNearbyAnimals() {
    if (!this.isAlive) return [];
    
    const myX = Math.floor(this.x / cellSize);
    const myY = Math.floor(this.y / cellSize);
    
    return animals.filter(animal => {
      if (!animal.isAlive || animal === this) return false;
      
      const animalX = Math.floor(animal.x / cellSize);
      const animalY = Math.floor(animal.y / cellSize);
      
      const distance = Math.sqrt(
        Math.pow(animalX - myX, 2) + 
        Math.pow(animalY - myY, 2)
      );
      
      return distance <= this.detectionRange;
    });
  }

  updateTask(deltaTime) {
    const nearby = this.detectNearbyAnimals();

    // Interrupt current task if needed
    if (this.isPredator) {
      const prey = nearby.find(a => !a.isPredator && a.isAlive);
      if (this.hunger > this.maxNeed * 0.7 && prey) {
        this.currentTask = new HuntTask(this, prey);
      }
    } else {
      const predator = nearby.find(a => a.isPredator && a.isAlive);
      if (predator) {
        this.currentTask = new FleeTask(this, predator);
      } else if (this.thirst > this.maxNeed && (!this.currentTask || this.currentTask instanceof WanderTask)) {
        this.currentTask = new FindWaterTask(this);
      } else if (this.hunger > this.maxNeed && (!this.currentTask || this.currentTask instanceof WanderTask)) {
        this.currentTask = new FindBerriesTask(this);
      } else if (!this.currentTask || this.currentTask.isComplete) {
        this.currentTask = new WanderTask(this);
      }
    }

    // Execute current task
    if (this.currentTask) {
      this.currentTask.update(deltaTime);
      if (this.currentTask.isComplete) this.currentTask = null;
    }
  }

  getNextCell(currentX, currentY) {
    let isChasing = false;

    // Task-driven movement
    if (this.movementMode === "towards" && this.targetAnimal) {
      const targetX = Math.floor(this.targetAnimal.x / cellSize);
      const targetY = Math.floor(this.targetAnimal.y / cellSize);
      this.currentDirection = this.getDirectionTowardsOrAway(targetX, targetY, true);
      isChasing = true;
    } else if (this.movementMode === "away" && this.targetAnimal) {
      const targetX = Math.floor(this.targetAnimal.x / cellSize);
      const targetY = Math.floor(this.targetAnimal.y / cellSize);
      this.currentDirection = this.getDirectionTowardsOrAway(targetX, targetY, false);
      isChasing = true;
    } else if (this.movementMode === "towards" && this.targetPosition) {
      const targetX = Math.floor(this.targetPosition.x / cellSize);
      const targetY = Math.floor(this.targetPosition.y / cellSize);
      this.currentDirection = this.getDirectionTowardsOrAway(targetX, targetY, true);
      isChasing = true;
    } else {
      // Default behavior if no task overrides
      const nearbyAnimals = this.detectNearbyAnimals();
      if (nearbyAnimals.length > 0) {
        const relevantAnimal = nearbyAnimals.find(animal =>
          this.isPredator ? !animal.isPredator : animal.isPredator
        );
        if (relevantAnimal) {
          const targetX = Math.floor(relevantAnimal.x / cellSize);
          const targetY = Math.floor(relevantAnimal.y / cellSize);
          this.currentDirection = this.getDirectionTowardsOrAway(targetX, targetY, this.isPredator);
          isChasing = true;
        }
      }
      if (!isChasing && this.isPredator) {
        const moves = [
          { x: currentX + 1, y: currentY },
          { x: currentX, y: currentY + 1 },
          { x: currentX - 1, y: currentY },
          { x: currentX, y: currentY - 1 }
        ];
        const cellDesirability = moves.map(move => {
          const cell = emptyCells.find(c => c.x === move.x && c.y === move.y);
          return { move, desirability: this.evaluateCellDesirability(cell) };
        });
        if (Math.random() < 0.85) {
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
          this.currentDirection = (this.currentDirection + (Math.random() < 0.5 ? 1 : -1) + 4) % 4;
        }
      } else if (!isChasing) {
        if (Math.random() < this.directionChangeChance) {
          this.currentDirection = (this.currentDirection + (Math.random() < 0.5 ? 1 : -1) + 4) % 4;
        }
      }
    }

    this.moveInterval = isChasing ? this.chaseSpeed : this.normalSpeed;
    const moves = [
      { x: currentX + 1, y: currentY },
      { x: currentX, y: currentY + 1 },
      { x: currentX - 1, y: currentY },
      { x: currentX, y: currentY - 1 }
    ];
    return moves[this.currentDirection];
  }

  getDirectionTowardsOrAway(targetX, targetY, moveTowards) {
    const currentX = Math.floor(this.x / cellSize);
    const currentY = Math.floor(this.y / cellSize);
    const dx = targetX - currentX;
    const dy = targetY - currentY;
    const dirX = moveTowards ? Math.sign(dx) : -Math.sign(dx);
    const dirY = moveTowards ? Math.sign(dy) : -Math.sign(dy);
    return Math.abs(dx) > Math.abs(dy) ? (dirX > 0 ? 0 : 2) : (dirY > 0 ? 1 : 3);
  }

  evaluateCellDesirability(cell) {
    if (!cell || !cell.noise) return 0;
    const noiseValue = parseFloat(cell.noise);
    if (this.type === 'creaturesCardCoyote') return noiseValue < 0.09 ? 1 : 0.2;
    if (this.type === 'creaturesCardBear') return noiseValue > 0.24 ? 1 : 0.2;
    return 0.5;
  }

  checkReproduction(deltaTime) {
    if (this.moveInterval === this.chaseSpeed) return;
    this.timeSinceLastReproduction += deltaTime;
    if (this.timeSinceLastReproduction < Animal.REPRODUCTION_INTERVAL) return;

    // Check global animal limit before attempting reproduction
    if (animals.length >= Animal.MAX_ANIMALS) {
      this.timeSinceLastReproduction = 0;
      return;
    }

    const sameSpecies = animals.filter(a => a.type === this.type && a.isAlive);
    if (sameSpecies.length < 2) return;

    const currentX = Math.floor(this.x / cellSize);
    const currentY = Math.floor(this.y / cellSize);
    const adjacentCells = [
      { x: currentX + 1, y: currentY },
      { x: currentX - 1, y: currentY },
      { x: currentX, y: currentY + 1 },
      { x: currentX, y: currentY - 1 }
    ];
    const validCells = adjacentCells.filter(cell =>
      emptyCells.some(g => g.x === cell.x && g.y === cell.y)
    );

    if (validCells.length > 0 && animals.length < Animal.MAX_ANIMALS) {
      const birthCell = validCells[Math.floor(Math.random() * validCells.length)];
      const newAnimal = new Animal(birthCell.x, birthCell.y, this.type, 0);
      animals.push(newAnimal);
      newAnimal.animateEmoji('pulse', newAnimal.emoji, 800);
    }
    this.timeSinceLastReproduction = 0;
  }

  checkForKills() {
    if (!this.isPredator || !this.isAlive || this.isFrozen) return;
    const currentX = Math.floor(this.x / cellSize);
    const currentY = Math.floor(this.y / cellSize);
    const prey = animals.find(a =>
      a !== this && !a.isPredator && a.isAlive &&
      Math.sqrt((Math.floor(a.x / cellSize) - currentX) ** 2 +
                (Math.floor(a.y / cellSize) - currentY) ** 2) <= Animal.KILL_DISTANCE
    );
    if (prey) this.killAnimal(prey);
  }

  killAnimal(prey) {
    this.isFrozen = true;
    prey.isFrozen = true;
    this.freezeTime = Date.now();
    prey.freezeTime = Date.now();
    prey.isDying = true;
    prey.deathTime = Date.now();
    prey.animateEmoji('small', prey.emoji, 500);
    setTimeout(() => prey.animateEmoji('fade', '🥩', 500), 500);
    this.animateEmoji('fade', this.emoji, 500);
    setTimeout(() => {
      prey.isAlive = false;
      const index = animals.indexOf(prey);
      if (index > -1) animals.splice(index, 1);
    }, 2000);
    setTimeout(() => this.isFrozen = false, 3000);
  }

  animateEmoji(type, emoji, duration = 500) {
    if (type === 'drown') {
      this.animation = Animation.create('small', emoji, duration * 0.3, this.x, this.y);
      setTimeout(() => {
        if (this.isAlive) this.animation = Animation.create('fade', '💦', duration * 0.7, this.x, this.y);
      }, duration * 0.4);
      return;
    }
    this.animation = Animation.create(type, emoji, duration, this.x, this.y);
  }

  drawAnimation(ctx) {
    if (!this.animation) return false;
    Animation.updatePosition(this.animation, this.x, this.y);
    const isActive = Animation.draw(ctx, this.animation);
    if (!isActive) this.animation = null;
    return isActive;
  }

  draw(ctx) {
    if (!this.isAlive) return;
    if (this.isDying) {
      const timeSinceDeath = Date.now() - this.deathTime;
      if (timeSinceDeath >= 2000) return;
    }
    if (!this.drawAnimation(ctx)) {
      ctx.fillStyle = 'black';
      ctx.font = `${this.getFontSize()}px Arial`;
      ctx.fillText(this.emoji, this.x, this.y);
    }
  }
}

function starterAnimalPopulations(amount = 20) {
  // Clear existing animals
  animals = [];

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