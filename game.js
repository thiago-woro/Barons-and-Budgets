//game loop
//game loop speed control
const gameSpeedSlider = document.getElementById("gameSpeedSlider");
const gameSpeedValue = document.getElementById("gameSpeedValue");
let gameLoopInterval = null;
let gameLoopSpeed = 6000 / parseInt(gameSpeedSlider.value); //300 = super fast  //30000 super slow

let lastTimestamp = 0;
const targetFrameRate = 1; // Adjust this value to your desired frame rate (e.g., 30 FPS)
const cycleLength = 3; // Controls how many steps in the movement cycle (0 to cycleLength-1)

// Initialize zoomLevel and other related variables
let zoomLevel = 1.0;
let canvasX = 0;
let canvasY = 0;
let mouseX = 0;
let mouseY = 0;
let cameraX = 0;
let cameraY = 0;

let loopCounter = 0; // Add at the top with other variables

// After generating the map, center the camera on the center of the map
cameraX = (gridSize * cellSize) / 2;
cameraY = (gridSize * cellSize) / 2;

gameSpeedSlider.addEventListener("input", function () {
  const newGameSpeed = parseInt(this.value);
  gameLoopSpeed = 10000 / newGameSpeed;
  gameSpeedValue.textContent = `Game Speed: ${newGameSpeed}`;
});

startButton.addEventListener("click", function () {
  if (gameLoopInterval === null) {

    if (npcs.length > 0) {
      // Center the camera on the first NPC when starting the simulation
      cameraX = npcs[0].x;
      cameraY = npcs[0].y;
    }

    gameLoopInterval = requestAnimationFrame(gameLoop);
    startButton.textContent = "⏸ Pause Game";
  } else {
    cancelAnimationFrame(gameLoopInterval);
    gameLoopInterval = null;
    startButton.textContent = "⏯ Play";
  }
});

startColony.addEventListener("click", function () {
  startNPCs(npcCtx, cellSize);
  startButton.removeAttribute("disabled");
});

//f9
function gameLoop(timestamp) {
  // Request the next frame immediately to ensure continuous animation
  gameLoopInterval = requestAnimationFrame(gameLoop);
  
  // Calculate the time elapsed since the last frame
  const elapsed = timestamp - lastTimestamp;

  if (elapsed >= 1000) {
    lastTimestamp = timestamp; // Update the last timestamp

    // Add loop counter (0 to cycleLength-1)
    loopCounter = (loopCounter + 1) % cycleLength;
    console.log(`gameLoop: counter ${loopCounter}`);

    // Your game logic and rendering code goes here
    if (isPaused) {
      playStatusImg.style.display = "none";
      return;
    } else {
      playStatusImg.style.display = "block";
    }

    // Determine if this is a "major activities" loop
    // Only run major activities (marriage, babies, etc.) every 5th loop
    const isMajorActivitiesLoop = loopCounter % 5 === 0;
    
    // Always update year counter but only on major activities loop
    if (isMajorActivitiesLoop) {
      year++;
      updatePopulationChart(year, npcs.length);
      npcTableHeader.textContent = `Total Population ${npcs.length}`;
    }

    // Always clear canvases for redrawing
    clearCanvas(npcCtx);
    clearCanvas(npcInfoOverlayCtx);

    // This section runs on EVERY loop - movement happens 5x more often
    const onScreenNPCS = npcs.slice(0, onScreenNPCSlimit);
    onScreenNPCS.forEach((npc) => {
      // Always move NPCs (5x more frequent than other activities)
      if (npc.shouldMove()) {
        npc.move();
      }
      
      // Draw the NPC and its info
      drawNPC(npc, npcCtx);
      npc.drawNPCInfo(npcCtx);
      
      // Optionally draw the path for debugging
      if (npc.currentPath) {
         drawPath(npcCtx, npc.currentPath);
      }
    });

    // Only run these activities on major activities loops (every 5th loop)
    if (isMajorActivitiesLoop) {
      let totalSalaries = 0;
      let salaryCount = 0;
      deathsThisLoop = 0; // Reset the deaths count for this loop
      
      npcs.forEach((npc) => {
        npc.ageAndDie();

        // Check if NPC is older than 20 and has an empty profession
        if (!npc.profession || (npc.age >= 20 && npc.profession === "novice")) {
          // Use the generateProfession method to assign a profession
          npc.profession = npc.generateProfession(npc.age);
          npc.salary = npc.calculateSalary();

          addNotification(
            "Economy",
            `🔨 ${npc.name} is now a ${npc.profession}`,
            `Salary: $${npc.salary}`,
            npc,
            "#4a7ba8"
          );
        }

        if (npc.salary > 0) {
          totalSalaries += npc.salary;
          salaryCount++;
        }
      });

      // Calculate the medium salary (average salary) if at least one NPC has a salary
      let mediumSalary = salaryCount > 0 ? totalSalaries / salaryCount : 0;
      updateUIbottomToolbar(totalSalaries);

      // Run social activities only on major activities loops
      coupleMaker(npcs);
      babyMaker(npcs);
      
      // Update UI elements
      currentPopulation.textContent = npcs.length;
      gameSpeed.textContent = "x " + gameLoopSpeed.toFixed(0);

      // Game over condition
      if (npcs.length < 2) {
        console.log("Game over! Population reached below 2.");
        isPaused = true;
      }
    }
    

  }
}

function updateDebuggerOverlay() {
  const debuggerOverlay = document.getElementById("debuggerOverlay");
  
  // Get counts of trees and houses
  const treeCount = treePositions ? treePositions.length : 0;
  const houseCount = houses ? houses.length : 0;
  
  debuggerOverlay.innerHTML = `
    Zoom Level: ${zoomLevel.toFixed(2)}<br>
    Canvas X: ${canvasX.toFixed(2)}<br>
    Canvas Y: ${canvasY.toFixed(2)}<br>
    Mouse X: ${mouseX.toFixed(2)}<br>
    Mouse Y: ${mouseY.toFixed(2)}<br>
    Camera X: ${cameraX.toFixed(2)}<br>
    Camera Y: ${cameraY.toFixed(2)}<br>
    Trees: ${treeCount}<br>
    Houses: ${houseCount}
  `;
}

///ground work for save/load game
// Save game state
function saveGame() {
    const gameState = {
      year,
      startingPopulation,
      populationIncreaseSpeed,
      // ... other variables
      npcs, // Save the entire NPCs array
      // ... other arrays or state that needs to be saved
    };
  
    const gameStateString = JSON.stringify(gameState);
    localStorage.setItem("savedGameState", gameStateString);
  }
  
  // Load game state
  function loadGame() {
    const savedGameStateString = localStorage.getItem("savedGameState");
    if (savedGameStateString) {
      const savedGameState = JSON.parse(savedGameStateString);
  
      year = savedGameState.year;
      startingPopulation = savedGameState.startingPopulation;
      populationIncreaseSpeed = savedGameState.populationIncreaseSpeed;
      // ... update other variables
  
      npcs = savedGameState.npcs; // Load the NPCs array
      // ... update other arrays or state that needs to be loaded
  
      // Update UI or game logic to reflect the loaded state
    }
  }
  
  // Call the save and load functions as needed, for example on button clicks
  saveButton.addEventListener("click", saveGame);
  loadGameWelcomeScreen.addEventListener("click", loadGame);
  
// Function to draw the path for debugging
function drawPath(ctx, path) {
  ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
  ctx.lineWidth = 2;
  
  ctx.beginPath();
  
  // Start from the first point
  if (path.length > 0) {
    ctx.moveTo(path[0].x * cellSize + cellSize/2, path[0].y * cellSize + cellSize/2);
    
    // Draw lines to each subsequent point
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x * cellSize + cellSize/2, path[i].y * cellSize + cellSize/2);
    }
  }
  
  ctx.stroke();
}
  