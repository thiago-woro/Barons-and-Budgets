//game loop
//game loop speed control
const gameSpeedSlider = document.getElementById("gameSpeedSlider");
const gameSpeedValue = document.getElementById("gameSpeedValue");
let gameLoopInterval = null;
let gameLoopSpeed = 6000 / parseInt(gameSpeedSlider.value); //300 = super fast  //30000 super slow

let lastTimestamp = 0;
const targetFrameRate = 1; // Adjust this value to your desired frame rate (e.g., 30 FPS)
const cycleLength = 3; // Controls how many steps in the movement cycle (0 to cycleLength-1)



let loopCounter = 0; // Add at the top with other variables



gameSpeedSlider.addEventListener("input", function () {
  const newGameSpeed = parseInt(this.value);
  gameLoopSpeed = 10000 / newGameSpeed;
  gameSpeedValue.textContent = `Game Speed: ${newGameSpeed}`;
});

startButton.addEventListener("click", function () {
  if (gameLoopInterval === null) {

   
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
    initializeFishingResources();
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
      // Update NPC state based on profession
      npc.update();
      
      // Only move NPCs if they're not in a stationary state
      const stationaryStates = ["cuttingTree", "restingAtHome", "constructingHarbor", "constructingFarm", "constructing"];
      if (npc.shouldMove() && !stationaryStates.includes(npc.state) && !npc.state.includes("constructing")) {
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

    // Update and draw fishing boats if the fisher module is loaded
    if (typeof updateAndDrawFishingBoats === 'function') {
      updateAndDrawFishingBoats(npcCtx);
    }

    // Draw all buildings
    if (buildings && buildings.length > 0) {
      buildings.forEach(building => {
        if (typeof building.draw === 'function') {
          building.draw(npcCtx);
        }
      });
    }

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
    // Create a deep copy and replace circular references with IDs
    const prepareNPCsForSave = (npcs) => {
      return npcs.map(npc => {
        const npcCopy = { ...npc };
        
        // Replace parent references with their IDs
        if (npcCopy.parents) {
          npcCopy.parentIds = npcCopy.parents.map(parent => 
            typeof parent === 'object' && parent !== null ? parent.myNumber : parent
          );
          delete npcCopy.parents; // Remove the circular reference
        }
        
        // Replace children references with their IDs
        if (npcCopy.children && Array.isArray(npcCopy.children)) {
          npcCopy.childrenIds = npcCopy.children.map(child => 
            typeof child === 'object' && child !== null ? child.myNumber : child
          );
          delete npcCopy.children; // Remove the circular reference
        }
        
        // Replace spouse reference with ID
        if (npcCopy.spouse && typeof npcCopy.spouse === 'object') {
          npcCopy.spouseId = npcCopy.spouse.myNumber;
          delete npcCopy.spouse; // Remove the circular reference
        }
        
        return npcCopy;
      });
    };

    // Handle fishing boats circular references
    const prepareBoatsForSave = (boats) => {
      if (!boats || !Array.isArray(boats)) return [];
      
      return boats.map(boat => {
        const boatCopy = { ...boat };
        
        // Replace owner reference with ID
        if (boatCopy.owner && typeof boatCopy.owner === 'object') {
          boatCopy.ownerId = boatCopy.owner.myNumber;
          delete boatCopy.owner;
        }
        
        return boatCopy;
      });
    };

    const gameState = {
      // Game state
      year,
      isPaused,
      gameLoopSpeed,
      
      // Population
      startingPopulation,
      populationIncreaseSpeed,
      npcs: prepareNPCsForSave(npcs),
      
      // World map data
      terrainMap,
      groundCells,
      waterCells,
      availableHouseCells,
      flatLandCells,
      sandCells,
      pathCells,
      
      // Resources
      trees,
      treePositions,
      oreDeposits: typeof oreDeposits !== 'undefined' ? oreDeposits : [],
      
      // Buildings
      houses,
      buildings,
      
      // Fishing
      fishingBoats: typeof fishingBoats !== 'undefined' ? 
        prepareBoatsForSave(fishingBoats) : [],
      fishingSpotsByHarbor: typeof fishingSpotsByHarbor !== 'undefined' ? 
        Array.from(fishingSpotsByHarbor.entries()) : [],
      harborToFishingSpotPaths: typeof harborToFishingSpotPaths !== 'undefined' ? 
        Array.from(harborToFishingSpotPaths.entries()) : [],
      
      // Timestamp
      savedAt: new Date().toISOString()
    };
  
    try {
      const gameStateString = JSON.stringify(gameState);
      localStorage.setItem("savedGameState", gameStateString);
      console.log("Game saved successfully!");
      addNotification("Game", "Game saved successfully!", new Date().toLocaleString(), null, "#4a7ba8");
    } catch (error) {
      console.warn("Failed to save game:", error);
      addNotification("Game", "Failed to save game", error.message, null, "#a84a4a");
    }
  }
  
  // Load game state
  function loadGame() {
    try {
      const savedGameStateString = localStorage.getItem("savedGameState");
      if (!savedGameStateString) {
        console.warn("No saved game found.");
        addNotification("Game", "No saved game found", "", null, "#a84a4a");
        return false;
      }
  
      const savedGameState = JSON.parse(savedGameStateString);
  
      // Game state
      year = savedGameState.year;
      isPaused = savedGameState.isPaused;
      gameLoopSpeed = savedGameState.gameLoopSpeed;
      
      // Population
      startingPopulation = savedGameState.startingPopulation;
      populationIncreaseSpeed = savedGameState.populationIncreaseSpeed;
      
      // Load NPCs with proper prototype methods
      npcs = savedGameState.npcs.map(npcData => {
        // Create a new NPC with position and other basic properties
        const npc = new NPC(
          Math.floor(npcData.x / cellSize), 
          Math.floor(npcData.y / cellSize), 
          npcData.myNumber, 
          null, // Set parents later to avoid circular reference
          npcData.age
        );
        
        // Copy all properties from saved NPC to the new instance
        Object.assign(npc, npcData);
        
        // Clear these fields to set them properly after all NPCs are created
        npc.parents = null;
        npc.children = [];
        npc.spouse = null;
        
        return npc;
      });
      
      // Second pass: restore relationship references
      savedGameState.npcs.forEach((npcData, index) => {
        const npc = npcs[index];
        
        // Restore parents
        if (npcData.parentIds && Array.isArray(npcData.parentIds)) {
          npc.parents = npcData.parentIds.map(id => 
            npcs.find(n => n.myNumber === id) || id
          ).filter(parent => parent !== undefined);
        }
        
        // Restore children
        if (npcData.childrenIds && Array.isArray(npcData.childrenIds)) {
          npc.children = npcData.childrenIds.map(id => 
            npcs.find(n => n.myNumber === id) || id
          ).filter(child => child !== undefined);
        }
        
        // Restore spouse
        if (npcData.spouseId !== undefined) {
          npc.spouse = npcs.find(n => n.myNumber === npcData.spouseId);
        }
      });
      
      // World map data
      terrainMap = savedGameState.terrainMap;
      groundCells = savedGameState.groundCells;
      waterCells = savedGameState.waterCells;
      availableHouseCells = savedGameState.availableHouseCells;
      flatLandCells = savedGameState.flatLandCells;
      sandCells = savedGameState.sandCells || [];
      pathCells = savedGameState.pathCells;
      
      // Resources
      trees = savedGameState.trees;
      treePositions = savedGameState.treePositions;
      
      if (typeof distributeOreDeposits === 'function' && savedGameState.oreDeposits) {
        oreDeposits = savedGameState.oreDeposits;
      }
      
      // Buildings
      houses = savedGameState.houses;
      buildings = savedGameState.buildings;
      
      // Fishing - only if the fisher module is loaded
      if (typeof FishingBoat === 'function' && savedGameState.fishingBoats) {
        // Restore Maps from array entries
        fishingSpotsByHarbor = new Map(savedGameState.fishingSpotsByHarbor);
        harborToFishingSpotPaths = new Map(savedGameState.harborToFishingSpotPaths);
        
        // Restore fishing boats with proper prototypes
        fishingBoats = savedGameState.fishingBoats.map(boatData => {
          const harbor = buildings.find(b => b.id === boatData.harborId);
          const owner = npcs.find(n => n.myNumber === boatData.ownerId);
          
          if (!harbor || !owner) {
            console.warn("Could not find harbor or owner for boat:", boatData);
            return null;
          }
          
          const boat = new FishingBoat(harbor, owner);
          Object.assign(boat, boatData);
          boat.owner = owner; // Set owner reference properly
          return boat;
        }).filter(boat => boat !== null);
      }
      
      // Redraw everything
      if (typeof drawTerrainLayer === 'function') {
        clearCanvas(groundCtx);
        clearCanvas(waterCtx);
        
        drawTerrainLayer(groundCtx, groundCells, cellSize);
        drawTerrainLayer(waterCtx, waterCells, cellSize);
        
        if (typeof drawSandTexture === 'function') {
          drawSandTexture(groundCtx);
        }
        
        if (typeof drawMountainTexture === 'function') {
          drawMountainTexture(groundCtx);
        }
      }
      
      // Redraw trees
      if (typeof drawTrees === 'function' && treeCtx) {
        clearCanvas(treeCtx);
        drawTrees(treeCtx, cellSize, treePositions, []);
      }
      
      // Redraw buildings
      buildings.forEach(building => {
        if (typeof building.draw === 'function') {
          building.draw(npcCtx);
        }
      });
      
      // Update UI
      currentPopulation.textContent = npcs.length;
      gameSpeed.textContent = "x " + gameLoopSpeed.toFixed(0);
      gameSpeedValue.textContent = `Game Speed: ${10000 / gameLoopSpeed}`;
      
      console.log("Game loaded successfully! Year:", year, "Population:", npcs.length);
      addNotification("Game", "Game loaded successfully!", `Year: ${year}, Population: ${npcs.length}`, null, "#4a7ba8");
      
      return true;
    } catch (error) {
      console.warn("Failed to load game:", error);
      addNotification("Game", "Failed to load game", error.message, null, "#a84a4a");
      return false;
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
  