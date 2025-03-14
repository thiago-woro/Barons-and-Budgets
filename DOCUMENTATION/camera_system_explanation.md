# Camera System Architecture

## Core Components

### 1. **Camera Class (`camera.js`)**  
Manages camera state and transformations:  
- **Position**: `camera.position` (x,y) controls panning  
- **Zoom**: `camera.zoom` scales view  
- **Event Listeners**:  
  - Mouse drag for panning  
  - Mouse wheel/keys Q/E for zooming  
  - Keyboard (WASD) for precise panning  

### 2. **Canvas Container (CSS)**  
Defined in `style.css`:  
```css
.canvas-container {  
  position: absolute;  
  transform: translate(...) scale(...); /* Applied by Camera */  
}  
```  
All game canvases are children of this container, so transformations affect all layers simultaneously.

### 3. **Coordinate Conversion**  
Critical for interactions:  
- `screenToWorld()`: Converts mouse clicks to world coordinates  
- `worldToScreen()`: Converts world positions to screen coordinates  

## Interactions

### Zoom Mechanics  
1. **Mouse Wheel**:  
   - Zooms around mouse cursor position  
   - Uses `lockedCellX/Y` to maintain focus point  
   - Smooth transition via `previousDesiredX/Y`  

2. **Keyboard (Q/E)**:  
   ```javascript  
   // uitools.js  
   setupKeyboardZoom() → adjusts camera.zoom directly  
   ```  

### Panning Mechanics  
1. **Mouse Drag**:  
   - Updates `camera.position` based on delta movement  
   - `updateTransform()` immediately updates CSS  

2. **Keyboard (WASD)**:  
   ```javascript  
   updateCameraPosition() → modifies camera.position  
   ```  

### UI Integration  
- **Tab System**:  
  - `handleBottomTabClick()` in `uitools.js` adjusts canvas z-indexes but doesn't affect camera  
  - Clicking buildings/NPCs uses `camera.screenToWorld()` to determine world coordinates  

- **Centering Functions**:  
  ```javascript  
  camera.centerOnCell() → used by:  
   - Clicking cells with Shift  
   - UI buttons (Reset Camera)  
   - NPC info panel interactions  
  ```  

## Canvas Layers  
Defined in `style.css`:  
```css  
#groundCanvas { z-index: 20 }  
#waterCanvas { z-index: 10 }  
#npcCanvas { z-index: 30 }  
```  
Layers are rendered back-to-front based on z-index values.

## Key Dependencies  
1. **Cell Size**:  
   `cellSize` variable used in:  
   - Coordinate calculations  
   - Cell snapping logic  

2. **Container Size**:  
   ```javascript  
   window.addEventListener('resize', updateContainerSize)  
   ```  

## Debugging Features  
- `cameraZoomInfo` element displays real-time camera state  
- `console.log` statements in `centerOnCell()` and zoom handlers  

## Optimization Notes  
- Smooth zoom uses interpolated position transitions  
- Boundary checks in `applyWorldBounds()` (currently commented out)  
- Performance: Transformations applied as CSS properties for GPU acceleration
