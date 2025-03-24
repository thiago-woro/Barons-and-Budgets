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

// Function to claim a tree
function claimTree(npc, tree, treeIndex) {
    const treeKey = `${tree.gridX},${tree.gridY}`;
    claimedTrees.add(treeKey);
    tree.treeArrayIndex = treeIndex;
    console.log(`${npc.name} claimed tree at ${tree.gridX}, ${tree.gridY}`);
    return tree;
}

//get nearestTree gridX , gridY (but don't claim it yet)
function findNearestTree(npc) {
    // Initialize NPC-specific inaccessible trees set if not already done
    if (!npc.inaccessibleTrees) {
        npc.inaccessibleTrees = new Set();
    }
    
    // Initialize variables to track nearest tree and its distance
    let nearestTree = null;
    let shortestDistance = Infinity;
    let nearestTreeIndex = -1;
    
    // Loop through all trees in the game
    for (let i = 0; i < gMatureTreesPositions.length; i++) {
        const tree = gMatureTreesPositions[i];
        
        // Skip trees that are already claimed or inaccessible to this NPC
        const treeKey = `${tree.gridX},${tree.gridY}`;
        if (claimedTrees.has(treeKey) || npc.inaccessibleTrees.has(treeKey)) {
            continue;
        }
        
        // Calculate Manhattan distance
        const distance = Math.abs(npc.gridX - tree.gridX) + Math.abs(npc.gridY - tree.gridY);
        
        // If this tree is closer than any we've seen so far, remember it
        if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestTree = tree;
            nearestTreeIndex = i;
        }
    }
    
    // Return the tree info without claiming it yet
    return { tree: nearestTree, index: nearestTreeIndex };
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
            const treeInfo = findNearestTree(npc);
            
            if (!treeInfo.tree) {
                console.log(`${npc.name}: No trees found! Changing profession to Harvester...`);
                // Clear any existing state data
                npc.stateData = {};
                npc.currentPath = '';
                npc.pathIndex = 0;
                
                // Explicitly change profession to harvester
                npc.profession = "Harvester";
                
                // Set appropriate state for the new profession
                npc.setState("idle");
                break;
            }

            const pathStart = { x: npc.gridX, y: npc.gridY };
            const target = { x: treeInfo.tree.gridX, y: treeInfo.tree.gridY };

            // Find path to the first tree
            const path = findPath(pathStart, target, true);

            if (path && path.length > 0) {
                // Only claim the tree if we can reach it
                const nearestTree = claimTree(npc, treeInfo.tree, treeInfo.index);
                
                console.log(`Path found for ${npc.name} to tree. Path length: ${path.length}`);
                npc.currentPath = path;
                drawExistingPath(path, npc);

                npc.pathIndex = 0;
                npc.stateData.targetTree = nearestTree; // Store the tree
                npc.setState("movingToTree");
            } else {
                console.log(`No path between ${pathStart.x}, ${pathStart.y} and ${target.x}, ${target.y}. ${npc.name} will find another tree.`);
                
                // Mark this tree as inaccessible for this NPC
                npc.inaccessibleTrees = npc.inaccessibleTrees || new Set();
                npc.inaccessibleTrees.add(`${treeInfo.tree.gridX},${treeInfo.tree.gridY}`);
                
                // Check if this NPC has marked too many trees as inaccessible
                // If they've marked a significant number (e.g., 10+), they might be in an isolated area
                if (npc.inaccessibleTrees.size > 3) {
                    console.log(`${npc.name} has tried too many inaccessible trees. Changing profession to Harvester.`);
                    npc.profession = "Harvester";
                    npc.stateData = {};
                    npc.currentPath = '';
                    npc.pathIndex = 0;
                    npc.setState("idle");
                } else {
                    // Try to find another tree
                    npc.setState("idle");
                }
            }
            break;

      
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
            if (npc.waitTime > 0) {
                npc.waitTime--;
                npc.animationState = npc.waitTime % 4 < 2 ? "chopping" : "normal";
                if (npc.waitTime === Math.floor(npc.maxWaitTime / 2) && npc.stateData.targetTreeIndex !== -1) {
                    dyingTreeAnimation(npc.stateData.targetTreeIndex, () => {
                        elfWoodCount += 1;
                        document.getElementById("woodCount").textContent = `${elfWoodCount} / ${treePositions.length}`;
                        console.warn(`${npc.name} cut tree at ${npc.stateData.targetTree.gridX}, ${npc.stateData.targetTree.gridY}`);
                        
                        const treeKey = `${npc.stateData.targetTree.gridX},${npc.stateData.targetTree.gridY}`;
                        claimedTrees.delete(treeKey);
                        [treePositions, gMatureTreesPositions, trees].forEach(arr => {
                            const idx = arr.findIndex(t => t.gridX === npc.stateData.targetTree.gridX && t.gridY === npc.stateData.targetTree.gridY);
                            if (idx !== -1) arr.splice(idx, 1);
                        });
                        npc.addToInventory("wood", 1);
                        treeFoundSound.play();
                        
                        // Reset path info before changing state
                        npc.currentPath = '';
                        npc.pathIndex = 0;
                        npc.waitTime = 0;
                        
                        // Important: This forces the state change to happen immediately 
                        // rather than waiting for the next update cycle
                        npc.setState("searchingLogCabin");
                    });
                }
            } else {
                npc.animationState = "normal";
                
                // Ensure we also transition if waitTime reached 0 without animation finishing
                if (npc.state === "cuttingTree") {
                    npc.currentPath = '';
                    npc.pathIndex = 0;
                    npc.setState("searchingLogCabin");
                }
            }
            break;

        case "searchingLogCabin":
            // Clear any existing path data
            npc.currentPath = '';
            npc.pathIndex = 0;
            
            // Make sure gridX and gridY match the NPC's current position
            // This fixes the teleporting issue by ensuring we start pathing from the current position
            npc.gridX = Math.floor(npc.x / cellSize);
            npc.gridY = Math.floor(npc.y / cellSize);
            console.log(`${npc.name} updated position to gridX: ${npc.gridX}, gridY: ${npc.gridY}`);
            
            //1 findNearestLogStorage
            npc.stateData.nearestLogStorage = getNearestLogStorage(npc);

            if (!npc.stateData.nearestLogStorage) {
                console.log(`No log storage found for ${npc.name} ${npc.profession}`);
                
                // Create a new log storage data object first
                const newLogStorage = {
                    race: npc.race,
                    gridX: npc.gridX,
                    gridY: npc.gridY,
                    count: 0
                };
                logStorageCabinPositions.push(newLogStorage);
                npc.stateData.nearestLogStorage = newLogStorage;
                
                // Create the building and add it to buildings array
                const newBuilding = new Building(npc.gridX, npc.gridY, npc, "logStorage", npc.race);
                buildings.push(newBuilding);
                newBuilding.draw(oreDepositsCtx);
                console.warn(`created log cabin at X ${npc.gridX}, Y ${npc.gridY}`);
            }
            
            // Add path visual indicator for debugging
            console.log(`${npc.name} is now searching for log cabin from position ${npc.gridX},${npc.gridY}`);
            
            npc.setState("movingToLogCabin");
            break;

        case "movingToLogCabin":  //2 findPath to nearestLogStorage
            // Get the log storage saved in the previous state or get it again if needed
            if (!npc.stateData.nearestLogStorage) {
                npc.stateData.nearestLogStorage = getNearestLogStorage(npc);
            }
            
            // If NPC is starting this state (no current path)
            if (!npc.currentPath || npc.currentPath === '') {
                // Ensure gridX and gridY match the current pixel position
                npc.gridX = Math.floor(npc.x / cellSize);
                npc.gridY = Math.floor(npc.y / cellSize);
                
                //preparing paths
                const pathToLogStorageStart = { x: npc.gridX, y: npc.gridY };
                const pathToLogStorageTarget = { x: npc.stateData.nearestLogStorage.gridX, y: npc.stateData.nearestLogStorage.gridY };
                
                // Draw starting point for debugging
                drawOneSingleCell(pathToLogStorageStart, "rgba(255,0,0,0.5)", boatCtx, "👣");
                
                //now we want to go to the cabin to deposit it.
                console.log(`Finding path from ${pathToLogStorageStart.x},${pathToLogStorageStart.y} to log cabin at ${pathToLogStorageTarget.x},${pathToLogStorageTarget.y}`);
                npc.currentPath = findPath(pathToLogStorageStart, pathToLogStorageTarget, true);
                npc.pathIndex = 0;
                
                if (npc.currentPath && npc.currentPath.length > 0) {
                    console.log(`Path found to log cabin. Length: ${npc.currentPath.length}`);
                    drawExistingPath(npc.currentPath, null);
                }

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
                    npc.stateData.targetLogStorage = newLogStorage;

                    //update the path to the new log storage
                    npc.currentPath = findPath(pathToLogStorageStart, 
                        { x: newLogStorage.gridX, y: newLogStorage.gridY }, true);
                    npc.pathIndex = 0;

                    //if still no path, then change profession.
                    if (!npc.currentPath || npc.currentPath.length === 0) {
                        npc.setState("stuck");
                        break;
                    }
                } else {
                    // Store the log storage reference in stateData
                    npc.stateData.targetLogStorage = npc.stateData.nearestLogStorage;
                }
            }
            
            // Now follow the path
            if (npc.pathIndex < npc.currentPath.length) {
                //AINDA NÃO TERMINOU O CAMINHO. 
                const nextCell = npc.currentPath[npc.pathIndex];
                npc.x = nextCell.x * cellSize;
                npc.y = nextCell.y * cellSize;
                npc.gridX = nextCell.x; // Update grid coordinates while moving
                npc.gridY = nextCell.y;
                npc.pathIndex++;
            } else {  //TERMINOU O CAMINHO.
                npc.setState("storingLogs");
                npc.pathIndex = 0;
                npc.currentPath = '';
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
            break;

            case "stuck":
                //do nothing
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

