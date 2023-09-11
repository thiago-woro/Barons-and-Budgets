
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



  //logs map to console
function logMap(terrainMap) {
  const landSymbol = "🟫";
  const waterSymbol = "🟦";
  for (let y = 0; y < terrainMap.length; y++) {
    let row = "";
    for (let x = 0; x < terrainMap[y].length; x++) {
      if (terrainMap[y][x] === WATER_SHADES[0]) {
        row += waterSymbol;
      } else {
        row += landSymbol;
      }
    }
    console.log(row);
  }
}






function animateWater() {
  for (let cell of waterCells) {
    let currentShadeIndex = WATER_SHADES.indexOf(cell.color);
    let nextShadeIndex = (currentShadeIndex + 1) % WATER_SHADES.length;
    cell.color = WATER_SHADES[nextShadeIndex];
  }

  // Redraw water layer
  drawTerrainLayer(waterCtx, waterCells, cellSize);
}
//setInterval(animateWater, 3000);  // Call animateWater() every 1000 milliseconds (1 second)







function drawValidCells(ctx, validCells) {
  // Loop through the array of valid cells and draw each one
  validCells.forEach((cell) => {
    const x = cell.x * cellSize;
    const y = cell.y * cellSize;

    // Draw a square or any shape at this position
    ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
    ctx.fillRect(x, y, cellSize, cellSize);
  });

  console.log(
    `Finished drawing %c${validCells.length} %cvalid cells.`,
    "font-weight: bold; color: green;",
    "font-weight: normal; color: inherit;"
  );
}

drawValidCellsButton.addEventListener("click", function () {
  console.log(validCells, cellSize, cellSize);
  drawValidCells(validCellsCtx, validCells);
});

