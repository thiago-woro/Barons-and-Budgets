let highlightedCellX = null;
let highlightedCellY = null;

class Camera {
  constructor(container) {
    this.container = container;
    this.position = { x: 0, y: 0 };
    this.zoom = 0.30;
    this.isDragging = false;
    this.lastMousePos = { x: 0, y: 0 };
    this.minZoom = 0.1;
    this.maxZoom = 2;
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

  updateHoveredCell(event) {
    let cellX, cellY; // Declare cellX and cellY at the top of the function

    const mouseX = event.offsetX;
    const mouseY = event.offsetY;
    const worldX = mouseX / this.zoom + this.position.x;
    const worldY = mouseY / this.zoom + this.position.y;

    cellX = Math.floor(worldX / cellSize);
    cellY = Math.floor(worldY / cellSize);

    const cellScreenX = (cellX * cellSize - this.position.x) * this.zoom;
    const cellScreenY = (cellY * cellSize - this.position.y) * this.zoom;
    boatCtx.clearRect(0, 0, boatCanvas.width, boatCanvas.height);
    boatCtx.fillStyle = 'rgba(128, 0, 128, 0.5)';
    boatCtx.strokeStyle = 'rgba(128, 0, 128, 0.5)';
    boatCtx.strokeRect(cellScreenX, cellScreenY, cellSize * this.zoom, cellSize * this.zoom);
    const cameraZoomInfo = document.getElementById('cameraZoomInfo');
    if (cameraZoomInfo) {
      cameraZoomInfo.innerHTML = `Zoom: ${this.zoom.toFixed(2)} | Position: (${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)}) | Cell: (${cellX}, ${cellY}) | Screen: (${cellScreenX.toFixed(2)}, ${cellScreenY.toFixed(2)})`;
    }

    highlightedCellX = cellX;
    highlightedCellY = cellY;
  }


   updateTransform() {
    this.container.style.transform = `translate(${-this.position.x * this.zoom}px, ${-this.position.y * this.zoom}px) scale(${this.zoom})`;
    this.updateCameraZoomInfo();
    const event = new MouseEvent('mousemove', {
      clientX: this.lastMousePos.x,
      clientY: this.lastMousePos.y,
    });
    this.updateHoveredCell(event);
    updateContainerSize();
  }

  updateCameraZoomInfo() {
    const cameraZoomInfoElement = document.getElementById('cameraZoomInfo');
    if (cameraZoomInfoElement) {
      cameraZoomInfoElement.innerHTML = `Camera: Zoom: ${this.zoom.toFixed(2)} | Position: (${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)})`;
    }
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

// Mouse clicks canvas map
let isDragging = false;
function logCellOnClick(container, ctx, cellSize, npcCtx, treeCtx, pathCtx) {
  container.addEventListener("click", function(event) {
    if (isDragging === false) {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      const { x: worldX, y: worldY } = camera.screenToWorld(x, y);
      const cellRow = Math.floor(worldY / cellSize);
      const cellCol = Math.floor(worldX / cellSize);
      console.info(`Click at (${x.toFixed(2)}, ${y.toFixed(2)}), Cell: (${cellCol}, ${cellRow}), tab: ${window.activeTabBottomLeft}`);

      if (event.shiftKey) {
        camera.centerOnCell(cellCol, cellRow);
        return;
      }

      ctx.strokeStyle = 'orange';
      ctx.lineWidth = 2;
      ctx.strokeRect(cellCol * cellSize, cellRow * cellSize, cellSize, cellSize);
    }
  });
}

logCellOnClick(container, boatCtx, cellSize, npcCtx, treeCtx, pathCtx);






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