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
 
  
function animateAnimalToRandomBush(animal = currentAnimalSelected, eatingDuration = 2000, movementDuration = 1000) {
  if (!animal) return;

  // Configurable radii
  const RANDOM_MOVE_RADIUS = 4;    // Initial random move range (±4 cells)
  const BUSH_CHECK_RADIUS = 3;     // Bush proximity check after random move
  const ADJACENT_RADIUS = 1;       // Distance to adjacent cell for bush
  const PRE_FOOD_COOLDOWN = 700;   // Cooldown before moving to food (in ms)

  animal.state = "randomJump";
  

  // Modified random offset generator that checks for walkable cells
  let targetCell = null;
  let attempts = 0;
  const MAX_ATTEMPTS = 2; // Prevent infinite loops if no valid cells found
  
  // Keep trying to find a valid walkable cell within range
  while (!targetCell && attempts < MAX_ATTEMPTS) {
    attempts++;
    
    // Generate random offset within RANDOM_MOVE_RADIUS
    const randomOffsetX = Math.floor(Math.random() * (RANDOM_MOVE_RADIUS * 2 + 1)) - RANDOM_MOVE_RADIUS;
    const randomOffsetY = Math.floor(Math.random() * (RANDOM_MOVE_RADIUS * 2 + 1)) - RANDOM_MOVE_RADIUS;
    
    // Calculate potential target cell
    const potentialX = animal.gridX + randomOffsetX;
    const potentialY = animal.gridY + randomOffsetY;
    
    // Check if the cell is walkable using the lookup set
    if (walkableCellsLookup.has(`${potentialX},${potentialY}`)) {
      targetCell = {
        gridX: potentialX,
        gridY: potentialY
      };
    }
  }
  
  // If no valid cell found after max attempts, use current position
  if (!targetCell) {
    console.warn("No walkable cell found for animal jump - staying in place");
    targetCell = {
      gridX: animal.gridX,
      gridY: animal.gridY
    };
  }
  
  let targetX = targetCell.gridX * cellSize;
  let targetY = targetCell.gridY * cellSize;
  const startX = animal.x;
  const startY = animal.y;
  const midX = (startX + targetX) / 2;
  const midY = (startY + targetY) / 2 - 50;
  const startTime = performance.now();

  function animateToRandomCell(time) {
    const progress = Math.min((time - startTime) / movementDuration, 1);
    const t = progress;
    const oneMinusT = 1 - t;

    animal.x = oneMinusT * oneMinusT * startX + 2 * oneMinusT * t * midX + t * t * targetX;
    animal.y = oneMinusT * oneMinusT * startY + 2 * oneMinusT * t * midY + t * t * targetY;

    animalCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);
    animals.forEach(a => a.draw(animalCtx));

    if (progress < 1) {
      requestAnimationFrame(animateToRandomCell);
    } else {
      animal.gridX = targetCell.gridX;
      animal.gridY = targetCell.gridY;
      lookingForFood(animal, targetCell, BUSH_CHECK_RADIUS, ADJACENT_RADIUS, PRE_FOOD_COOLDOWN, eatingDuration, movementDuration);
    }
  }

  requestAnimationFrame(animateToRandomCell);
}

function lookingForFood(animal, targetCell, bushCheckRadius, adjacentRadius, preFoodCooldown, eatingDuration, movementDuration) {
  animal.state = "lookingforfood";
  
  // Define minimum durations for drinking
  const MINIMUM_DRINKING_COOLDOWN = 8000; // seconds minimum cooldown
  const MINIMUM_DRINKING_DURATION = 3000; //  seconds minimum drinking time

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

  let resource = null;
  let isPuddle = false;

  if (closestPuddle) {
    resource = closestPuddle;
    isPuddle = true;
  } else {
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
    animal.state = "cooldown";
    setTimeout(() => {
      const adjacentCells = [
        { gridX: resource.gridX - adjacentRadius, gridY: resource.gridY },
        { gridX: resource.gridX + adjacentRadius, gridY: resource.gridY },
        { gridX: resource.gridX, gridY: resource.gridY - adjacentRadius },
        { gridX: resource.gridX, gridY: resource.gridY + adjacentRadius }
      ];
      targetCell = adjacentCells[Math.floor(Math.random() * adjacentCells.length)];
      const targetX = targetCell.gridX * cellSize;
      const targetY = targetCell.gridY * cellSize;

      animal.state = "movingtofood";
      const moveStartTime = performance.now();

      function animateToResource(time) {
        const progress = Math.min((time - moveStartTime) / movementDuration , 1);
        animal.x = animal.x + (targetX - animal.x) * progress;
        animal.y = animal.y + (targetY - animal.y) * progress;

        animalCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);
        animals.forEach(a => a.draw(animalCtx));

        if (progress < 1) {
          requestAnimationFrame(animateToResource);
        } else {
          animal.gridX = targetCell.gridX;
          animal.gridY = targetCell.gridY;
          animal.state = isPuddle ? "drinking" : "eating";

          if (isPuddle) {
            const puddle = potablePuddleCells.find(p => p.x === resource.gridX && p.y === resource.gridY);
            if (puddle) {
              // Store original opacity to calculate the drinking duration
              const originalOpacity = puddle.opacity || 0.6;
              
              // Make drinking duration proportional to puddle size but ensure minimum 5 seconds
              const drinkingDuration = Math.max(MINIMUM_DRINKING_DURATION, originalOpacity * eatingDuration * 2);
              
              // Calculate fade steps and amount to ensure complete draining 
              const fadeSteps = drinkingDuration / 100; // Update every 100ms
              const fadeAmount = puddle.opacity / fadeSteps; // Ensure we reach 0 by the end
              
              // Create interval for gradual draining that continues until opacity is 0
              const fadeInterval = setInterval(() => {
                if (puddle.opacity > 0) {
                  // Reduce opacity and ensure it doesn't go negative
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
              
              // Use the calculated duration or minimum, whichever is larger
              eatingDuration = drinkingDuration;
            }
          }

          setTimeout(() => {
            if (!isPuddle) {
              const bushIndex = gBushesPositions.findIndex(b => 
                b.gridX === resource.gridX && b.gridY === resource.gridY
              );
              if (bushIndex !== -1) {
                gBushesPositions.splice(bushIndex, 1);
                const treeIndex = treePositions.findIndex(t => 
                  t.gridX === resource.gridX && t.gridY === resource.gridY && t.emoji === "🌳"
                );
                if (treeIndex !== -1) treePositions.splice(treeIndex, 1);
                drawTrees(treeCtx, treePositions);
                modifyWalkableCells([{ x: resource.gridX, y: resource.gridY }], "add");
              }
            }
            animal.state = "cooldown";
            setTimeout(() => {
              animal.state = "idle";
            }, isPuddle ? MINIMUM_DRINKING_COOLDOWN : 1000); // Use longer cooldown for drinking
          }, eatingDuration);
        }
      }

      requestAnimationFrame(animateToResource);
    }, preFoodCooldown);
  } else {
    animal.state = "cooldown";
    setTimeout(() => {
      animal.state = "idle";
    }, 1000);
  }
}

function moveAnimalsPeriodically(animalType, delay, movePercentage, durationRange) {
  setTimeout(() => {
    const animalsToMove = animals.filter(a => a.type === animalType && a.state === "idle");
    const count = Math.floor(animalsToMove.length * movePercentage);
    const shuffled = animalsToMove.sort(() => Math.random() - 0.5).slice(0, count);
    
    shuffled.forEach(animal => {
      const randomDuration = Math.floor(Math.random() * durationRange) + 1000;
      animateAnimalToRandomBush(animal, randomDuration);
    });
  }, delay);
}

function moveHerbivoresPeriodically() {
  moveAnimalsPeriodically("Chicken", 2000, 0.4, 800);
  moveAnimalsPeriodically("Sheep", 3000, 0.2, 2000);
  moveAnimalsPeriodically("Cow", 3000, 0.1, 2000);
  moveAnimalsPeriodically("Pig", 3000, 0.1, 2000);

  setTimeout(moveHerbivoresPeriodically, 2000);
}


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
    Target Cell: <strong>${animal.targetCell}</strong><br/>
    Last Move From X: <strong>${animal.lastMoveFromX}</strong><br/>
    Last Move From Y: <strong>${animal.lastMoveFromY}</strong><br/>
    <br/>
    <br/>
    <br/>
    #${animal.id}<br/><br/>
    <button id="animateAnimalToRandomBushButton">Animate Animal to Random Bush</button>
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