class Animal {
  // Static speed settings
  static PREY_BASE_SPEED = 1000;  // Base movement interval for prey
  static PREDATOR_SPEED_MULTIPLIER = 2;  // How much faster predators are
  static KILL_DISTANCE = 1;  // Distance in cells required for a kill
  static REPRODUCTION_INTERVAL = 20000;  // Time between reproduction attempts (5 seconds)
  static MAX_AGE = 60000;  // Time until natural death (60 seconds)
  static PREDATOR_MAX_AGE = 30000;  // Predators die twice as fast (30 seconds)
  static MAX_ANIMALS = Math.floor(maxLandPopulation);  // Maximum number of animals allowed based on usable land

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
    this.animation = {
      type,
      emoji,
      startTime: Date.now(),
      duration
    };
  }

  drawAnimation(ctx) {
    if (!this.animation) return false;

    const progress = (Date.now() - this.animation.startTime) / this.animation.duration;
    if (progress >= 1) {
      this.animation = null;
      return false;
    }

    ctx.font = '20px Arial';
    
    switch (this.animation.type) {
      case 'pop':
        const scale = 1 + Math.sin(progress * Math.PI) * 0.5; // Scale between 1 and 1.5
        ctx.font = `${20 * scale}px Arial`;
        ctx.fillText(this.animation.emoji, this.x, this.y);
        break;
      
      case 'fade':
        ctx.globalAlpha = 1 - progress;
        ctx.fillText(this.animation.emoji, this.x, this.y);
        ctx.globalAlpha = 1;
        break;
      
      case 'small':
        const size = 20 - (progress * 10); // Shrink from 20 to 10
        ctx.font = `${size}px Arial`;
        ctx.fillText(this.animation.emoji, this.x, this.y);
        break;

      case 'getBig':
        const growSize = 4 + (progress * 16); // Start at 4px, grow to 20px
        ctx.font = `${growSize}px Arial`;
        ctx.fillText(this.animation.emoji, this.x, this.y);
        break;
    }

    return true;
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

    // Define movement based on direction
    const moves = [
      { x: currentX + 1, y: currentY },     // right
      { x: currentX, y: currentY + 1 },     // down
      { x: currentX - 1, y: currentY },     // left
      { x: currentX, y: currentY - 1 }      // up
    ];

    // Maybe change direction if not chasing/fleeing
    if (!isChasing && Math.random() < this.directionChangeChance) {
      // 70% chance to turn 90 degrees, 30% chance to turn 180
      const turnAmount = Math.random() < 0.7 ? 1 : 2;
      // Randomly decide to turn left or right for 90-degree turns
      this.currentDirection = (this.currentDirection + (turnAmount * (Math.random() < 0.5 ? 1 : -1)) + 4) % 4;
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
    if (!this.isAlive) return;

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