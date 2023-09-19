//game loop
//game loop speed control
const gameSpeedSlider = document.getElementById("gameSpeedSlider");
const gameSpeedValue = document.getElementById("gameSpeedValue");
let gameLoopInterval = null;
let gameLoopSpeed = 6000 / parseInt(gameSpeedSlider.value); //300 = super fast  //30000 super slow

gameSpeedSlider.addEventListener("input", function () {
  const newGameSpeed = parseInt(this.value);
  gameLoopSpeed = 10000 / newGameSpeed;
  gameSpeedValue.textContent = `Game Speed: ${newGameSpeed}`;
});

startButton.addEventListener("click", function () {
  if (gameLoopInterval === null) {
    gameLoopInterval = setInterval(gameLoop, gameLoopSpeed);
    startButton.textContent = "⏸ Pause Game";
  } else {
    clearInterval(gameLoopInterval);
    gameLoopInterval = null;
    startButton.textContent = "⏯ Play";
  }
});

startColony.addEventListener("click", function () {
  startNPCs(npcCtx, cellSize);
  startButton.removeAttribute("disabled");
});

//f9
function gameLoop() {
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
    npc.move();
    drawNPC(npc, npcCtx);
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
  