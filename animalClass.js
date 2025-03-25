const calcDistance = (x1, y1, x2, y2) => Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

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
    return animals.filter(a => {
      if (a === this || !a.isAlive) return false;
      const distance = calcDistance(this.gridX, this.gridY, a.gridX, a.gridY);
      return distance <= this.detectionRange;
    });
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
            // If no target or target reached, set new target at the edge of detection
            if (!this.targetCell || this.hasReachedTarget()) {
              // Pick a cell at the edge of detection range in a random direction
              const angle = Math.random() * Math.PI * 2;
              const distance = this.detectionRange;
              const targetX = Math.floor(this.gridX + Math.cos(angle) * distance);
              const targetY = Math.floor(this.gridY + Math.sin(angle) * distance);
              
              // Find the closest empty cell to this target point
              let closest = null;
              let closestDist = Infinity;
              for (const cell of emptyCells) {
                const dist = calcDistance(targetX, targetY, cell.x, cell.y);
                if (dist < closestDist) {
                  closestDist = dist;
                  closest = cell;
                }
              }
              this.targetCell = closest || emptyCells[Math.floor(Math.random() * emptyCells.length)];
              
              // Find a path to the target
              this.findPathToTarget(this.targetCell);
            }
          }
          break;

        case "hunting":
          if (!this.targetAnimal?.isAlive) {
            this.state = "patrolling";
            this.targetAnimal = null;
            this.currentPath = null;
          } else {
            // Update path to the prey every few seconds to avoid constant recalculation
            if (!this.currentPath || this.stateTimer % 500 < 20) {
              // Only recalculate path if prey has moved significantly
              const target = { 
                x: this.targetAnimal.gridX, 
                y: this.targetAnimal.gridY 
              };
              
              if (target.x && target.y) {
                this.findPathToTarget(target);
                
                if (!this.currentPath) {
                  // If no path to prey, try to find a new prey
                  const newPrey = this.detectNearbyAnimals().find(a => !a.isPredator && a.isAlive);
                  if (newPrey && newPrey !== this.targetAnimal) {
                    console.log(`${this.type} (${this.gridX}, ${this.gridY}) switching to new prey target`);
                    this.targetAnimal = newPrey;
                    this.findPathToTarget({ x: newPrey.gridX, y: newPrey.gridY });
                  }
                }
              }
            }
            
            const distance = calcDistance(this.gridX, this.gridY, this.targetAnimal.gridX, this.targetAnimal.gridY);
            
            if (distance <= Animal.KILL_DISTANCE) {
              this.checkForKills();
              if (!this.targetAnimal?.isAlive) {
                this.hunger = Math.max(0, this.hunger - 70);
                this.state = "patrolling";
                this.targetAnimal = null;
                this.currentPath = null;
                console.log(`${this.type} (${this.gridX}, ${this.gridY}) killed prey and reduced hunger to ${this.hunger.toFixed(1)}`);
              }
            } else if (distance > this.detectionRange * 1.3 || this.stateTimer >= 5000) {
              console.log(`${this.type} (${this.gridX}, ${this.gridY}) gave up chase after ${Math.floor(this.stateTimer/1000)}s`);
              this.state = "patrolling";
              this.targetAnimal = null;
              this.currentPath = null;
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
          if (!predator || calcDistance(this.gridX, this.gridY, predator.gridX, predator.gridY) > this.detectionRange * 1.5) {
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

          if (this.stateTimer >= 5000) {
            console.log(`⏱️ ${this.type} (${this.gridX}, ${this.gridY}) gave up searching for water after ${Math.floor(this.stateTimer/1000)}s.`);
            this.state = "seekingBerries"; // Try berries instead
            this.targetCell = null;
            this.attemptedTargets.clear();
            this.stateTimer = 0;
            this.currentPath = null;
            break;
          }
          
          if (!this.targetCell) {
            // DEBUG: Log water positions to see their structure
            if (outsideRingLakeBorders.length > 0) {
              console.log(`Water data debug - first water cell:`, outsideRingLakeBorders[0]);
            } else {
              console.log(`No water cells in outsideRingLakeBorders array`);
            }
          
            // Find the closest water source - make sure to handle different property formats
            const waterCells = outsideRingLakeBorders
              .map(cell => {
                // Create a standard format with x,y coordinates
                return {
                  x: cell.x || cell.gridX || 0,
                  y: cell.y || cell.gridY || 0,
                  original: cell
                };
              })
              .filter(cell => !this.attemptedTargets.has(`${cell.x},${cell.y}`))
              .filter(cell => cell.x !== 0 || cell.y !== 0) // Filter out invalid water cells
              .sort((a, b) => {
                return calcDistance(this.gridX, this.gridY, a.x, a.y) - 
                       calcDistance(this.gridX, this.gridY, b.x, b.y);
              });

            if (!waterCells.length) {
              console.log(`❌ ${this.type} (${this.gridX}, ${this.gridY}) no accessible water cells found. Total attempted: ${this.attemptedTargets.size}`);
              this.state = "seekingBerries"; // Try berries instead
              this.targetCell = null;
              this.attemptedTargets.clear();
              this.stateTimer = 0;
              this.currentPath = null;
              break;
            }

            this.targetCell = waterCells[0];
            this.attemptedTargets.add(`${this.targetCell.x},${this.targetCell.y}`);
            console.log(`🔍 ${this.type} (${this.gridX}, ${this.gridY}) targeting water at (${this.targetCell.x}, ${this.targetCell.y}). Distance: ${calcDistance(this.gridX, this.gridY, this.targetCell.x, this.targetCell.y).toFixed(1)} cells`);
            
            // Find a path to the water
            const pathResult = this.findPathToTarget(this.targetCell);
            if (!pathResult) {
              console.log(`🚫 ${this.type} (${this.gridX}, ${this.gridY}) couldn't find path to water at (${this.targetCell.x}, ${this.targetCell.y})`);
              this.targetCell = null; // Reset target to try another water source
            } else {
              console.log(`✅ ${this.type} (${this.gridX}, ${this.gridY}) found path to water. Length: ${this.currentPath.length} steps`);
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

          if (this.stateTimer >= 5000) {
            console.log(`⏱️ ${this.type} (${this.gridX}, ${this.gridY}) gave up searching for berries after ${Math.floor(this.stateTimer/1000)}s.`);
            this.state = "seekingWater"; // Try water instead
            this.targetCell = null;
            this.stateTimer = 0;
            this.currentPath = null;
            break;
          }

          if (!this.targetCell) {
            if (!gBushesPositions.length) {
              console.log(`${this.type} (${this.gridX}, ${this.gridY}) failed to find berries - none exist on map`);
              this.state = "seekingWater"; // Try water instead
              this.targetCell = null;
              this.stateTimer = 0;
              this.currentPath = null;
              break;
            }
            
            // DEBUG: Log berry positions to see their structure
            console.log(`Berry data debug - first bush:`, gBushesPositions[0]);

            /* bushes
            {
  "gridX": 15,
  "gridY": 147
}
            
             */
            
            // Find closest berry bush - make sure to handle different property formats
            const berries = gBushesPositions.map(bush => {
              // Create a standard format with x,y coordinates regardless of the original format
              return {
                x: bush.x || bush.gridX || 0,
                y: bush.y || bush.gridY || 0,
                original: bush
              };
            }).filter(b => b.x !== 0 || b.y !== 0); // Filter out invalid berries
            
            if (berries.length === 0) {
              console.log(`${this.type} (${this.gridX}, ${this.gridY}) found no valid berry coordinates`);
              this.state = "seekingWater";
              this.targetCell = null;
              this.stateTimer = 0;
              this.currentPath = null;
              break;
            }
            
            // Sort by distance
            const closest = berries.sort((a, b) => 
              calcDistance(this.gridX, this.gridY, a.x, a.y) - 
              calcDistance(this.gridX, this.gridY, b.x, b.y)
            )[0];
            
            this.targetCell = closest;
            
            console.log(`🔍 ${this.type} (${this.gridX}, ${this.gridY}) targeting berries at (${this.targetCell.x}, ${this.targetCell.y}). Distance: ${calcDistance(this.gridX, this.gridY, this.targetCell.x, this.targetCell.y).toFixed(1)} cells`);
            
            // Find a path to the berries
            const berryPathResult = this.findPathToTarget(this.targetCell);
            if (!berryPathResult) {
              console.log(`🚫 ${this.type} (${this.gridX}, ${this.gridY}) couldn't find path to berries at (${this.targetCell.x}, ${this.targetCell.y})`);
              this.targetCell = null; // Reset target to try another berry bush
            } else {
              console.log(`✅ ${this.type} (${this.gridX}, ${this.gridY}) found path to berries. Length: ${this.currentPath.length} steps`);
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
    
    return calcDistance(this.gridX, this.gridY, targetX, targetY) <= 1;
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
    
    const start = { x: this.gridX, y: this.gridY };
    const end = { x: targetX, y: targetY };
    
    // Use existing findPath function from the game
    const path = findPath(start, end, true);
    
    if (path && path.length > 0) {
      this.currentPath = path;
      this.pathIndex = 0;
      return true;
    } else {
      console.log(`No path found for ${this.type} from (${start.x}, ${start.y}) to (${end.x}, ${end.y})`);
      return false;
    }
  }

  // Find a path away from a predator
  findEscapePath(predator) {
    // Calculate a position in the opposite direction of the predator
    const dx = this.gridX - predator.gridX;
    const dy = this.gridY - predator.gridY;
    const distance = Math.max(3, this.detectionRange); // Minimum escape distance
    
    // Normalize and scale the direction vector
    const length = Math.sqrt(dx * dx + dy * dy);
    const escapeX = Math.floor(this.gridX + (dx / length) * distance);
    const escapeY = Math.floor(this.gridY + (dy / length) * distance);
    
    // Find the closest empty cell to this escape point
    let bestCell = null;
    let bestDistance = Infinity;
    
    for (const cell of emptyCells) {
      const dist = calcDistance(escapeX, escapeY, cell.x, cell.y);
      if (dist < bestDistance) {
        bestDistance = dist;
        bestCell = cell;
      }
    }
    
    if (bestCell) {
      this.targetCell = bestCell;
      this.findPathToTarget(bestCell);
      if (this.currentPath) {
        console.log(`${this.type} (${this.gridX}, ${this.gridY}) fleeing predator to (${bestCell.x}, ${bestCell.y})`);
      } else {
        // If we can't find a valid escape path, try to move away blindly
        this.currentPath = null;
      }
    }
  }

  handleMovement(deltaTime) {
    this.timeSinceLastMove += deltaTime;
    if (this.timeSinceLastMove < this.moveInterval) return;
    
    // If we have a path, follow it
    if (this.currentPath && this.pathIndex < this.currentPath.length) {
      const nextCell = this.currentPath[this.pathIndex];
      this.x = nextCell.x * cellSize;
      this.y = nextCell.y * cellSize;
      this.gridX = nextCell.x;
      this.gridY = nextCell.y;
      this.pathIndex++;
      this.checkForKills();
      this.timeSinceLastMove = 0;
    }
    // If no path or at the end of the path, stay put
    else {
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
    
    const prey = animals.find(a => 
      a !== this && 
      !a.isPredator && 
      a.isAlive && 
      calcDistance(this.gridX, this.gridY, a.gridX, a.gridY) <= Animal.KILL_DISTANCE
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
      //log
      console.log(`Placed ${type} at ${cell.x}, ${cell.y}`);
    }
  }

  // Place predators
  placeAnimals(coyoteCount, 'Coyote', sandCells);
  placeAnimals(bearCount, 'Bear', mountainCells);

  // Place prey
  placeAnimals(sheepCount, 'Sheep', middleCells);
  placeAnimals(chickenCount, 'Chicken', middleCells);

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