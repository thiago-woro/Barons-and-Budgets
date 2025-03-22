// Woodcutter profession behaviors
// This file contains all the logic for woodcutter NPCs



//get nearestTree gridX , gridY
function getNearestTree(npc) {
    //console.log(`${npc.name} is looking for a tree`);
    
    // Initialize variables to track nearest tree and its distance
    let nearestTree = null;
    let shortestDistance = Infinity;
    
    // Loop through all trees in the game
    for (const tree of treePositions) {
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



// Woodcutter update flow with path finding logging
function updateWoodcutter(npc) {

//log the npc.gridX , npc.gridY
console.log(`Woodcutter ${npc.name} is at grid coordinates: (${npc.gridX}, ${npc.gridY})`);

//get first tree 
const nearestTree = getNearestTree(npc);

//log the first tree grid coordinates
console.log(`First tree is at grid coordinates: (${nearestTree.gridX}, ${nearestTree.gridY})`);



        pathStart = { x: npc.gridX, y: npc.gridY };
        const target = { x: nearestTree.gridX, y: nearestTree.gridY };


//find path to the first tree
        const path = findPath(pathStart, target);

        

//log the path

     if (path) {
            console.log("Path found:", path);
            

            // Clear previous paths
           // boatCtx.clearRect(0, 0, boatCtx.canvas.width, boatCtx.canvas.height);
            
            // Draw path as purple line
            npcInfoOverlayCtx.strokeStyle = "#8A2BE2"; // Purple color
            npcInfoOverlayCtx.lineWidth = 2;
            npcInfoOverlayCtx.beginPath();
            
            // Move to the first point
            const firstCell = path[0];
            npcInfoOverlayCtx.moveTo(
                (firstCell.x * cellSize) + (cellSize / 2), 
                (firstCell.y * cellSize) + (cellSize / 2)
            );
            
            // Draw lines to each subsequent point
            for (let i = 1; i < path.length; i++) {
                const cell = path[i];
                npcInfoOverlayCtx.lineTo(
                    (cell.x * cellSize) + (cellSize / 2), 
                    (cell.y * cellSize) + (cellSize / 2)
                );
            }
            
            npcInfoOverlayCtx.stroke();
            isPaused = true;
            alert("Path found");
            return;
        } else {
            console.log("No path found between start and target");
            
            // Clear previous paths when no path is found
          //  npcInfoOverlayCtx.clearRect(0, 0, npcInfoOverlayCtx.canvas.width, boatCtx.canvas.height);
        }







}




