// Woodcutter profession behaviors
// This file contains all the logic for woodcutter NPCs


/**
 * Finds the nearest tree to an NPC
 * @param {Object} npc - The NPC object
 * @returns {Object|null} - The nearest tree or null if none found
 */

 // Add these helper functions at the top of the file
function manhattan(point1, point2) {
    return Math.abs(point1.x - point2.x) + Math.abs(point1.y - point2.y);
}

function findNearestTree(startX, startY) {
    let nearest = null;
    let minDistance = Infinity;

    // Filter for pine trees only (🌲)
    treePositions.filter(tree => tree.emoji === "🌲").forEach(tree => {
        const distance = manhattan(
            { x: Math.floor(startX/cellSize), y: Math.floor(startY/cellSize) },
            { x: Math.floor(tree.x/cellSize), y: Math.floor(tree.y/cellSize) }
        );
        if (distance < minDistance) {
            minDistance = distance;
            nearest = tree;
        }
    });

    return nearest;
}


function findNearestTree(npc) {
  let nearestTree = null;
  let minDistance = Infinity;
  
  // Check if treePositions exists and has elements
  if (typeof treePositions === 'undefined' || !treePositions || treePositions.length === 0) {
    return null;
  }
  
  treePositions.forEach(tree => {
    // Convert tree coordinates to grid coordinates
    const treeX = Math.floor(tree.x / cellSize);
    const treeY = Math.floor(tree.y / cellSize);
    
    const npcX = Math.floor(npc.x / cellSize);
    const npcY = Math.floor(npc.y / cellSize);
    
    const distance = Math.sqrt(
      Math.pow(treeX - npcX, 2) + 
      Math.pow(treeY - npcY, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestTree = {
        x: treeX,
        y: treeY,
        originalTree: tree
      };
    }
  });
  
  return nearestTree;
}

// Simplified state machine for woodcutter behavior
function updateWoodcutter(npc) {
  // Set canMove flag based on state - woodcutters can't move while actively cutting
  npc.canMove = npc.state !== "activelyCutting";
  
  switch (npc.state) {
    case "idle":
      npc.setState("cuttingTrees");
      break;
      
    case "cuttingTrees":
      // If we don't have a path or target tree, find one
      if (!npc.currentPath || !npc.stateData.targetTree) {
        const tree = findNearestTree(npc);
        if (tree) {
          npc.currentPath = findPathTo(npc, tree);
          npc.pathIndex = 0;
          npc.stateData.targetTree = tree;
        } else {
          // No trees found, go idle
          npc.setState("idle");
          break;
        }
      }
      
      // Follow the path to the tree
      const pathCompleted = followPath(npc);
      
      // If we've reached the tree, start cutting
      if (pathCompleted) {
        npc.waitTime = npc.maxWaitTime;
        
        // Store the tree index for animation later
        if (npc.stateData.targetTree && npc.stateData.targetTree.originalTree) {
          const treeIndex = treePositions.indexOf(npc.stateData.targetTree.originalTree);
          if (treeIndex !== -1) {
            npc.stateData.targetTreeIndex = treeIndex;
          }
        }
        
        // Start the cutting process
        npc.setState("activelyCutting");
        // Explicitly set canMove to false when cutting starts
        npc.canMove = false;
      }
      break;
      
    case "activelyCutting":
      // Ensure NPC doesn't move while cutting
      npc.canMove = false;
      
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
        if (npc.waitTime === Math.floor(npc.maxWaitTime / 2) && npc.stateData.targetTreeIndex !== undefined) {
          dyingTreeAnimation(npc.stateData.targetTreeIndex, () => {
            //add wood to the wood count
            elfWoodCount += 1;

            //update the wood count display
            document.getElementById("woodCount").textContent = elfWoodCount + "/ " + treePositions.length;
          });
        }
      } else {
        npc.animationState = "normal"; // Reset animation state
        // Tree has been cut, go back home
        npc.setState("returningHome");
        
        // Clear the current path and target tree
        npc.currentPath = null;
        npc.stateData.targetTree = null;
        // Allow movement again
        npc.canMove = true;
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
          // No homes found, go back to cutting trees

          console.warn("No homes found, going back to cutting trees");
          npc.setState("idle");
          break;
        }
      }
      
      // Follow the path to home
      const homePathCompleted = followPath(npc);
      
      // If we've reached home, rest briefly then go back to cutting trees
      if (homePathCompleted) {
        npc.waitTime = npc.maxWaitTime / 2; // Rest for half the time of cutting
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
        npc.animationState = "normal"; // Reset animation state
        npc.setState("cuttingTrees"); // Go back to cutting trees
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
    case "cuttingTrees": 
      text = "🌲 To tree"; 
      bgColor = "rgba(135, 206, 250, 0.7)"; // Light blue
      break;
    case "activelyCutting": 
      text = "🪓 Cutting"; 
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
  if ((npc.state === "activelyCutting" || npc.state === "resting") && npc.waitTime > 0) {
    const maxWidth = 20;
    const progress = npc.waitTime / npc.maxWaitTime;
    const barWidth = maxWidth * progress;
    
    // Draw background bar
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(npc.x - maxWidth/2, npc.y - 15, maxWidth, 3);
    
    // Draw progress
    ctx.fillStyle = npc.state === "activelyCutting" ? "orange" : "purple";
    ctx.fillRect(npc.x - maxWidth/2, npc.y - 15, barWidth, 3);
  }
} 