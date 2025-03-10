// Fisher profession behaviors
// This file contains all the logic for fisher NPCs

// State machine for fisher behavior
function updateFisher(npc) {
  switch (npc.state) {
    case "idle":
      // First check if we have a harbor, if not, try to build one
      const harbor = findNearestHarbor(npc);
      if (!harbor) {
        npc.transitionTo("buildingHarbor");
      } else {
        npc.transitionTo("findingFishSpot");
      }
      break;
      
    case "buildingHarbor":
      // Find suitable water edge location for harbor
      const harborSpot = findHarborLocation(npc);
      if (harborSpot) {
        npc.currentPath = findPathTo(npc, harborSpot);
        npc.pathIndex = 0;
        npc.stateData.harborSpot = harborSpot;
        npc.transitionTo("movingToHarborSpot");
      } else {
        npc.transitionTo("idle");
      }
      break;
      
    case "movingToHarborSpot":
      if (followPath(npc)) {
        npc.transitionTo("constructingHarbor");
        npc.waitTime = npc.maxWaitTime * 2; // Harbor takes longer to build
      }
      break;
      
    case "constructingHarbor":
      if (npc.waitTime > 0) {
        npc.waitTime--;
        npc.animationState = "building";
        
        // Place harbor when construction is complete
        if (npc.waitTime === 0) {
          const spot = npc.stateData.harborSpot;
          buildings.push(new Harbor(spot.x, spot.y, cellSize, npc));
          npc.transitionTo("findingFishSpot");
        }
      }
      break;
      
    case "findingFishSpot":
      const fishSpot = findFishingSpot(npc);
      if (fishSpot) {
        npc.currentPath = findPathTo(npc, fishSpot);
        npc.pathIndex = 0;
        npc.stateData.fishSpot = fishSpot;
        npc.transitionTo("movingToFishSpot");
      } else {
        npc.transitionTo("idle");
      }
      break;
      
    case "movingToFishSpot":
      if (followPath(npc)) {
        npc.transitionTo("fishing");
        npc.waitTime = npc.maxWaitTime;
      }
      break;
      
    case "fishing":
      if (npc.waitTime > 0) {
        npc.waitTime--;
        
        // Add visual feedback for fishing
        if (npc.waitTime % 2 === 0) {
          npc.animationState = "fishing";
        } else {
          npc.animationState = "normal";
        }
        
        // Catch fish when halfway through
        if (npc.waitTime === Math.floor(npc.maxWaitTime / 2)) {
          fishCount++;
          
          // Add fish to personal inventory
          npc.addToInventory('fish');
          
          document.getElementById("fishCount").textContent = fishCount;
        }
      } else {
        npc.animationState = "normal";
        npc.transitionTo("findingHome");
      }
      break;
      
    case "findingHome":
      const home = findNearestHome(npc);
      if (home) {
        npc.currentPath = findPathTo(npc, home);
        npc.pathIndex = 0;
        npc.stateData.targetHome = home;
        npc.transitionTo("movingToHome");
      } else {
        npc.transitionTo("idle");
      }
      break;
      
    case "movingToHome":
      if (followPath(npc)) {
        npc.transitionTo("restingAtHome");
        npc.waitTime = npc.maxWaitTime;
      }
      break;
      
    case "restingAtHome":
      if (npc.waitTime > 0) {
        npc.waitTime--;
        npc.animationState = "sleeping";
      } else {
        npc.animationState = "normal";
        npc.transitionTo("findingFishSpot");
      }
      break;
  }
}

// Helper function to find nearest harbor
function findNearestHarbor(npc) {
  let nearestHarbor = null;
  let minDistance = Infinity;
  
  buildings.forEach(building => {
    if (building instanceof Harbor) {
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
        nearestHarbor = building;
      }
    }
  });
  
  return nearestHarbor;
}

// Helper function to find suitable harbor location
function findHarborLocation(npc) {
  // Look for ground cells adjacent to water
  for (const groundCell of groundCells) {
    const x = groundCell.x;
    const y = groundCell.y;
    
    // Check adjacent cells for water
    const hasAdjacentWater = waterCells.some(waterCell => 
      Math.abs(waterCell.x - x) <= 1 && Math.abs(waterCell.y - y) <= 1
    );
    
    if (hasAdjacentWater) {
      return { x, y };
    }
  }
  return null;
}

// Helper function to find fishing spot in water
function findFishingSpot(npc) {
  // Find a water cell near the harbor
  const harbor = findNearestHarbor(npc);
  if (!harbor) return null;
  
  const harborX = Math.floor(harbor.x / cellSize);
  const harborY = Math.floor(harbor.y / cellSize);
  
  // Look for deep water cells within range
  let bestSpot = null;
  let minDistance = Infinity;
  
  waterCells.forEach(cell => {
    const distance = Math.sqrt(
      Math.pow(cell.x - harborX, 2) + 
      Math.pow(cell.y - harborY, 2)
    );
    
    // Find water cells that are not too far from harbor
    if (distance < minDistance && distance > 2 && distance < 10) {
      minDistance = distance;
      bestSpot = { x: cell.x, y: cell.y };
    }
  });
  
  return bestSpot;
}

// Draw fisher info based on state
function drawFisherInfo(npc, ctx) {
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
    case "buildingHarbor": 
      text = "🏗️ Building harbor"; 
      bgColor = "rgba(152, 251, 152, 0.7)";
      break;
    case "movingToHarborSpot": 
      text = "🚶 To harbor spot"; 
      bgColor = "rgba(135, 206, 250, 0.7)";
      break;
    case "constructingHarbor": 
      text = "🏗️ Constructing"; 
      bgColor = "rgba(255, 165, 0, 0.7)";
      break;
    case "findingFishSpot": 
      text = "🔍 Finding fish"; 
      bgColor = "rgba(152, 251, 152, 0.7)";
      break;
    case "movingToFishSpot": 
      text = "🚣 To fishing spot"; 
      bgColor = "rgba(135, 206, 250, 0.7)";
      break;
    case "fishing": 
      text = "🎣 Fishing"; 
      bgColor = "rgba(0, 191, 255, 0.7)";
      break;
    case "findingHome": 
      text = "🔍 Finding home"; 
      bgColor = "rgba(152, 251, 152, 0.7)";
      break;
    case "movingToHome": 
      text = "🚶 To home"; 
      bgColor = "rgba(135, 206, 250, 0.7)";
      break;
    case "restingAtHome": 
      text = "🏠 Resting"; 
      bgColor = "rgba(221, 160, 221, 0.7)";
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
  
  if ((npc.state === "fishing" || npc.state === "constructingHarbor" || npc.state === "restingAtHome") && npc.waitTime > 0) {
    const maxWidth = 20;
    const progress = npc.waitTime / npc.maxWaitTime;
    const barWidth = maxWidth * progress;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(npc.x - maxWidth/2, npc.y - 15, maxWidth, 3);
    
    ctx.fillStyle = npc.state === "fishing" ? "blue" : (npc.state === "constructingHarbor" ? "orange" : "purple");
    ctx.fillRect(npc.x - maxWidth/2, npc.y - 15, barWidth, 3);
  }
} 