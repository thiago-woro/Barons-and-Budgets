class Animal {
  // Static speed settings
  static PREY_BASE_SPEED = 1000;  // Base movement interval for prey
  static PREDATOR_SPEED_MULTIPLIER = 2;  // How much faster predators are
  static KILL_DISTANCE = 1;  // Distance in cells required for a kill

  constructor(x, y, type) {
    this.x = x * cellSize;
    this.y = y * cellSize;
    this.type = type;
    this.isPredator = this.checkIfPredator();
    this.emoji = this.getEmoji();
    this.state = "idle";
    this.isAlive = true;
    
    // Set movement speed based on predator/prey status
    this.moveInterval = this.isPredator ? 
      Animal.PREY_BASE_SPEED / Animal.PREDATOR_SPEED_MULTIPLIER : 
      Animal.PREY_BASE_SPEED;
    
    this.timeSinceLastMove = 0;
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
    if (!this.isPredator || !this.isAlive) return;

    const currentX = Math.floor(this.x / cellSize);
    const currentY = Math.floor(this.y / cellSize);
    
    // Check for prey in kill range
    const prey = animals.filter(animal => {
      if (animal === this || animal.isPredator || !animal.isAlive) return false;
      
      const animalX = Math.floor(animal.x / cellSize);
      const animalY = Math.floor(animal.y / cellSize);
      
      const distance = Math.sqrt(
        Math.pow(currentX - animalX, 2) + 
        Math.pow(currentY - animalY, 2)
      );
      
      return distance <= Animal.KILL_DISTANCE;
    });

    // Kill the first prey found
    if (prey.length > 0) {
      this.killAnimal(prey[0]);
    }
  }

  killAnimal(prey) {
    prey.isAlive = false;
    // Remove the dead animal from the animals array
    const index = animals.indexOf(prey);
    if (index > -1) {
      animals.splice(index, 1);
    }
    
    // Add notification
    addNotification(
      "Hunt",
      `${this.emoji} catches ${prey.emoji}`,
      `A ${this.type.replace('creaturesCard', '')} caught a ${prey.type.replace('creaturesCard', '')}!`,
      [],
      "#ff6b6b"
    );
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

  move(deltaTime) {
    if (!this.isAlive) return;

    this.timeSinceLastMove += deltaTime;
    
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
    
    ctx.font = '20px Arial';
    ctx.fillText(this.emoji, this.x, this.y);
  }
} 