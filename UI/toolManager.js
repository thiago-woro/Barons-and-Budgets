let selectedEmoji = '';
let selectedToolName = '';

document.addEventListener('DOMContentLoaded', () => {
    const ToolState = {
        SELECTING: 'selecting',
        PLACING_ANIMAL: 'placing_animal',
        PLACING_BUILDING: 'placing_building',
        TERRAIN_TOOL: 'terrain_tool',
        SELECTING_NPC: 'selecting_npc',
        SELECTING_ANIMAL: 'selecting_animal'
    };

    let currentToolState = ToolState.SELECTING;
    let selectedTool = null;

    // Add this object to track last selected tool per tab
    const tabToolState = {
        buildings: null,
        terrain: null,
        creatures: null,
        animals: null,
        budgets: null
    };

    const removeActiveClass = (selector) => document.querySelectorAll(selector).forEach(el => el.classList.remove('active'));
    const addActiveClass = (selector, id) => document.getElementById(id).classList.add('active');

    // Modified handleCardClick to save tool state
    const handleCardClick = (card) => {
        const cardId = card.id;
        selectedEmoji = card.dataset.emoji;
        selectedToolName = card.dataset.text;
        removeActiveClass('.bottomCard');
        addActiveClass('.bottomCard', cardId);
        selectedTool = cardId;
        document.body.style.cursor = 'auto';
        
        // Save the selected tool for current tab
        tabToolState[window.activeTabBottomLeft] = cardId;
        
        // Set tool state based on tab
        currentToolState = (() => {
            switch (window.activeTabBottomLeft) {
                case 'animals': return ToolState.PLACING_ANIMAL;
                case 'buildings': return ToolState.PLACING_BUILDING;
                case 'terrain': return ToolState.TERRAIN_TOOL;
                case 'creatures': return ToolState.SELECTING_NPC;
                default: return ToolState.SELECTING;
            }
        })();
    };

    // IMPORTANT: Only add event listeners to DOM elements - don't try to draw them
    document.querySelectorAll('.bottomCard').forEach(card => {
        card.addEventListener('click', () => handleCardClick(card));
        // Make sure we're not treating the card as a building
        if (card.id.startsWith('buildingsCard')) {
            // Remove any attributes that might cause it to be treated as a Building object
            card.removeAttribute('x');
            card.removeAttribute('y');
            card.removeAttribute('type');
        }
    });

    const getClickCoordinates = (event) => {
        const rect = container.getBoundingClientRect();
        const { x: worldX, y: worldY } = camera.screenToWorld(event.clientX - rect.left, event.clientY - rect.top);
        return { cellRow: Math.floor(worldY / cellSize), cellCol: Math.floor(worldX / cellSize), worldX, worldY };
    };

    const handleDrowningAnimation = (coords, toolId) => {
        const drowningAnimal = new Animal(coords.cellCol, coords.cellRow, toolId);
        drowningAnimal.isDrowning = true;
        animals.push(drowningAnimal);
        drowningAnimal.animateEmoji('drown', drowningAnimal.emoji, 1500);

        const clearAndRedrawAnimals = () => {
            animalCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);
            animals.forEach(animal => animal.draw(animalCtx));
        };

        clearAndRedrawAnimals();

        setTimeout(() => {
            const index = animals.indexOf(drowningAnimal);
            if (index > -1) animals.splice(index, 1);
            clearAndRedrawAnimals();
        }, 2000);
    };

    const placeAnimal = (coords, toolId) => {
        if (!emptyCells.some(cell => cell.x === coords.cellCol && cell.y === coords.cellRow)) {
            console.log("Animal drowning in water!"); //todo if its water, drown, if its tree, just pick a nearby cell with no trees
            handleDrowningAnimation(coords, toolId);
            return;
        }

        const maxAge = toolId.includes('Coyote') || toolId.includes('Bear') ?
            Animal.PREDATOR_MAX_AGE : Animal.MAX_AGE;
        const randomAge = Math.floor(Math.random() * (maxAge * 0.9 - maxAge * 0.15) + maxAge * 0.15);

        let animalSpecies = toolId.includes('Coyote') ? 'Coyote' : toolId.includes('Bear') ? 'Bear' : toolId.includes('Sheep') ? 'Sheep' : 'Chicken';

        animals.push(new Animal(coords.cellCol, coords.cellRow, animalSpecies, randomAge));
        animalCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);
        animals.forEach(animal => animal.draw(animalCtx));
        console.log("Placed animal:", animals[animals.length - 1]);
    };

    const placeBuilding = (coords, toolId) => {
        console.log(`Placing building: ${toolId} at`, coords);
        
        // Extract the building type by removing the "buildingsCard" prefix
        const buildingType = toolId.startsWith("buildingsCard") ? 
            toolId.replace("buildingsCard", "") : toolId;
            
        // Create the building with the cleaned type
        buildings.push(new Building(coords.cellCol, coords.cellRow, null, buildingType, ""));
        
        // Clear and redraw all buildings
        homesCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);
        buildings.forEach(building => building.draw(homesCtx));
        console.log("Placed building:", buildings[buildings.length - 1]);
    };

    const handleTerrainTool = (coords, toolId) => {
        console.log(`> terrain >> ${toolId}`);
        if (toolId === "terrainCardBush") placeTree(coords.cellCol, coords.cellRow, "🌳");
        if (toolId === "terrainCardTree") placeTree(coords.cellCol, coords.cellRow, "🌲");
        if (toolId === "terrainCardPath") viewPath(coords);
    };

    const selectNPC = (coords) => {
        for (const npc of npcs) {
            if (npc.gridX === coords.cellCol && npc.gridY === coords.cellRow) {
                console.log("Found NPC at", coords);
                showNPCInfo(npc);
                currentNPCselected = npc;
                break;
            }
        }
    };

    const placeNPC = (coords, toolId) => {
        console.log(`Placing NPC of type: ${toolId} at`, coords);
        npcs.push(new NPC(coords.cellCol, coords.cellRow, npcs.length, null, 0));
        npcCanvas.getContext('2d').clearRect(0, 0, npcCanvas.width, npcCanvas.height);
    };

    const walkSelectedNPCtoCell = (coords) => {
        // TODO: Implement the moveTo functionality
        console.log(`selected NPC: ${currentNPCselected.name}, currently at: ${currentNPCselected.gridX}, ${currentNPCselected.gridY}  move to: ${coords.cellCol}, ${coords.cellRow}`);
        let fromCell = {x: currentNPCselected.gridX, y: currentNPCselected.gridY};
        let toCell = {x: coords.cellCol, y: coords.cellRow};
        let path = findPath(fromCell, toCell);
        console.log(`path: ${path}`);

        if (path) {
            console.log("Path found:", path);
            
            // Clear previous paths
            boatCtx.clearRect(0, 0, boatCtx.canvas.width, boatCtx.canvas.height);
            
            // Draw path as purple line
            boatCtx.strokeStyle = "#8A2BE2"; // Purple color
            boatCtx.lineWidth = 2;
            boatCtx.beginPath();
            
            // Move to the first point
            const firstCell = path[0];
            boatCtx.moveTo(
                (firstCell.x * cellSize) + (cellSize / 2), 
                (firstCell.y * cellSize) + (cellSize / 2)
            );
            
            // Draw lines to each subsequent point
            for (let i = 1; i < path.length; i++) {
                const cell = path[i];
                boatCtx.lineTo(
                    (cell.x * cellSize) + (cellSize / 2), 
                    (cell.y * cellSize) + (cellSize / 2)
                );
            }
            
            boatCtx.stroke();
        } else {
            console.log("No path found between start and target");
            
            // Clear previous paths when no path is found
           // boatCtx.clearRect(0, 0, boatCtx.canvas.width, boatCtx.canvas.height);
        }
    };

    const selectBuilding = (coords) => {
        console.log("Selecting buildings or houses at coords:", coords);
        const foundHouse = houses.find(house =>
            Math.floor(house.x / cellSize) === coords.cellCol &&
            Math.floor(house.y / cellSize) === coords.cellRow
        );
        const foundBuilding = foundHouse ? null : buildings.find(building =>
            Math.floor(building.x / cellSize) === coords.cellCol &&
            Math.floor(building.y / cellSize) === coords.cellRow
        );
        const foundStructure = foundHouse || foundBuilding;

        if (foundStructure) {
            const insideBuilding = document.getElementById('insideBuilding');
            if (insideBuilding) {
                insideBuilding.style.visibility = 'visible';
                insideBuilding.style.display = 'flex';
                populateBuildingDetails(foundStructure);
            }
        } else {
            console.log(`No building or house found at cell (${coords.cellCol}, ${coords.cellRow})`);
        }
    };

    const populateBuildingDetails = (structure) => {
        container.style.visibility = 'collapse';
        container.style.display = "none";
        const isHouse = houses.includes(structure);
        const structureType = isHouse ? (structure.type || 'House') : (structure.type || 'Building');
        document.getElementById('buildingTitle').textContent = structureType;

        let detailsHtml = `
            <p>Type: ${structureType}</p>
            <p>Position: (${isHouse ? Math.floor(structure.x / cellSize) : structure.x}, 
                         ${isHouse ? Math.floor(structure.y / cellSize) : structure.y})</p>
        `;

        if (structure.owner) detailsHtml += `<p>Owner: ${structure.owner}</p>`;
        if (structure.size) detailsHtml += `<p>Size: ${structure.size}</p>`;
        if (structure.id) detailsHtml += `<p>ID: ${structure.id}</p>`;
        if (!isHouse) {
            if (structure.buildingType) detailsHtml += `<p>Building Type: ${structure.buildingType}</p>`;
            if (structure.resources) detailsHtml += `<p>Resources: ${structure.resources}</p>`;
        }

        document.getElementById('buildingDetails').innerHTML = detailsHtml;
        document.getElementById('buildingDetails').style.display = "block";

        console.log('importing rooms');

        fetch('buildings/interior.html')
            .then(res => res.text())
            .then(html => {
                let temp = document.createElement('div');
                temp.innerHTML = html;
                let interior = document.getElementById('buildingDetails');

                Array.from(temp.childNodes).forEach(node => {
                    if (node.tagName !== 'SCRIPT') {
                        interior.appendChild(node);
                    }
                });

                Array.from(temp.querySelectorAll('script')).forEach(script => {
                    let newScript = document.createElement('script');
                    newScript.src = script.src ? script.src : '';
                    newScript.textContent = script.textContent;
                    document.head.appendChild(newScript);
                });
            })
            .then(() => {
                console.log('rooms imported');
                console.log('generating rooms');
                severalRooms(3); // Default to 3 rooms
            });
    };

    const selectAnimal = (coords) => {
        for (const animal of animals) {
            if (animal.gridX === coords.cellCol && animal.gridY === coords.cellRow) {
                console.log(`Found animal at ${coords.cellCol}, ${coords.cellRow}`);
                showAnimalInfo(animal);
                currentAnimalSelected = animal; 
                break;
            }
        }
    };

    //MAIN CLICK DETECTOR    THIAGO
    container.addEventListener("click", (event) => {
        if (isDragging) return;
        const coords = getClickCoordinates(event);
        switch (currentToolState) {
            case ToolState.PLACING_ANIMAL: 
                if (selectedTool === "animalSelectTool") {
                    selectAnimal(coords);
                } else {
                    placeAnimal(coords, selectedTool);
                }
                break;
            case ToolState.PLACING_BUILDING: selectedTool === "buildingsCardSelectTool" ? selectBuilding(coords) : placeBuilding(coords, selectedTool); break;
            case ToolState.TERRAIN_TOOL: handleTerrainTool(coords, selectedTool); break;
            case ToolState.SELECTING_NPC:
                if (selectedTool === "creaturesCardSelectTool") {
                    selectNPC(coords);
                } else if (selectedTool === "walkSelectedNPCtoCell" && currentNPCselected) {
                    walkSelectedNPCtoCell(coords);
                } else {
                    placeNPC(coords, selectedTool);
                }
                break;
        }
    });

    document.getElementById('closeBuildingButton').addEventListener('click', () => {
        document.getElementById('insideBuilding').style.display = 'none';
        container.style.display = "block";
        container.style.visibility = 'visible';
    });

    const setActiveAnimalCard = (id, emoji) => {
        removeActiveClass('#animalsRow .bottomCard');
        const card = document.querySelector(`#animalsRow .bottomCard#${id}`);
        if (card) {
            card.classList.add('active');
            selectedTool = id;
            
            if (id !== "animalSelectTool") {
                document.body.style.cursor = `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><text x="0" y="24" font-size="14">${emoji}</text></svg>'), auto`;
            } else {
                document.body.style.cursor = 'auto';
            }
            window.activeTabBottomLeft = "animals";
            currentToolState = ToolState.PLACING_ANIMAL;
        }
    };

    document.querySelectorAll('#animalsRow .bottomCard').forEach(card => {
        card.addEventListener('click', function() {
            const emoji = this.querySelector('h3').textContent.trim();
            setActiveAnimalCard(this.id, emoji);
        });
    });

    document.addEventListener('click', (e) => {
        if (!e.target.closest('.bottomTabs') && window.activeTabBottomLeft !== "animals") {
            document.body.style.cursor = 'auto';
        }
    });

    // Modified tab click handler
    document.querySelectorAll('#leftMenuHeaderTabs .bottomTabs').forEach(tab => {
        tab.addEventListener('click', () => {
            // Get the tab id from the first span (which contains the tab name)
            const tabSpan = tab.querySelector('span:first-child');
            const tabId = tabSpan.id.replace('Tab', '').toLowerCase();
            window.activeTabBottomLeft = tabId;
            
            removeActiveClass('#leftMenuHeaderTabs .bottomTabs');
            tab.classList.add('active');
            
            // Hide/show appropriate rows
            ['terrainRow', 'creaturesRow', 'animalsRow', 'budgetsRow', 'buildingsRow'].forEach(rowId => {
                document.getElementById(rowId).style.display = 
                    rowId.replace('Row', '').toLowerCase() === tabId ? 'flex' : 'none';
            });

            // Restore last selected tool for this tab or select default
            const rowElement = document.getElementById(`${tabId}Row`);
            if (rowElement) {
                const savedTool = tabToolState[tabId];
                if (savedTool && document.getElementById(savedTool)) {
                    // Restore previously selected tool
                    handleCardClick(document.getElementById(savedTool));
                } else {
                    // Select first tool (usually the Select tool) as default
                    const firstTool = rowElement.querySelector('.bottomCard');
                    if (firstTool) {
                        handleCardClick(firstTool);
                    }
                }
            }
        });
    });

    // Modified setDefaultSelectTools
    const setDefaultSelectTools = () => {
        // First clear all active tabs and rows
        removeActiveClass('#leftMenuHeaderTabs .bottomTabs');
        ['terrainRow', 'creaturesRow', 'animalsRow', 'budgetsRow', 'buildingsRow'].forEach(rowId => {
            document.getElementById(rowId).style.display = 'none';
        });

        // Set buildings tab as initial active tab
        const buildingsTab = document.getElementById('buildingsTab');
        if (buildingsTab) {
            buildingsTab.parentElement.classList.add('active');
            document.getElementById('buildingsRow').style.display = 'flex';
            window.activeTabBottomLeft = 'buildings';

            // Select first tool in buildings tab
            const firstBuildingTool = document.querySelector('#buildingsRow .bottomCard');
            if (firstBuildingTool) {
                handleCardClick(firstBuildingTool);
            }
        }
    };

    setDefaultSelectTools();
});




// Variable to store the start cell for pathfinding
let toolManagerPathStartTest = null;

// Function to handle path visualization when using the path tool
function viewPath(coords) {
    if (!toolManagerPathStartTest) {
        // First click - set start cell
        toolManagerPathStartTest = { x: coords.cellCol, y: coords.cellRow };
        console.log("Path start cell selected:", toolManagerPathStartTest);
    } else {
        // Second click - set target cell and calculate path
        const target = { x: coords.cellCol, y: coords.cellRow };
        console.log("Path target cell selected:", target);
        
        // Calculate path using A* algorithm
        const path = findPath(toolManagerPathStartTest, target);
        
        if (path) {
            console.log("Path found:", path);
            
            // Clear previous paths
            boatCtx.clearRect(0, 0, boatCtx.canvas.width, boatCtx.canvas.height);
            
            // Draw path as purple line
            boatCtx.strokeStyle = "#8A2BE2"; // Purple color
            boatCtx.lineWidth = 2;
            boatCtx.beginPath();
            
            // Move to the first point
            const firstCell = path[0];
            boatCtx.moveTo(
                (firstCell.x * cellSize) + (cellSize / 2), 
                (firstCell.y * cellSize) + (cellSize / 2)
            );
            
            // Draw lines to each subsequent point
            for (let i = 1; i < path.length; i++) {
                const cell = path[i];
                boatCtx.lineTo(
                    (cell.x * cellSize) + (cellSize / 2), 
                    (cell.y * cellSize) + (cellSize / 2)
                );
            }
            
            boatCtx.stroke();
        } else {
            console.log("No path found between start and target");
            
            // Clear previous paths when no path is found
            boatCtx.clearRect(0, 0, boatCtx.canvas.width, boatCtx.canvas.height);
        }
        
        // Reset the start cell for the next path
        toolManagerPathStartTest = null;
    }
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



/**
 * Animates an animal moving diagonally to a random bush location using a curved path.
 * This is a visual-only animation that ignores game logic and pathfinding.
 * @param {Animal} animal - The animal object to animate.
 */
function animateAnimalToRandomBush(animal) {
  if (!animal) {
    animal = currentAnimalSelected;
  }
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
  console.log("Animating animal to random bush", animal.id);

  // Select a random bush position
  const targetBush = gBushesPositions[Math.floor(Math.random() * gBushesPositions.length)];
  
  // Important: Bush coordinates are in grid units, need to convert to pixel coordinates
  const targetGridX = targetBush.gridX;
  const targetGridY = targetBush.gridY;
  const targetPixelX = targetGridX * cellSize; // Convert grid to pixel for animation
  const targetPixelY = targetGridY * cellSize; // Convert grid to pixel for animation

  console.log("Target bush", targetBush, "gridX:", targetGridX, "gridY:", targetGridY, 
              "pixelX:", targetPixelX, "pixelY:", targetPixelY);
  
  // Store starting position (already in pixels)
  const startX = animal.x;
  const startY = animal.y;
  
  // Animation duration in milliseconds
  const duration = 2000; // Reduced from 10000 to 2000 for faster animation
  const startTime = performance.now();
  
  // Midpoint for curve calculation (slightly above direct path)
  const midX = (startX + targetPixelX) / 2;
  const midY = (startY + targetPixelY) / 2 - 50; // Offset upward for arc effect
  
  function animate(currentTime) {
    // Calculate progress (0 to 1)
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Clear previous frame - need to redraw all animals
    animalCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);
    
    if (progress < 1) {
      // Quadratic Bezier curve calculation for smooth arcing movement
      const t = progress;
      const oneMinusT = 1 - t;
      
      // Calculate new position along the curve (in pixels)
      const newX = oneMinusT * oneMinusT * startX + 2 * oneMinusT * t * midX + t * t * targetPixelX;
      const newY = oneMinusT * oneMinusT * startY + 2 * oneMinusT * t * midY + t * t * targetPixelY;
      
      // Update animal position for rendering only
      animal.x = newX;
      animal.y = newY;
      
      // Redraw all animals (including our animated one at the new position)
      animals.forEach(a => a.draw(animalCtx));
      
      // Continue animation
      requestAnimationFrame(animate);
    } else {
      // Animation complete - update both pixel and grid coordinates
      animal.x = targetPixelX;
      animal.y = targetPixelY;
      animal.gridX = targetGridX;
      animal.gridY = targetGridY;
      
      // Redraw all animals
      animals.forEach(a => a.draw(animalCtx));
      
      console.log(`Animation complete! Animal moved to bush at grid(${targetGridX}, ${targetGridY}), pixel(${targetPixelX}, ${targetPixelY})`);
    }
  }
  
  // Start the animation
  requestAnimationFrame(animate);
}



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