// Hunter profession behaviors
// This file contains all the logic for hunter NPCs

// State machine for hunter behavior
function updateHunter(npc) {
  switch (npc.state) {
    case "idle":
      npc.transitionTo("findingPrey");
      break;
      
    case "findingPrey":
      const prey = findNearestPrey(npc);
      if (prey) {
        npc.currentPath = findPathTo(npc, prey);
        npc.pathIndex = 0;
        npc.stateData.targetPrey = prey;
        npc.transitionTo("huntingPrey");
      } else {
        npc.transitionTo("idle");
      }
      break;
      
    case "huntingPrey":
      if (followPath(npc)) {
        // Path completed, we're close enough to kill
        npc.transitionTo("killing");
        npc.waitTime = npc.maxWaitTime;
        if (npc.stateData.targetPrey) {
          npc.stateData.targetPreyIndex = animals.indexOf(npc.stateData.targetPrey);
        }
      }
      break;
      
    case "killing":
      if (npc.waitTime > 0) {
        npc.waitTime--;
        
        // Add visual feedback for killing (hunting animation)
        if (npc.waitTime % 2 === 0) {
          npc.animationState = "hunting";
        } else {
          npc.animationState = "normal";
        }
        
        // Kill the prey when halfway through the animation
        if (npc.waitTime === Math.floor(npc.maxWaitTime / 2) && npc.stateData.targetPreyIndex !== undefined) {
          const prey = npc.stateData.targetPrey;
          if (prey && prey.isAlive) {
            prey.isAlive = false;
            huntedAnimalsCount++;
            
            // Add meat to personal inventory
            npc.addToInventory('meat');
            
            document.getElementById("huntCount").textContent = huntedAnimalsCount;
            prey.animateEmoji('fade', '🥩', 1500);
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
        npc.transitionTo("findingPrey");
      }
      break;
  }
}

// Helper function to find nearest prey
function findNearestPrey(npc) {
  let nearestPrey = null;
  let minDistance = Infinity;
  
  animals.forEach(animal => {
    if (!animal.isAlive || animal.isPredator) return;
    
    const animalX = Math.floor(animal.x / cellSize);
    const animalY = Math.floor(animal.y / cellSize);
    
    const npcX = Math.floor(npc.x / cellSize);
    const npcY = Math.floor(npc.y / cellSize);
    
    const distance = Math.sqrt(
      Math.pow(animalX - npcX, 2) + 
      Math.pow(animalY - npcY, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestPrey = {
        x: animalX,
        y: animalY,
        originalPrey: animal
      };
    }
  });
  
  return nearestPrey;
}

// Draw hunter info based on state
function drawHunterInfo(npc, ctx) {
  let infoText = "";
  
  switch (npc.state) {
    case "idle": 
      infoText = "🔍 Idle"; 
      break;
    case "findingPrey": 
      infoText = "🔍 Finding prey"; 
      break;
    case "huntingPrey": 
      infoText = "🏹 Hunting"; 
      break;
    case "killing": 
      infoText = "⚔️ Killing"; 
      break;
    case "findingHome": 
      infoText = "🔍 Finding home"; 
      break;
    case "movingToHome": 
      infoText = "To home"; 
      break;
    case "restingAtHome": 
      infoText = "🏠 Resting"; 
      break;
    default: 
      infoText = npc.state;
  }
  
  // Additional info - meat count
  const additionalInfo = {
    text: `🥩: ${npc.inventory.filter(item => item === 'meat').length}`
    // No need to specify color - NPC class will handle it
  };
  
  // Progress bar for killing or resting
  let progressBar = null;
  if ((npc.state === "killing" || npc.state === "restingAtHome") && npc.waitTime > 0) {
    progressBar = {
      progress: npc.waitTime / npc.maxWaitTime,
      width: 20,
      color: npc.state === "killing" ? "red" : "purple",
      bgColor: "rgba(0, 0, 0, 0.3)"
    };
  }
  
  // Call the common NPC method for displaying info
  npc.drawInfoText(ctx, infoText, additionalInfo, progressBar);
} 