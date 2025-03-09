const ToolState = {
  SELECTING: 'selecting',
  PLACING_ANIMAL: 'placing_animal',
  PLACING_BUILDING: 'placing_building',
  TERRAIN_TOOL: 'terrain_tool',
  SELECTING_NPC: 'selecting_npc'
};

let currentToolState = ToolState.SELECTING;
let selectedTool = null;

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
  
  // Draw the animal
  animal.draw(animalCtx);
}

// Animation loop for animals
let lastTime = performance.now();

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

// Start the animation loop
requestAnimationFrame(updateAnimals);

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
  if (isDragging) return;
  
  const coords = getClickCoordinates(event);
  
  switch(currentToolState) {
    case ToolState.PLACING_ANIMAL:
      placeAnimal(coords, selectedTool);
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
  }
}); 