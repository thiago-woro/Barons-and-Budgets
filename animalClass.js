// Base Task class
class Task {
  constructor(animal) {
    this.animal = animal;
    this.isComplete = false;
  }

  update(deltaTime) {}
  onComplete() { this.isComplete = true; }
}

// Utility function for distance calculation
const calcDistance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

// FleeTask
class FleeTask extends Task {
  constructor(animal, predator) {
    super(animal);
    this.predator = predator;
    this.fleeingTime = 0;
    this.maxFleeingTime = 3000;
  }

  update(deltaTime) {
    if (!this.predator?.isAlive) return this.onComplete();

    const myGrid = this.animal.gridPos();
    const predGrid = this.predator.gridPos();
    const distance = calcDistance(myGrid.x, myGrid.y, predGrid.x, predGrid.y);

    if (distance > this.animal.detectionRange * 1.5) return this.onComplete();

    this.animal.setMovement("away", this.predator);
    this.fleeingTime += deltaTime;
    if (this.fleeingTime >= this.maxFleeingTime) this.onComplete();
  }
}

// HuntTask
class HuntTask extends Task {
  constructor(animal, prey) {
    super(animal);
    this.prey = prey;
    this.huntingTime = 0;
    this.maxHuntingTime = 5000;
  }

  update(deltaTime) {
    if (!this.prey?.isAlive) return this.onComplete();

    const myGrid = this.animal.gridPos();
    const preyGrid = this.prey.gridPos();
    const distance = calcDistance(myGrid.x, myGrid.y, preyGrid.x, preyGrid.y);

    if (distance <= Animal.KILL_DISTANCE) {
      this.animal.checkForKills();
      if (!this.prey.isAlive) {
        this.animal.hunger = Math.max(0, this.animal.hunger - 70);
        return this.onComplete();
      }
    }

    if (distance > this.animal.detectionRange * 1.3) return this.onComplete();

    this.animal.setMovement("towards", this.prey);
    this.huntingTime += deltaTime;
    if (this.huntingTime >= this.maxHuntingTime) this.onComplete();
  }
}

// FindWaterTask
class FindWaterTask extends Task {
  constructor(animal) {
    super(animal);
    this.targetWaterCell = null;
    this.drinkingTime = 0;
    this.maxDrinkingTime = 2000;
    this.isDrinking = false;
    this.searchTimeout = 0;
    this.maxSearchTime = 5000;
    this.attemptedTargets = new Set();
    console.log(`🚿 ${animal.type} (${animal.gridPosStr()}) started looking for water`);
  }

  update(deltaTime) {
    const myGrid = this.animal.gridPos();

    if (this.isDrinking) {
      this.drinkingTime += deltaTime;
      if (this.drinkingTime >= this.maxDrinkingTime) {
        this.animal.thirst = Math.max(0, this.animal.thirst - 60);
        console.log(`🚰 ${this.animal.type} (${myGrid.x}, ${myGrid.y}) finished drinking, thirst: ${this.animal.thirst}`);
        this.onComplete();
      }
      return;
    }

    this.searchTimeout += deltaTime;
    if (this.searchTimeout >= this.maxSearchTime) {
      console.log(`⏱️ ${this.animal.type} (${myGrid.x}, ${myGrid.y}) gave up searching for water`);
      return this.onComplete();
    }

    if (!this.targetWaterCell) {
      const waterCells = outsideRingLakeBorders.slice(0, 50);
      if (!waterCells.length) {
        console.log(`❌ ${this.animal.type} (${myGrid.x}, ${myGrid.y}) found no water`);
        return this.onComplete();
      }

      this.targetWaterCell = waterCells
        .filter(cell => !this.attemptedTargets.has(`${cell.x},${cell.y}`))
        .sort((a, b) => calcDistance(myGrid.x, myGrid.y, a.x, a.y) - calcDistance(myGrid.x, myGrid.y, b.x, b.y))[0];

      if (!this.targetWaterCell) {
        console.log(`🚫 ${this.animal.type} (${myGrid.x}, ${myGrid.y}) tried all water cells`);
        return this.onComplete();
      }
      this.attemptedTargets.add(`${this.targetWaterCell.x},${this.targetWaterCell.y}`);
      console.log(`🔍 ${this.animal.type} (${myGrid.x}, ${myGrid.y}) targeting water at (${this.targetWaterCell.x}, ${this.targetWaterCell.y})`);
    }

    const distance = calcDistance(myGrid.x, myGrid.y, this.targetWaterCell.x, this.targetWaterCell.y);
    if (distance <= 1) {
      this.isDrinking = true;
      this.animal.movementMode = "random";
      console.log(`💧 ${this.animal.type} (${myGrid.x}, ${myGrid.y}) reached water`);
      return;
    }

    this.animal.setMovement("towards", null, this.targetWaterCell);
    this.checkStuck(deltaTime, distance);
  }

  checkStuck(deltaTime, distance) {
    if (this.lastDistance && Math.abs(this.lastDistance - distance) < 0.1) {
      this.stuckTime = (this.stuckTime || 0) + deltaTime;
      if (this.stuckTime > 1000) {
        console.log(`⚠️ ${this.animal.type} (${this.animal.gridPosStr()}) stuck, retrying`);
        this.targetWaterCell = null;
        this.stuckTime = 0;
      }
    } else {
      this.stuckTime = 0;
    }
    this.lastDistance = distance;
  }

  onComplete() {
    console.log(`✅ ${this.animal.type} (${this.animal.gridPosStr()}) completed water task, attempted ${this.attemptedTargets.size} targets`);
    super.onComplete();
  }
}

// FindBerriesTask
class FindBerriesTask extends Task {
  constructor(animal) {
    super(animal);
    this.targetBerryCell = null;
    this.eatingTime = 0;
    this.maxEatingTime = 2000;
    this.isEating = false;
  }

  update(deltaTime) {
    const myGrid = this.animal.gridPos();

    if (this.isEating) {
      this.eatingTime += deltaTime;
      if (this.eatingTime >= this.maxEatingTime) {
        this.animal.hunger = Math.max(0, this.animal.hunger - 50);
        this.onComplete();
      }
      return;
    }

    if (!this.targetBerryCell) {
      if (!gBushesPositions.length) {
        console.log(`${this.animal.type} failed to find berries`);
        this.animal.currentTask = new FindWaterTask(this.animal);
        return this.onComplete();
      }
      this.targetBerryCell = gBushesPositions
        .sort((a, b) => calcDistance(myGrid.x, myGrid.y, a.x, a.y) - calcDistance(myGrid.x, myGrid.y, b.x, b.y))[0];
    }

    const distance = calcDistance(myGrid.x, myGrid.y, this.targetBerryCell.x, this.targetBerryCell.y);
    if (distance <= 1) {
      this.isEating = true;
      this.animal.movementMode = "random";
      return;
    }

    this.animal.setMovement("towards", null, this.targetBerryCell);
  }
}

// Animal class
class Animal {
  static PREY_BASE_SPEED = 2000;
  static PREDATOR_SPEED_MULTIPLIER = 2;
  static KILL_DISTANCE = 1;
  static REPRODUCTION_INTERVAL = 15000;
  static MAX_AGE = 30000;
  static PREDATOR_MAX_AGE = 20000;
  static MAX_ANIMALS = Math.floor(maxLandPopulation);
  static BABY_EMOJI_DURATION = 5000;

  static setAllPaused(isPaused) {
    animals.forEach(animal => animal.isPaused = isPaused);
  }

  constructor(x, y, type, age = 0) {
    this.x = x * cellSize;
    this.y = y * cellSize;
    this.type = type;
    this.isPredator = this.checkIfPredator();
    this.emoji = this.getEmoji();
    this.isAlive = true;
    this.age = age;
    this.isPaused = false;
    this.birthDate = Date.now();
    this.fontSize = this.getSpeciesFontSize();

    this.moveInterval = this.isPredator ? Animal.PREY_BASE_SPEED / Animal.PREDATOR_SPEED_MULTIPLIER : Animal.PREY_BASE_SPEED;
    this.normalSpeed = this.moveInterval;
    this.chaseSpeed = this.moveInterval * 0.8;
    this.timeSinceLastMove = 0;
    this.currentDirection = Math.floor(Math.random() * 4);
    this.directionChangeChance = this.isPredator ? 0.2 : 0.4;
    this.detectionRange = this.isPredator ? 5 : 4;

    this.timeSinceLastReproduction = Math.random() * Animal.REPRODUCTION_INTERVAL;
    this.hunger = 0;
    this.thirst = 0;
    this.maxNeed = 100;
    this.hungerRate = this.isPredator ? 0.6 : 0.5;
    this.thirstRate = 0.3;
    this.currentTask = null;
    this.movementMode = "random";
    this.targetPosition = null;
    this.targetAnimal = null;
  }

  gridPos() { return { x: Math.floor(this.x / cellSize), y: Math.floor(this.y / cellSize) }; }
  gridPosStr() { const pos = this.gridPos(); return `${pos.x}, ${pos.y}`; }

  setMovement(mode, targetAnimal = null, targetCell = null) {
    this.movementMode = mode;
    this.targetAnimal = targetAnimal;
    this.targetPosition = targetCell ? { x: targetCell.x * cellSize, y: targetCell.y * cellSize } : null;
  }

  getSpeciesFontSize() {
    return { creaturesCardSheep: 20, creaturesCardCow: 21, creaturesCardChicken: 17, creaturesCardPig: 19, creaturesCardBear: 23, creaturesCardCoyote: 19 }[this.type] || 20;
  }

  getFontSize() {
    return (Date.now() - this.birthDate < Animal.BABY_EMOJI_DURATION) ? Math.floor(this.fontSize * 0.65) : this.fontSize;
  }

  checkIfPredator() {
    return ['creaturesCardBear', 'creaturesCardCoyote'].includes(this.type);
  }

  getEmoji() {
    return { creaturesCardSheep: '🐑', creaturesCardCow: '🐄', creaturesCardChicken: '🐔', creaturesCardPig: '🐖', creaturesCardBear: '🐻', creaturesCardCoyote: '🐺' }[this.type] || '❓';
  }

  update(deltaTime) {
    if (!this.isAlive || this.isPaused || this.isFrozen) return;

    this.age = Math.min(this.age + deltaTime, this.isPredator ? Animal.PREDATOR_MAX_AGE : Animal.MAX_AGE);
    this.hunger = Math.min(this.hunger + this.hungerRate * (deltaTime / 1000), this.maxNeed);
    this.thirst = Math.min(this.thirst + this.thirstRate * (deltaTime / 1000), this.maxNeed);

    if (this.age >= (this.isPredator ? Animal.PREDATOR_MAX_AGE : Animal.MAX_AGE)) {
      this.isAlive = false;
      animals.splice(animals.indexOf(this), 1);
      return;
    }

    this.updateTask(deltaTime);
    this.handleMovement(deltaTime);
    this.checkReproduction(deltaTime);
  }

  detectNearbyAnimals() {
    if (!this.isAlive) return [];
    const myGrid = this.gridPos();
    return animals.filter(a => a !== this && a.isAlive && calcDistance(myGrid.x, myGrid.y, a.gridPos().x, a.gridPos().y) <= this.detectionRange);
  }

  updateTask(deltaTime) {
    const nearby = this.detectNearbyAnimals();
    if (this.isPredator) {
      const prey = nearby.find(a => !a.isPredator && a.isAlive);
      this.currentTask = (this.hunger > this.maxNeed * 0.7 && prey) ? new HuntTask(this, prey) : (!this.currentTask || this.currentTask.isComplete) ? null : this.currentTask;
    } else {
      const predator = nearby.find(a => a.isPredator && a.isAlive);
      this.currentTask = predator ? new FleeTask(this, predator) :
        this.thirst > this.maxNeed ? new FindWaterTask(this) :
        this.hunger > this.maxNeed ? new FindBerriesTask(this) :
        (!this.currentTask || this.currentTask.isComplete) ? (this.currentTask instanceof FindWaterTask ? new FindBerriesTask(this) : new FindWaterTask(this)) : this.currentTask;
    }

    if (this.currentTask) {
      this.currentTask.update(deltaTime);
      if (this.currentTask.isComplete) this.currentTask = null;
    }
  }

  handleMovement(deltaTime) {
    this.timeSinceLastMove += deltaTime;
    if (this.timeSinceLastMove < this.moveInterval) return;

    const current = this.gridPos();
    const nextCell = this.getNextCell(current.x, current.y);
    
    // Add safety check for undefined nextCell
    if (!nextCell) {
      console.warn(`⚠️ ${this.type} at (${current.x}, ${current.y}) got undefined nextCell`);
      this.timeSinceLastMove = 0;
      return;
    }
    
    if (emptyCells.some(cell => cell && cell.x === nextCell.x && cell.y === nextCell.y)) {
      this.x = nextCell.x * cellSize;
      this.y = nextCell.y * cellSize;
      this.checkForKills();
    }
    this.timeSinceLastMove = 0;
  }

  getNextCell(x, y) {
    let isChasing = false;
    const targetGrid = this.movementMode === "towards" && this.targetAnimal ? this.targetAnimal.gridPos() :
                      this.movementMode === "away" && this.targetAnimal ? this.targetAnimal.gridPos() :
                      this.movementMode === "towards" && this.targetPosition ? { x: Math.floor(this.targetPosition.x / cellSize), y: Math.floor(this.targetPosition.y / cellSize) } : null;

    if (targetGrid) {
      this.currentDirection = this.getDirectionTowardsOrAway(targetGrid.x, targetGrid.y, this.movementMode === "towards");
      isChasing = true;
    } else {
      const nearby = this.detectNearbyAnimals();
      const relevant = nearby.find(a => this.isPredator ? !a.isPredator : a.isPredator);
      if (relevant) {
        const target = relevant.gridPos();
        this.currentDirection = this.getDirectionTowardsOrAway(target.x, target.y, this.isPredator);
        isChasing = true;
      } else if (this.isPredator) {
        const moves = [{ x: x + 1, y }, { x, y: y + 1 }, { x: x - 1, y }, { x, y: y - 1 }];
        const desirability = moves.map(m => ({ move: m, value: this.evaluateCellDesirability(emptyCells.find(c => c && c.x === m.x && c.y === m.y)) }));
        
        if (Math.random() < 0.85) {
          const values = desirability.map(d => d.value);
          // Make sure we have valid values before finding max
          if (values.length > 0) {
            const maxVal = Math.max(...values);
            const best = desirability.filter(d => d.value === maxVal);
            
            // Check if best array has elements before accessing it
            if (best && best.length > 0) {
              const selectedBest = best[Math.floor(Math.random() * best.length)];
              // Make sure selectedBest exists and has a move property
              if (selectedBest && selectedBest.move) {
                const selectedMove = selectedBest.move;
                const index = moves.findIndex(m => m.x === selectedMove.x && m.y === selectedMove.y);
                // Ensure index is valid
                if (index !== -1) {
                  this.currentDirection = index;
                }
              }
            }
          }
        } else {
          this.currentDirection = (this.currentDirection + (Math.random() < 0.5 ? 1 : -1) + 4) % 4;
        }
      } else if (Math.random() < this.directionChangeChance) {
        this.currentDirection = (this.currentDirection + (Math.random() < 0.5 ? 1 : -1) + 4) % 4;
      }
    }

    // Ensure current direction is valid
    this.currentDirection = ((this.currentDirection % 4) + 4) % 4;
    
    this.moveInterval = isChasing ? this.chaseSpeed : this.normalSpeed;
    const moves = [{ x: x + 1, y }, { x, y: y + 1 }, { x: x - 1, y }, { x, y: y - 1 }];
    return moves[this.currentDirection];
  }

  getDirectionTowardsOrAway(tx, ty, towards) {
    const { x, y } = this.gridPos();
    const dx = tx - x, dy = ty - y;
    const dirX = towards ? Math.sign(dx) : -Math.sign(dx);
    const dirY = towards ? Math.sign(dy) : -Math.sign(dy);
    return Math.abs(dx) > Math.abs(dy) ? (dirX > 0 ? 0 : 2) : (dirY > 0 ? 1 : 3);
  }

  evaluateCellDesirability(cell) {
    if (!cell?.noise) return 0.5;
    const noise = parseFloat(cell.noise);
    return this.type === 'creaturesCardCoyote' ? (noise < 0.09 ? 1 : 0.2) :
           this.type === 'creaturesCardBear' ? (noise > 0.24 ? 1 : 0.2) : 0.5;
  }

  checkReproduction(deltaTime) {
    if (this.moveInterval === this.chaseSpeed || animals.length >= Animal.MAX_ANIMALS) return;
    this.timeSinceLastReproduction += deltaTime;
    if (this.timeSinceLastReproduction < Animal.REPRODUCTION_INTERVAL) return;

    const sameSpecies = animals.filter(a => a.type === this.type && a.isAlive);
    if (sameSpecies.length < 2) return;

    const { x, y } = this.gridPos();
    const adjacent = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]
      .map(([x, y]) => ({ x, y }))
      .filter(cell => emptyCells.some(g => g.x === cell.x && g.y === cell.y));

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
    const { x, y } = this.gridPos();
    const prey = animals.find(a => a !== this && !a.isPredator && a.isAlive && calcDistance(x, y, a.gridPos().x, a.gridPos().y) <= Animal.KILL_DISTANCE);
    if (prey) this.killAnimal(prey);
  }

  killAnimal(prey) {
    [this, prey].forEach(a => { a.isFrozen = true; a.freezeTime = Date.now(); });
    prey.isDying = true;
    prey.deathTime = Date.now();
    prey.animateEmoji('small', prey.emoji, 500);
    setTimeout(() => prey.animateEmoji('fade', '🥩', 500), 500);
    this.animateEmoji('fade', this.emoji, 500);
    setTimeout(() => {
      prey.isAlive = false;
      animals.splice(animals.indexOf(prey), 1);
    }, 2000);
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