
// In Camera class:
updateHoveredCell(event) {
  // Get mouse coordinates relative to container
  const mouseX = event.offsetX;
  const mouseY = event.offsetY;
  
  // Convert screen to world coordinates using camera transformation
  const worldX = mouseX / this.zoom + this.position.x;
  const worldY = mouseY / this.zoom + this.position.y;
  
  // Calculate cell indices
  const cellX = Math.floor(worldX / cellSize);
  const cellY = Math.floor(worldY / cellSize);
  
  // Calculate the screen position for highlighting
  const cellScreenX = (cellX * cellSize - this.position.x) * this.zoom;
  const cellScreenY = (cellY * cellSize - this.position.y) * this.zoom;
  
  // Clear previous highlight and draw new one
  boatCtx.clearRect(0, 0, boatCanvas.width, boatCanvas.height);
  boatCtx.fillStyle = 'rgba(128, 0, 128, 0.5)';
  boatCtx.fillRect(cellScreenX, cellScreenY, cellSize * this.zoom, cellSize * this.zoom);
  
  // Update zoom info display
  const cameraZoomInfo = document.getElementById('cameraZoomInfo');
  if (cameraZoomInfo) {
    cameraZoomInfo.innerHTML = `updateHoveredCell: Zoom: ${this.zoom.toFixed(2)} | Position: (${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)}) | Cell: (${cellX}, ${cellY}) | Screen: (${cellScreenX.toFixed(2)}, ${cellScreenY.toFixed(2)})`;
  }
}

//### 2. Coordinate Transformation Functions (camera.js)

// Convert screen coordinates to world coordinates
screenToWorld(screenX, screenY) {
  const rect = this.container.getBoundingClientRect();
  const mouseX = screenX - rect.left;
  const mouseY = screenY - rect.top;
  
  // Convert to world coordinates
  const worldX = (mouseX - this.position.x * this.zoom) / this.zoom;
  const worldY = (mouseY - this.position.y * this.zoom) / this.zoom;
  
  return { x: worldX, y: worldY };
}

// Convert world coordinates to screen coordinates
worldToScreen(worldX, worldY) {
  const rect = this.container.getBoundingClientRect();
  
  // Convert to screen coordinates
  const screenX = worldX * this.zoom + this.position.x * this.zoom + rect.left;
  const screenY = worldY * this.zoom + this.position.y * this.zoom + rect.top;
  
  return { x: screenX, y: screenY };
}


// 3. Click Coordinate Calculation (toolManager.js)
function getClickCoordinates(event) {
  const rect = container.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Convert screen coordinates to world coordinates using camera
  const { x: worldX, y: worldY } = camera.screenToWorld(x, y);
  
  // Calculate cell indices
  const cellRow = Math.floor(worldY / cellSize);
  const cellCol = Math.floor(worldX / cellSize);
  
  return { cellRow, cellCol, worldX, worldY };
}

// 4. Animal Placement Logic (toolManager.js)
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

// 5. Main Click Event Handler (toolManager.js)
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

// 6. Tool State Management (toolManager.js)
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
      // Other cases...
    }
  });
});

// Key Variable Definitions

/* - `cellSize` - The size of each grid cell in pixels (defined in globalvariables.js)
- `animals` - Global array that stores all animal instances (defined in globalvariables.js)
- `groundCells` - Array of land cell coordinates (defined in globalvariables.js)
- `isDragging` - Boolean flag to prevent click actions during camera dragging
 */
// Canvas Setup (uitools.js)
// Canvas initialization
const canvasElements = [
  // Other canvases...
  "animalCanvas"
];

const ctxElements = {};

for (const canvasId of canvasElements) {
  ctxElements[canvasId] = setupCanvas(canvasId);
}

// Extract the animal canvas context for drawing
const [animalCanvas, animalCtx] = ctxElements["animalCanvas"];




// Animation Loop for Animals (toolManager.js)
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