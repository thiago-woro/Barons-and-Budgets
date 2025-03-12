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
  let infoText = "";
  let bgColor = null;
  
  switch (npc.state) {
    case "idle": 
      infoText = "🔍 Idle"; 
      break;
    case "findingOre": 
      infoText = "🔍 Finding ore"; 
      break;
    case "movingToOre": 
      infoText = "To ore"; 
      break;
    case "mining": 
      infoText = "⛏️ Mining"; 
      break;
    case "findingHome": 
      infoText = "🔍 Finding home"; 
      break;
    case "movingToHome": 
      infoText = "To home"; 
      break;
    case "restingAtHome": 
      infoText = "Resting"; 
      break;
    default: 
      infoText = npc.state;
  }
  
  // Additional info - ore count
  const additionalInfo = {
    text: `💎: ${npc.inventory.filter(item => item === 'ore').length}`
    // No need to specify color - NPC class will handle it
  };
  
  // Progress bar for mining or resting
  let progressBar = null;
  if ((npc.state === "mining" || npc.state === "restingAtHome") && npc.waitTime > 0) {
    progressBar = {
      progress: npc.waitTime / npc.maxWaitTime,
      width: 20,
      color: npc.state === "mining" ? "brown" : "purple",
      bgColor: "rgba(0, 0, 0, 0.3)"
    };
  }
  
  // Call the common NPC method for displaying info
  npc.drawInfoText(ctx, infoText, additionalInfo, progressBar);
} 