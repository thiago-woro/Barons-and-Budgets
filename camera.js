////////////////////CAMERA FUNCTIONS
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
              
              // Adjust position to keep mouse point fixed
              const mousePosAfterZoom = this.screenToWorld(e.clientX, e.clientY);
              this.position.x += mousePosAfterZoom.x - mousePosBeforeZoom.x;
              this.position.y += mousePosAfterZoom.y - mousePosBeforeZoom.y;
              
              this.updateTransform();
          }
      });

      // Mouse drag for panning
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

  screenToWorld(screenX, screenY) {
      const rect = this.container.getBoundingClientRect();
      const x = (screenX - rect.left) / this.zoom + this.position.x;
      const y = (screenY - rect.top) / this.zoom + this.position.y;
      return { x, y };
  }

  updateHoveredCell(event) {
      const worldPos = this.screenToWorld(event.clientX, event.clientY);
      const cellX = Math.floor(worldPos.x / cellSize);
      const cellY = Math.floor(worldPos.y / cellSize);

      // Clear previous highlight
      boatCtx.clearRect(0, 0, groundCanvas.width, groundCanvas.height);

      // Draw new highlight
      boatCtx.save();
      boatCtx.fillStyle = 'rgba(128, 0, 128, 0.5)';
      boatCtx.fillRect(
          cellX * cellSize,
          cellY * cellSize,
          cellSize,
          cellSize
      );
      boatCtx.restore();
  }

  updateTransform() {
      this.container.style.transform = `translate(${-this.position.x * this.zoom}px, ${-this.position.y * this.zoom}px) scale(${this.zoom})`;
      this.updateDebugInfo();
  }

  updateDebugInfo() {
      const debuggerOverlay = document.getElementById('debuggerOverlay');
      if (debuggerOverlay) {
          debuggerOverlay.innerHTML = `
              Zoom: ${this.zoom.toFixed(2)}<br>
              Position X: ${this.position.x.toFixed(2)}<br>
              Position Y: ${this.position.y.toFixed(2)}
          `;
      }
  }

  reset() {
      this.position = { x: 0, y: 0 };
      this.zoom = 1.0;
      this.updateTransform();
  }
}

// Initialize camera
const camera = new Camera(container);

// Optional: Add reset functionality
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
      camera.reset();
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

//mouse clicks canvas map
function logCellOnClick(container, ctx, cellSize) {
// console.log(`loading cell logger`);
container.addEventListener("click", function(event) {
  if (!isDragging) {
    // Calculate the mouse position within the container.
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Calculate cell indices (row and column) based on mouse position.
    const cellRow = Math.floor(y / cellSize);
    const cellCol = Math.floor(x / cellSize);

   // console.log(`Cell clicked: X = ${cellCol}, Y = ${cellRow}`);

    ctx.fillStyle = 'purple'; 
    ctx.fillRect(cellCol * cellSize, cellRow * cellSize, cellSize, cellSize);

    leftClick(cellCol, cellRow, npcCtx, cellSize);
    //  const adjacentCells = getAdjacentCells(cellCol, cellRow, 3, 5, 5);  //didnt work use 

  }
});
}

// Example of how to use the function, assuming the container, npcCtx, and cellSize are already defined.
//  logCellOnClick(container, boatCtx, cellSize); // OG FUNCTION - THIS WORKS OK

function leftClick(x, y, npcCtx, cellSize) {
// Create a new house
const newHouse = new House(x, y, cellSize);

// Add the new house to the global array of houses
houses.push(newHouse);

// Draw the new house
newHouse.draw(npcCtx, cellSize);
drawRectanglesBetweenHouses(houses, treeCtx);

// Optionally alert the user
//alert(`House drawn at ${x}, ${y}. Current home value: ${newHouse.homeValue}`);
}

//reset camera controls - DO NOT DELETE
function resetCanvasPosition() {
  zoomLevel = 1; // Reset to initial zoom level
  canvasX = 0;  // Reset X translation
  canvasY = 0;  // Reset Y translation
  updateCanvasPosition();  // Update the canvas position
}
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
  }
});

// Listen for click on the 'recenterCanvas' icon
document.getElementById("recenterCanvas").addEventListener("click", () => {
 // resetCanvasPosition();
  centerCanvasOnMap();

console.log("map centered ok");

});

// Function to center the canvas on the map
function centerCanvasOnMap() {
// Calculate the new canvasX and canvasY values to center the canvas
canvasX = (groundCanvas.width / 2) ;
canvasY = (groundCanvas.height / 2);

// Update the canvas position
updateCanvasPosition();
}