let highlightedCellX = null;
let highlightedCellY = null;

// Function to convert mouse position to game cell coordinates
function mouseToGameCell(mouseX, mouseY) {
  const worldX = mouseX / camera.zoom + camera.position.x;
  const worldY = mouseY / camera.zoom + camera.position.y;
  
  const cellX = Math.floor(worldX / cellSize);
  const cellY = Math.floor(worldY / cellSize);
  
  return { cellX, cellY };
}

class Camera {
  constructor(container) {
    this.container = container;
    this.position = { x: 0, y: 0 };
    this.zoom = 0.30;
    this.isDragging = false;
    this.lastMousePos = { x: 0, y: 0 };
    this.minZoom = 0.35;
    this.maxZoom = 2.3;
    this.zoomFactor = 0.25;
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.container.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      this.container.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const deltaX = (e.clientX - this.lastMousePos.x) / this.zoom;
        const deltaY = (e.clientY - this.lastMousePos.y) / this.zoom;
        this.position.x -= deltaX;
        this.position.y -= deltaY;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.updateTransform();
      }
      this.updateHoveredCell(e);
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.container.style.cursor = 'default';
    });
  }

centerOnHighlightedCell() {
    if (highlightedCellX !== null && highlightedCellY !== null) {
        this.centerOnCell(highlightedCellX, highlightedCellY);
    }
}

 screenToWorld(screenX, screenY) {
  const rect = this.container.getBoundingClientRect();
  const worldX = (screenX - rect.left) / this.zoom + this.position.x;
  const worldY = (screenY - rect.top) / this.zoom + this.position.y;
  return { x: worldX, y: worldY };
}

worldToScreen(worldX, worldY) {
  const rect = this.container.getBoundingClientRect();
  const screenX = (worldX - this.position.x) * this.zoom + rect.left;
  const screenY = (worldY - this.position.y) * this.zoom + rect.top;
  return { x: screenX, y: screenY };
}

  updateHoveredCell(event) { //highlighted cell
    const mouseX = event.offsetX;
    const mouseY = event.offsetY;
    
    // Use the mouseToGameCell function to get cell coordinates
    const { cellX, cellY } = mouseToGameCell(mouseX, mouseY);

    const cellScreenX = (cellX * cellSize - this.position.x) * this.zoom;
    const cellScreenY = (cellY * cellSize - this.position.y) * this.zoom;
    boatCtx.clearRect(0, 0, boatCanvas.width, boatCanvas.height);
    boatCtx.fillStyle = 'rgba(128, 0, 128, 0.5)';  //purple highlight
    boatCtx.strokeStyle = 'rgba(128, 0, 128, 0.5)';
    boatCtx.strokeRect(cellScreenX, cellScreenY, cellSize * this.zoom, cellSize * this.zoom);
    const cameraZoomInfo = document.getElementById('cameraZoomInfo');
    if (cameraZoomInfo) {
      cameraZoomInfo.innerHTML = `Zoom: ${this.zoom.toFixed(2)} | Position: (${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)}) | Cell: (${cellX}, ${cellY}) | Row: ${cellY} | Column: ${cellX} | Screen: (${cellScreenX.toFixed(2)}, ${cellScreenY.toFixed(2)})`;
    }

    highlightedCellX = cellX;
    highlightedCellY = cellY;
  }


   updateTransform() {
    this.container.style.transform = `translate(${-this.position.x * this.zoom}px, ${-this.position.y * this.zoom}px) scale(${this.zoom})`;
    const event = new MouseEvent('mousemove', {
      clientX: this.lastMousePos.x,
      clientY: this.lastMousePos.y,
    });
    this.updateHoveredCell(event);
    updateContainerSize();
  }




centerOnCell(cellX, cellY) {
  // Target cell center in world coordinates
  const worldX = (cellX * cellSize) + (cellSize / 2);
  const worldY = (cellY * cellSize) + (cellSize / 2);

  // Container center in screen coordinates (relative to container's top-left)
  const containerRect = this.container.getBoundingClientRect();
  const containerCenterX = containerRect.width / 2;
  const containerCenterY = containerRect.height / 2;

  // Set position so worldX, worldY map to container center
  this.position.x = worldX - containerCenterX / this.zoom;
  this.position.y = worldY - containerCenterY / this.zoom;

  this.updateTransform();

  // Debugging
  const screenPos = this.worldToScreen(worldX, worldY);
  console.log(`Centered on (${cellX}, ${cellY}) - World: (${worldX}, ${worldY}), Pos: (${this.position.x}, ${this.position.y})`);
  console.log(`Screen Pos: (${screenPos.x}, ${screenPos.y}) vs Container Center: (${containerCenterX}, ${containerCenterY})`);
}

  centerCanvasOnMap() {  // RESETCAMERA BUTTON
    //log
    console.warn(`--- Reset Camera ---`);
    let totalX = 0;
    let totalY = 0;
    for (const cell of groundCells) {
      totalX += cell.x;
      totalY += cell.y;
    }
    const centerX = totalX / groundCells.length;
    const centerY = totalY / groundCells.length;
    this.centerOnCell(Math.floor(centerX), Math.floor(centerY));
  }
  
  // Function to center the camera on the origin (0,0)
  centerOnOrigin() {
    console.warn(`--- Centering on Origin (0,0) ---`);
    this.centerOnCell(0, 0);
    console.log(`Camera now at position: (${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)})`);
  }
}

// Initialize camera
const camera = new Camera(container);


let lockedCellX = null;
let lockedCellY = null;
let scrollTimeout = null;
let initialWorldX = null;
let initialWorldY = null;
let isZooming = false;
let previousDesiredX = null;
let previousDesiredY = null;

container.addEventListener('wheel', (e) => {
    e.preventDefault();

    const rect = container.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldMouse = camera.screenToWorld(mouseX, mouseY);
    const currentCellX = Math.floor(worldMouse.x / cellSize);
    const currentCellY = Math.floor(worldMouse.y / cellSize);

    if (!isZooming) {
        isZooming = true;
        lockedCellX = currentCellX;
        lockedCellY = currentCellY;
        initialWorldX = (lockedCellX * cellSize) + (cellSize / 2);
        initialWorldY = (lockedCellY * cellSize) + (cellSize / 2);
        previousDesiredX = camera.position.x;
        previousDesiredY = camera.position.y;
    }

    const zoomDirection = -Math.sign(e.deltaY);
    const zoomStep = camera.zoom * camera.zoomFactor * zoomDirection * 0.3; //Reduced zoom step
    const newZoom = Math.min(Math.max(camera.zoom + zoomStep, camera.minZoom), camera.maxZoom);

    const containerRect = camera.container.getBoundingClientRect();
    const containerCenterX = containerRect.width / 2;
    const containerCenterY = containerRect.height / 2;
    const worldCenter = camera.screenToWorld(containerCenterX, containerCenterY);

    const targetCameraX = initialWorldX - worldCenter.x;
    const targetCameraY = initialWorldY - worldCenter.y;

    const transitionSpeed = 0.1; // Reduced transition speed for smoother effect.
    if (previousDesiredX !== null) {
        const desiredCameraX = previousDesiredX + (targetCameraX - previousDesiredX) * transitionSpeed;
        const desiredCameraY = previousDesiredY + (targetCameraY - previousDesiredY) * transitionSpeed;
        camera.position.x = desiredCameraX;
        camera.position.y = desiredCameraY;
        previousDesiredX = desiredCameraX;
        previousDesiredY = desiredCameraY;
    } else {
        camera.position.x = targetCameraX;
        camera.position.y = targetCameraY;
        previousDesiredX = targetCameraX;
        previousDesiredY = targetCameraY;
    }

    camera.zoom = newZoom;
    camera.updateTransform();

    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
        isZooming = false;
        lockedCellX = null;
        lockedCellY = null;
        initialWorldX = null;
        initialWorldY = null;
        previousDesiredX = null;
        previousDesiredY = null;
    }, 200); // Reduced timeout
});

/* major camera functions ends here */








const panAmount = 20; // Adjust panning speed as needed
const pressedKeys = {}; // Track currently pressed keys

document.addEventListener('keydown', (event) => {
    pressedKeys[event.key.toLowerCase()] = true;
    updateCameraPosition();
});

document.addEventListener('keyup', (event) => {
    delete pressedKeys[event.key.toLowerCase()];
    updateCameraPosition();
});

function updateCameraPosition() {
    let dx = 0;
    let dy = 0;

    if (pressedKeys['w']) dy -= panAmount;
    if (pressedKeys['a']) dx -= panAmount;
    if (pressedKeys['s']) dy += panAmount;
    if (pressedKeys['d']) dx += panAmount;

    camera.position.x += dx;
    camera.position.y += dy;
    camera.updateTransform();
}














/*  DEBUGER TOOLS IGNORE THIS PART  */

/* ///THIS ACTUALLY FINALLY WORKS
container.addEventListener('click', (event) => {
  const rect = container.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  const { x: worldX, y: worldY } = camera.screenToWorld(x, y);
  const cellX = Math.floor(worldX / cellSize);
  const cellY = Math.floor(worldY / cellSize);

  // Calculate viewport center in world coordinates
  const containerRect = camera.container.getBoundingClientRect();
  const containerCenterX = containerRect.width / 2;
  const containerCenterY = containerRect.height / 2;
  const worldCenter = camera.screenToWorld(containerCenterX, containerCenterY);
  const viewportWorldX = worldCenter.x;
  const viewportWorldY = worldCenter.y;

  // Calculate desired camera position
  const cellWorldX = worldX;
  const cellWorldY = worldY;
  const desiredCameraPositionX = cellWorldX - viewportWorldX;
  const desiredCameraPositionY = cellWorldY - viewportWorldY;

  // Update camera position
  camera.position.x = desiredCameraPositionX;
  camera.position.y = desiredCameraPositionY;

  // Increase zoom by 10%
  camera.zoom *= 1.1; // Increase zoom by 10%
  camera.zoom = Math.min(camera.zoom, camera.maxZoom); // Ensure zoom doesn't exceed maximum

  camera.updateTransform();

  // Log for debugging
  console.log(`Clicked Cell: (${cellX}, ${cellY}) | Camera Position: (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}) | Desired Camera Position: (${desiredCameraPositionX.toFixed(2)}, ${desiredCameraPositionY.toFixed(2)}) | Zoom: ${camera.zoom.toFixed(2)}`);
});
 */

document.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'p') {
    logAllCenters();
  }
});

function logAllCenters() {
  const screenWidth = window.innerWidth;
  const screenHeight = window.innerHeight;
  const screenCenterX = screenWidth / 2;
  const screenCenterY = screenHeight / 2;

  const containerRect = camera.container.getBoundingClientRect();
  const containerCenterX = containerRect.width / 2;
  const containerCenterY = containerRect.height / 2;

  const worldCenter = camera.screenToWorld(containerCenterX, containerCenterY);
  const worldCenterX = worldCenter.x;
  const worldCenterY = worldCenter.y;

  console.log(`--- Centers ---`);
  console.info(`Container Center (Relative to Container): (${containerCenterX.toFixed(0)}, ${containerCenterY.toFixed(0)})`);
  console.warn(`World Center (World Coordinates): (${worldCenterX.toFixed(0)}, ${worldCenterY.toFixed(0)})`);
  console.log(`Camera Position: (${camera.position.x.toFixed(0)}, ${camera.position.y.toFixed(0)})`);
}


// Function to show dialog and center on user-provided coordinates
function promptAndCenterOnCell() {
  const input = prompt("Enter cell coordinates (format: x,y)", "");
  if (input === null || input.trim() === "") return;

  try {
    const coords = input.split(',').map(coord => parseInt(coord.trim(), 10));

    if (coords.length !== 2 || isNaN(coords[0]) || isNaN(coords[1])) {
      console.warn("Invalid coordinate format. Please use: x,y");
      return;
    }

    const [cellX, cellY] = coords;
    camera.centerOnCell(cellX, cellY);
  } catch (error) {
    console.warn("Error parsing coordinates:", error);
  }
}

// Add a keypress handler for 'g' key to go to coordinates
document.addEventListener('keydown', (event) => {
  if (event.key === 'g') {
    promptAndCenterOnCell();
  }
});







function applyWorldBounds() {
    const minX = 0;
    const maxX = 200 * cellSize; // Replace with your world's dimensions
    const minY = 0;
    const maxY = 200 * cellSize;

    // Viewport Dimensions
    const viewportWidth = this.container.getBoundingClientRect().width;
    const viewportHeight = this.container.getBoundingClientRect().height;

    // Bounds Checking
    const minCameraX = minX - (viewportWidth / this.zoom / 2);
    const maxCameraX = maxX - (viewportWidth / this.zoom / 2);
    const minCameraY = minY - (viewportHeight / this.zoom / 2);
    const maxCameraY = maxY - (viewportHeight / this.zoom / 2);

    this.position.x = Math.max(minCameraX, Math.min(this.position.x, maxCameraX));
    this.position.y = Math.max(minCameraY, Math.min(this.position.y, maxCameraY));
}


function updateContainerSize() {
  const container = document.getElementById('container');
  container.style.width = `${window.innerWidth}px`;
  container.style.height = `${window.innerHeight}px`;
}


// Call updateContainerSize when the window is resized
window.addEventListener('resize', updateContainerSize);

// Call updateContainerSize after the camera is initialized
document.addEventListener('DOMContentLoaded', () => {
    updateContainerSize();
})



// Mouse clicks canvas map
// Using the global isDragging variable from globalvariables.js
function logCellOnClick(container, ctx, cellSize, event) {
  const rect = container.getBoundingClientRect();
  const screenX = event.clientX - rect.left;
  const screenY = event.clientY - rect.top;
  
  // Use the mouseToGameCell function to get cell coordinates
  const { cellX: cellCol, cellY: cellRow } = mouseToGameCell(screenX, screenY);
  
  // Get world coordinates using camera's screenToWorld
  const { x: worldX, y: worldY } = camera.screenToWorld(screenX, screenY);
  
  // Calculate world coordinates of the cell's top-left corner
  const cellWorldX = cellCol * cellSize;
  const cellWorldY = cellRow * cellSize;
  
  console.info(`😁 logCellOnClick: Screen(${screenX.toFixed(2)}, ${screenY.toFixed(2)}) → World(${worldX.toFixed(2)}, ${worldY.toFixed(2)}) → Cell(${cellCol}, ${cellRow})`);
  console.info(`Cell world coords: (${cellWorldX}, ${cellWorldY}), Camera: pos(${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)}), zoom: ${camera.zoom}`);

  if (event.shiftKey) {
    camera.centerOnCell(cellCol, cellRow);
    return;
  }

  // Draw rectangle around the clicked cell
  ctx.strokeStyle = 'orange';
  ctx.lineWidth = 2;
  ctx.strokeRect(cellWorldX, cellWorldY, cellSize, cellSize);
  
  return { 
    screen: { x: screenX, y: screenY },
    world: { x: worldX, y: worldY },
    cell: { col: cellCol, row: cellRow },
    cellWorld: { x: cellWorldX, y: cellWorldY },
    activeTab: window.activeTabBottomLeft, 
    zoomLevel: camera.zoom 
  };
}

//logCellOnClick(container, boatCtx, cellSize, npcCtx, treeCtx, pathCtx);

// Add event listener for the R key
window.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === 'r') {
    //
    console.log("r key pressed - no function yet. file: uitools.js");
  } else if (event.key.toLowerCase() === 'o') {
    // Center on origin when O key is pressed
    camera.centerOnOrigin();
  } else if (event.key.toLowerCase() === 'x') {
    // Display cell X positions on the boatCtx canvas
    displayCellXPositions();
  } else if (event.key.toLowerCase() === 'y') {
    // Display cell Y positions on the boatCtx canvas
    displayCellYPositions();
  } else if (event.key.toLowerCase() === 'c') {
    // Display cell coordinates (both X and Y) on the boatCtx canvas
    displayCellCoordinates();
  } else if (event.key.toLowerCase() === 'h') {
    // Display house positions on the boatCtx canvas
    displayHousePositions();
  } else if (event.key.toLowerCase() === 'i') {
    // Display information about camera position and origin
    displayCameraInfo();
  }
});

// Function to display cell X positions on the boatCtx canvas
function displayCellXPositions() {
  console.log("Displaying cell X positions on the canvas");
  
  // Clear the boat canvas
  boatCtx.clearRect(0, 0, boatCanvas.width, boatCanvas.height);
  
  // Get visible area in world coordinates
  const containerRect = container.getBoundingClientRect();
  const topLeft = camera.screenToWorld(0, 0);
  const bottomRight = camera.screenToWorld(containerRect.width, containerRect.height);
  
  // Calculate visible cell range (add some margin)
  const startCellX = Math.floor(topLeft.x / cellSize) - 1;
  const endCellX = Math.ceil(bottomRight.x / cellSize) + 1;
  const startCellY = Math.floor(topLeft.y / cellSize) - 1;
  const endCellY = Math.ceil(bottomRight.y / cellSize) + 1;
  
  console.log(`Visible cell range: X(${startCellX} to ${endCellX}), Y(${startCellY} to ${endCellY})`);
  
  // Set text properties
  boatCtx.font = "12px Arial";
  boatCtx.textAlign = "center";
  boatCtx.textBaseline = "middle";
  
  // Draw cell X positions
  for (let x = startCellX; x <= endCellX; x++) {
    for (let y = startCellY; y <= endCellY; y++) {
      // Calculate world coordinates of cell center
      const worldX = x * cellSize + cellSize / 2;
      const worldY = y * cellSize + cellSize / 2;
      
      // Convert to screen coordinates
      const screenPos = camera.worldToScreen(worldX, worldY);
      
      // Draw cell X position
      boatCtx.fillStyle = "rgba(255, 0, 0, 0.8)";
      boatCtx.fillText(x.toString(), screenPos.x, screenPos.y);
      
      // Draw cell outline
      boatCtx.strokeStyle = "rgba(200, 200, 200, 0.3)";
      boatCtx.lineWidth = 1;
      const cellScreenX = (x * cellSize - camera.position.x) * camera.zoom;
      const cellScreenY = (y * cellSize - camera.position.y) * camera.zoom;
      boatCtx.strokeRect(cellScreenX, cellScreenY, cellSize * camera.zoom, cellSize * camera.zoom);
    }
  }
}

// Function to display cell Y positions on the boatCtx canvas
function displayCellYPositions() {
  console.log("Displaying cell Y positions on the canvas");
  
  // Clear the boat canvas
  boatCtx.clearRect(0, 0, boatCanvas.width, boatCanvas.height);
  
  // Get visible area in world coordinates
  const containerRect = container.getBoundingClientRect();
  const topLeft = camera.screenToWorld(0, 0);
  const bottomRight = camera.screenToWorld(containerRect.width, containerRect.height);
  
  // Calculate visible cell range (add some margin)
  const startCellX = Math.floor(topLeft.x / cellSize) - 1;
  const endCellX = Math.ceil(bottomRight.x / cellSize) + 1;
  const startCellY = Math.floor(topLeft.y / cellSize) - 1;
  const endCellY = Math.ceil(bottomRight.y / cellSize) + 1;
  
  console.log(`Visible cell range: X(${startCellX} to ${endCellX}), Y(${startCellY} to ${endCellY})`);
  
  // Set text properties
  boatCtx.font = "12px Arial";
  boatCtx.textAlign = "center";
  boatCtx.textBaseline = "middle";
  
  // Draw cell Y positions
  for (let x = startCellX; x <= endCellX; x++) {
    for (let y = startCellY; y <= endCellY; y++) {
      // Calculate world coordinates of cell center
      const worldX = x * cellSize + cellSize / 2;
      const worldY = y * cellSize + cellSize / 2;
      
      // Convert to screen coordinates
      const screenPos = camera.worldToScreen(worldX, worldY);
      
      // Draw cell Y position
      boatCtx.fillStyle = "rgba(0, 0, 255, 0.8)";
      boatCtx.fillText(y.toString(), screenPos.x, screenPos.y);
      
      // Draw cell outline
      boatCtx.strokeStyle = "rgba(200, 200, 200, 0.3)";
      boatCtx.lineWidth = 1;
      const cellScreenX = (x * cellSize - camera.position.x) * camera.zoom;
      const cellScreenY = (y * cellSize - camera.position.y) * camera.zoom;
      boatCtx.strokeRect(cellScreenX, cellScreenY, cellSize * camera.zoom, cellSize * camera.zoom);
    }
  }
}

// Function to display both X and Y coordinates
function displayCellCoordinates() {
  console.log("Displaying cell coordinates on the canvas");
  
  // Clear the boat canvas
  boatCtx.clearRect(0, 0, boatCanvas.width, boatCanvas.height);
  
  // Get visible area in world coordinates
  const containerRect = container.getBoundingClientRect();
  const topLeft = camera.screenToWorld(0, 0);
  const bottomRight = camera.screenToWorld(containerRect.width, containerRect.height);
  
  // Calculate visible cell range (add some margin)
  const startCellX = Math.floor(topLeft.x / cellSize) - 1;
  const endCellX = Math.ceil(bottomRight.x / cellSize) + 1;
  const startCellY = Math.floor(topLeft.y / cellSize) - 1;
  const endCellY = Math.ceil(bottomRight.y / cellSize) + 1;
  
  console.log(`Visible cell range: X(${startCellX} to ${endCellX}), Y(${startCellY} to ${endCellY})`);
  
  // Set text properties
  boatCtx.font = "10px Arial";
  boatCtx.textAlign = "center";
  boatCtx.textBaseline = "middle";
  
  // Draw cell coordinates
  for (let x = startCellX; x <= endCellX; x++) {
    for (let y = startCellY; y <= endCellY; y++) {
      // Calculate world coordinates of cell center
      const worldX = x * cellSize + cellSize / 2;
      const worldY = y * cellSize + cellSize / 2;
      
      // Convert to screen coordinates
      const screenPos = camera.worldToScreen(worldX, worldY);
      
      // Draw cell coordinates
      boatCtx.fillStyle = "rgba(0, 0, 0, 0.8)";
      boatCtx.fillText(`${x},${y}`, screenPos.x, screenPos.y);
      
      // Draw cell outline
      boatCtx.strokeStyle = "rgba(200, 200, 200, 0.3)";
      boatCtx.lineWidth = 1;
      const cellScreenX = (x * cellSize - camera.position.x) * camera.zoom;
      const cellScreenY = (y * cellSize - camera.position.y) * camera.zoom;
      boatCtx.strokeRect(cellScreenX, cellScreenY, cellSize * camera.zoom, cellSize * camera.zoom);
    }
  }
}

// Function to display house positions on the canvas
function displayHousePositions() {
  console.log("Displaying house positions on the canvas");
  
  // Clear the boat canvas
  boatCtx.clearRect(0, 0, boatCanvas.width, boatCanvas.height);
  
  // Check if houses array exists and has items
  if (!houses || !houses.length) {
    console.warn("No houses to display");
    return;
  }
  
  // Set text properties
  boatCtx.font = "10px Arial";
  boatCtx.textAlign = "center";
  boatCtx.textBaseline = "middle";
  
  // Log all house positions
  console.log("All houses positions:");
  houses.forEach((house, index) => {
    // Calculate cell coordinates
    const cellX = Math.floor(house.x / cellSize);
    const cellY = Math.floor(house.y / cellSize);
    
    console.log(`House ${index}: world(${house.x}, ${house.y}), cell(${cellX}, ${cellY})`);
    
    // Convert to screen coordinates
    const screenPos = camera.worldToScreen(house.x, house.y);
    
    // Draw house position
    boatCtx.fillStyle = "rgba(255, 0, 0, 0.8)";
    boatCtx.fillText(`H${index}(${cellX},${cellY})`, screenPos.x, screenPos.y);
    
    // Draw house hitbox
    boatCtx.strokeStyle = "rgba(255, 0, 0, 0.5)";
    boatCtx.lineWidth = 2;
    const hitboxSize = 50 / camera.zoom;
    const hitboxScreenX = (house.x - hitboxSize/2 - camera.position.x) * camera.zoom;
    const hitboxScreenY = (house.y - hitboxSize/2 - camera.position.y) * camera.zoom;
    boatCtx.strokeRect(hitboxScreenX, hitboxScreenY, hitboxSize * camera.zoom, hitboxSize * camera.zoom);
    
    // Draw a line from the house to cell (0,0) to visualize the offset
    boatCtx.strokeStyle = "rgba(255, 255, 0, 0.3)";
    boatCtx.lineWidth = 1;
    boatCtx.beginPath();
    boatCtx.moveTo(screenPos.x, screenPos.y);
    
    // Get screen coordinates for cell (0,0)
    const originScreenPos = camera.worldToScreen(0, 0);
    boatCtx.lineTo(originScreenPos.x, originScreenPos.y);
    boatCtx.stroke();
    
    // Mark the origin (0,0) with a cross
    boatCtx.strokeStyle = "rgba(0, 255, 0, 0.8)";
    boatCtx.lineWidth = 2;
    boatCtx.beginPath();
    boatCtx.moveTo(originScreenPos.x - 10, originScreenPos.y);
    boatCtx.lineTo(originScreenPos.x + 10, originScreenPos.y);
    boatCtx.moveTo(originScreenPos.x, originScreenPos.y - 10);
    boatCtx.lineTo(originScreenPos.x, originScreenPos.y + 10);
    boatCtx.stroke();
    
    // Label the origin
    boatCtx.fillStyle = "rgba(0, 255, 0, 0.8)";
    boatCtx.fillText("(0,0)", originScreenPos.x, originScreenPos.y + 15);
  });
}

// Function to display information about camera position and origin
function displayCameraInfo() {
  console.log("--- Camera Information ---");
  console.log(`Camera position: (${camera.position.x.toFixed(2)}, ${camera.position.y.toFixed(2)})`);
  console.log(`Camera zoom: ${camera.zoom.toFixed(2)}`);
  
  // Calculate the cell that contains the point (0,0)
  const originCellX = Math.floor(0 / cellSize);
  const originCellY = Math.floor(0 / cellSize);
  console.log(`Origin (0,0) is in cell: (${originCellX}, ${originCellY})`);
  
  // Calculate the screen position of the origin (0,0)
  const originScreenPos = camera.worldToScreen(0, 0);
  console.log(`Origin (0,0) screen position: (${originScreenPos.x.toFixed(2)}, ${originScreenPos.y.toFixed(2)})`);
  
  // Calculate the world position of the screen center
  const containerRect = camera.container.getBoundingClientRect();
  const screenCenterX = containerRect.width / 2;
  const screenCenterY = containerRect.height / 2;
  const worldCenter = camera.screenToWorld(screenCenterX, screenCenterY);
  console.log(`Screen center world position: (${worldCenter.x.toFixed(2)}, ${worldCenter.y.toFixed(2)})`);
  
  // Calculate the cell at the screen center
  const { cellX: centerCellX, cellY: centerCellY } = mouseToGameCell(screenCenterX, screenCenterY);
  console.log(`Screen center is in cell: (${centerCellX}, ${centerCellY})`);
  
  // Clear the boat canvas and draw the information
  boatCtx.clearRect(0, 0, boatCanvas.width, boatCanvas.height);
  
  // Get the correct screen position for world origin (0,0)
  const originScreenPos2 = camera.worldToScreen(0, 0);
  
  // Mark the origin (0,0) with a cross
  boatCtx.strokeStyle = "rgba(0, 255, 0, 0.8)";
  boatCtx.lineWidth = 2;
  boatCtx.beginPath();
  boatCtx.moveTo(originScreenPos2.x - 10, originScreenPos2.y);
  boatCtx.lineTo(originScreenPos2.x + 10, originScreenPos2.y);
  boatCtx.moveTo(originScreenPos2.x, originScreenPos2.y - 10);
  boatCtx.lineTo(originScreenPos2.x, originScreenPos2.y + 10);
  boatCtx.stroke();
  
  // Label the origin
  boatCtx.font = "12px Arial";
  boatCtx.fillStyle = "rgba(0, 255, 0, 0.8)";
  boatCtx.fillText("World (0,0)", originScreenPos2.x, originScreenPos2.y + 20);
  
  // Mark the screen center
  boatCtx.strokeStyle = "rgba(255, 0, 0, 0.8)";
  boatCtx.beginPath();
  boatCtx.moveTo(screenCenterX - 10, screenCenterY);
  boatCtx.lineTo(screenCenterX + 10, screenCenterY);
  boatCtx.moveTo(screenCenterX, screenCenterY - 10);
  boatCtx.lineTo(screenCenterX, screenCenterY + 10);
  boatCtx.stroke();
  
  // Label the screen center
  boatCtx.fillStyle = "rgba(255, 0, 0, 0.8)";
  boatCtx.fillText("Screen Center", screenCenterX, screenCenterY + 20);
  
  // Draw a line connecting the origin and screen center
  boatCtx.strokeStyle = "rgba(255, 255, 0, 0.5)";
  boatCtx.lineWidth = 1;
  boatCtx.beginPath();
  boatCtx.moveTo(originScreenPos2.x, originScreenPos2.y);
  boatCtx.lineTo(screenCenterX, screenCenterY);
  boatCtx.stroke();
  
  // Add text showing the distance between origin and screen center
  const distanceX = Math.abs(worldCenter.x).toFixed(0);
  const distanceY = Math.abs(worldCenter.y).toFixed(0);
  const midX = (originScreenPos2.x + screenCenterX) / 2;
  const midY = (originScreenPos2.y + screenCenterY) / 2;
  boatCtx.fillStyle = "rgba(255, 255, 0, 0.8)";
  boatCtx.fillText(`Distance: (${distanceX}, ${distanceY})`, midX, midY - 10);
}