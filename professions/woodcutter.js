// Woodcutter profession behaviors
// This file contains all the logic for woodcutter NPCs



/* 
 // Add these helper functions at the top of the file
function manhattan(point1, point2) {
    return Math.abs(point1.x - point2.x) + Math.abs(point1.y - point2.y);
}

function findNearestPineTreeByCoords(startX, startY) {
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
 */

function findNearestTree(npc) {
  let nearestTree = null;
  let minDistance = Infinity;
  
  // Check if treePositions exists and has elements
  if (typeof treePositions === 'undefined' || !treePositions || treePositions.length === 0) {
    return null;
  }

  // Convert npc world coordinates to grid coordinates
  const npcGridX = Math.floor(npc.x / cellSize);
  const npcGridY = Math.floor(npc.y / cellSize);
  
  console.log(`NPC at Cell X ${npcGridX}, Y ${npcGridY}`);
  
  treePositions.forEach(tree => {
    // Tree positions are already in grid coordinates
    const treeGridX = tree.gridX;
    const treeGridY = tree.gridY;
    
    // Use Manhattan distance for grid-based movement
    const distance = Math.abs(treeGridX - npcGridX) + Math.abs(treeGridY - npcGridY);
    
    if (distance < minDistance) {
      minDistance = distance;
      nearestTree = {
        x: treeGridX * cellSize, // Convert back to world coordinates for pathfinding
        y: treeGridY * cellSize,
        gridX: treeGridX,
        gridY: treeGridY,
        originalTree: tree
      };
    }
  });
  
  if (nearestTree) {
    console.log(`Found nearest tree at Cell X ${nearestTree.gridX}, Y ${nearestTree.gridY}, distance: ${minDistance}`);
  } else {
    console.log(`No trees found within range`);
  }
  
  return nearestTree;
}

// Woodcutter update flow with path finding logging
function updateWoodcutter(npc) {
    // Current state tracking
    console.log(`Woodcutter ${npc.id} (${npc.name}) at Cell X ${npc.x}, Y${npc.y} - State: ${npc.state}`);
    
    // State machine for woodcutter behavior
    switch(npc.state) {
        case 'idle':
            // Find nearest tree and decide to cut it
            const nearestTree = findNearestTree(npc);
            if (nearestTree) {
                npc.targetTree = nearestTree;
                npc.state = 'moving_to_tree';
                console.log(`Woodcutter ${npc.id} found tree at Cell X ${Math.floor(nearestTree.x/cellSize)}, Y${Math.floor(nearestTree.y/cellSize)}`);
            } else {
                console.log(`Woodcutter ${npc.id} couldn't find any trees, remaining idle`);
            }
            break;
            
        case 'moving_to_tree':
            // Path finding to tree
            if (!npc.path || npc.path.length === 0) {
                console.log(`Woodcutter ${npc.id} calculating path to tree at Cell X ${Math.floor(npc.targetTree.x/cellSize)}, Y${Math.floor(npc.targetTree.y/cellSize)}`);
                
                // Convert tree world coordinates to grid coordinates
                const treeGridX = Math.floor(npc.targetTree.x / cellSize);
                const treeGridY = Math.floor(npc.targetTree.y / cellSize);
                
                // Find path using A* algorithm
                npc.path = findPath(
                    {x: npc.x, y: npc.y}, 
                    {x: treeGridX, y: treeGridY}
                );
                
                if (npc.path) {
                    console.log(`Woodcutter ${npc.id} found path to tree with ${npc.path.length} steps`);
                    logPathDetails(npc.path);
                } else {
                    console.log(`Woodcutter ${npc.id} couldn't find path to tree, looking for another tree`);
                    npc.state = 'idle';
                    npc.targetTree = null;
                }
            } else {
                // Move along path
                const nextStep = npc.path.shift();
                console.log(`Woodcutter ${npc.id} moving to Cell X ${nextStep.x}, Y${nextStep.y}`);
                
                // Update position
                npc.x = nextStep.x;
                npc.y = nextStep.y;
                
                // Check if reached tree
                if (npc.path.length === 0) {
                    console.log(`Woodcutter ${npc.id} reached tree location`);
                    npc.state = 'cutting_tree';
                    npc.cuttingProgress = 0;
                }
            }
            break;
            
        case 'cutting_tree':
            // Cutting tree logic
            npc.cuttingProgress += 1;
            if (npc.cuttingProgress >= 10) { // 10 ticks to cut a tree
                console.log(`Woodcutter ${npc.id} finished cutting tree`);
                // Remove tree from world
                removeTree(npc.targetTree);
                // Add wood to inventory
                npc.inventory.wood = (npc.inventory.wood || 0) + 1;
                console.log(`Woodcutter ${npc.id} collected wood, now has ${npc.inventory.wood} wood`);
                
                // Check if inventory is full
                if (npc.inventory.wood >= 5) {
                    npc.state = 'returning_home';
                    console.log(`Woodcutter ${npc.id} inventory full, returning home`);
                } else {
                    npc.state = 'idle';
                    npc.targetTree = null;
                }
            }
            break;
            
        case 'returning_home':
            // Path finding to home
            if (!npc.path || npc.path.length === 0) {
                // Find house associated with this woodcutter
                const home = findHomeForNPC(npc);
                if (home) {
                    console.log(`Woodcutter ${npc.id} calculating path to home at Cell X ${Math.floor(home.x/cellSize)}, Y${Math.floor(home.y/cellSize)}`);
                    
                    // Calculate path to home
                    npc.path = findPath(
                        {x: npc.x, y: npc.y}, 
                        {x: Math.floor(home.x/cellSize), y: Math.floor(home.y/cellSize)}
                    );
                    
                    if (npc.path) {
                        console.log(`Woodcutter ${npc.id} found path to home with ${npc.path.length} steps`);
                        logPathDetails(npc.path);
                    } else {
                        console.log(`Woodcutter ${npc.id} couldn't find path to home, wandering`);
                        npc.state = 'wandering';
                    }
                } else {
                    console.log(`Woodcutter ${npc.id} has no home, wandering`);
                    npc.state = 'wandering';
                }
            } else {
                // Move along path
                const nextStep = npc.path.shift();
                console.log(`Woodcutter ${npc.id} moving to Cell X ${nextStep.x}, Y${nextStep.y}`);
                
                // Update position
                npc.x = nextStep.x;
                npc.y = nextStep.y;
                
                // Check if reached home
                if (npc.path.length === 0) {
                    console.log(`Woodcutter ${npc.id} reached home, depositing ${npc.inventory.wood} wood`);
                    // Deposit wood
                    depositResources(npc);
                    npc.inventory.wood = 0;
                    npc.state = 'resting';
                    npc.restingTime = 0;
                }
            }
            break;
            
        case 'resting':
            // Rest for a while
            npc.restingTime += 1;
            if (npc.restingTime >= 20) { // Rest for 20 ticks
                console.log(`Woodcutter ${npc.id} finished resting, going back to work`);
                npc.state = 'idle';
            }
            break;
            
        case 'wandering':
            // Random movement when lost
            if (!npc.path || npc.path.length === 0) {
                // Generate random valid cell to move to
                const randomCell = findRandomWalkableCell(npc.x, npc.y, 5); // Search within 5 cells radius
                if (randomCell) {
                    console.log(`Woodcutter ${npc.id} wandering to Cell X ${randomCell.x}, Y${randomCell.y}`);
                    npc.path = findPath({x: npc.x, y: npc.y}, randomCell);
                    
                    if (npc.path) {
                        console.log(`Woodcutter ${npc.id} found wandering path with ${npc.path.length} steps`);
                    } else {
                        console.log(`Woodcutter ${npc.id} couldn't find wandering path, remaining still`);
                    }
                }
                
                // After wandering, try to resume normal activities
                npc.state = 'idle';
            } else {
                // Move along path
                const nextStep = npc.path.shift();
                console.log(`Woodcutter ${npc.id} wandering to Cell X ${nextStep.x}, Y${nextStep.y}`);
                npc.x = nextStep.x;
                npc.y = nextStep.y;
            }
            break;
    }
}

// Helper function to log path details
function logPathDetails(path) {
    if (!path || path.length === 0) return;
    
    console.log("Path details:");
    path.forEach((step, index) => {
        console.log(`  Step ${index+1}: Cell X ${step.x}, Y${step.y}`);
    });
}

// Helper to find a home for an NPC
function findHomeForNPC(npc) {
    for (const house of houses) {
        if (house.inhabitants.includes(npc)) {
            return house;
        }
    }
    return null;
}

// Helper to find a random walkable cell within radius
function findRandomWalkableCell(x, y, radius) {
    // Try up to 10 times to find a valid cell
    for (let i = 0; i < 10; i++) {
        const randomX = x + Math.floor(Math.random() * (radius * 2 + 1)) - radius;
        const randomY = y + Math.floor(Math.random() * (radius * 2 + 1)) - radius;
        
        // Check if this cell is walkable (not water, not occupied by tree)
        if (isWalkable(randomX, randomY)) {
            return {x: randomX, y: randomY};
        }
    }
    return null;
}

// Helper to deposit resources
function depositResources(npc) {
    // Track resources in global economy or house storage
    const home = findHomeForNPC(npc);
    if (home) {
        home.resources = home.resources || {};
        home.resources.wood = (home.resources.wood || 0) + npc.inventory.wood;
        console.log(`House at Cell X ${Math.floor(home.x/cellSize)}, Y${Math.floor(home.y/cellSize)} now has ${home.resources.wood} wood`);
    }
}

// Helper to remove a tree from the world
function removeTree(tree) {
    // Find index of tree in trees array
    const index = trees.findIndex(t => t === tree);
    if (index !== -1) {
        trees.splice(index, 1);
        console.log(`Tree removed at Cell X ${Math.floor(tree.x/cellSize)}, Y${Math.floor(tree.y/cellSize)}`);
        
        // Redraw trees
        treeCtx.clearRect(0, 0, treeCanvas.width, treeCanvas.height);
        trees.forEach(tree => tree.draw(treeCtx));
    }
}

// Helper to check if a cell is walkable
function isWalkable(x, y) {
    // Already defined in your A* pathfinding
    // Check bounds, water, trees, etc.
    return emptyCells.some(cell => cell.x === x && cell.y === y) && 
           !treePositions.some(tree => {
               const treeGridX = Math.floor(tree.x / cellSize);
               const treeGridY = Math.floor(tree.y / cellSize);
               return treeGridX === x && treeGridY === y;
           });
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