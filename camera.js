class Camera {
  constructor(container) {
    this.container = container;
    this.position = { x: 0, y: 0 };
    this.zoom = 1.0;
    this.isDragging = false;
    this.lastMousePos = { x: 0, y: 0 };
    this.minZoom = 0.1;
    this.maxZoom = 5;
    this.zoomSpeed = 0.1;
    this.zoomFactor = 0.05; // New property for proportional zoom
    this.setupEventListeners();
  }

  setupEventListeners() {
    // Mouse wheel for zooming
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const mousePosBeforeZoom = this.screenToWorld(e.clientX, e.clientY);

      // Calculate new zoom with proportional speed
      const zoomDirection = -Math.sign(e.deltaY);
      const zoomChange = this.zoom * this.zoomFactor * zoomDirection;
      const newZoom = Math.min(Math.max(this.zoom + zoomChange, this.minZoom), this.maxZoom);

      if (newZoom !== this.zoom) {
        // Apply zoom
        const zoomFactor = newZoom / this.zoom;
        this.zoom = newZoom;
        
        // Update global zoomLevel to match
        zoomLevel = this.zoom;

        // Adjust position to keep mouse point fixed
        const mousePosAfterZoom = this.screenToWorld(e.clientX, e.clientY);
        this.position.x += mousePosAfterZoom.x - mousePosBeforeZoom.x;
        this.position.y += mousePosAfterZoom.y - mousePosBeforeZoom.y;
        
        // Update global canvasX and canvasY
        canvasX = -this.position.x * this.zoom;
        canvasY = -this.position.y * this.zoom;

        this.updateTransform();
      }
    });

    // Mouse drag for panning
    this.container.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      isDragging = true; // Update global variable
      this.lastMousePos = { x: e.clientX, y: e.clientY };
      this.container.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (this.isDragging) {
        const deltaX = (e.clientX - this.lastMousePos.x) / this.zoom;
        const deltaY = (e.clientY - this.lastMousePos.y) / this.zoom;
        
        this.position.x -= deltaX;
        this.position.y -= deltaY;
        
        // Update global canvasX and canvasY
        canvasX = -this.position.x * this.zoom;
        canvasY = -this.position.y * this.zoom;
        
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.updateTransform();
      }
      this.updateHoveredCell(e);
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
      isDragging = false; // Update global variable
      this.container.style.cursor = 'default';
    });
  }

screenToWorld(screenX, screenY) {
  const rect = this.container.getBoundingClientRect();
  const mouseX = screenX - rect.left;
  const mouseY = screenY - rect.top;
  // Convert to world coordinates
  const worldX = (mouseX - this.position.x * this.zoom) / this.zoom;
  const worldY = (mouseY - this.position.y * this.zoom) / this.zoom;
  return { x: worldX, y: worldY };
}

/* 
Understanding the screenToWorld Method
The screenToWorld method is crucial for converting mouse coordinates (which are relative to the container) into world coordinates, which are the actual coordinates in the game map. This conversion is necessary because the container can be translated and scaled, affecting the relationship between screen and world coordinates.

Steps in the screenToWorld Method
Get Container Bounding Rectangle :
javascript
Copy
1
const rect = this.container.getBoundingClientRect();
This gets the size and position of the container relative to the viewport.
Calculate Mouse Coordinates Relative to Container :
javascript
Copy
1
2
const mouseX = screenX - rect.left;
const mouseY = screenY - rect.top;
These lines convert the screen coordinates (which are relative to the entire document) to coordinates relative to the container.
Adjust for Translation :
javascript
Copy
1
2
const worldX = (mouseX - this.position.x * this.zoom) / this.zoom;
const worldY = (mouseY - this.position.y * this.zoom) / this.zoom;
this.position.x * this.zoom and this.position.y * this.zoom account for the translation applied to the container.
Subtracting these values from the mouse coordinates adjusts for the translation.
Dividing by this.zoom accounts for the scaling, giving the correct world coordinates.
How It Fits Into the Overall System
Mouse Click Event :
When a user clicks on a cell, the logCellOnClick function is triggered. This function calls camera.screenToWorld(x, y) to convert the click coordinates to world coordinates.
Coordinate Conversion :
The screenToWorld method ensures that the click coordinates are correctly transformed to account for the camera's translation and scaling.
Cell Calculation :
After converting the coordinates to world coordinates, the cell indices are calculated using:
javascript
Copy
1
2
const cellRow = Math.floor(worldY / cellSize);
const cellCol = Math.floor(worldX / cellSize);
Logging and Drawing :
The cell indices are then logged, and a purple rectangle is drawn at the clicked cell.
Summary
Translation Adjustment : Subtracting this.position.x * this.zoom and this.position.y * this.zoom from the mouse coordinates adjusts for the translation.
Scaling Adjustment : Dividing by this.zoom ensures that the coordinates are correctly scaled to match the world coordinates.
By following these steps, the screenToWorld method ensures that the click coordinates are accurately converted to world coordinates, even when the camera is zoomed or panned. This prevents issues like the ones you encountered, where the cell indices were incorrect due to the transformations.
 */

  updateHoveredCell(event) {
    // Use offsetX/offsetY for mouse coordinates relative to the container
    const mouseX = event.offsetX;
    const mouseY = event.offsetY;

    // Convert screen coordinates to world coordinates
    const worldX = mouseX / this.zoom + this.position.x;
    const worldY = mouseY / this.zoom + this.position.y;

    // Calculate cell index based on world coordinates
    const cellX = Math.floor(worldX / cellSize);
    const cellY = Math.floor(worldY / cellSize);

    // Calculate the screen position of the cell highlight
    const cellScreenX = (cellX * cellSize - this.position.x) * this.zoom;
    const cellScreenY = (cellY * cellSize - this.position.y) * this.zoom;

    // Clear previous highlight
    boatCtx.clearRect(0, 0, boatCanvas.width, boatCanvas.height);

    // Draw the highlight
    boatCtx.fillStyle = 'rgba(128, 0, 128, 0.5)';
    boatCtx.fillRect(cellScreenX, cellScreenY, cellSize * this.zoom, cellSize * this.zoom);

    // Update camera zoom info with additional cell info
    const cameraZoomInfo = document.getElementById('cameraZoomInfo');
    if (cameraZoomInfo) {
      cameraZoomInfo.innerHTML = `updateHoveredCell: Zoom: ${this.zoom.toFixed(2)} | Position: (${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)}) | Cell: (${cellX}, ${cellY}) | Screen: (${cellScreenX.toFixed(2)}, ${cellScreenY.toFixed(2)})`;
    }

    // Update debug info
    const debuggerOverlay = document.getElementById('debuggerOverlay');
    if (debuggerOverlay) {
      debuggerOverlay.innerHTML = `
        updateHoveredCell: World: (${worldX.toFixed(2)}, ${worldY.toFixed(2)})<br>
        Mouse: (${mouseX.toFixed(2)}, ${mouseY.toFixed(2)})<br>
        Cell: (${cellX}, ${cellY})<br>
        Screen Cell: (${cellScreenX.toFixed(2)}, ${cellScreenY.toFixed(2)})<br>
        Zoom: ${this.zoom.toFixed(2)}<br>
        Position: (${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)})
      `;
    }
  }

  updateTransform() {
    // Apply transform to the container
    this.container.style.transform = `translate(${-this.position.x * this.zoom}px, ${-this.position.y * this.zoom}px) scale(${this.zoom})`;
    
    // Update global values
    canvasX = -this.position.x * this.zoom;
    canvasY = -this.position.y * this.zoom;
    zoomLevel = this.zoom;
    
    // Don't call updateCanvasPosition() since we're applying the transform directly

    this.updateDebugInfo();
    this.updateCameraZoomInfo();

    // Update the highlighted cell if the mouse is over the container
    const event = new MouseEvent('mousemove', {
      clientX: this.lastMousePos.x,
      clientY: this.lastMousePos.y
    });
    this.updateHoveredCell(event);
  }

  updateDebugInfo() {
    const debuggerOverlay = document.getElementById('debuggerOverlay');
    if (debuggerOverlay) {
      debuggerOverlay.innerHTML = `
        Camera:<br>
        - Zoom: ${this.zoom.toFixed(2)}<br>
        - Position X: ${this.position.x.toFixed(2)}<br>
        - Position Y: ${this.position.y.toFixed(2)}<br>
        - Container Width: ${this.container.clientWidth}<br>
        - Container Height: ${this.container.clientHeight}
      `;
    }
  }

  updateCameraZoomInfo() {
    const cameraZoomInfo = document.getElementById('cameraZoomInfo');
    if (cameraZoomInfo) {
      cameraZoomInfo.innerHTML = `Camera: Zoom: ${this.zoom.toFixed(2)} | Position: (${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)}) | Mouse: (${this.lastMousePos?.x || 0}, ${this.lastMousePos?.y || 0})`;
    }
  }

  reset() {
    this.position = { x: 0, y: 0 };
    this.zoom = 1.0;
    
    // Update global variables
    canvasX = 0;
    canvasY = 0;
    zoomLevel = 1.0;
    
    this.updateTransform();
  }
}

// Initialize camera
const camera = new Camera(container);

// Add event listener for the reset camera button
document.getElementById("resetCameraButton").addEventListener("click", function() {
  camera.reset();
});

// Listen for 'Esc' key
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    hideMenu = true;
    gameTab.style.display = "none";
    statsTab.style.display = "none";
    chartTab.style.display = "none";
    npcTab.style.display = "none";
    minimizeTabButton.textContent = "Show";
    resetCanvasPosition();
    camera.reset(); // Reset the camera too
  }
});

///this works - do not delete
function getAdjacentCells(targetCell) {
  const { row: targetRow, col: targetCol } = targetCell;
  // Define the offsets for adjacent cells
  const offsets = [
    { row: -1, col: -1 },
    { row: -1, col: 0 },
    { row: -1, col: 1 },
    { row: 0, col: -1 },
    { row: 0, col: 0 }, // Target cell
    { row: 0, col: 1 },
    { row: 1, col: -1 },
    { row: 1, col: 0 },
    { row: 1, col: 1 },
  ];
  const adjacentCells = [];
  // Calculate and store the positions of adjacent cells relative to the target cell
  for (const offset of offsets) {
    const adjacentRow = targetRow + offset.row;
    const adjacentCol = targetCol + offset.col;
    adjacentCells.push({ row: adjacentRow, col: adjacentCol });
  }
  return adjacentCells;
}

// Mouse clicks canvas map
let isDragging = false; // Define a global isDragging variable

function logCellOnClick(container, ctx, cellSize, npcCtx, treeCtx, pathCtx) {
  container.addEventListener("click", function(event) {
    if (isDragging === false) {
      // Calculate the mouse position within the container.
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Convert screen coordinates to world coordinates
      const { x: worldX, y: worldY } = camera.screenToWorld(x, y);

      // Calculate cell indices (row and column) based on world position.
      const cellRow = Math.floor(worldY / cellSize);
      const cellCol = Math.floor(worldX / cellSize);

      console.log(`Cell clicked: X = ${cellCol}, Y = ${cellRow}`);

      // Draw a purple rectangle at the clicked cell
      ctx.fillStyle = 'purple'; 
      ctx.fillRect(cellCol * cellSize, cellRow * cellSize, cellSize, cellSize);

      // Perform the left-click action
      leftClickAction(cellCol, cellRow, npcCtx, cellSize, treeCtx, pathCtx);
    }
  });
}

// Example of how to use the function, assuming the container, npcCtx, and cellSize are already defined.
logCellOnClick(container, boatCtx, cellSize, npcCtx, treeCtx, pathCtx);

function leftClickAction(x, y, npcCtx, cellSize, treeCtx, pathCtx) {
  // Create a new house
  const newHouse = new House(x, y);
  // Log x and y
  console.log(`House drawn at ${x}, ${y}`);
  // Add the new house to the global array of houses
  // houses.push(newHouse);
  // Draw the new house
  newHouse.draw(npcCtx);
  // drawRectanglesBetweenHouses(houses, treeCtx);
  // Optionally alert the user
  // alert(`House drawn at ${x}, ${y}. Current home value: ${newHouse.homeValue}`);
}

// Reset camera controls - DO NOT DELETE
function resetCanvasPosition() {
  // Update Camera object instead of directly setting values
  camera.reset();
}

// Listen for click on the 'recenterCanvas' icon
document.getElementById("recenterCanvas").addEventListener("click", () => {
  resetCanvasPosition();
  centerCanvasOnMap();
  console.log("map centered ok");
});

// Function to center the canvas on the map
function centerCanvasOnMap() {
  // Calculate the center of the landCells array
  let totalX = 0;
  let totalY = 0;
  for (const cell of groundCells) {
    totalX += cell.x;
    totalY += cell.y;
  }
  const centerX = totalX / groundCells.length;
  const centerY = totalY / groundCells.length;

  // Calculate the center in world coordinates
  const centerWorldX = centerX * cellSize;
  const centerWorldY = centerY * cellSize;
  
  // Set camera position to center on this point
  camera.position.x = centerWorldX - (groundCanvas.width / 2) / camera.zoom;
  camera.position.y = centerWorldY - (groundCanvas.height / 2) / camera.zoom;
  
  // Update global variables
  canvasX = -camera.position.x * camera.zoom;
  canvasY = -camera.position.y * camera.zoom;
  
  camera.updateTransform();
}