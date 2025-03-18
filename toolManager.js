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
  
  // Mouse tracking variables
  let mouseDownTime = 0;
  let mouseDownX = 0;
  let mouseDownY = 0;
  let wasDragging = false;

  // Track exact mouse position and timing
  container.addEventListener('mousedown', (e) => {
    mouseDownTime = Date.now();
    mouseDownX = e.clientX;
    mouseDownY = e.clientY;
    wasDragging = false;
  });

  container.addEventListener('mousemove', (e) => {
    if (mouseDownTime === 0) return;
    
    const dx = Math.abs(e.clientX - mouseDownX);
    const dy = Math.abs(e.clientY - mouseDownY);
    
    // If mouse has moved more than 3 pixels, consider it a drag
    if (dx > 3 || dy > 3) {
      wasDragging = true;
    }
  });

  container.addEventListener('mouseup', (e) => {
    const mouseUpTime = Date.now();
    const dx = Math.abs(e.clientX - mouseDownX);
    const dy = Math.abs(e.clientY - mouseDownY);
    
    // Only consider it a drag if mouse moved more than 3 pixels
    isDragging = wasDragging || (dx > 3 || dy > 3);
    
    // Reset tracking variables
    mouseDownTime = 0;
    
    // Reset drag state after a short delay
    setTimeout(() => {
      isDragging = false;
      wasDragging = false;
    }, 50);
  });

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
  function getClickCoordinates(event) {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const { x: worldX, y: worldY } = camera.screenToWorld(x, y);
    const cellRow = Math.floor(worldY / cellSize);
    const cellCol = Math.floor(worldX / cellSize);
    
    return { cellRow, cellCol, worldX, worldY };
  }

  function placeAnimal(coords, toolId) {
    console.log(`Attempting to place animal: ${toolId} at Row ${coords.cellRow}, Col ${coords.cellCol}, Tab: ${window.activeTabBottomLeft}`);
    
    // Return early if active tab is not Animals
    if (window.activeTabBottomLeft !== "animals") {
      console.warn("Cannot place animal: Active tab is not Animals");
      return;
    }

    //return early if animal limit is reached
    if (animals.length >= 500) {
      console.log("Animal limit reached!");
      return;
    }

    // Check if clicked on ground
    const isGround = groundCells.some(cell => 
      cell.x === coords.cellCol && cell.y === coords.cellRow
    );

    console.log(`Cell coordinates: Row ${coords.cellRow}, Col ${coords.cellCol}, isGround: ${isGround}`);
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
    // Implement building placement logic
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
    console.log("Canvas container clicked");
    
    // Only check for dragging when animals tab is active
    if (isDragging || wasDragging) {
      console.warn("Prevented placement - was dragging");
      return;
    }
    
    const coords = getClickCoordinates(event);
    console.log(`Click coordinates: Row ${coords.cellRow}, Col ${coords.cellCol}`);
    
    switch(currentToolState) {
      case ToolState.PLACING_ANIMAL:
        console.log(`Attempting to place animal, current tool: ${selectedTool}`);
        placeAnimal(coords, selectedTool);
        console.log(`Animals count after placement: ${animals.length}`);
        break;
      case ToolState.PLACING_BUILDING:
        placeBuilding(coords, selectedTool); 
        break;
      case ToolState.TERRAIN_TOOL:
        handleTerrainTool(coords, selectedTool);
        break;
      case ToolState.SELECTING_NPC:
        handleNPCSelection(coords);
        break;
      default:
        console.log(`Current tool state: ${currentToolState}`);
    }
  });

  // Start the animation loop
  requestAnimationFrame(updateAnimals);
}); 