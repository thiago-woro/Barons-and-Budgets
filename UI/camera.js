// Initialize zoomLevel and other related variables
let zoomLevel = 1.0;
let canvasX = 0;
let canvasY = 0;
let mouseX = 0;
let mouseY = 0;
let cameraX = 0;
let cameraY = 0;

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

  /* html structure - dont delete
  	<body>
        <div class="canvas-container" id="container" style="visibility: collapse;">
            <canvas id="groundCanvas"  style="z-index: 10;"></canvas>
            <canvas id="waterCanvas"  style="z-index: 0;"></canvas>
   */

  setupEventListeners() {
    // Mouse wheel for zooming
    this.container.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = this.container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Log mouse position before zoom
      //console.log(`Before Zoom: Mouse Position = (${mouseX}, ${mouseY})`);

      // Calculate new zoom with proportional speed
      const zoomDirection = -Math.sign(e.deltaY);
      const zoomChange = this.zoom * this.zoomFactor * zoomDirection;
      const newZoom = Math.min(Math.max(this.zoom + zoomChange, this.minZoom), this.maxZoom);
      if (newZoom !== this.zoom) {
        // Apply zoom without translation effect
        this.zoom = newZoom;

        // Log mouse position after zoom
       // console.log(`After Zoom: Mouse Position = (${mouseX}, ${mouseY})`);

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

  // Convert world coordinates to screen coordinates
  worldToScreen(worldX, worldY) {
    const rect = this.container.getBoundingClientRect();
    // Convert to screen coordinates
    const screenX = worldX * this.zoom + this.position.x * this.zoom + rect.left;
    const screenY = worldY * this.zoom + this.position.y * this.zoom + rect.top;
    return { x: screenX, y: screenY };
  }

  

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
  }



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
  }












  updateTransform() {
    // Apply transform to the container
    this.container.style.transform = `translate(${-this.position.x * this.zoom}px, ${-this.position.y * this.zoom}px) scale(${this.zoom})`;

    // Update global values
    canvasX = -this.position.x * this.zoom;
    canvasY = -this.position.y * this.zoom;
    zoomLevel = this.zoom;

    // Don't call updateCanvasPosition() since we're applying the transform directly
    this.updateCameraZoomInfo();

    // Update the highlighted cell if the mouse is over the container
    const event = new MouseEvent('mousemove', {
      clientX: this.lastMousePos.x,
      clientY: this.lastMousePos.y
    });
    this.updateHoveredCell(event);
  }

 

  updateCameraZoomInfo() {
    const cameraZoomInfoElement = document.getElementById('cameraZoomInfo');
    if (cameraZoomInfoElement) {
      cameraZoomInfoElement.innerHTML = `Camera: Zoom: ${this.zoom.toFixed(2)} | Position: (${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)})`;
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

const canvases = container.querySelectorAll("canvas");
        let translateX = 0;
        let translateY = 0;

        // Adjust the translation values based on your desired speed
        const translateSpeed = 50;

        window.addEventListener("keydown", (event) => {
            const key = event.key.toLowerCase();

            switch (key) {
                case "a":
                    translateX += translateSpeed;
                    break;
                case "d":
                    translateX -= translateSpeed;
                    break;
                case "w":
                    translateY += translateSpeed;
                    break;
                case "s":
                    translateY -= translateSpeed;
                    break;
            }

            // Apply the translation to all canvas elements
            canvases.forEach((canvas) => {
                canvas.style.transform = `translate(${translateX}px, ${translateY}px)`;
            });
        });

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

/* // Mouse clicks canvas map
//let isDragging = false; // Define a global isDragging variable
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
      ctx.fillStyle = 'green';
      ctx.fillRect(cellCol * cellSize, cellRow * cellSize, cellSize, cellSize);

      //leftClickAction(cellCol, cellRow, npcCtx, cellSize, treeCtx, pathCtx);
    }
  });
}

logCellOnClick(container, boatCtx, cellSize, npcCtx, treeCtx, pathCtx);
 */

  container.addEventListener("click", function(event) {
    if (isDragging === false) {
logCellOnClick(container, boatCtx, cellSize, npcCtx, treeCtx, pathCtx);

    }
  });

//let isDragging = false; // Define a global isDragging variable
function logCellOnClick(container, ctx, cellSize) { //same things as getClickCoordinates   ❤❤❤
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
      console.log(`logCellOnClick - Cell clicked: X = ${cellCol}, Y = ${cellRow}`);



      // Draw a purple rectangle at the clicked cell
      ctx.fillStyle = 'green';
      ctx.fillRect(cellCol * cellSize, cellRow * cellSize, cellSize, cellSize);


      return { cellCol, cellRow };

    }
  ;
}








// Reset camera controls - DO NOT DELETE
function resetCanvasPosition() {
  // Update camera object instead of directly setting values
  camera.reset();
}

// Listen for click on the 'recenterCanvas' icon
document.getElementById("recenterCanvas").addEventListener("click", () => {
  resetCanvasPosition();
  centerCanvasOnMap();
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

  /* paint the center cells in green */
  // Draw a green rectangle at the center cell
  const cellCol = Math.floor(centerX / cellSize);
  const cellRow = Math.floor(centerY / cellSize);
  boatCtx.fillStyle = 'purple'; // Set the fill color to bright purple
  boatCtx.fillRect(cellCol * cellSize, cellRow * cellSize, cellSize, cellSize); // Draw a green rectangle at the center cell


  // Set camera position to center on this point
  camera.position.x = centerX - (groundCanvas.width / 2) / camera.zoom;
  camera.position.y = centerY - (groundCanvas.height / 2) / camera.zoom;

  // Update global variables
  canvasX = -camera.position.x * camera.zoom;
  canvasY = -camera.position.y * camera.zoom;

  camera.updateTransform();
}



document.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'c') {

    centerCanvasOnMap();
  }
});