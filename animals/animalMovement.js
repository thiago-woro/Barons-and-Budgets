/* 
bush object is:
{
  "gridX": 155,
  "gridY": 92
}

 ANIMAL OBJECT IS
 {
  "x": 840,
  "y": 2260,
  "gridX": 42,
  "gridY": 113,
}
  */



// Task: Move to a random cell within a radius without a curve
function taskSlowRandomMove(animal, params = {}) {
  return new Promise(resolve => {
    const { radius = 4, movementDuration = 1000 } = params;
    animal.state = "moving";

    // Try to find a walkable cell within radius
    let targetCell = null;
    const randomOffsetX = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
    const randomOffsetY = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
    const potentialX = animal.gridX + randomOffsetX;
    const potentialY = animal.gridY + randomOffsetY;

    if (walkableCellsLookup.has(`${potentialX},${potentialY}`)) {
      targetCell = { gridX: potentialX, gridY: potentialY };
    } else {
      // Fallback to adjacent cell if no walkable cell found
      const possibleMoves = [
        { gridX: animal.gridX + 1, gridY: animal.gridY },
        { gridX: animal.gridX - 1, gridY: animal.gridY },
        { gridX: animal.gridX, gridY: animal.gridY + 1 },
        { gridX: animal.gridX, gridY: animal.gridY - 1 }
      ];
      targetCell = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }

    const targetX = targetCell.gridX * cellSize;
    const targetY = targetCell.gridY * cellSize;
    const startX = animal.x;
    const startY = animal.y;
    const startTime = performance.now();

    function animate(time) {
      const progress = Math.min((time - startTime) / movementDuration, 1);
      animal.x = startX + (targetX - startX) * progress;
      animal.y = startY + (targetY - startY) * progress;

      animalCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);
      animals.forEach(a => a.draw(animalCtx));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        animal.gridX = targetCell.gridX;
        animal.gridY = targetCell.gridY;
        animal.state = "idle";
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}




// Task: Move to a random cell within a radius
function taskMoveRandom(animal, params = {}) {
  return new Promise(resolve => {
    const { radius = 4, movementDuration = 1000 } = params;
    animal.state = "randomJump";

    // Try to find a walkable cell within radius
    let targetCell = null;
    const randomOffsetX = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
    const randomOffsetY = Math.floor(Math.random() * (radius * 2 + 1)) - radius;
    const potentialX = animal.gridX + randomOffsetX;
    const potentialY = animal.gridY + randomOffsetY;

    if (walkableCellsLookup.has(`${potentialX},${potentialY}`)) {
      targetCell = { gridX: potentialX, gridY: potentialY };
    } else {
      // Fallback to adjacent cell if no walkable cell found
      const possibleMoves = [
        { gridX: animal.gridX + 1, gridY: animal.gridY },
        { gridX: animal.gridX - 1, gridY: animal.gridY },
        { gridX: animal.gridX, gridY: animal.gridY + 1 },
        { gridX: animal.gridX, gridY: animal.gridY - 1 }
      ];
      targetCell = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
    }

    const targetX = targetCell.gridX * cellSize;
    const targetY = targetCell.gridY * cellSize;
    const startX = animal.x;
    const startY = animal.y;
    const midX = (startX + targetX) / 2;
    const midY = (startY + targetY) / 2 - 50;
    const startTime = performance.now();

    function animate(time) {
      const progress = Math.min((time - startTime) / movementDuration, 1);
      const t = progress;
      const oneMinusT = 1 - t;

      animal.x = oneMinusT * oneMinusT * startX + 2 * oneMinusT * t * midX + t * t * targetX;
      animal.y = oneMinusT * oneMinusT * startY + 2 * oneMinusT * t * midY + t * t * targetY;

      animalCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);
      animals.forEach(a => a.draw(animalCtx));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        animal.gridX = targetCell.gridX;
        animal.gridY = targetCell.gridY;
        animal.state = "idle";
        resolve();
      }
    }

    requestAnimationFrame(animate);
  });
}

// Task: Look for food (puddle, grass, or bush)
function taskLookForFood(animal, params = {}) {
  return new Promise(resolve => {
    const { bushCheckRadius = 3, adjacentRadius = 1 } = params;
    animal.state = "lookingforfood";

    let resource = null;
    let isPuddle = false;
    let isGrass = false;

    // Check for puddle
    let closestPuddle = null;
    for (let dx = -bushCheckRadius; dx <= bushCheckRadius; dx++) {
      for (let dy = -bushCheckRadius; dy <= bushCheckRadius; dy++) {
        const checkX = animal.gridX + dx;
        const checkY = animal.gridY + dy;
        if (Math.abs(dx) + Math.abs(dy) <= bushCheckRadius && puddlePositions.has(`${checkX},${checkY}`)) {
          if (!closestPuddle || (Math.abs(dx) + Math.abs(dy) < Math.abs(closestPuddle.gridX - animal.gridX) + Math.abs(closestPuddle.gridY - animal.gridY))) {
            closestPuddle = { gridX: checkX, gridY: checkY };
          }
        }
      }
    }

    if (closestPuddle) {
      resource = closestPuddle;
      isPuddle = true;
    } else if (animal.type === "Cow" || animal.type === "Chicken") {
      // Check for grass if animal eats grass
      const nearbyGrass = grassCells.filter(g => 
        Math.abs(g.x - animal.gridX) + Math.abs(g.y - animal.gridY) <= bushCheckRadius
      );
      
      if (nearbyGrass.length > 0) {
        resource = nearbyGrass.reduce((closest, grass) => {
          const distToCurrent = Math.abs(grass.x - animal.gridX) + Math.abs(grass.y - animal.gridY);
          const distToClosest = Math.abs(closest.x - animal.gridX) + Math.abs(closest.y - animal.gridY);
          return distToCurrent < distToClosest ? grass : closest;
        }, nearbyGrass[0]);
        
        resource = { gridX: resource.x, gridY: resource.y };
        isGrass = true;
      }
    }

    // If no puddle or grass found, check for bushes
    if (!resource) {
      const nearbyBushes = gBushesPositions.filter(b => 
        Math.abs(b.gridX - animal.gridX) + Math.abs(b.gridY - animal.gridY) <= bushCheckRadius
      );
      
      if (nearbyBushes.length > 0) {
        resource = nearbyBushes.reduce((closest, bush) => {
          const distToCurrent = Math.abs(bush.gridX - animal.gridX) + Math.abs(bush.gridY - animal.gridY);
          const distToClosest = Math.abs(closest.gridX - animal.gridX) + Math.abs(closest.gridY - animal.gridY);
          return distToCurrent < distToClosest ? bush : closest;
        }, nearbyBushes[0]);
      }
    }

    if (resource) {
      let targetCellList;
      if (isGrass) {
        // For grass, the target is the grass cell itself
        targetCellList = [{ gridX: resource.gridX, gridY: resource.gridY }];
      } else {
        // For puddles and bushes, target an adjacent cell
        targetCellList = [
          { gridX: resource.gridX - adjacentRadius, gridY: resource.gridY },
          { gridX: resource.gridX + adjacentRadius, gridY: resource.gridY },
          { gridX: resource.gridX, gridY: resource.gridY - adjacentRadius },
          { gridX: resource.gridX, gridY: resource.gridY + adjacentRadius }
        ].filter(cell => walkableCellsLookup.has(`${cell.gridX},${cell.gridY}`));

        // If no walkable adjacent cells, use the closest walkable cell
        if (targetCellList.length === 0) {
          targetCellList = [{ gridX: animal.gridX, gridY: animal.gridY }];
        }
      }
      
      // Store the target resource and cell for later tasks
      animal.targetResource = { ...resource, isPuddle, isGrass };
      animal.targetCell = targetCellList[Math.floor(Math.random() * targetCellList.length)];
      resolve(true); // Resolved with true means resource was found
    } else {
      // No resource found
      animal.state = "cooldown";
      setTimeout(() => {
        animal.state = "idle";
        resolve(false); // Resolved with false means no resource was found
      }, 1000);
    }
  });
}

// Task: Move to food resource
function taskMoveToFood(animal, params = {}) {
  return new Promise(resolve => {
    const { movementDuration = 1000 } = params;
    
    if (!animal.targetResource || !animal.targetCell) {
      animal.state = "idle";
      resolve(false);
      return;
    }

    animal.state = "movingtofood";
    const targetX = animal.targetCell.gridX * cellSize;
    const targetY = animal.targetCell.gridY * cellSize;
    const moveStartTime = performance.now();

    function animate(time) {
      const progress = Math.min((time - moveStartTime) / movementDuration, 1);
      animal.x = animal.x + (targetX - animal.x) * progress;
      animal.y = animal.y + (targetY - animal.y) * progress;

      animalCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);
      animals.forEach(a => a.draw(animalCtx));

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        animal.gridX = animal.targetCell.gridX;
        animal.gridY = animal.targetCell.gridY;
        resolve(true);
      }
    }

    requestAnimationFrame(animate);
  });
}

// Task: Drink from puddle
function taskDrink(animal, params = {}) {
  return new Promise(resolve => {
    const { eatingDuration = 2000, minDrinkingDuration = 3000, minDrinkingCooldown = 8000 } = params;
    
    if (!animal.targetResource || !animal.targetResource.isPuddle) {
      animal.state = "idle";
      resolve(false);
      return;
    }

    animal.state = "drinking";
    const resource = animal.targetResource;
    const puddle = potablePuddleCells.find(p => p.x === resource.gridX && p.y === resource.gridY);

    if (puddle) {
      // Calculate drinking parameters based on puddle size
      const originalOpacity = puddle.opacity || 0.6;
      const drinkingDuration = Math.max(minDrinkingDuration, originalOpacity * eatingDuration * 2);
      const fadeSteps = drinkingDuration / 100;
      const fadeAmount = puddle.opacity / fadeSteps;

      // Create interval for gradual draining
      const fadeInterval = setInterval(() => {
        if (puddle.opacity > 0) {
          puddle.opacity = Math.max(0, puddle.opacity - fadeAmount);
          drawPuddles(); // Redraw puddles after each update
        } else {
          // When opacity reaches 0, clear interval and update puddle positions
          clearInterval(fadeInterval);
          // Filter out this puddle from the array when fully drained
          potablePuddleCells = potablePuddleCells.filter(p => 
            !(p.x === resource.gridX && p.y === resource.gridY)
          );
          updatePuddlePositions(); // Update the puddle positions set
        }
      }, 100);
      
      // Handle state after drinking
      setTimeout(() => {
        animal.state = "cooldown";
        setTimeout(() => {
          animal.state = "idle";
          animal.targetResource = null;
          animal.targetCell = null;
          resolve(true);
        }, minDrinkingCooldown);
      }, drinkingDuration);
    } else {
      // Puddle not found or already gone
      animal.state = "idle";
      animal.targetResource = null;
      animal.targetCell = null;
      resolve(false);
    }
  });
}

// Task: Eat grass
function taskEatGrass(animal, params = {}) {
  return new Promise(resolve => {
    const { eatingDuration = 2000 } = params;
    
    if (!animal.targetResource || !animal.targetResource.isGrass) {
      animal.state = "idle";
      resolve(false);
      return;
    }

    animal.state = "eating";
    const resource = animal.targetResource;
    const cellX = resource.gridX;
    const cellY = resource.gridY;
    
    // Optional: Draw a red X over the targeted grass cell (for debugging)
    if (debugCtx) {
      const x = cellX * cellSize;
      const y = cellY * cellSize;
      
      debugCtx.save(); // Save current context state
      debugCtx.strokeStyle = 'red';
      debugCtx.lineWidth = 2;
      
      debugCtx.beginPath();
      debugCtx.moveTo(x, y);
      debugCtx.lineTo(x + cellSize, y + cellSize);
      debugCtx.moveTo(x + cellSize, y);
      debugCtx.lineTo(x, y + cellSize);
      debugCtx.stroke();
      debugCtx.restore(); // Restore context state
      
      // Clear the X after a delay
      setTimeout(() => {
        debugCtx.clearRect(x - 2, y - 2, cellSize + 4, cellSize + 4);
      }, eatingDuration + 500);
    }
    
    setTimeout(() => {
      const bushIndex = grassCells.findIndex(grass => 
        grass.x === cellX && grass.y === cellY
      );
      
      if (bushIndex !== -1) {
        // Remove the grass cell from the array
        grassCells.splice(bushIndex, 1);
        
        // Only update the specific grass cell that was removed
        const x = cellX * cellSize;
        const y = cellY * cellSize;
        grassCtx.clearRect(x, y, cellSize, cellSize);
      }
      
      animal.state = "cooldown";
      setTimeout(() => {
        animal.state = "idle";
        animal.targetResource = null;
        animal.targetCell = null;
        resolve(true);
      }, 1000);
    }, eatingDuration);
  });
}

// Task: Eat bush
function taskEatBush(animal, params = {}) {
  return new Promise(resolve => {
    const { eatingDuration = 2000 } = params;
    
    if (!animal.targetResource || animal.targetResource.isPuddle || animal.targetResource.isGrass) {
      animal.state = "idle";
      resolve(false);
      return;
    }

    animal.state = "eating";
    const resource = animal.targetResource;

    setTimeout(() => {
      const bushIndex = gBushesPositions.findIndex(b => 
        b.gridX === resource.gridX && b.gridY === resource.gridY
      );
      
      if (bushIndex !== -1) {
        gBushesPositions.splice(bushIndex, 1);
        const treeIndex = treePositions.findIndex(t => 
          t.gridX === resource.gridX && t.gridY === resource.gridY && t.emoji === "🌳"
        );
        if (treeIndex !== -1) treePositions.splice(treeIndex, 1);
        modifyWalkableCells([{ x: resource.gridX, y: resource.gridY }], "add");
      }
      
      animal.state = "cooldown";
      setTimeout(() => {
        animal.state = "idle";
        animal.targetResource = null;
        animal.targetCell = null;
        resolve(true);
      }, 1000);
    }, eatingDuration);
  });
}

// Task: Cooldown
function taskCooldown(animal, params = {}) {
  return new Promise(resolve => {
    const { duration = 1000 } = params;
    animal.state = "cooldown";
    setTimeout(() => {
      animal.state = "idle";
      resolve();
    }, duration);
  });
}

// Add task queue to each animal (called once during initialization)
function initializeAnimalTaskSystem() {
  animals.forEach(animal => {
    if (!animal.taskQueue) {
      animal.taskQueue = [];
      animal.isProcessingTasks = false;
    }
  });
}

// Function to add tasks to an animal's queue and process them
async function addTasksToAnimal(animal, tasks) {
  // Initialize if not already done
  if (!animal.taskQueue) {
    animal.taskQueue = [];
    animal.isProcessingTasks = false;
  }
  
  // Add new tasks to the queue
  animal.taskQueue.push(...tasks);

  // If the animal is not already processing tasks, start processing
  if (!animal.isProcessingTasks && animal.taskQueue.length > 0) {
    animal.isProcessingTasks = true;
    
    try {
      while (animal.taskQueue.length > 0) {
        const { task, params } = animal.taskQueue[0]; // Look at the next task
        const result = await task(animal, params); // Wait for the task to complete
        
        // Remove the task we just completed
        animal.taskQueue.shift();
        
        // If the task returned false and there are conditional tasks, skip them
        if (result === false && animal.taskQueue.length > 0 && animal.taskQueue[0].conditional) {
          // Skip all consecutive conditional tasks
          while (animal.taskQueue.length > 0 && animal.taskQueue[0].conditional) {
            animal.taskQueue.shift();
          }
        }
      }
    } catch (error) {
      console.error(`Error processing tasks for animal ${animal.id}:`, error);
    }
    
    // When all tasks are done, set animal to idle
    animal.isProcessingTasks = false;
    animal.state = "idle";
  }
}

// Behavior definitions for different animal types
const animalBehaviors = {
  Chicken: [
    { task: taskLookForFood, params: { bushCheckRadius: 3, adjacentRadius: 1 } },
    { task: taskMoveToFood, params: { movementDuration: 1000 }, conditional: true },
    { task: taskDrink, params: { eatingDuration: 2000, minDrinkingDuration: 3000, minDrinkingCooldown: 8000 }, conditional: true },
    { task: taskEatGrass, params: { eatingDuration: 2000 }, conditional: true },
    { task: taskEatBush, params: { eatingDuration: 2000 }, conditional: true },
    { task: taskMoveRandom, params: { radius: 4, movementDuration: 1000 } },
    { task: taskCooldown, params: { duration: 2000 } }
  ],
  Cow: [
    { task: taskSlowRandomMove, params: { radius: 2, movementDuration: 800 } },
    { task: taskLookForFood, params: { bushCheckRadius: 3, adjacentRadius: 1 } },
    { task: taskMoveToFood, params: { movementDuration: 1800 }, conditional: true },
    { task: taskEatGrass, params: { eatingDuration: 3500 }, conditional: true },
    { task: taskCooldown, params: { duration: 1000 } }
  ],
  Sheep: [
    { task: taskLookForFood, params: { bushCheckRadius: 3, adjacentRadius: 1 } },
    { task: taskMoveToFood, params: { movementDuration: 1000 }, conditional: true },
    { task: taskEatBush, params: { eatingDuration: 2000 }, conditional: true },
    { task: taskMoveRandom, params: { radius: 3, movementDuration: 1000 } },
    { task: taskCooldown, params: { duration: 1500 } }
  ],
  Pig: [
    { task: taskLookForFood, params: { bushCheckRadius: 3, adjacentRadius: 1 } },
    { task: taskMoveToFood, params: { movementDuration: 1000 }, conditional: true },
    { task: taskEatBush, params: { eatingDuration: 2000 }, conditional: true },
    { task: taskMoveRandom, params: { radius: 4, movementDuration: 1000 } },
    { task: taskCooldown, params: { duration: 2000 } }
  ]
};

// Task: Hunt for prey
function taskHuntForPrey(animal, params = {}) {
  return new Promise(resolve => {
    const { huntRadius = 5 } = params;
    animal.state = "hunting";
    
    // Check if animal is a predator
    if (!animal.isPredator) {
      animal.state = "idle";
      resolve(false);
      return;
    }
    
    // Find potential prey within hunt radius
    const potentialPrey = animals.filter(prey => 
      prey.id !== animal.id && 
      !prey.isPredator && 
      Math.abs(prey.gridX - animal.gridX) + Math.abs(prey.gridY - animal.gridY) <= huntRadius
    );
    
    if (potentialPrey.length > 0) {
      // Choose closest prey
      const closestPrey = potentialPrey.reduce((closest, prey) => {
        const distToCurrent = Math.abs(prey.gridX - animal.gridX) + Math.abs(prey.gridY - animal.gridY);
        const distToClosest = Math.abs(closest.gridX - animal.gridX) + Math.abs(closest.gridY - animal.gridY);
        return distToCurrent < distToClosest ? prey : closest;
      }, potentialPrey[0]);
      
      // Store target animal for subsequent tasks
      animal.targetAnimal = closestPrey;
      resolve(true);
    } else {
      animal.state = "idle";
      resolve(false);
    }
  });
}

// Task: Move towards prey
function taskMoveToPrey(animal, params = {}) {
  return new Promise(resolve => {
    const { movementDuration = 1200 } = params;
    
    if (!animal.targetAnimal) {
      animal.state = "idle";
      resolve(false);
      return;
    }
    
    animal.state = "stalking";
    
    // Calculate position to move to (adjacent to prey)
    const prey = animal.targetAnimal;
    const currentDistX = prey.gridX - animal.gridX;
    const currentDistY = prey.gridY - animal.gridY;
    
    // Move closer but not all the way to prey
    const moveDistX = currentDistX === 0 ? 0 : (currentDistX > 0 ? 1 : -1);
    const moveDistY = currentDistY === 0 ? 0 : (currentDistY > 0 ? 1 : -1);
    
    let targetGridX = animal.gridX + moveDistX;
    let targetGridY = animal.gridY + moveDistY;
    
    // Check if target cell is walkable
    if (!walkableCellsLookup.has(`${targetGridX},${targetGridY}`)) {
      // Try moving only horizontally or vertically if diagonal isn't walkable
      if (walkableCellsLookup.has(`${animal.gridX + moveDistX},${animal.gridY}`)) {
        targetGridX = animal.gridX + moveDistX;
        targetGridY = animal.gridY;
      } else if (walkableCellsLookup.has(`${animal.gridX},${animal.gridY + moveDistY}`)) {
        targetGridX = animal.gridX;
        targetGridY = animal.gridY + moveDistY;
      } else {
        // No valid move, stay in place
        animal.state = "idle";
        resolve(false);
        return;
      }
    }
    
    const targetX = targetGridX * cellSize;
    const targetY = targetGridY * cellSize;
    const startX = animal.x;
    const startY = animal.y;
    const moveStartTime = performance.now();
    
    function animate(time) {
      const progress = Math.min((time - moveStartTime) / movementDuration, 1);
      animal.x = animal.x + (targetX - animal.x) * progress;
      animal.y = animal.y + (targetY - animal.y) * progress;
      
      animalCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);
      animals.forEach(a => a.draw(animalCtx));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        animal.gridX = targetGridX;
        animal.gridY = targetGridY;
        
        // Check if close enough to attack
        const distanceToTarget = Math.abs(animal.gridX - prey.gridX) + Math.abs(animal.gridY - prey.gridY);
        if (distanceToTarget <= 1) {
          resolve(true); // Ready to attack
        } else {
          resolve(true); // Moved closer but not close enough yet
        }
      }
    }
    
    requestAnimationFrame(animate);
  });
}

// Task: Attack prey
function taskAttackPrey(animal, params = {}) {
  return new Promise(resolve => {
    const { attackDuration = 1500 } = params;
    
    if (!animal.targetAnimal) {
      animal.state = "idle";
      resolve(false);
      return;
    }
    
    const prey = animal.targetAnimal;
    const distanceToTarget = Math.abs(animal.gridX - prey.gridX) + Math.abs(animal.gridY - prey.gridY);
    
    if (distanceToTarget > 1) {
      // Too far to attack
      animal.state = "idle";
      resolve(false);
      return;
    }
    
    animal.state = "attacking";
    
    // Visual effect for attack
    if (debugCtx) {
      const x = prey.gridX * cellSize;
      const y = prey.gridY * cellSize;
      
      debugCtx.save();
      debugCtx.strokeStyle = 'red';
      debugCtx.lineWidth = 3;
      debugCtx.beginPath();
      debugCtx.arc(x + cellSize/2, y + cellSize/2, cellSize/2, 0, Math.PI * 2);
      debugCtx.stroke();
      debugCtx.restore();
      
      setTimeout(() => {
        debugCtx.clearRect(x - 3, y - 3, cellSize + 6, cellSize + 6);
      }, attackDuration);
    }
    
    setTimeout(() => {
      // Remove prey from game
      const preyIndex = animals.findIndex(a => a.id === prey.id);
      if (preyIndex !== -1) {
        animals.splice(preyIndex, 1);
        animalCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);
        animals.forEach(a => a.draw(animalCtx));
      }
      
      animal.state = "cooldown";
      animal.targetAnimal = null;
      
      setTimeout(() => {
        animal.state = "idle";
        resolve(true);
      }, 2000); // Cooldown after attacking
    }, attackDuration);
  });
}

// Add predator behavior to animalBehaviors
animalBehaviors.Wolf = [
  { task: taskHuntForPrey, params: { huntRadius: 6 } },
  { task: taskMoveToPrey, params: { movementDuration: 1200 }, conditional: true },
  { task: taskAttackPrey, params: { attackDuration: 1500 }, conditional: true },
  { task: taskMoveRandom, params: { radius: 5, movementDuration: 1500 } },
  { task: taskCooldown, params: { duration: 2500 } }
];

animalBehaviors.Fox = [
  { task: taskHuntForPrey, params: { huntRadius: 4 } },
  { task: taskMoveToPrey, params: { movementDuration: 800 }, conditional: true },
  { task: taskAttackPrey, params: { attackDuration: 1000 }, conditional: true },
  { task: taskMoveRandom, params: { radius: 4, movementDuration: 1000 } },
  { task: taskCooldown, params: { duration: 1500 } }
];

// Update moveHerbivoresPeriodically to include predators
function moveAnimalsPeriodically() {
  // Herbivores
  moveAnimalTypesPeriodically("Chicken", 2000, 0.4);
  moveAnimalTypesPeriodically("Sheep", 3000, 0.2);
  moveAnimalTypesPeriodically("Cow", 3000, 0.9);
  moveAnimalTypesPeriodically("Pig", 3000, 0.9);
  
  // Predators
  moveAnimalTypesPeriodically("Wolf", 4000, 0.8);
  moveAnimalTypesPeriodically("Fox", 3000, 0.6);

  setTimeout(moveAnimalsPeriodically, 2000);
  drawTrees(treeCtx, treePositions);
}

// Rename for clarity - this is the function that moves a specific type of animal
function moveAnimalTypesPeriodically(animalType, delay, movePercentage) {
  setTimeout(() => {
    const animalsToMove = animals.filter(a => a.type === animalType && a.state === "idle");
    const count = Math.floor(animalsToMove.length * movePercentage);
    const shuffled = animalsToMove.sort(() => Math.random() - 0.5).slice(0, count);

    shuffled.forEach(animal => {
      const behavior = animalBehaviors[animalType];
      if (behavior) {
        addTasksToAnimal(animal, behavior);
      }
    });
  }, delay);
}

// Backwards compatibility
function moveHerbivoresPeriodically() {
  moveAnimalsPeriodically();
}

// animateAnimalToRandomBush function now uses the task system
function animateAnimalToRandomBush(animal = currentAnimalSelected, eatingDuration = 2000, movementDuration = 1000) {
  if (!animal) return;
  
  // Clear any existing tasks
  animal.taskQueue = [];
  animal.isProcessingTasks = false;
  
  // Determine appropriate behavior based on animal type
  const behavior = animalBehaviors[animal.type] || [
    { task: taskMoveRandom, params: { radius: 4, movementDuration } },
    { task: taskLookForFood, params: { bushCheckRadius: 3, adjacentRadius: 1 } },
    { task: taskMoveToFood, params: { movementDuration }, conditional: true },
    { task: taskDrink, params: { eatingDuration, minDrinkingDuration: 3000, minDrinkingCooldown: 8000 }, conditional: true },
    { task: taskEatGrass, params: { eatingDuration }, conditional: true },
    { task: taskEatBush, params: { eatingDuration }, conditional: true }
  ];
  
  // Add tasks to the animal
  addTasksToAnimal(animal, behavior);
}

// Initialize the task system when the game starts
window.addEventListener('load', () => {
  initializeAnimalTaskSystem();
});

//npc card details
function showAnimalInfo(animal) {
  const infoPanel = document.getElementById('infoPanel');
  let infoHtml = `
    <strong>${animal.type} ${animal.emoji}</strong><br/>
    Position: ${animal.gridX}, ${animal.gridY}<br/>
    Age: <strong>${animal.age}</strong><br/>
    Is Predator: <strong>${animal.isPredator}</strong><br/>
    Eats Grass: <strong>${animal.eatsGrass}</strong><br/>
    Eats Plants: <strong>${animal.eatsPlants}</strong><br/>
    Eats Animals: <strong>${animal.eatsAnimals}</strong><br/>
    Hunger: <strong>${animal.hunger}</strong><br/>
    Thirst: <strong>${animal.thirst}</strong><br/>
    State: <strong>${animal.state}</strong><br/>
    Last State: <strong>${animal.lastState}</strong><br/>
    Time Since Last Reproduction: <strong>${animal.timeSinceLastReproduction}</strong><br/>
    Move Interval: <strong>${animal.moveInterval}</strong><br/>
    Move Cooldown: <strong>${animal.moveCooldown}</strong><br/>
    Resource Cooldown: <strong>${animal.resourceCooldown}</strong><br/>
    Wander Duration: <strong>${animal.wanderDuration}</strong><br/>
    Target Animal: <strong>${animal.targetAnimal}</strong><br/>
    Target Cell: <strong>${animal.targetCell ? `${animal.targetCell.gridX}, ${animal.targetCell.gridY}` : 'None'}</strong><br/>
    Task Queue: <strong>${animal.taskQueue ? animal.taskQueue.length : 0} tasks</strong><br/>
    Last Move From X: <strong>${animal.lastMoveFromX}</strong><br/>
    Last Move From Y: <strong>${animal.lastMoveFromY}</strong><br/>
    <br/>
    <br/>
    <br/>
    #${animal.id}<br/><br/>
    <button id="animateAnimalToRandomBushButton">Animate Animal</button>
  `;

  infoPanel.innerHTML = infoHtml; // Set the content 

  // Make the info panel visible
  infoPanel.style.visibility = 'visible';
  infoPanel.style.display = 'block';
  
  // Add event listener to the button AFTER it's added to the DOM
  document.getElementById('animateAnimalToRandomBushButton').addEventListener('click', () => {
    // Pass the current animal to the animation function
    animateAnimalToRandomBush(animal);
  });
}


let animateAnimalButton = document.getElementById('animateAnimalToRandomBushButton');

/* 
DO NOT TOUCH THIS
function animateAnimalToRandomBush(animal = null) {
    console.log("Animating animal to random bush");
  if ( !gBushesPositions || gBushesPositions.length === 0) {
    console.log("No animal or bush positions available.");
    return;
  }

  if (!animal) {
    animal = currentAnimalSelected;
    return;
  }

  // Select a random bush position
  const targetBush = gBushesPositions[Math.floor(Math.random() * gBushesPositions.length)];
  const targetX = targetBush.x * cellSize;
  const targetY = targetBush.y * cellSize;

  // Calculate the distance to the target
  const distanceX = targetX - animal.x;
  const distanceY = targetY - animal.y;

  // Calculate the number of steps (animation frames)
  const steps = 1; // You can adjust this for faster/slower animation

  // Calculate the increment for each step
  const incrementX = distanceX / steps;
  const incrementY = distanceY / steps;

  let currentStep = 0;

  function animateStep() {
    if (currentStep >= steps) {
      // Animation complete
      animal.x = targetX; // Ensure the final position is exact
      animal.y = targetY;
      animal.gridX = targetBush.x;
      animal.gridY = targetBush.y;
      animalCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);
      animal.draw(animalCtx);
      console.log("Animal animation complete at bush:", targetBush);
      return;
    }

    // Update animal position
    animal.x += incrementX;
    animal.y += incrementY;

    // Clear and redraw the animal
    animalCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);
    animal.draw(animalCtx);

    currentStep++;

    // Request the next animation frame
    requestAnimationFrame(animateStep);
  }

  // Start the animation
  animateStep();
}  */