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
    case "findingPrey": 
      text = "🔍 Finding prey"; 
      bgColor = "rgba(152, 251, 152, 0.7)";
      break;
    case "huntingPrey": 
      text = "🏹 Hunting"; 
      bgColor = "rgba(135, 206, 250, 0.7)";
      break;
    case "killing": 
      text = "⚔️ Killing"; 
      bgColor = "rgba(255, 165, 0, 0.7)";
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
  
  if ((npc.state === "killing" || npc.state === "restingAtHome") && npc.waitTime > 0) {
    const maxWidth = 20;
    const progress = npc.waitTime / npc.maxWaitTime;
    const barWidth = maxWidth * progress;
    
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(npc.x - maxWidth/2, npc.y - 15, maxWidth, 3);
    
    ctx.fillStyle = npc.state === "killing" ? "red" : "purple";
    ctx.fillRect(npc.x - maxWidth/2, npc.y - 15, barWidth, 3);
  }
} 