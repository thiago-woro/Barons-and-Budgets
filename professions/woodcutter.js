// Woodcutter profession behaviors
// This file contains all the logic for woodcutter NPCs

if (loopCounter > 3) {
    isPaused = true;
}

function findPathbetweenNPCandTree(startPos, targetPos) {
    const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    
    const isWalkable = (x, y) => {
        if (x < 0 || y < 0 || x >= rows || y >= rows) return false;
        return emptyCells.some(cell => cell.x === x && cell.y === y);
    };
    
    const openSet = [{ x: startPos.x, y: startPos.y, g: 0, h: heuristic(startPos, targetPos), f: heuristic(startPos, targetPos), parent: null }];
    const closedSet = [];
    
    while (openSet.length > 0) {
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();
        closedSet.push(current);
        
        if (current.x === targetPos.x && current.y === targetPos.y) {
            const path = [];
            let temp = current;
            while (temp) {
                path.push({ x: temp.x, y: temp.y });
                temp = temp.parent;
            }
            return path.reverse();
        }
        
        const neighbors = [
            { x: current.x - 1, y: current.y },
            { x: current.x + 1, y: current.y },
            { x: current.x, y: current.y - 1 },
            { x: current.x, y: current.y + 1 }
        ];
        
        for (const neighbor of neighbors) {
            if (!isWalkable(neighbor.x, neighbor.y) || 
                closedSet.some(n => n.x === neighbor.x && n.y === neighbor.y)) continue;
            
            const gScore = current.g + 1;
            const existingIdx = openSet.findIndex(n => n.x === neighbor.x && n.y === neighbor.y);
            
            if (existingIdx === -1) {
                openSet.push({
                    x: neighbor.x,
                    y: neighbor.y,
                    g: gScore,
                    h: heuristic(neighbor, targetPos),
                    f: gScore + heuristic(neighbor, targetPos),
                    parent: current
                });
            } else if (gScore < openSet[existingIdx].g) {
                openSet[existingIdx].g = gScore;
                openSet[existingIdx].f = gScore + openSet[existingIdx].h;
                openSet[existingIdx].parent = current;
            }
        }
    }
    
    console.log("No path found"); // Log when no path is found
    return null;
}


//get nearestTree gridX , gridY
function getNearestTree(npc) {
    //console.log(`${npc.name} is looking for a tree`);
    
    // Initialize variables to track nearest tree and its distance
    let nearestTree = null;
    let shortestDistance = Infinity;
    
    // Loop through all trees in the game
    for (const tree of gPalmTreesPositions) {
        // Calculate Manhattan distance (sum of absolute differences)
        const distance = Math.abs(npc.gridX - tree.gridX) + Math.abs(npc.gridY - tree.gridY);
        
        // If this tree is closer than any we've seen so far, remember it
        if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestTree = tree;
        }
    }
    
    // Log whether we found a tree or not
   // console.warn(nearestTree ? "Yes, found nearest tree" : "No, could not find any trees");
    
    return nearestTree;
}

function drawPath(path) {
    // Clear previous paths
    // boatCtx.clearRect(0, 0, boatCtx.canvas.width, boatCtx.canvas.height);
    
    // Draw path as purple line
    boatCtx.strokeStyle = "#8A2BE2"; // Purple color
}

function drawOneSingleCell(cell, color) {
    boatCtx.fillStyle = color;
    boatCtx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
}


// Woodcutter update flow with path finding logging
function updateWoodcutter(npc) {
    loopCounter++;
    //log the npc.gridX , npc.gridY
    console.log(`Woodcutter ${npc.name} is at grid coordinates: (${npc.gridX}, ${npc.gridY})`);

    //get first tree 
    const nearestTree = getNearestTree(npc);
    
    // Check if a tree was found before proceeding
    if (!nearestTree) {
        console.log("No trees found for woodcutter");
        return;
    }
    
    //log the first tree grid coordinates
    console.log(`First tree is at grid coordinates: (${nearestTree.gridX}, ${nearestTree.gridY})`);

    const pathStart = { x: npc.gridX, y: npc.gridY };
    const target = { x: nearestTree.gridX, y: nearestTree.gridY };

    //draw the pathStart and target
    drawOneSingleCell(pathStart, "red");
    drawOneSingleCell(target, "blue");


//find path to the first tree
    const path = findPathbetweenNPCandTree(pathStart, target, true);

    

//log the path

     if (path) {
            console.log("Path found. Path length:", path.length);
            console.log("Path cells:", path);

            // Clear previous paths
            // boatCtx.clearRect(0, 0, boatCtx.canvas.width, boatCtx.canvas.height);
            
            // Draw path as purple line
            boatCtx.strokeStyle = "#8A2BE2"; // Purple color
            boatCtx.lineWidth = 2;
            boatCtx.beginPath();
            
            // Move to the first point
            const firstCell = path[0];
            boatCtx.moveTo(
                (firstCell.x * cellSize) + (cellSize / 2), 
                (firstCell.y * cellSize) + (cellSize / 2)
            );
            
            // Draw lines to each subsequent point
            for (let i = 1; i < path.length; i++) {
                const cell = path[i];
                boatCtx.lineTo(
                    (cell.x * cellSize) + (cellSize / 2), 
                    (cell.y * cellSize) + (cellSize / 2)
                );
            }
            
            boatCtx.stroke();
            console.log("Drawing the path");
            isPaused = true;
            //alert("Path found");
            return;
        } else {
            console.log(`no path between ${pathStart.x} , ${pathStart.y} and ${target.x} , ${target.y}`);
            console.log("Failed to find a valid path.");
            isPaused = true;
            
            // Fix the height reference to use the correct canvas
            // boatCtx.clearRect(0, 0, npcInfoOverlayCtx.canvas.width, npcInfoOverlayCtx.canvas.height);
        }







}


