// Woodcutter profession behaviors
// This file contains all the logic for woodcutter NPCs

// State machine for woodcutter behavior
function updateWoodcutter(npc) {
 
  switch (npc.state) {
    case "idle":
      npc.transitionTo("findingTree");
      break;
      
    case "findingTree":
      const tree = findNearestTree(npc);
      if (tree) {
       // console.log(`woodcutter: ${npc.name} found tree at ${tree.x}, ${tree.y}`);
        npc.currentPath = findPathTo(npc, tree);
        npc.pathIndex = 0;
        npc.stateData.targetTree = tree;
        npc.transitionTo("movingToTree");
      } else {
       // console.log(`woodcutter: ${npc.name} couldn't find any trees!`);
        npc.transitionTo("idle");
      }
      break;
      
    case "movingToTree":
      if (followPath(npc)) {
        // Path completed
        npc.transitionTo("cuttingTree");
        npc.waitTime = npc.maxWaitTime;
        // Store the tree index for animation later
        if (npc.stateData.targetTree && npc.stateData.targetTree.originalTree) {
          const treeIndex = treePositions.indexOf(npc.stateData.targetTree.originalTree);
          if (treeIndex !== -1) {
            npc.stateData.targetTreeIndex = treeIndex;
          }
        }
      }
      break;
      
    case "cuttingTree":
      if (npc.waitTime > 0) {
        npc.waitTime--;
        
        // Add visual feedback for tree cutting (chopping animation)
        if (npc.waitTime % 2 === 0) {
          // Alternate between normal position and "chopping" position
          npc.animationState = "chopping";
        } else {
          npc.animationState = "normal";
        }
        
        // Start tree animation when we're about halfway through cutting
        // This ensures the tree falls as the woodcutter is still chopping
        if (npc.waitTime === Math.floor(npc.maxWaitTime / 2) && npc.stateData.targetTreeIndex !== undefined) {
          dyingTreeAnimation(npc.stateData.targetTreeIndex, () => {
            //add wood to the wood count
            elfWoodCount += 1;
            
            // Add wood to personal inventory
            npc.addToInventory('wood');

            //log total amount of trees on the map
            console.log(`Total trees remaining on map: ${treePositions.length}`);

            //update the wood count display
            document.getElementById("woodCount").textContent = elfWoodCount + "/ " + treePositions.length;
          });
        }
      } else {
        npc.animationState = "normal"; // Reset animation state
        // Tree has already been removed by the animation
        npc.transitionTo("findingHome");
      }
      break;
      
    case "findingHome":
      const home = findNearestHome(npc);
      if (home) {
       // console.log(`woodcutter: ${npc.name} found home at ${home.x}, ${home.y}`);
        npc.currentPath = findPathTo(npc, home);
        npc.pathIndex = 0;
        npc.stateData.targetHome = home;
        npc.transitionTo("movingToHome");
      } else {
      //  console.log(`woodcutter: ${npc.name} couldn't find any homes!`);
        npc.transitionTo("idle");
      }
      break;
      
    case "movingToHome":
      if (followPath(npc)) {
        // Path completed
        npc.transitionTo("restingAtHome");
        npc.waitTime = npc.maxWaitTime;
      }
      break;
      
    case "restingAtHome":
      if (npc.waitTime > 0) {
        npc.waitTime--;
        
        // Add visual feedback for resting (sleeping animation)
        npc.animationState = "sleeping";
      } else {
        npc.animationState = "normal"; // Reset animation state
        npc.transitionTo("findingTree");
      }
      break;
  }
}

// Draw woodcutter info based on state
function drawWoodcutterInfo(npc, ctx) {
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
    case "findingTree": 
      text = "🔍 Finding tree"; 
      bgColor = "rgba(152, 251, 152, 0.7)"; // Pale green
      break;
    case "movingToTree": 
      text = "🚶 To tree"; 
      bgColor = "rgba(135, 206, 250, 0.7)"; // Light blue
      break;
    case "cuttingTree": 
      text = "🪓 Cutting"; 
      bgColor = "rgba(255, 165, 0, 0.7)"; // Orange
      break;
    case "findingHome": 
      text = "🔍 Finding home"; 
      bgColor = "rgba(152, 251, 152, 0.7)"; // Pale green
      break;
    case "movingToHome": 
      text = "🚶 To home"; 
      bgColor = "rgba(135, 206, 250, 0.7)"; // Light blue
      break;
    case "restingAtHome": 
      text = "🏠 Resting"; 
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
  if ((npc.state === "cuttingTree" || npc.state === "restingAtHome") && npc.waitTime > 0) {
    const maxWidth = 20;
    const progress = npc.waitTime / npc.maxWaitTime;
    const barWidth = maxWidth * progress;
    
    // Draw background bar
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(npc.x - maxWidth/2, npc.y - 15, maxWidth, 3);
    
    // Draw progress
    ctx.fillStyle = npc.state === "cuttingTree" ? "orange" : "purple";
    ctx.fillRect(npc.x - maxWidth/2, npc.y - 15, barWidth, 3);
  }
} 