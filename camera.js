////////////////////CAMERA FUNCTIONS
let keys = {};
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let canvasX = 0;
let canvasY = 0;
let zoomLevel = 1; // Initial zoom level
const zoomSpeed = 0.1; // Adjust this for zoom speed
const minZoom = 0.5; // Minimum zoom level
const maxZoom = 8; // Maximum zoom level
const canvasSpeed = 5;

function handleKeyDown(event) {
  keys[event.key] = true;
}

function handleKeyUp(event) {
  keys[event.key] = false;
}

function handleMouseDown(event) {
  isDragging = true;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
}

function handleMouseMove(event) {
  if (isDragging) {
    event.stopPropagation(); // Prevents this event from triggering parent handlers

    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;
    canvasX -= deltaX;
    canvasY -= deltaY;
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    container.style.cursor = "all-scroll";
    updateCanvasPosition();
  }
}

function handleMouseUp() {
  isDragging = false;
  container.style.cursor = "url(./assets/cursor/skyrim.cur), auto"; // Set the cursor to your custom one
}

const zoomStep = 0.1;

let mouseX = 0;
let mouseY = 0;

function handleMouseWheel(event) {
  event.preventDefault();

  // Get the mouse cursor's position within the container
  mouseX = event.clientX - container.getBoundingClientRect().left;
  mouseY = event.clientY - container.getBoundingClientRect().top;

  const canvasMouseX = mouseX / zoomLevel - canvasX / zoomLevel;
  const canvasMouseY = mouseY / zoomLevel - canvasY / zoomLevel;

  // Calculate the cell indices (row and column) based on mouse position
  const cellRow = Math.floor(canvasMouseY / gridSize);
  const cellCol = Math.floor(canvasMouseX / gridSize);

  // Calculate the zoom change based on the zoom step
  const zoomChange = event.deltaY > 0 ? -zoomStep : zoomStep;

  // Adjust zoom level based on the calculated zoom change
  const newZoomLevel = Math.max(
    minZoom,
    Math.min(zoomLevel + zoomChange, maxZoom)
  );

  // Calculate how much the canvas should move to keep the cursor over the same point.
  const zoomRatio = newZoomLevel / zoomLevel;
  const newCanvasX = mouseX + zoomRatio * (canvasX - mouseX);
  const newCanvasY = mouseY + zoomRatio * (canvasY - mouseY);

  // Update zoom level and translations
  zoomLevel = newZoomLevel;
  canvasX = newCanvasX;
  canvasY = newCanvasY;

  // Apply CSS transform to zoom and translate the canvas container
  updateCanvasPosition();
}

function updateCanvasPosition() {
  if (keys["ArrowLeft"] || keys["a"]) {
    canvasX -= canvasSpeed;
  }
  if (keys["ArrowRight"] || keys["d"]) {
    console.log(">");
    canvasX += canvasSpeed;
  }
  if (keys["ArrowUp"] || keys["w"]) {
    canvasY -= canvasSpeed;
  }
  if (keys["ArrowDown"] || keys["s"]) {
    canvasY += canvasSpeed;
  }

  // Apply CSS transform to move and zoom the canvas container
  // container.style.transform = `translate(${-canvasX}px, ${-canvasY}px) scale(${zoomLevel})`;

  container.style.transform = `scale(${zoomLevel}) translate(${-canvasX}px, ${-canvasY}px)`;
}

document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);
// Add event listeners for mouse events
container.addEventListener("mousedown", handleMouseDown);
container.addEventListener("mousemove", handleMouseMove);
container.addEventListener("mouseup", handleMouseUp);

// Add event listener for mouse wheel (scroll) events
container.addEventListener("wheel", handleMouseWheel);

// Update canvas position continuously
function updateLoop() {
  updateCanvasPosition();
  requestAnimationFrame(updateLoop);
}

// Set initial position to the bottom left based on initial zoom level
function setInitialCanvasPosition() {
  const containerRect = container.getBoundingClientRect();
  canvasX = 0;
  canvasY = containerRect.height - containerRect.height / zoomLevel;
}

// Update canvas position continuously
function updateLoop() {
  updateCanvasPosition();
  requestAnimationFrame(updateLoop);
}

document.addEventListener("DOMContentLoaded", () => {
  setInitialCanvasPosition();  // Set the initial position
  updateLoop();  // Start the update loop
});



/// TO-DO ACCOUNT FOR CURRENT CANVAS ZOOM
function highlightCellOnMouseOver(container, ctx, cellSize) {
  container.addEventListener("mousemove", function (event) {
    if (!isDragging) {
    const rect = container.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    const cellRow = Math.floor(y / cellSize);
    const cellCol = Math.floor(x / cellSize);

    //console.log(`Mouse is over cell: X = ${cellCol}, Y = ${cellRow}`);

    // Clear the entire npcCanvas
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Draw a red overlay on the npcCanvas
    ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Semi-transparent red
    ctx.fillRect(cellCol * cellSize, cellRow * cellSize, cellSize, cellSize);
 }});
}


// Attach the event listener to the canvas container and draw on npcCanvas
highlightCellOnMouseOver(container, boatCtx, cellSize);


//mouse clicks canvas map
function logCellOnClick(container, ctx, cellSize) {
  container.addEventListener("click", function(event) {
    if (!isDragging) {
      // Calculate the mouse position within the container.
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // Calculate cell indices (row and column) based on mouse position.
      const cellRow = Math.floor(y / cellSize);
      const cellCol = Math.floor(x / cellSize);

      console.log(`Cell clicked: X = ${cellCol}, Y = ${cellRow}`);

      ctx.fillStyle = 'purple'; 
      ctx.fillRect(cellCol * cellSize, cellRow * cellSize, cellSize, cellSize);

      leftClick(cellCol, cellRow, npcCtx, cellSize);

    }
  });
}

// Example of how to use the function, assuming the container, npcCtx, and cellSize are already defined.
logCellOnClick(container, boatCtx, cellSize);


function leftClick(x, y, npcCtx, cellSize) {
  // Create a new house
  const newHouse = new House(x, y, cellSize);
  
  // Add the new house to the global array of houses
  houses.push(newHouse);
  
  // Draw the new house
  newHouse.draw(npcCtx, cellSize);
  
  // Optionally alert the user
  alert(`House drawn at ${x}, ${y}. Current home value: ${newHouse.homeValue}`);
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
      resetCanvasPosition();
    }
  });
  
  // Listen for click on the 'recenterCanvas' icon
  document.getElementById("recenterCanvas").addEventListener("click", () => {
    resetCanvasPosition();
console.log("map centered ok");

  });
