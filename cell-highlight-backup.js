/*
Backup File for Mouse Hover Highlighting Feature
This file includes all the code needed to run the mouse hover highlight functionality.
*/

// Global Variables
var cellSize = 50; // Define cell size in world units
var container = document.getElementById('container'); // Container element for the canvas
var boatCanvas = document.getElementById('boatCanvas'); // Canvas for drawing highlights
var boatCtx = boatCanvas.getContext('2d');

// Ensure canvas dimensions are set
boatCanvas.width = container.clientWidth;
boatCanvas.height = container.clientHeight;

// Camera Class
function Camera(container) {
    // Variables at the top
    this.container = container;
    this.position = { x: 0, y: 0 };
    this.zoom = 1.0;
    this.isDragging = false;
    this.lastMousePos = { x: 0, y: 0 };
    this.minZoom = 0.1;
    this.maxZoom = 5;
    this.zoomFactor = 0.05; // Proportional zoom factor
    
    this.setupEventListeners();
}

Camera.prototype.setupEventListeners = function() {
    // Mouse wheel for zooming
    this.container.addEventListener('wheel', function(e) {
        e.preventDefault();
        var mousePosBeforeZoom = this.screenToWorld(e.clientX, e.clientY);
        
        // Calculate new zoom with proportional speed
        var zoomDirection = -Math.sign(e.deltaY);
        var zoomChange = this.zoom * this.zoomFactor * zoomDirection;
        var newZoom = Math.min(Math.max(this.zoom + zoomChange, this.minZoom), this.maxZoom);
        
        if (newZoom !== this.zoom) {
            var zoomFactor = newZoom / this.zoom;
            this.zoom = newZoom;
            
            // Adjust position to keep mouse point fixed
            var mousePosAfterZoom = this.screenToWorld(e.clientX, e.clientY);
            this.position.x += mousePosAfterZoom.x - mousePosBeforeZoom.x;
            this.position.y += mousePosAfterZoom.y - mousePosBeforeZoom.y;
            
            this.updateTransform();
        }
    }.bind(this));
    
    // Mouse drag for panning
    this.container.addEventListener('mousedown', function(e) {
        // Variables at top
        this.isDragging = true;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.container.style.cursor = 'grabbing';
    }.bind(this));
    
    window.addEventListener('mousemove', function(e) {
        if (this.isDragging) {
            // Variables at the top
            var deltaX = (e.clientX - this.lastMousePos.x) / this.zoom;
            var deltaY = (e.clientY - this.lastMousePos.y) / this.zoom;
            
            this.position.x -= deltaX;
            this.position.y -= deltaY;
            
            this.lastMousePos = { x: e.clientX, y: e.clientY };
            this.updateTransform();
        }
        this.updateHoveredCell(e);
    }.bind(this));
    
    window.addEventListener('mouseup', function() {
        this.isDragging = false;
        this.container.style.cursor = 'default';
    }.bind(this));
};

Camera.prototype.screenToWorld = function(screenX, screenY) {
    // Variables at top
    var rect = this.container.getBoundingClientRect();
    var mouseX = screenX - rect.left;
    var mouseY = screenY - rect.top;
    
    // Convert to world coordinates
    var worldX = mouseX / this.zoom + this.position.x;
    var worldY = mouseY / this.zoom + this.position.y;
    
    return { x: worldX, y: worldY };
};

Camera.prototype.updateHoveredCell = function(event) {
    // Use offsetX/offsetY for mouse coordinates relative to the container
    var mouseX = event.offsetX;
    var mouseY = event.offsetY;
    console.log(`updateHoveredCell: mouseX: ${mouseX}, mouseY: ${mouseY}, zoom: ${this.zoom}, position: (${this.position.x}, ${this.position.y})`);
    
    // Convert screen coordinates to world coordinates
    var worldX = mouseX / this.zoom + this.position.x;
    var worldY = mouseY / this.zoom + this.position.y;
    
    // Calculate cell index based on world coordinates
    var cellX = Math.floor(worldX / cellSize);
    var cellY = Math.floor(worldY / cellSize);
    
    // Calculate the screen position of the cell highlight
    var cellScreenX = (cellX * cellSize - this.position.x) * this.zoom;
    var cellScreenY = (cellY * cellSize - this.position.y) * this.zoom;
    
    // Clear previous highlight
    boatCtx.clearRect(0, 0, boatCanvas.width, boatCanvas.height);
    
    // Draw the highlight
    boatCtx.fillStyle = 'rgba(128, 0, 128, 0.5)';
    boatCtx.fillRect(cellScreenX, cellScreenY, cellSize * this.zoom, cellSize * this.zoom);
    
    // Update camera zoom info with additional cell info
    var cameraZoomInfo = document.getElementById('cameraZoomInfo');
    if (cameraZoomInfo) {
        cameraZoomInfo.innerHTML = `updateHoveredCell: Zoom: ${this.zoom.toFixed(2)} | Position: (${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)}) | Cell: (${cellX}, ${cellY}) | Screen: (${cellScreenX.toFixed(2)}, ${cellScreenY.toFixed(2)})`;
    }
    
    // Update debug info
    var debuggerOverlay = document.getElementById('debuggerOverlay');
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
};

Camera.prototype.updateTransform = function() {
    // Apply transform to the container
    this.container.style.transform = `translate(${-this.position.x * this.zoom}px, ${-this.position.y * this.zoom}px) scale(${this.zoom})`;
    console.log(`updateTransform: pos(${this.position.x}, ${this.position.y}) zoom(${this.zoom})`);
    
    // Update debug info if needed
    this.updateDebugInfo();
    this.updateCameraZoomInfo();
    
    // Simulate a mousemove event to update the hovered cell
    var simulatedEvent = new MouseEvent('mousemove', { clientX: this.lastMousePos.x, clientY: this.lastMousePos.y });
    this.updateHoveredCell(simulatedEvent);
};

Camera.prototype.updateDebugInfo = function() {
    var debuggerOverlay = document.getElementById('debuggerOverlay');
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
};

Camera.prototype.updateCameraZoomInfo = function() {
    var cameraZoomInfo = document.getElementById('cameraZoomInfo');
    if (cameraZoomInfo) {
        cameraZoomInfo.innerHTML = `Camera: Zoom: ${this.zoom.toFixed(2)} | Position: (${this.position.x.toFixed(2)}, ${this.position.y.toFixed(2)}) | Mouse: (${this.lastMousePos.x || 0}, ${this.lastMousePos.y || 0})`;
    }
};

Camera.prototype.reset = function() {
    // Variables at the top
    this.position = { x: 0, y: 0 };
    this.zoom = 1.0;
    this.updateTransform();
};

// Initialize Camera
var camera = new Camera(container);

// Optional: Add reset functionality on Esc key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        camera.reset();
    }
});

// End of backup file 