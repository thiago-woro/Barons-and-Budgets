// Woodcutter profession behaviors

/* logStorage {
    race: "Elf",
    gridX: 0,
    gridY: 0,
    count: 0
} */


function getNearestLogStorage(npc) {
    //get nearest log storage
    let nearestLogStorage = null;
    let shortestDistance = Infinity;

    if (logStorageCabinPositions.length === 0) {
        console.log(`No log storage found for ${npc.name} ${npc.profession}`);
        return null;
    }
    //loop through logStorage
    for (const logStorageLocations of logStorageCabinPositions) {
        const distance = Math.abs(npc.gridX - logStorageLocations.gridX) + Math.abs(npc.gridY - logStorageLocations.gridY);

        if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestLogStorage = logStorageLocations;
        }
    }   

    return nearestLogStorage;
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



function drawOneSingleCell(cell, color, ctx = boatCtx, emoji = null) {
    ctx.fillStyle = color;
    ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
    if (emoji) {
        ctx.font = "20px Arial";
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.fillText(emoji, cell.x * cellSize + cellSize / 2, cell.y * cellSize + cellSize / 2);
    }
}


// Woodcutter update flow with path finding logging
function updateWoodcutter(npc) {
    switch (npc.state) {
        case "idle":
            npc.setState("searchingForTree");
            break;

        case "searchingForTree":
            const nearestTree = getNearestTree(npc);

            if (!nearestTree) {
                console.log(`No trees found for ${npc.name} ${npc.profession}`);
                npc.setState("roaming");
                return;
            }

            const pathStart = { x: npc.gridX, y: npc.gridY };
            const target = { x: nearestTree.gridX, y: nearestTree.gridY };

            //find path to the first tree
            const path = findPath(pathStart, target, true);

            if (path && path.length > 0) {
                console.log("Path found. Path length:", path.length);

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
                npc.currentPath = path;
                npc.pathIndex = 0;
                npc.stateData.targetTree = nearestTree; // Store the tree
                npc.setState("movingToTree");
                break;
            } else {
                console.log(`no path between ${pathStart.x} , ${pathStart.y} and ${target.x} , ${target.y}. ${npc.name} ${npc.profession} will roam around.`);
                npc.setState("roaming");
                break;
            }

        case "movingToTree":
            if (npc.pathIndex < npc.currentPath.length) {
                const nextCell = npc.currentPath[npc.pathIndex];
                npc.x = nextCell.x * cellSize;
                npc.y = nextCell.y * cellSize;
                npc.pathIndex++;
            } else {
                npc.setState("cuttingTree"); // Transition to cutting
                npc.stateData.cuttingProgress = 0; // Initialize cutting progress
                
                // Find the index of the target tree in the treePositions array
                const targetTreeIndex = treePositions.findIndex(
                    tree => tree.gridX === npc.stateData.targetTree.gridX && 
                           tree.gridY === npc.stateData.targetTree.gridY
                );
                
                // Set the targetTreeIndex in stateData for use in the dyingTreeAnimation
                npc.stateData.targetTreeIndex = targetTreeIndex;
                
                // Set the waitTime for cutting
                npc.waitTime = npc.maxWaitTime;
            }
            break;

 case "cuttingTree":
      // console.log(`${npc.name} CHOPPING TREE at ${npc.stateData.targetTree.gridX}, ${npc.stateData.targetTree.gridY}`);

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

           //update the wood count display
            document.getElementById("woodCount").textContent = elfWoodCount + "/ " + treePositions.length;
       // "Cut" the tree
       console.warn(`🎄🎄🎄🎄🎄´${npc.name} has cut down a tree at ${npc.stateData.targetTree.gridX}, ${npc.stateData.targetTree.gridY}`);
                
       // Add wood to inventory
       npc.addToInventory("wood", 1);

       //Remove tree from the map
       const treeIndex = treePositions.findIndex(tree => tree.gridX === npc.stateData.targetTree.gridX && tree.gridY === npc.stateData.targetTree.gridY);
       if (treeIndex !== -1) {
           treePositions.splice(treeIndex, 1);
       }

       //remove tree from the trees array
       trees.splice(treeIndex, 1);

       treeFoundSound.play();
            npc.setState("storeLogs");

        
          });
        }
      } else {
        npc.animationState = "normal"; // Reset animation state
        // Tree has already been removed by the animation

      }
      break;

        case "storeLogs":
            //1 findNearestLogStorage
            let nearestLogStorage = getNearestLogStorage(npc);

            if (!nearestLogStorage) {
                console.log(`No log storage found for ${npc.name} ${npc.profession}`);
                
                // Create a new log storage data object first
                const newLogStorage = {
                    race: npc.race,
                    gridX: npc.gridX,
                    gridY: npc.gridY,
                    count: 0
                };
                logStorageCabinPositions.push(newLogStorage);
                nearestLogStorage = newLogStorage;
                
                // Create the building and add it to buildings array
                const newBuilding = new Building(npc.gridX, npc.gridY, npc, "logStorage", npc.race);
                buildings.push(newBuilding);
                
                // Draw the building manually with the appropriate context
                if (oreDepositsCtx) {
                    newBuilding.draw(oreDepositsCtx);
                } else {
                    // Fallback to drawing a simple marker
                    const logStorageCell = {
                        x: newLogStorage.gridX,
                        y: newLogStorage.gridY
                    };
                    drawOneSingleCell(logStorageCell, "#00FF00", oreDepositsCtx, "⏬");
                }
            }

            //2 findPath to nearestLogStorage
            const pathToLogStorageStart = { x: npc.gridX, y: npc.gridY };
            const pathToLogStorageTarget = { x: nearestLogStorage.gridX, y: nearestLogStorage.gridY };

            npc.currentPath = findPath(pathToLogStorageStart, pathToLogStorageTarget, true);
            npc.pathIndex = 0;

            if (!npc.currentPath || npc.currentPath.length === 0) {
                //if there is no path, probably bc its too far, just create new storage
                const newLogStorage = {
                    race: npc.race,
                    gridX: npc.gridX,
                    gridY: npc.gridY,
                    count: 0
                };
                logStorageCabinPositions.push(newLogStorage);

                //draw the new log storage on the map
                const logStorageCell = {
                    x: newLogStorage.gridX,
                    y: newLogStorage.gridY
                };
                drawOneSingleCell(logStorageCell, "#00FF00", oreDepositsCtx, "☢");

                //update the nearest log storage
                nearestLogStorage = newLogStorage;

                //update the path to the new log storage
                npc.currentPath = findPath(pathToLogStorageStart, pathToLogStorageTarget, true);
                npc.pathIndex = 0;

                //if still no path, then just state roaming
                if (!npc.currentPath || npc.currentPath.length === 0) {
                    console.log(`No path to log storage for ${npc.name} ${npc.profession}`);
                    npc.setState("roaming");
                    break;
                }

                console.log(`No path to log storage for ${npc.name} ${npc.profession}`);
                break;
            }

            // Store the log storage reference in stateData for use in movingToLogStorage state
            npc.stateData.targetLogStorage = nearestLogStorage;
            npc.setState("movingToLogStorage");
            break;

        case "movingToLogStorage":
            if (followPath(npc)) {
                //3 store logs
                const woodCount = npc.getInventoryCount("wood");
                if (woodCount > 0 && npc.stateData.targetLogStorage) {
                    npc.stateData.targetLogStorage.count += woodCount;
                    npc.removeFromInventory("wood", woodCount);
                    console.log(`${npc.name} stored ${woodCount} wood at (${npc.stateData.targetLogStorage.gridX}, ${npc.stateData.targetLogStorage.gridY}). Total: ${npc.stateData.targetLogStorage.count}`);
                }

                //4 update log storage count (already done above)

                npc.setState("idle");
            }
            break;

        case "roaming":
            //basic roaming
            npc.move();
            npc.setState("idle");
            break;
    }
}


