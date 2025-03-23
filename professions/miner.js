// Miner profession behaviors
// This file contains all the logic for miner NPCs

// State machine for miner behavior
function updateMiner(npc) {
  switch (npc.state) {
    case "idle":
      npc.setState("mining");
      break;
      
    case "mining":
      // If we don't have a path or target ore, find one
      if (!npc.currentPath || !npc.stateData.targetOre) {
        const ore = findNearestOre(npc);
        if (ore) {
          npc.currentPath = findPathTo(npc, ore);

          //log the result of findPathTo, if failed / null or empty or not empty!
          if (npc.currentPath === null || npc.currentPath.length === 0) {
            console.warn(`${npc.name} failed to find a path to the ore`);
          } else {
            console.warn(`❤❤❤❤❤❤${npc.name} found a path to the ore`);
          }
          npc.pathIndex = 0;
          npc.stateData.targetOre = ore;
        } else {
          // No ore found, go idle
          npc.setState("idle");
          break;
        }
      }
      
      // Follow the path to the ore
      if (followPath(npc)) {
        npc.waitTime = npc.maxWaitTime;
        if (npc.stateData.targetOre) {
          // Store the ore index for animation later
          const oreIndex = oreDeposits.indexOf(npc.stateData.targetOre.originalOre);
          if (oreIndex !== -1) {
            npc.stateData.targetOreIndex = oreIndex;
          }
        }
        npc.setState("activelyMining");
      }
      break;
      
    case "activelyMining":
      if (npc.waitTime > 0) {
        npc.waitTime--;
        
        // Add visual feedback for mining (mining animation)
        if (npc.waitTime % 2 === 0) {
          npc.animationState = "mining";
        } else {
          npc.animationState = "normal";
        }
        
        // Start ore animation when we're about halfway through mining
        if (npc.waitTime === Math.floor(npc.maxWaitTime / 2) && npc.stateData.targetOreIndex !== undefined) {
          // If you have an ore animation function, call it here
          if (typeof mineOreAnimation === 'function') {
            mineOreAnimation(npc.stateData.targetOreIndex, () => {
              // Add ore to inventory
              npc.addToInventory('ore', 1);
            });
          } else {
            // No animation function, just add ore to inventory
            npc.addToInventory('ore', 1);
          }
        }
      } else {
        npc.animationState = "normal";
        // Clear the current path and target ore
        npc.currentPath = null;
        npc.stateData.targetOre = null;
        npc.setState("returningHome");
      }
      break;
      
    case "returningHome":
      // If we don't have a path or target home, find one
      if (!npc.currentPath || !npc.stateData.targetHome) {
        const home = findNearestHome(npc);
        if (home) {
          npc.currentPath = findPathTo(npc, home);
          npc.pathIndex = 0;
          npc.stateData.targetHome = home;
        } else {
          // No homes found, go back to mining
          npc.setState("mining");
          break;
        }
      }
      
      // Follow the path to home
      if (followPath(npc)) {
        npc.waitTime = npc.maxWaitTime / 2; // Rest for half the time of mining
        npc.animationState = "sleeping";
        npc.setState("resting");
        
        // Clear the current path and target home
        npc.currentPath = null;
        npc.stateData.targetHome = null;
      }
      break;
      
    case "resting":
      if (npc.waitTime > 0) {
        npc.waitTime--;
      } else {
        npc.animationState = "normal";
        npc.setState("mining"); // Go back to mining
      }
      break;
  }
}

// Helper function to find nearest ore deposit
function findNearestOre(npc) {
  let nearestOre = null;
  let minDistance = Infinity;
  
  // Check if oreDeposits exists and has elements
  if (typeof oreDeposits === 'undefined' || !oreDeposits || !Array.isArray(oreDeposits) || oreDeposits.length === 0) {
    console.warn(`findNearestOre: ${npc.name} - oreDeposits is undefined or empty`);
    return null;
  }
  
  oreDeposits.forEach(ore => {
    if (!ore || ore.resources <= 0) return; // Skip undefined or depleted deposits
    
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
  
  if (!nearestOre) {
    console.warn(`findNearestOre: ${npc.name} - No valid ore deposits found`);
  }
  
  return nearestOre;
}

// Draw miner info based on state
function drawMinerInfo(npc, ctx) {
  // Variables always at the top
  const font = "12px Arial";
  const fillColor = "black";
  
  ctx.font = font;
  ctx.fillStyle = fillColor;
  ctx.textAlign = "center";
  
  // Determine text based on current state
  let text = "";
  let bgColor = "rgba(255, 255, 255, 0.7)"; // Default background
  
  switch (npc.state) {
    case "idle": 
      text = "🔍 Idle"; 
      bgColor = "rgba(200, 200, 200, 0.7)"; // Gray
      break;
    case "mining": 
      text = "⛏️ To ore"; 
      bgColor = "rgba(135, 206, 250, 0.7)"; // Light blue
      break;
    case "activelyMining": 
      text = "⛏️ Mining"; 
      bgColor = "rgba(255, 165, 0, 0.7)"; // Orange
      break;
    case "returningHome": 
      text = "🏠 To home"; 
      bgColor = "rgba(135, 206, 250, 0.7)"; // Light blue
      break;
    case "resting": 
      text = "😴 Resting"; 
      bgColor = "rgba(221, 160, 221, 0.7)"; // Plum
      break;
    default: 
      text = npc.state;
  }
  
  // Draw a background for the text
  const textWidth = ctx.measureText(text).width;
  const padding = 4;
  ctx.fillStyle = bgColor;
  ctx.fillRect(npc.x - textWidth/2 - padding, npc.y - 35, textWidth + padding*2, 16);
  
  // Draw a text shadow
  ctx.fillStyle = "white";
  ctx.fillText(text, npc.x, npc.y - 25);
  ctx.fillStyle = fillColor;
  ctx.fillText(text, npc.x, npc.y - 24);
  
  // If waiting, show a progress bar
  if ((npc.state === "activelyMining" || npc.state === "resting") && npc.waitTime > 0) {
    const maxWidth = 20;
    const progress = npc.waitTime / npc.maxWaitTime;
    const barWidth = maxWidth * progress;
    
    // Draw background bar
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(npc.x - maxWidth/2, npc.y - 15, maxWidth, 3);
    
    // Draw progress
    ctx.fillStyle = npc.state === "activelyMining" ? "orange" : "purple";
    ctx.fillRect(npc.x - maxWidth/2, npc.y - 15, barWidth, 3);
  }
} 