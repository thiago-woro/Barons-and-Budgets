let cellSize = 10;
var gridSize = 90;
let npcs = [];

function setupCanvas(canvasId, width, height) {
  const canvas = document.getElementById(canvasId);
  const ctx = canvas.getContext("2d");

  canvas.width = width; // Set canvas width to the specified width
  canvas.height = height; // Set canvas height to the specified height

  return [canvas, ctx];
}

const container = document.getElementById("canvas-content");
const containerWidth = container.offsetWidth; // Use offsetWidth instead of container
const containerHeight = container.offsetHeight; // Use offsetHeight instead of container

const [npcCanvas, npcCtx] = setupCanvas(
  "npcCanvas",
  containerWidth,
  containerHeight
);
const [groundCanvas, groundCtx] = setupCanvas(
  "groundCanvas",
  containerWidth,
  containerHeight
);

const [waterCanvas, waterCtx] = setupCanvas(
  "waterCanvas",
  containerWidth,
  containerHeight
);


const [treeCanvas, treeCtx] = setupCanvas(
  "treeCanvas",
  containerWidth,
  containerHeight
);

const [boatCanvas, boatCtx] = setupCanvas(
  "boatCanvas",
  containerWidth,
  containerHeight
);

const [minimapCanvas, minimapCtx] = setupCanvas(
  "minimap",
  containerWidth,
  containerHeight
);

const [pathCanvas, pathCtx] = setupCanvas(
  "path",
  containerWidth,
  containerHeight
);

let terrainGrid;


let perlinNoiseScale = 0.03; //original number is 0.025

let offset = 0.55; //og is 0.35
let noiseValues = [];
let terrainMap = [];
let groundCells = [];
let waterCells = [];
let trees = [];
let usableLand = 0.3



var SAND = "#b0ad58";

var WATER_SHADES = [
  "#b9e0fa",
  "#9ecbf3",
  "#7ab3e9",
  "#5c91d1",
  "#4b7cb8",
  "#4173b0",
  "#3d76b",
  "#6b9bbf",
  "#5690b7",
];
var LAND_SHADES = [
  "#e0cd77",
  "#9ac558",
  "#88b14b",
  "#759e42",
  "#648a3b",
  "#547637",
  "#7fbf6e",
  "#6bb556",
  "#5aa748",
];

document.getElementById("gen2").addEventListener("click", async function () {
  await generateTerrainMap(gridSize, gridSize, perlinNoiseScale);
});

console.log(
  `ground cells: ${groundCells.length}, water cells: ${waterCells.length}`
);

function generateTerrainMap(width, height, noiseScale) {
  console.log("Running generateTerrainMap() in mapGen.js");

   // Clear arrays and variables from previous run
   waterCells = [];
   groundCells = [];
    trees = [];

  // Initialize variables
  const perlinInstance = Object.create(perlin);
  terrainMap = new Array(height);
  noiseValues = new Array(height);

  // Reseed the Perlin noise generator
  perlin.seed();

  for (let y = 0; y < height; y++) {
    terrainMap[y] = new Array(width);
    noiseValues[y] = new Array(width); // Initialize noiseValues for this row

    for (let x = 0; x < width; x++) {
      const noiseValue =
        perlinInstance.get(x * noiseScale, y * noiseScale) - 0.5 + offset;

      // Store the noise value
      noiseValues[y][x] = noiseValue;

      // Determine terrain type based on noise value
      let shadeIndex;
      if (noiseValue < 0) {
        shadeIndex = Math.floor(-noiseValue * WATER_SHADES.length);
        terrainMap[y][x] = WATER_SHADES[shadeIndex];
        waterCells.push({ x, y, color: WATER_SHADES[shadeIndex] }); // Store color here
      } else {
        shadeIndex = Math.floor(noiseValue * LAND_SHADES.length);
        terrainMap[y][x] = LAND_SHADES[shadeIndex];
        if (noiseValue > 0) {
          groundCells.push({ x, y, color: LAND_SHADES[shadeIndex] }); // Store color here
        }
      }
    }
  }
  console.log(
    `2) ground cells: ${groundCells.length}, water cells: ${waterCells.length}`
  );

  // Calculate the total number of cells
  const totalCells = groundCells.length + waterCells.length;
  maxPop = groundCells.length * usableLand;
  console.log(`Total cells generated: `, totalCells);
  console.log(`Max pop.: `, maxPop);


  // Call the modified function to draw ground and water cells
  drawTerrainLayer(groundCtx, groundCells, cellSize);
  drawTerrainLayer(waterCtx, waterCells, cellSize);
  startTrees(treeCtx, cellSize);
  //debugTerrain(npcCtx, gridSize, cellSize);
}
function drawTerrainLayer(ctx, cellArray, cellSize) {
  // Clear the canvas
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  for (const cell of cellArray) {
    const x = cell.x;
    const y = cell.y;
    const color = cell.color;

    //console.log(`cell  X: ${cell.x}, Y: ${cell.y}, ${cell.color}`)

    drawRoundedRect(
      ctx,
      x * cellSize,
      y * cellSize,
      cellSize * 1.2,
      cellSize * 1.2,
      3.5,
      color
    );
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

// Call fn to generate the terrain map with Perlin noise
var generatedMap = generateTerrainMap(gridSize, gridSize, perlinNoiseScale);

//2 step

// Assuming terrainMap is already generated
const landSymbol = "🟫";
const waterSymbol = "🟦";

//logs map to console
function logMap(terrainMap) {
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
//logMap(terrainMap);

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

function drawRoundedRect(ctx, x, y, width, height, borderRadius, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(x + borderRadius, y);
  ctx.lineTo(x + width - borderRadius, y);
  ctx.arc(
    x + width - borderRadius,
    y + borderRadius,
    borderRadius,
    -Math.PI / 2,
    0
  );
  ctx.lineTo(x + width, y + height - borderRadius);
  ctx.arc(
    x + width - borderRadius,
    y + height - borderRadius,
    borderRadius,
    0,
    Math.PI / 2
  );
  ctx.lineTo(x + borderRadius, y + height);
  ctx.arc(
    x + borderRadius,
    y + height - borderRadius,
    borderRadius,
    Math.PI / 2,
    Math.PI
  );
  ctx.lineTo(x, y + borderRadius);
  ctx.arc(
    x + borderRadius,
    y + borderRadius,
    borderRadius,
    Math.PI,
    -Math.PI / 2
  );
  ctx.closePath();
  ctx.fill();
}

/* 
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
 */


clearGround.addEventListener("click", function () { //DO NO DELETE
clearCanvas(groundCtx); // Clears the ground canvas
clearCanvas(waterCtx); // Clears the water canvas
clearCanvas(treeCtx); // Clears the tree canvas
});
function clearCanvas(ctx) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}







/// FOR DEBUGGING ONLY - DO NOT DELETE
function debugTerrain(ctx, gridSize, cellSize) {
  ctx.fillStyle = "black";
  ctx.textAlign = "center";
  ctx.font = "18px Arial";

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const cellIndex = row * gridSize + col;
      const x = col * cellSize + cellSize / 2;
      const y = row * cellSize + cellSize / 2;

      // Draw a low-opacity red rectangle behind the number
      ctx.fillStyle = "rgba(255, 0, 0, 0.0)";
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);

      // Draw the number on top of the rectangle
      ctx.fillStyle = "black";

      ctx.fillText(cellIndex, x, y);
    }
  }

  console.log("Finished drawing terrain with indices");
}

// Function to clear npcs array and npcCanvas
function clearNPC() {
  // Clear the npcs array
  npcs = [];

  // Clear the npcCanvas
  npcCtx.clearRect(0, 0, npcCanvas.width, npcCanvas.height);
  groundCtx.clearRect(0, 0, npcCanvas.width, npcCanvas.height);
  waterCtx.clearRect(0, 0, npcCanvas.width, npcCanvas.height);
}

function startTrees(ctx, cellSize) {
  clearCanvas(treeCtx);
  trees = [];
  let treeCount = 0;

  const treeEmojis = ["🌳", "🌲", "🌴", "🌳", "🌵"];

  treeCount = groundCells.length * 0.01;
  console.log("will draw " + treeCount.toFixed(0) + " trees");

  for (let i = 0; i < treeCount && groundCells.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * groundCells.length);
    const selectedCell = groundCells.splice(randomIndex, 1)[0];

    const randomEmojiIndex = Math.floor(Math.random() * treeEmojis.length);
    const selectedEmoji = treeEmojis[randomEmojiIndex];

    const x = selectedCell.x * cellSize;
    const y = selectedCell.y * cellSize;

    // Store tree information
    trees.push({ x, y, emoji: selectedEmoji });

    // Draw shadow
    ctx.beginPath();
    ctx.arc(x, y + 5, 7, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fill();

    // Draw tree
    ctx.fillStyle = "rgba(0, 0, 0, 1)";
    ctx.textAlign = "center";
    ctx.font = "bold 20px Arial";
    ctx.fillText(selectedEmoji, x, y);
  }

  //debugger to show cell index
  //debugTerrain(npcCtx, gridSize, cellSize)
}

const infoPanel = document.getElementById("infoPanel");

function showNPCInfo(npc) {
  infoPanel.style.left = `${npc.x}px`;
  infoPanel.style.top = `${npc.y}px`;
  infoPanel.style.display = "block";
  infoPanel.innerHTML = `
    <strong>Name:</strong> ${npc.name}<br/>
    <strong>Age:</strong> ${npc.age}<br/>
    <strong>Sex:</strong> ${npc.sex}<br/>
  `;
}

npcCanvas.addEventListener("mousemove", function (event) {
  const rect = npcCanvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  let foundNPC = false;
  for (const npc of npcs) {
    const distance = Math.sqrt((x - npc.x) ** 2 + (y - npc.y) ** 2);
    if (distance < 10) {
      // Adjust the value based on your needs
      showNPCInfo(npc);
      foundNPC = true;
      break;
    }
  }
  if (!foundNPC) {
    infoPanel.style.display = "none";
  }
});

function showCellnumber(ctx, gridSize, cellSize) {
  ctx.font = "12px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const cellsInRow = Math.floor(ctx.canvas.width / cellSize);

  for (let row = 0; row < gridSize / cellSize; row++) {
    for (let col = 0; col < gridSize / cellSize; col++) {
      const cellIndex = row * cellsInRow + col;
      const x = col * cellSize + cellSize / 2;
      const y = row * cellSize + cellSize / 2;

      // Draw a low-opacity red rectangle behind the number
      ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
      ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);

      // Draw the number on top of the rectangle
      ctx.fillStyle = "black";
      ctx.fillText(cellIndex, x, y);
    }
  }
}

