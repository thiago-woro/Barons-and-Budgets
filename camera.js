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
  });
  

  //git add . && git commit -m "Added feature: Esc key to reset camera Scale and Translate" && git push origin main
