//game loop
//game loop speed control
const gameSpeedSlider = document.getElementById("gameSpeedSlider");
const gameSpeedValue = document.getElementById("gameSpeedValue");
let gameLoopInterval = null;
let gameLoopSpeed = 6000 / parseInt(gameSpeedSlider.value); //300 = super fast  //30000 super slow

let lastTimestamp = 0;
const targetFrameRate = 1; // Adjust this value to your desired frame rate (e.g., 30 FPS)

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
  // Calculate the time elapsed since the last frame
  const elapsed = timestamp - lastTimestamp;

  if (elapsed >= 1000) {
   lastTimestamp = timestamp; // Update the last timestamp

   // Add loop counter (0-9)
   loopCounter = (loopCounter + 1) % 10;
   console.log(`gameLoop: counter ${loopCounter}`);

   // Your game logic and rendering code goes here
   if (isPaused) {
     playStatusImg.style.display = "none";
     return;
   } else {
     playStatusImg.style.display = "block";
   }

  let totalSalaries = 0; // Variable to store the sum of all salaries
  let salaryCount = 0; // Variable to store the number of NPCs with salaries

  year++;
  updatePopulationChart(year, npcs.length);

  npcTableHeader.textContent = `Total Population ${npcs.length}`;

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
  //  console.error(`medium salary: ${mediumSalary} total salaries: ${totalSalaries}, salary count: ${salaryCount}`);
  updateUIbottomToolbar(totalSalaries);

  coupleMaker(npcs);
  babyMaker(npcs);
  //console.log("Total: " + babies.length + " born");

  //sortNPCTable();

  clearCanvas(npcCtx);
  clearCanvas(npcInfoOverlayCtx);

  // This will move and redraw each NPC, including new babies
  const onScreenNPCS = npcs.slice(0, onScreenNPCSlimit); // Get the first XX NPCs, global variable -> onScreenNPCSlimit

  onScreenNPCS.forEach((npc) => {
    if (npc.race == 'Elf') {
      if (loopCounter === 3 || loopCounter === 6) {
        // Elves move only on counts 3 and 6
        npc.move();
      }
    } else if (npc.race == 'Kurohi') {
      if (loopCounter === 5) {
        // Kurohi move only on count 5
        npc.move();
      }
    } else {
      if (loopCounter === 0) {
        // Other races move on count 0
        npc.move();
      }
    }
    drawNPC(npc, npcCtx);
    
/*     // Optionally draw the path for debugging
    if (npc.currentPath) {
       drawPath(npcCtx, npc.currentPath);
    } */
});
  

  //growthRate.textContent = populationIncreaseSpeed;
  currentPopulation.textContent = npcs.length;
  gameSpeed.textContent = "x " + gameLoopSpeed.toFixed(0);
  //economicGDP.textContent = "$ " + economicGDP;
  // console.log("End of year " + year + "🏁");

  // Game over condition
  if (npcs.length < 2) {
    console.log("Game over! Population reached below 2.");
    isPaused = true;
    playStatusImg.style.display = "none";
  }
  updateDebuggerOverlay();
  requestAnimationFrame(gameLoop);
} else {
  // If less than one second has passed, request the next frame without executing the game logic
  requestAnimationFrame(gameLoop);
}}



function updateDebuggerOverlay() {
  const debuggerOverlay = document.getElementById("debuggerOverlay");
  debuggerOverlay.innerHTML = `
    Zoom Level: ${zoomLevel.toFixed(2)}<br>
    Canvas X: ${canvasX.toFixed(2)}<br>
    Canvas Y: ${canvasY.toFixed(2)}<br>
    Mouse X: ${mouseX.toFixed(2)}<br>
    Mouse Y: ${mouseY.toFixed(2)}<br>
    Camera X: ${cameraX.toFixed(2)}<br>
    Camera Y: ${cameraY.toFixed(2)}
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
  