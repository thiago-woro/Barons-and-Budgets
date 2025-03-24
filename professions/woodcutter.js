// Woodcutter profession behaviors

/* logStorage {
    race: "Elf",
    gridX: 0,
    gridY: 0,
    count: 0
} */

// Track which trees are currently claimed by woodcutters
const claimedTrees = new Set();

function getNearestLogStorage(npc) {
    //get nearest log storage
    let nearestLogStorage = null;
    let shortestDistance = Infinity;

    if (logStorageCabinPositions.length === 0) {
        console.log(`No log storage found for ${npc.name} ${npc.profession}`);
        return null;
    }
    //loop through logStorage   //TODO FILTER OUT SAME RACE CABINS
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
    let nearestTreeIndex = -1;
    
    // Loop through all trees in the game
    for (let i = 0; i < gMatureTreesPositions.length; i++) {
        const tree = gMatureTreesPositions[i];
        
        // Skip trees that are already claimed by other woodcutters
        const treeKey = `${tree.gridX},${tree.gridY}`;
        if (claimedTrees.has(treeKey)) {
            continue;
        }
        
        // Calculate Manhattan distance (sum of absolute differences)
        const distance = Math.abs(npc.gridX - tree.gridX) + Math.abs(npc.gridY - tree.gridY);
        
        // If this tree is closer than any we've seen so far, remember it
        if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestTree = tree;
            nearestTreeIndex = i;
        }
    }
    
    // If we found a tree, mark it as claimed
    if (nearestTree) {
        const treeKey = `${nearestTree.gridX},${nearestTree.gridY}`;
        claimedTrees.add(treeKey);
        // Store the index in the tree object for easy removal later
        nearestTree.treeArrayIndex = nearestTreeIndex;
        console.log(`${npc.name} claimed tree at ${nearestTree.gridX}, ${nearestTree.gridY}`);
    }
    
    return nearestTree;
}

function drawExistingPath(path, npc) {
    if (npc) {
        path = npc.currentPath;
    }
                // Clear previous paths
                boatCtx.clearRect(0, 0, boatCtx.canvas.width, boatCtx.canvas.height);

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
                npc.setState("idle");
                npc.generateProfession(npc.race);
                console.log(`${npc.name}: No trees found!. Became a ${npc.profession}...`);

                break;
            }

            const pathStart = { x: npc.gridX, y: npc.gridY };
            const target = { x: nearestTree.gridX, y: nearestTree.gridY };

            //find path to the first tree
            const path = findPath(pathStart, target, true);

            if (path && path.length > 0) {
                console.log("Path found. Path length:", path.length);
                npc.currentPath = path;
                drawExistingPath(path, npc);

                npc.pathIndex = 0;
                npc.stateData.targetTree = nearestTree; // Store the tree
                npc.setState("movingToTree");
                break;
            } else {
                console.log(`no path between ${pathStart.x} , ${pathStart.y} and ${target.x} , ${target.y}. ${npc.name} ${npc.profession} will roam around.`);
                // If no path found, unclaim the tree
                if (nearestTree) {
                    const treeKey = `${nearestTree.gridX},${nearestTree.gridY}`;
                    claimedTrees.delete(treeKey);
                    console.log(`${npc.name} unclaimed tree at ${nearestTree.gridX}, ${nearestTree.gridY} (no path found)`);
                }
                //npc.setState("idle");
                npc.generateProfession(npc.race);
                break;
            }

      
        case "movingToTree":
            if (npc.pathIndex < npc.currentPath.length) { 
                //AINDA NÃO TERMINOU O CAMINHO. 
                const nextCell = npc.currentPath[npc.pathIndex];
                npc.x = nextCell.x * cellSize;
                npc.y = nextCell.y * cellSize;
                npc.pathIndex++;
            } else {  //TERMINOU O CAMINHO.
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

       // Remove tree claim when it's cut down
       if (npc.stateData.targetTree) {
           const treeKey = `${npc.stateData.targetTree.gridX},${npc.stateData.targetTree.gridY}`;
           claimedTrees.delete(treeKey);
           
           // Remove from gMatureTreesPositions array as well
           if (npc.stateData.targetTree.treeArrayIndex !== undefined) {
               gMatureTreesPositions.splice(npc.stateData.targetTree.treeArrayIndex, 1);
               console.log(`Removed tree from gMatureTreesPositions at index ${npc.stateData.targetTree.treeArrayIndex}`);
           } else {
               // Fallback: remove by searching through the array
               const matureTreeIndex = gMatureTreesPositions.findIndex(
                   tree => tree.gridX === npc.stateData.targetTree.gridX && 
                          tree.gridY === npc.stateData.targetTree.gridY
               );
               if (matureTreeIndex !== -1) {
                   gMatureTreesPositions.splice(matureTreeIndex, 1);
                   console.log(`Removed tree from gMatureTreesPositions by searching (index ${matureTreeIndex})`);
               }
           }
       }

       //Remove tree from the map
       const treeIndex = treePositions.findIndex(tree => tree.gridX === npc.stateData.targetTree.gridX && tree.gridY === npc.stateData.targetTree.gridY);
       if (treeIndex !== -1) {
           treePositions.splice(treeIndex, 1);
       }
        //remove tree from the trees array
        trees.splice(treeIndex, 1);
        treeFoundSound.play();
        npc.setState("searchingLogCabin");
          });
        }
      } else {
        npc.animationState = "normal"; // Reset animation state
        // Tree has already been removed by the animation

      }
      break;

        case "searchingLogCabin":
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
                newBuilding.draw(oreDepositsCtx);
                console.warn(`created log cabin at X ${npc.gridX}, Y ${npc.gridY} `)
                
            }
            npc.setState("movingToLogCabin");
            break;

        case "movingToLogCabin":  //2 findPath to nearestLogStorage
            //preparing paths
            const pathToLogStorageStart = { x: npc.gridX, y: npc.gridY };
            const pathToLogStorageTarget = { x: nearestLogStorage.gridX, y: nearestLogStorage.gridY };
            npc.currentPath = ''; //remove the path to previous tree. 
            //now we want to go to the cabin to deposit it.
            //updating npc path
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
                logStorageCabinPositions.push(newLogStorage); //smaller array just for log cabins
             
                // Create the building and add it to buildings array
                //broader array of all buildings
                const newBuilding = new Building(npc.gridX, npc.gridY, npc, "logCabin", npc.race);
                buildings.push(newBuilding);
                newBuilding.draw(oreDepositsCtx);
                console.warn(`created log cabin at X ${npc.gridX}, Y ${npc.gridY} `)
                
                //update the nearest log storage
                nearestLogStorage = newLogStorage;

                //update the path to the new log storage
                npc.currentPath = findPath(pathToLogStorageStart, pathToLogStorageTarget, true);
                npc.pathIndex = 0;

                //if still no path, then just state roaming
                if (!npc.currentPath || npc.currentPath.length === 0) {
                    console.log(`No path to log storage for ${npc.name} ${npc.profession}`);
                    npc.generateProfession(npc.race);
                    break;
                }

                console.log(`No path to log storage for ${npc.name} ${npc.profession}`);
                break;
            }

            // Store the log storage reference in stateData for use in movingToLogStorage state
            npc.stateData.targetLogStorage = nearestLogStorage;
            npc.setState("storingLogs");
            
             if (npc.pathIndex < npc.currentPath.length) {
                //AINDA NÃO TERMINOU O CAMINHO. 

                const nextCell = npc.currentPath[npc.pathIndex];
                npc.x = nextCell.x * cellSize;
                npc.y = nextCell.y * cellSize;
                npc.pathIndex++;
                break;
            } else {  //TERMINOU O CAMINHO.
                npc.setState("storingLogs");
                npc.pathIndex = 0;
                npc.currentPath = '';
                break;
            }
            break;


            case "storingLogs":
                //3 store logs
                const woodCount = npc.getInventoryCount("wood");
                if (woodCount > 0 && npc.stateData.targetLogStorage) {
                    npc.stateData.targetLogStorage.count += woodCount;
                    npc.removeFromInventory("wood", woodCount);
                    console.warn(`🎄🎄🎄🎄🎄 ${npc.name} stored ${woodCount} wood at (${npc.stateData.targetLogStorage.gridX}, ${npc.stateData.targetLogStorage.gridY}). Total: ${npc.stateData.targetLogStorage.count}`);
                }

                //4 update log storage count (already done above)
                npc.setState("idle");
            break

        case "roaming":
            //basic roaming
            npc.move();
            npc.setState("idle");
            break;
    }
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

