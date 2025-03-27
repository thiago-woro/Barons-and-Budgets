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


/**
 * Animates an animal to a random cell, then looks for food.
 * @param {Animal} animal - The animal to animate (default: currentAnimalSelected).
 * @param {number} eatingDuration - Time spent eating in ms (default: 2000).
 * @param {number} movementDuration - Movement animation duration in ms (default: 1000).
 */
function animateAnimalToRandomBush(animal = currentAnimalSelected, eatingDuration = 2000, movementDuration = 1000) {
  if (!animal) return;

  // Configurable radii
  const RANDOM_MOVE_RADIUS = 4;    // Initial random move range (±7 cells)
  const BUSH_CHECK_RADIUS = 3;     // Bush proximity check after random move
  const ADJACENT_RADIUS = 1;       // Distance to adjacent cell for bush
  const PRE_FOOD_COOLDOWN = 700;  // Cooldown before moving to food (in ms)

  animal.state = "randomJump"; // Changed to randomJump during initial move
  const randomOffset = () => Math.floor(Math.random() * (RANDOM_MOVE_RADIUS * 2 + 1)) - RANDOM_MOVE_RADIUS;
  let targetCell = {
    gridX: animal.gridX + randomOffset(),
    gridY: animal.gridY + randomOffset()
  };
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

/**
 * Checks for nearby bushes and moves the animal to eat if found.
 * @param {Animal} animal - The animal looking for food.
 * @param {Object} targetCell - Current target cell coordinates.
 * @param {number} bushCheckRadius - Radius to check for bushes.
 * @param {number} adjacentRadius - Distance to move adjacent to bush.
 * @param {number} preFoodCooldown - Cooldown before moving to food.
 * @param {number} eatingDuration - Time spent eating.
 * @param {number} movementDuration - Movement animation duration.
 */
function lookingForFood(animal, targetCell, bushCheckRadius, adjacentRadius, preFoodCooldown, eatingDuration, movementDuration) {
  animal.state = "lookingforfood"; // Set state to lookingforfood

  const nearbyBushes = gBushesPositions.filter(b => 
    Math.abs(b.gridX - animal.gridX) + Math.abs(b.gridY - animal.gridY) <= bushCheckRadius
  );

  if (nearbyBushes.length > 0) {
    const closestBush = nearbyBushes.reduce((closest, bush) => {
      const distToCurrent = Math.abs(bush.gridX - animal.gridX) + Math.abs(bush.gridY - animal.gridY);
      const distToClosest = Math.abs(closest.gridX - animal.gridX) + Math.abs(closest.gridY - animal.gridY);
      return distToCurrent < distToClosest ? bush : closest;
    }, nearbyBushes[0]);

    animal.state = "cooldown";
    setTimeout(() => {
      const adjacentCells = [
        { gridX: closestBush.gridX - adjacentRadius, gridY: closestBush.gridY },
        { gridX: closestBush.gridX + adjacentRadius, gridY: closestBush.gridY },
        { gridX: closestBush.gridX, gridY: closestBush.gridY - adjacentRadius },
        { gridX: closestBush.gridX, gridY: closestBush.gridY + adjacentRadius }
      ];
      targetCell = adjacentCells[Math.floor(Math.random() * adjacentCells.length)];
      const targetX = targetCell.gridX * cellSize;
      const targetY = targetCell.gridY * cellSize;

      animal.state = "movingtofood";
      const moveStartTime = performance.now();

      function animateToBush(time) {
        const progress = Math.min((time - moveStartTime) / (movementDuration / 2), 1);
        animal.x = animal.x + (targetX - animal.x) * progress;
        animal.y = animal.y + (targetY - animal.y) * progress;

        animalCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);
        animals.forEach(a => a.draw(animalCtx));

        if (progress < 1) {
          requestAnimationFrame(animateToBush);
        } else {
          animal.gridX = targetCell.gridX;
          animal.gridY = targetCell.gridY;
          animal.state = "eating";
          setTimeout(() => {
            const bushIndex = gBushesPositions.findIndex(b => 
              b.gridX === closestBush.gridX && b.gridY === closestBush.gridY
            );
            if (bushIndex !== -1) {
              gBushesPositions.splice(bushIndex, 1);
              const treeIndex = treePositions.findIndex(t => 
                t.gridX === closestBush.gridX && t.gridY === closestBush.gridY && t.emoji === "🌳"
              );
              if (treeIndex !== -1) treePositions.splice(treeIndex, 1);
              drawTrees(treeCtx, treePositions);
              modifyWalkableCells([{ x: closestBush.gridX, y: closestBush.gridY }], "add");
            }
            animal.state = "cooldown";
            setTimeout(() => {
              animal.state = "idle";
            }, 1000);
          }, eatingDuration);
        }
      }

      requestAnimationFrame(animateToBush);
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