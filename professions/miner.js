// Miner profession behaviors
// This file contains all the logic for miner NPCs

// State machine for miner behavior
function updateMiner(npc) {
  switch (npc.state) {
    case "idle":
      npc.transitionTo("findingOre");
      break;
      
    case "findingOre":
      const ore = findNearestOre(npc);
      if (ore) {
        npc.currentPath = findPathTo(npc, ore);
        npc.pathIndex = 0;
        npc.stateData.targetOre = ore;
        npc.transitionTo("movingToOre");
      } else {
        npc.transitionTo("idle");
      }
      break;
      
    case "movingToOre":
      if (followPath(npc)) {
        npc.transitionTo("mining");
        npc.waitTime = npc.maxWaitTime;
        if (npc.stateData.targetOre) {
          npc.stateData.targetOreIndex = oreDeposits.indexOf(npc.stateData.targetOre);
        }
      }
      break;
      
    case "mining":
      if (npc.waitTime > 0) {
        npc.waitTime--;
        
        // Add visual feedback for mining
        if (npc.waitTime % 2 === 0) {
          npc.animationState = "mining";
        } else {
          npc.animationState = "normal";
        }
        
        // Mine ore when halfway through
        if (npc.waitTime === Math.floor(npc.maxWaitTime / 2) && npc.stateData.targetOreIndex !== undefined) {
          const ore = npc.stateData.targetOre;
          if (ore) {
            ore.resources--;
            if (ore.resources <= 0) {
              // Remove depleted ore deposit
              const index = oreDeposits.indexOf(ore);
              if (index !== -1) {
                oreDeposits.splice(index, 1);
              }
            }
            // Increment ore count based on race
            switch(npc.race) {
              case "Elf":
                elfCrystalliteCount++;
                break;
              case "Kurohi":
                kurohiCrystalliteCount++;
                break;
              case "Purries":
                purriesCrystalliteCount++;
                break;
            }
            
            // Add ore to personal inventory
            npc.addToInventory('ore');
            
            // Update display
            document.getElementById("crystalbottomToolBar").textContent = elfCrystalliteCount;
          }
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
        npc.transitionTo("findingOre");
      }
      break;
  }
}

// Helper function to find nearest ore deposit
function findNearestOre(npc) {
  let nearestOre = null;
  let minDistance = Infinity;
  
  oreDeposits.forEach(ore => {
    if (ore.resources <= 0) return; // Skip depleted deposits
    
    const oreX = Math.floor(ore.x / cellSize);
    const oreY = Math.floor(ore.y / cellSize);
    
    const npcX = Math.floor(npc.x / cellSize);
    const npcY = Math.floor(npc.y / cellSize);
    
    const distance = Math.sqrt(
      Math.pow(oreX - npcX, 2) + 
      Math.pow(oreY - npcY, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestOre = {
        x: oreX,
        y: oreY,
        originalOre: ore
      };
    }
  });
  
  return nearestOre;
}

// Draw miner info based on state
function drawMinerInfo(npc, ctx) {
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
    case "findingOre": 
      text = "🔍 Finding ore"; 
      bgColor = "rgba(152, 251, 152, 0.7)";
      break;
    case "movingToOre": 
      text = "To ore"; 
      bgColor = "rgba(135, 206, 250, 0.7)";
      break;
    case "mining": 
      text = "⛏️ Mining"; 
      bgColor = "rgba(255, 165, 0, 0.7)";
      break;
    case "findingHome": 
      text = "🔍 Finding home"; 
      bgColor = "rgba(152, 251, 152, 0.7)";
      break;
    case "movingToHome": 
      text = "To home"; 
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
  
  if ((npc.state === "mining" || npc.state === "restingAtHome") && npc.waitTime > 0) {
    const maxWidth = 20;
    const progress = npc.waitTime / npc.maxWaitTime;
    const barWidth = maxWidth * progress;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(npc.x - maxWidth/2, npc.y - 15, maxWidth, 3);
    
    ctx.fillStyle = npc.state === "mining" ? "brown" : "purple";
    ctx.fillRect(npc.x - maxWidth/2, npc.y - 15, barWidth, 3);
  }
} 