
function minimap(ctx, terrainMap, cellSize, cellSize) {
    //console.log("terrainMap: " + terrainMap);
    console.log("terrainMap: " + terrainMap.length);
  
    ctx.clearRect(0, 0, minimapCanvas.width, minimapCanvas.height); // Clear the canvas
  
    for (let y = 0; y < terrainMap.length; y++) {
      for (let x = 0; x < terrainMap[y].length; x++) {
        if (terrainMap[y][x] !== WATER_SHADES[0]) {
          const cellX = x * cellSize;
          const cellY = y * cellSize;
  
          // Choose the color based on your LAND_SHADES array
          const color =
            LAND_SHADES[Math.floor(Math.random() * LAND_SHADES.length)];
  
          ctx.fillStyle = color;
          ctx.fillRect(cellX, cellY, cellSize, cellSize);
        }
      }
    }
  }