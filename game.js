// Game loop speed control
const gameSpeedSlider = document.getElementById("gameSpeedSlider");
const gameSpeedValue = document.getElementById("gameSpeedValue");
let gameLoopInterval = null;
let simulationInterval = null; // New: for simulation updates
let gameLoopSpeed = parseInt(gameSpeedSlider.value); // Slider value (1-100)
let lastTimestamp = 0;
const targetFrameRate = 60; // 60 FPS for smooth rendering
const simulationBaseInterval = 1000; // Base simulation update every 1s
const cycleLength = 3; // Added: Controls major activity cycles (every 3rd simulation tick)
let loopCounter = 0;
let isPaused = true; // Start paused






gameSpeedSlider.addEventListener("input", function () {
  gameLoopSpeed = parseInt(this.value); // 1 (slow) to 100 (fast)
  gameSpeedValue.textContent = `Game Speed: ${gameLoopSpeed}`;
  // Adjust simulation interval dynamically
  clearInterval(simulationInterval);
  simulationInterval = setInterval(updateSimulation, simulationBaseInterval / (gameLoopSpeed / 50));
});

startButton.addEventListener("click", function () {
  if (gameLoopInterval === null) {
    gameLoopInterval = requestAnimationFrame(renderLoop);
    simulationInterval = setInterval(updateSimulation, simulationBaseInterval / (gameLoopSpeed / 50));
    startButton.textContent = "⏸ Pause Game";
    isPaused = false;
  } else {
    cancelAnimationFrame(gameLoopInterval);
    clearInterval(simulationInterval);
    gameLoopInterval = null;
    simulationInterval = null;
    startButton.textContent = "⏯ Play";
    isPaused = true;
  }
});

startColony.addEventListener("click", function () {
  startNPCs(npcCtx, cellSize);
  initializeFishingResources();
  startButton.removeAttribute("disabled");
});

// Fast render loop (60 FPS)
function renderLoop(timestamp) {
  gameLoopInterval = requestAnimationFrame(renderLoop);

  const deltaTime = timestamp - lastTimestamp;
  lastTimestamp = timestamp;

  if (deltaTime < 1000 / targetFrameRate) return; // Cap at 60 FPS

  if (isPaused) {
    playStatusImg.style.display = "none";
    return;
  } else {
    playStatusImg.style.display = "block";
  }

  // Clear canvases every frame
  clearCanvas(npcCtx);
  clearCanvas(npcInfoOverlayCtx);
  animalCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);

  // Draw NPCs
  const onScreenNPCS = npcs.slice(0, onScreenNPCSlimit);
  onScreenNPCS.forEach((npc) => {
    drawNPC(npc, npcCtx);
    npc.drawNPCInfo(npcCtx);
    if (npc.currentPath) drawPath(npcCtx, npc.currentPath);
  });

  // Draw fishing boats
  if (typeof updateAndDrawFishingBoats === 'function') {
    updateAndDrawFishingBoats(npcCtx);
  }

  // Draw buildings
  if (buildings && buildings.length > 0) {
    buildings.forEach(building => {
      if (typeof building.draw === 'function') {
        building.draw(npcCtx);
      }
    });
  }

  // Draw animals
  animals.forEach(animal => {
    animal.draw(animalCtx);
  });
}

// Slow simulation loop (custom rate)
function updateSimulation() {
  console.time("simulation");
  if (isPaused) return;

  loopCounter = (loopCounter + 1) % cycleLength; // Line 96: Now defined
  const isMajorActivitiesLoop = loopCounter === 0;

  // Major activities (e.g., every 3rd simulation tick)
  if (isMajorActivitiesLoop) {
    year++;
    updatePopulationChart(year, npcs.length);
    npcTableHeader.textContent = `Total Population ${npcs.length}`;

    let totalSalaries = 0;
    let salaryCount = 0;
    deathsThisLoop = 0;

    npcs.forEach((npc) => {
      npc.ageAndDie();
      if (!npc.profession || (npc.age >= 20 && npc.profession === "novice")) {
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

    let mediumSalary = salaryCount > 0 ? totalSalaries / salaryCount : 0;
    updateUIbottomToolbar(totalSalaries);
    coupleMaker(npcs);
    babyMaker(npcs);
    currentPopulation.textContent = npcs.length;
    gameSpeed.textContent = "x " + gameLoopSpeed;
  }

  // NPC simulation updates
  const onScreenNPCS = npcs.slice(0, onScreenNPCSlimit);
  onScreenNPCS.forEach((npc) => {
    npc.update(); // Profession logic
    const stationaryStates = ["cuttingTree", "restingAtHome", "constructingHarbor", "constructingFarm", "constructing"];
    if (npc.shouldMove() && !stationaryStates.includes(npc.state) && !npc.state.includes("constructing")) {
      npc.move();
    }
  });

  // Animal simulation updates
  animals.forEach(animal => {
    animal.update(simulationBaseInterval / (gameLoopSpeed / 50)); // Scaled deltaTime
  });
  console.timeEnd("simulation");
}

// Start the render loop
requestAnimationFrame(renderLoop);



function updateZoomTrackerUI() {
  return;
  const debuggerOverlay = document.getElementById("zoomUItracker");
  
  // Get counts of trees and houses
  const treeCount = treePositions ? treePositions.length : 0;
  const houseCount = houses ? houses.length : 0;
  
  zoomUItracker.innerHTML = `
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
    try {
        // Create a deep copy and replace circular references with IDs
        const prepareNPCsForSave = (npcs) => {
          // First create a clean array of NPCs with only the essential properties
          return npcs.map(npc => {
            // Create a new object with only the properties we want to save
            // This avoids any potential circular references from spread operator
            const cleanNPC = {
              // Basic properties
              myNumber: npc.myNumber,
              x: npc.x,
              y: npc.y,
              race: npc.race,
              age: npc.age,
              sex: npc.sex,
              gender: npc.gender,
              color: npc.color,
              isAlive: npc.isAlive,
              deathAge: npc.deathAge,
              name: npc.name,
              profession: npc.profession,
              salary: npc.salary,
              movementSpeed: npc.movementSpeed,
              state: npc.state,
              
              // Store IDs instead of object references
              parentIds: [],
              childrenIds: [],
              spouseId: null
            };
            
            // Add any other scalar properties that should be saved
            if (npc.waitTime !== undefined) cleanNPC.waitTime = npc.waitTime;
            if (npc.maxWaitTime !== undefined) cleanNPC.maxWaitTime = npc.maxWaitTime;
            if (npc.pathIndex !== undefined) cleanNPC.pathIndex = npc.pathIndex;
            if (npc.stateData !== undefined) cleanNPC.stateData = { ...npc.stateData };
            if (npc.animationState !== undefined) cleanNPC.animationState = npc.animationState;
            
            // Handle inventory if it exists
            if (npc.inventory && typeof npc.inventory === 'object') {
              cleanNPC.inventory = {};
              // Only copy the data, not methods
              Object.keys(npc.inventory).forEach(key => {
                if (typeof npc.inventory[key] !== 'function') {
                  cleanNPC.inventory[key] = npc.inventory[key];
                }
              });
            }
            
            // Convert parent references to IDs
            if (npc.parents) {
              if (Array.isArray(npc.parents)) {
                cleanNPC.parentIds = npc.parents.map(parent => 
                  typeof parent === 'object' && parent !== null ? parent.myNumber : parent
                ).filter(id => id !== undefined && id !== null);
              } else if (npc.parents !== null && typeof npc.parents === 'object') {
                cleanNPC.parentIds = [npc.parents.myNumber];
              }
            }
            
            // Convert children references to IDs
            if (npc.children && Array.isArray(npc.children)) {
              cleanNPC.childrenIds = npc.children.map(child => 
                typeof child === 'object' && child !== null ? child.myNumber : child
              ).filter(id => id !== undefined && id !== null);
            }
            
            // Convert spouse reference to ID
            if (npc.spouse) {
              if (typeof npc.spouse === 'object' && npc.spouse !== null) {
                cleanNPC.spouseId = npc.spouse.myNumber;
              } else if (typeof npc.spouse === 'number') {
                cleanNPC.spouseId = npc.spouse;
              } else if (typeof npc.spouse === 'string' && !isNaN(parseInt(npc.spouse))) {
                cleanNPC.spouseId = parseInt(npc.spouse);
              }
            }
            
            return cleanNPC;
          });
        };

        // Handle fishing boats circular references
        const prepareBoatsForSave = (boats) => {
          if (!boats || !Array.isArray(boats)) return [];
          
          return boats.map(boat => {
            // Create a new clean object instead of spreading
            const cleanBoat = {
              id: boat.id,
              x: boat.x,
              y: boat.y,
              harborId: boat.harborId,
              state: boat.state,
              fishCaught: boat.fishCaught,
              capacity: boat.capacity,
              speed: boat.speed
            };
            
            // Replace owner reference with ID
            if (boat.owner && typeof boat.owner === 'object') {
              cleanBoat.ownerId = boat.owner.myNumber;
            } else if (typeof boat.owner === 'number') {
              cleanBoat.ownerId = boat.owner;
            }
            
            // Add any other important properties
            if (boat.targetX !== undefined) cleanBoat.targetX = boat.targetX;
            if (boat.targetY !== undefined) cleanBoat.targetY = boat.targetY;
            if (boat.fishingSpotId !== undefined) cleanBoat.fishingSpotId = boat.fishingSpotId;
            
            return cleanBoat;
          });
        };

        // Prepare buildings for save by removing circular references
        const prepareBuildingsForSave = (buildings) => {
          if (!buildings || !Array.isArray(buildings)) return [];
          
          return buildings.map(building => {
            // Create a new clean object instead of spreading
            const cleanBuilding = {
              id: building.id,
              x: building.x,
              y: building.y,
              type: building.type,
              size: building.size,
              width: building.width,
              height: building.height
            };
            
            // Copy any other scalar properties
            if (building.color !== undefined) cleanBuilding.color = building.color;
            if (building.completed !== undefined) cleanBuilding.completed = building.completed;
            if (building.constructionProgress !== undefined) 
              cleanBuilding.constructionProgress = building.constructionProgress;
            if (building.maxHealth !== undefined) cleanBuilding.maxHealth = building.maxHealth;
            if (building.health !== undefined) cleanBuilding.health = building.health;
            if (building.race !== undefined) cleanBuilding.race = building.race;
            
            // Replace owner reference with ID if it exists
            if (building.owner && typeof building.owner === 'object') {
              cleanBuilding.ownerId = building.owner.myNumber;
            } else if (typeof building.owner === 'number') {
              cleanBuilding.ownerId = building.owner;
            } else if (typeof building.owner === 'string') {
              cleanBuilding.owner = building.owner; // Keep string owners (like "Town")
            }
            
            // Replace occupants with IDs if they exist
            if (building.occupants && Array.isArray(building.occupants)) {
              cleanBuilding.occupantIds = building.occupants.map(occupant => 
                typeof occupant === 'object' && occupant !== null ? occupant.myNumber : occupant
              ).filter(id => id !== undefined && id !== null);
            }
            
            return cleanBuilding;
          });
        };

        // Prepare animals for save
        const prepareAnimalsForSave = (animals) => {
          if (!animals || !Array.isArray(animals)) return [];
          
          return animals.map(animal => {
            // Create a new clean object instead of spreading
            const cleanAnimal = {
              id: animal.id,
              x: animal.x,
              y: animal.y,
              type: animal.type,
              emoji: animal.emoji,
              speed: animal.speed,
              isPredator: animal.isPredator
            };
            
            // Copy any other important properties
            if (animal.health !== undefined) cleanAnimal.health = animal.health;
            if (animal.maxHealth !== undefined) cleanAnimal.maxHealth = animal.maxHealth;
            if (animal.targetX !== undefined) cleanAnimal.targetX = animal.targetX;
            if (animal.targetY !== undefined) cleanAnimal.targetY = animal.targetY;
            if (animal.state !== undefined) cleanAnimal.state = animal.state;
            if (animal.moveTimer !== undefined) cleanAnimal.moveTimer = animal.moveTimer;
            
            return cleanAnimal;
          });
        };

        // Prepare Map objects for serialization
        const prepareMapForSave = (map) => {
          if (!map || typeof map.entries !== 'function') return [];
          try {
            return Array.from(map.entries());
          } catch (error) {
            console.warn("Error converting Map to array:", error);
            return [];
          }
        };

        const gameState = {
          // Game state
          year,
          isPaused,
          gameLoopSpeed,
          
          // Player info
          playerRace: window.playerRace || "Elf",
          kingdomName: window.kingdomName || "Elven Kingdom",
          playerName: window.playerName || "OrcXSlayer777",
          playedHours: window.playedHours || 0,
          
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
          houses: prepareBuildingsForSave(houses),
          buildings: prepareBuildingsForSave(buildings),
          
          // Animals
          animals: typeof animals !== 'undefined' && Array.isArray(animals) ? 
            prepareAnimalsForSave(animals) : [],
          
          // Fishing
          fishingBoats: typeof fishingBoats !== 'undefined' ? 
            prepareBoatsForSave(fishingBoats) : [],
          fishingSpotsByHarbor: typeof fishingSpotsByHarbor !== 'undefined' ? 
            prepareMapForSave(fishingSpotsByHarbor) : [],
          harborToFishingSpotPaths: typeof harborToFishingSpotPaths !== 'undefined' ? 
            prepareMapForSave(harborToFishingSpotPaths) : [],
          
          // Timestamp
          savedAt: new Date().toISOString()
        };
      
        const gameStateString = JSON.stringify(gameState);
        localStorage.setItem("savedGameState", gameStateString);
        console.log("Game saved successfully!");
        addNotification("Game", "Game saved successfully!", new Date().toLocaleString(), null, "#4a7ba8");
        return true;
    } catch (error) {
        console.error("Failed to save game:", error);
        addNotification("Game", "Failed to save game", error.message, null, "#a84a4a");
        return false;
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
      
      // Population - don't reassign constants
      console.log(`Loaded game with starting population: ${savedGameState.startingPopulation}`);
      console.log(`Loaded game with population increase speed: ${savedGameState.populationIncreaseSpeed}`);
      
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
        npc.parents = [];  // Initialize as empty array instead of null
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
      
      // World map data - check if variables are constants before assigning
      if (typeof terrainMap !== 'undefined' && !Object.isFrozen(terrainMap)) {
        terrainMap = savedGameState.terrainMap;
      }
      
      if (typeof groundCells !== 'undefined' && !Object.isFrozen(groundCells)) {
        groundCells = savedGameState.groundCells;
      }
      
      if (typeof waterCells !== 'undefined' && !Object.isFrozen(waterCells)) {
        waterCells = savedGameState.waterCells;
      }
      
      if (typeof availableHouseCells !== 'undefined' && !Object.isFrozen(availableHouseCells)) {
        availableHouseCells = savedGameState.availableHouseCells;
      }
      
      if (typeof flatLandCells !== 'undefined' && !Object.isFrozen(flatLandCells)) {
        flatLandCells = savedGameState.flatLandCells;
      }
      
      if (typeof sandCells !== 'undefined' && !Object.isFrozen(sandCells)) {
        sandCells = savedGameState.sandCells || [];
      }
      
      if (typeof pathCells !== 'undefined' && !Object.isFrozen(pathCells)) {
        pathCells = savedGameState.pathCells;
      }
      
      // Resources
      if (typeof trees !== 'undefined' && !Object.isFrozen(trees)) {
        trees = savedGameState.trees;
      }
      
      // Handle treePositions - ensure it's an array
      if (typeof treePositions !== 'undefined') {
        if (!Object.isFrozen(treePositions)) {
          // If it's not frozen, we can reassign
          treePositions = Array.isArray(savedGameState.treePositions) ? 
            savedGameState.treePositions : [];
        } else if (Array.isArray(treePositions)) {
          // If it's frozen but is an array, we can modify its contents
          treePositions.length = 0; // Clear the array
          if (Array.isArray(savedGameState.treePositions)) {
            // Add each tree position to the existing array
            savedGameState.treePositions.forEach(tree => treePositions.push(tree));
          }
        } else {
          console.warn("treePositions exists but is not an array and cannot be modified");
        }
      }
      
      if (typeof distributeOreDeposits === 'function' && savedGameState.oreDeposits && 
          typeof oreDeposits !== 'undefined' && !Object.isFrozen(oreDeposits)) {
        oreDeposits = savedGameState.oreDeposits;
      }
      
      // Buildings
      if (typeof houses !== 'undefined' && !Object.isFrozen(houses)) {
        houses = savedGameState.houses;
      }
      
      if (typeof buildings !== 'undefined' && !Object.isFrozen(buildings)) {
        buildings = savedGameState.buildings;
      }
      
      // Fishing - only if the fisher module is loaded
      if (typeof FishingBoat === 'function' && savedGameState.fishingBoats) {
        // Handle fishing spots map - since it's a constant, we need to clear and add items instead of reassigning
        if (typeof fishingSpotsByHarbor !== 'undefined') {
          try {
            // Clear the existing map
            if (typeof fishingSpotsByHarbor.clear === 'function') {
              fishingSpotsByHarbor.clear();
              
              // Add entries from saved data
              if (Array.isArray(savedGameState.fishingSpotsByHarbor)) {
                savedGameState.fishingSpotsByHarbor.forEach(entry => {
                  if (Array.isArray(entry) && entry.length === 2) {
                    fishingSpotsByHarbor.set(entry[0], entry[1]);
                  }
                });
              }
              console.log("Restored fishingSpotsByHarbor with", fishingSpotsByHarbor.size, "entries");
            } else {
              console.warn("fishingSpotsByHarbor exists but is not a Map or doesn't have clear method");
            }
          } catch (error) {
            console.warn("Error restoring fishingSpotsByHarbor:", error);
          }
        }
        
        // Handle harbor paths map - since it's a constant, we need to clear and add items instead of reassigning
        if (typeof harborToFishingSpotPaths !== 'undefined') {
          try {
            // Clear the existing map
            if (typeof harborToFishingSpotPaths.clear === 'function') {
              harborToFishingSpotPaths.clear();
              
              // Add entries from saved data
              if (Array.isArray(savedGameState.harborToFishingSpotPaths)) {
                savedGameState.harborToFishingSpotPaths.forEach(entry => {
                  if (Array.isArray(entry) && entry.length === 2) {
                    harborToFishingSpotPaths.set(entry[0], entry[1]);
                  }
                });
              }
              console.log("Restored harborToFishingSpotPaths with", harborToFishingSpotPaths.size, "entries");
            } else {
              console.warn("harborToFishingSpotPaths exists but is not a Map or doesn't have clear method");
            }
          } catch (error) {
            console.warn("Error restoring harborToFishingSpotPaths:", error);
          }
        }
        
        // Handle fishing boats - since it's a constant array, we need to clear and add items instead of reassigning
        if (typeof fishingBoats !== 'undefined' && Array.isArray(fishingBoats)) {
          try {
            // Clear the existing array
            fishingBoats.length = 0;
            
            // Create new boat objects and push them to the existing array
            if (Array.isArray(savedGameState.fishingBoats)) {
              const newBoats = savedGameState.fishingBoats.map(boatData => {
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
              
              // Push all new boats to the existing array
              newBoats.forEach(boat => fishingBoats.push(boat));
              console.log("Restored", fishingBoats.length, "fishing boats");
            }
          } catch (error) {
            console.warn("Error restoring fishing boats:", error);
          }
        }
      }
      
      // Animals - if the module is loaded
      if (typeof animals !== 'undefined' && !Object.isFrozen(animals) && 
          savedGameState.animals && Array.isArray(savedGameState.animals)) {
        try {
          if (typeof Animal === 'function') {
            // If Animal constructor exists, recreate with proper prototypes
            animals = savedGameState.animals.map(animalData => {
              const animal = new Animal(animalData.x, animalData.y, animalData.type);
              Object.assign(animal, animalData);
              return animal;
            });
          } else {
            // Otherwise just assign the data
            animals = savedGameState.animals;
          }
        } catch (error) {
          console.warn("Error restoring animals:", error);
        }
      }
      
      // Clear all canvases before redrawing
      clearCanvas(npcCtx);
      clearCanvas(npcInfoOverlayCtx);
      clearCanvas(groundCtx);
      clearCanvas(waterCtx);
      clearCanvas(treeCtx);
      
      // Redraw everything
      if (typeof drawTerrainLayer === 'function') {
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
        // Make sure treePositions is an array before passing it
        if (Array.isArray(treePositions)) {
          try {
            // Call with the correct parameters based on the function signature
            drawTrees(treeCtx, treePositions);
          } catch (error) {
            console.warn("Error drawing trees:", error);
          }
        } else {
          console.warn("Cannot draw trees: treePositions is not an array");
        }
      }
      
      // Redraw buildings
      if (buildings && buildings.length > 0) {
        buildings.forEach(building => {
          if (typeof building.draw === 'function') {
            building.draw(npcCtx);
          }
        });
      }
      
      // Redraw NPCs
      if (npcs && npcs.length > 0) {
        console.log(`Drawing ${npcs.length} NPCs after loading`);
        npcs.forEach(npc => {
          if (typeof drawNPC === 'function') {
            drawNPC(npc, npcCtx);
          }
        });
      }
      
      // Rebuild NPC table
      const npcTable = document.getElementById("npcTable");
      if (npcTable) {
        // Clear existing table
        const tbody = npcTable.querySelector("tbody");
        if (tbody) {
          tbody.innerHTML = "";
          
          // Rebuild table with loaded NPCs
          npcs.forEach(npc => {
            if (typeof addNPCToTable === 'function') {
              addNPCToTable(npc);
            } else {
              // Fallback if addNPCToTable is not available
              const row = document.createElement("tr");
              row.innerHTML = `
                <td>${npc.name}</td>
                <td>${npc.race}</td>
                <td>${npc.age}</td>
                <td>${npc.profession || "None"}</td>
              `;
              tbody.appendChild(row);
            }
          });
        }
      }
      
      // Update UI
      currentPopulation.textContent = npcs.length;
      gameSpeed.textContent = "x " + gameLoopSpeed.toFixed(0);
      gameSpeedValue.textContent = `Game Speed: ${10000 / gameLoopSpeed}`;
      npcTableHeader.textContent = `Total Population ${npcs.length}`;
      
      // Update player info if available
      if (savedGameState.playerRace) {
        window.playerRace = savedGameState.playerRace;
        const playerRaceDisplay = document.getElementById("playerRaceDisplay");
        if (playerRaceDisplay) {
          playerRaceDisplay.textContent = savedGameState.playerRace;
        }
      }
      
      if (savedGameState.kingdomName) {
        window.kingdomName = savedGameState.kingdomName;
      }
      
      if (savedGameState.playerName) {
        window.playerName = savedGameState.playerName;
      }
      
      if (savedGameState.playedHours !== undefined) {
        window.playedHours = savedGameState.playedHours;
      }
      
      // Force a redraw of the world
      if (typeof redrawWorld === 'function') {
        redrawWorld();
      }
      
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
  