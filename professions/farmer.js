// Farmer profession behaviors
// This file contains all the logic for farmer NPCs

// State machine for farmer behavior
function updateFarmer(npc) {
  switch (npc.state) {
    case "idle":
      // First check if we have a farm, if not, try to build one
      const farm = findNearestFarm(npc);
      if (!farm) {
        npc.transitionTo("buildingFarm");
      } else {
        npc.transitionTo("farming");
      }
      break;
      
    case "buildingFarm":
      // Find suitable ground location for farm
      const farmSpot = findFarmLocation(npc);
      if (farmSpot) {
        npc.currentPath = findPathTo(npc, farmSpot);
        npc.pathIndex = 0;
        npc.stateData.farmSpot = farmSpot;
        npc.transitionTo("movingToFarmSpot");
      } else {
        npc.transitionTo("idle");
      }
      break;
      
    case "movingToFarmSpot":
      if (followPath(npc)) {
        npc.transitionTo("constructingFarm");
        npc.waitTime = npc.maxWaitTime * 2; // Farm takes longer to build
      }
      break;
      
    case "constructingFarm":
      if (npc.waitTime > 0) {
        npc.waitTime--;
        npc.animationState = "building";
        
        // Place farm when construction is complete
        if (npc.waitTime === 0) {
          const spot = npc.stateData.farmSpot;
          // Check if Farm class exists
          if (typeof Farm === 'undefined') {
            console.error("Farm class is not defined. Ensure buildings/farm.js is loaded before farmer.js");
            npc.transitionTo("idle");
            return;
          }
          
          const farm = new Farm(spot.x, spot.y, cellSize, npc);
          buildings.push(farm);
          npc.stateData.currentFarm = farm;
          colorAdjacentCells(spot.x, spot.y, 'yellow');
          npc.transitionTo("farming");
        }
      }
      break;
      
    case "farming":
      if (!npc.stateData.farmingTime) {
        npc.stateData.farmingTime = 0;
      }
      
      npc.stateData.farmingTime++;
      npc.animationState = "farming";
      
      // Every 100 ticks, produce rice
      if (npc.stateData.farmingTime % 100 === 0) {
        npc.addToInventory('rice');
        if (npc.stateData.currentFarm) {
          npc.stateData.currentFarm.animateEmoji('bounce', '🌾', 1000);
        }
      }
      break;
  }
}

// Helper function to find nearest farm
function findNearestFarm(npc) {
  let nearestFarm = null;
  let minDistance = Infinity;
  
  // Ensure buildings array exists
  if (!window.buildings) {
    window.buildings = [];
    console.warn("Created missing buildings array");
  }
  
  buildings.forEach(building => {
    if (building instanceof Farm) {
      const buildingX = Math.floor(building.x / cellSize);
      const buildingY = Math.floor(building.y / cellSize);
      
      const npcX = Math.floor(npc.x / cellSize);
      const npcY = Math.floor(npc.y / cellSize);
      
      const distance = Math.sqrt(
        Math.pow(buildingX - npcX, 2) + 
        Math.pow(buildingY - npcY, 2)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestFarm = building;
      }
    }
  });
  
  return nearestFarm;
}

// Helper function to find suitable farm location
function findFarmLocation(npc) {
  // Look for ground cells with enough space around them
  for (const groundCell of groundCells) {
    const x = groundCell.x;
    const y = groundCell.y;
    
    // Check if there's enough space for farming (8 adjacent cells)
    const hasSpace = checkAdjacentCells(x, y);
    if (hasSpace) {
      return { x, y };
    }
  }
  return null;
}

// Helper function to check if there's enough space around a cell
function checkAdjacentCells(x, y) {
  const adjacentCells = [
    {x: x-1, y: y-1}, {x: x, y: y-1}, {x: x+1, y: y-1},
    {x: x-1, y: y},                    {x: x+1, y: y},
    {x: x-1, y: y+1}, {x: x, y: y+1}, {x: x+1, y: y+1}
  ];
  
  return adjacentCells.every(cell => 
    groundCells.some(ground => 
      ground.x === cell.x && ground.y === cell.y
    )
  );
}

// Helper function to color adjacent cells
function colorAdjacentCells(x, y, color) {
  const adjacentCells = [
    {x: x-1, y: y-1}, {x: x, y: y-1}, {x: x+1, y: y-1},
    {x: x-1, y: y},                    {x: x+1, y: y},
    {x: x-1, y: y+1}, {x: x, y: y+1}, {x: x+1, y: y+1}
  ];
  
  adjacentCells.forEach(cell => {
    const groundCell = groundCells.find(g => g.x === cell.x && g.y === cell.y);
    if (groundCell) {
      groundCell.color = color;
    }
  });
}

// Draw farmer info based on state
function drawFarmerInfo(npc, ctx) {
  const font = "12px Arial";
  const fillColor = "black";
  
  ctx.font = font;
  ctx.fillStyle = fillColor;
  ctx.textAlign = "center";
  
  let text = "";
  let bgColor = "rgba(255, 255, 255, 0.7)";
  
  switch (npc.state) {
    case "idle": 
      text = "🔍 Idle"; 
      bgColor = "rgba(200, 200, 200, 0.7)";
      break;
    case "buildingFarm": 
      text = "🏗️ Building farm"; 
      bgColor = "rgba(152, 251, 152, 0.7)";
      break;
    case "movingToFarmSpot": 
      text = "To farm spot"; 
      bgColor = "rgba(135, 206, 250, 0.7)";
      break;
    case "constructingFarm": 
      text = "🏗️ Constructing"; 
      bgColor = "rgba(255, 165, 0, 0.7)";
      break;
    case "farming": 
      text = "🌾 Farming"; 
      bgColor = "rgba(255, 255, 0, 0.7)";
      break;
    default: 
      text = npc.state;
  }
  
  const textWidth = ctx.measureText(text).width;
  const padding = 4;
  ctx.fillStyle = bgColor;
  ctx.fillRect(npc.x - textWidth/2 - padding, npc.y - 35, textWidth + padding*2, 16);
  
  ctx.fillStyle = "white";
  ctx.fillText(text, npc.x, npc.y - 25);
  ctx.fillStyle = fillColor;
  ctx.fillText(text, npc.x, npc.y - 24);
  
  if (npc.state === "constructingFarm" && npc.waitTime > 0) {
    const maxWidth = 20;
    const progress = npc.waitTime / npc.maxWaitTime;
    const barWidth = maxWidth * progress;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(npc.x - maxWidth/2, npc.y - 15, maxWidth, 3);
    
    ctx.fillStyle = "orange";
    ctx.fillRect(npc.x - maxWidth/2, npc.y - 15, barWidth, 3);
  }
} 