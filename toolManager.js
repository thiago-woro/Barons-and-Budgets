document.addEventListener('DOMContentLoaded', () => {
  const ToolState = {
    SELECTING: 'selecting',
    PLACING_ANIMAL: 'placing_animal',
    PLACING_BUILDING: 'placing_building',
    TERRAIN_TOOL: 'terrain_tool',
    SELECTING_NPC: 'selecting_npc'
  };

  let currentToolState = ToolState.SELECTING;
  let selectedTool = null;
  let lastTime = performance.now();

  // Add click handlers for the bottom cards
  document.querySelectorAll('.bottomCard').forEach(card => {
    card.addEventListener('click', () => {
      const cardId = card.id;
      
      // Set state based on active tab and card
      switch(window.activeTabBottomLeft) {
        case 'animals':
          currentToolState = ToolState.PLACING_ANIMAL;
          selectedTool = cardId;
          break;
        case 'buildings': 
          currentToolState = ToolState.PLACING_BUILDING;
          selectedTool = cardId;
          break;
        case 'terrain':
          currentToolState = ToolState.TERRAIN_TOOL;
          selectedTool = cardId;
          break;
        case 'creatures':
          currentToolState = ToolState.SELECTING_NPC;
          selectedTool = cardId;
          break;
      }
    });
  });

  // Helper function to get click coordinates 
   //LIFE SAVER, DO NOT DELETE ❤❤❤❤❤❤❤
  //THIS ACTUALLY CONVERTS MOUSE TO CELL X,Y THE RIGHT WAY
  function getClickCoordinates(event) {   //same thing as logCellonClick()
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const { x: worldX, y: worldY } = camera.screenToWorld(x, y);
    const cellRow = Math.floor(worldY / cellSize);
    const cellCol = Math.floor(worldX / cellSize);
    
    return { cellRow, cellCol, worldX, worldY };
  }

  function placeAnimal(coords, toolId) {
    // Check if clicked on ground
    const isGround = groundCells.some(cell => 
      cell.x === coords.cellCol && cell.y === coords.cellRow
    );

    if (!isGround) {
      console.log("Can't place animal on water!");
      return;
    }

    // Create and add new animal
    const animal = new Animal(coords.cellCol, coords.cellRow, toolId);
    animals.push(animal);
    
    // Clear canvas before drawing
    animalCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);
    
    // Draw all animals
    animals.forEach(animal => {
      animal.draw(animalCtx);
    });

    console.log("Placed animal:", animal);
  }

  // Animation loop for animals
  function updateAnimals(currentTime) {
    // Calculate time passed since last frame
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    // Clear previous positions
    animalCtx.clearRect(0, 0, animalCanvas.width, animalCanvas.height);
    
    // Update and draw each animal
    animals.forEach(animal => {
      animal.move(deltaTime);
      animal.draw(animalCtx);
    });

    requestAnimationFrame(updateAnimals);
  }

  function placeBuilding(coords, toolId) {

    console.log(`Placing building: ${toolId} at`, coords);

  const building = new Building(coords.cellCol, coords.cellRow, cellSize, null, toolId);
  buildings.push(building);

  // Clear canvas before drawing
  homesCtx.clearRect(0, 0, boatCanvas.width, boatCanvas.height);

  // Draw all buildings
  buildings.forEach(building => {
    building.draw(homesCtx);
  });
  
  }

  function handleTerrainTool(coords, toolId) {
    console.log(`Using terrain tool: ${toolId} at`, coords);
    // Implement terrain modification logic
  }

  function handleNPCSelection(coords) {
    console.log(`Selecting NPC at`, coords);
    // Implement NPC selection logic
  }

  // Main click handler for the container
  container.addEventListener("click", function(event) {
    if (isDragging) return;
    
    const coords = getClickCoordinates(event);
    
    switch(currentToolState) {
      case ToolState.PLACING_ANIMAL:
        placeAnimal(coords, selectedTool);
        break;
      case ToolState.PLACING_BUILDING:

      if (selectedTool === "buildingsCardSelectTool") {

          // Check if houses array exists and has items
  if (!houses || !houses.length) {
    console.log("No houses found in the houses array");
    return;
  }
        selectBuilding(selectedTool, coords);
      } else {
        placeBuilding(coords, selectedTool); 
      }
        break;
      case ToolState.TERRAIN_TOOL:
        handleTerrainTool(coords, selectedTool);
        break;
      case ToolState.SELECTING_NPC:
        handleNPCSelection(coords);
        break;
    }
  });

  // Start the animation loop
  requestAnimationFrame(updateAnimals);
}); 




function selectBuilding(toolId, coords) {
  console.log("Selecting homes in the homes array, received coords:", coords);

  // Log all house cell positions for debugging
  console.log("All house cell positions:");
  houses.forEach((house, index) => {
    const houseCellX = Math.floor(house.x / cellSize);
    const houseCellY = Math.floor(house.y / cellSize);
    console.log(`House ${index}: world(${house.x}, ${house.y}), cell(${houseCellX}, ${houseCellY})`);
  });

  // Find a house at the exact clicked cell coordinates
  let foundHouse = null;

  for (const house of houses) {
    const houseCellX = Math.floor(house.x / cellSize);
    const houseCellY = Math.floor(house.y / cellSize);

    // Check if house coordinates exactly match the clicked coordinates
    if (houseCellX === coords.cellCol && houseCellY === coords.cellRow) {
      foundHouse = house;
      console.log(`✅ Found house at exact cell (${houseCellX}, ${houseCellY})`);
      break;
    }
  }

  // Show the house details if found
  if (foundHouse) {
    const insideBuilding = document.getElementById('insideBuilding');
    if (insideBuilding) {
      insideBuilding.style.visibility = 'visible';
      populateBuildingDetails(foundHouse);
    } 
  } else {
    console.log(`No house found at exact cell (${coords.cellCol}, ${coords.cellRow})`);
  }
}

// Function to populate building details
function populateBuildingDetails(house) {

  container.style.visibility = 'collapse';
  container.style.display = "none";

  const buildingTitle = document.getElementById('buildingTitle');
  const buildingDetails = document.getElementById('buildingDetails');
  
  if (buildingTitle) {
    buildingTitle.textContent = house.type || 'Building';
  }
  
  if (buildingDetails) {
    let detailsHtml = '';
    
    // Add building ID or name
    detailsHtml += `<p>ID: ${house.id || 'Unknown'}</p>`;
    
    // Add building position
    detailsHtml += `<p>Position: (${Math.floor(house.x / cellSize)}, ${Math.floor(house.y / cellSize)})</p>`;
    
    // Add owner information if available
    if (house.owner) {
      detailsHtml += `<p>Owner: ${house.owner}</p>`;
    }
    
    // Add any other relevant building information
    if (house.size) {
      detailsHtml += `<p>Size: ${house.size}</p>`;
    }
    
    buildingDetails.innerHTML = detailsHtml;
  }
}

