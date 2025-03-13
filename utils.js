function drawStartandTarget(ctx, cellSize, start, target, closedSet) {
    console.warn(`ClosedSet size: ${closedSet ? closedSet.size : 'undefined'}`);

    if (!ctx || !start || !target) {
        console.warn("drawStartandTarget: Invalid context or positions.");
        return;
    }

    // Save current context state
    ctx.save();
/*     
    // Draw closed set cells in purple
    if (closedSet && closedSet.size > 0) {
        ctx.fillStyle = "rgba(128, 0, 128, 0.5)"; // Purple with transparency
        
        console.warn("ClosedSet keys:", Array.from(closedSet));
        
        closedSet.forEach(key => {
            // Simple split by comma since keys are now properly formatted
            const [x, y] = key.split(',').map(Number);
            
            if (!isNaN(x) && !isNaN(y)) {
                const pixelX = x * cellSize;
                const pixelY = y * cellSize;
                ctx.fillRect(pixelX, pixelY, cellSize, cellSize);
                console.warn(`Drew closed cell at (${x},${y})`);
            } else {
                console.warn(`Could not parse closedSet key: ${key}`);
            }
        });
    } */
    
    // Draw neighbor cells in orange
    ctx.fillStyle = "rgba(255, 165, 0, 0.7)"; // Orange with transparency
    const neighbors = getNeighbors(start.x, start.y);
    neighbors.forEach(neighbor => {
        const neighborPixelX = neighbor.x * cellSize;
        const neighborPixelY = neighbor.y * cellSize;
        ctx.fillRect(neighborPixelX, neighborPixelY, cellSize, cellSize);
    });
    
    // Draw start position in green (on top of other cells)
    ctx.fillStyle = "rgba(0, 255, 0, 0.7)";
    const startPixelX = start.x * cellSize;
    const startPixelY = start.y * cellSize;
    ctx.fillRect(startPixelX, startPixelY, cellSize, cellSize);
    
    // Draw target position in red (on top of other cells)
    ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
    const targetPixelX = target.x * cellSize;
    const targetPixelY = target.y * cellSize;
    ctx.fillRect(targetPixelX, targetPixelY, cellSize, cellSize);
    
    // Restore context state
    ctx.restore();
    
    console.warn(`Drew start at (${start.x}, ${start.y}) and target at (${target.x}, ${target.y})`);
    

}

function findNearestHome(npc) {
    let nearestHome = null;
    let minDistance = Infinity;

    // Check if houses exists and has elements
    if (typeof houses === 'undefined' || !houses || houses.length === 0) {
        console.log(`utils: ${npc.name} couldn't find any homes - houses array is empty or undefined. houses array length: ${houses ? houses.length : 'undefined'}`);

        alert(`utils: ${npc.name} couldn't find any homes - houses array is empty or undefined. houses array length: ${houses ? houses.length : 'undefined'}`);
        return null;
    }

    houses.forEach(house => {
        // Convert house coordinates to grid coordinates
        const houseX = Math.floor(house.x / cellSize);
        const houseY = Math.floor(house.y / cellSize);

        const npcX = Math.floor(npc.x / cellSize);
        const npcY = Math.floor(npc.y / cellSize);

        const distance = Math.sqrt(
            Math.pow(houseX - npcX, 2) +
            Math.pow(houseY - npcY, 2)
        );

        if (distance < minDistance) {
            minDistance = distance;
            nearestHome = {
                x: houseX,
                y: houseY,
                originalHouse: house
            };
        }
    });

    console.log(`utils: ${npc.name} found nearest home at distance ${minDistance.toFixed(2)}`);
    return nearestHome;
}

/**
 * Checks if a cell is a valid land cell
 * @param {number} x - The x coordinate
 * @param {number} y - The y coordinate
 * @returns {boolean} - True if the cell is a valid land cell
 */
function isLandCell(x, y) {
    // Check if coordinates are valid numbers
    if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) {
        console.warn(`isLandCell: Invalid coordinates (${x}, ${y})`);
        return false;
    }

    // Check if groundCells exists
    if (typeof groundCells === 'undefined' || !groundCells || !Array.isArray(groundCells)) {
        console.warn(`isLandCell: groundCells is undefined or not an array. groundCells array length: ${groundCells ? groundCells.length : 'undefined'}`);
        return false;
    }

    // Check if the cell is in the groundCells array
    return groundCells.some(cell => cell && cell.x === x && cell.y === y);
}

/**
 * Finds a path from NPC to target using A* pathfinding algorithm
 * Only allows movement over land cells
 * @param {Object} npc - The NPC object
 * @param {Object} target - The target coordinates {x, y}
 * @returns {Array|null} - Array of path coordinates or null if no path found
 */
function findPathTo(npc, target) {
    // Skip non-woodcutters
    if (npc.profession !== 'Woodcutter') {
        return null;
    }

    const startX = Math.floor(npc.x / cellSize);
    const startY = Math.floor(npc.y / cellSize);
    console.log(`findPathTo: ${npc.name} - Start: (${startX}, ${startY}), Target: (${target.x}, ${target.y})`);

    // A* pathfinding implementation
    const openSet = [];
    const closedSet = new Set();
    const cameFrom = new Map();

    // Cost from start to current node
    const gScore = new Map();
    // Estimated total cost from start to goal through current node
    const fScore = new Map();

    const startKey = `${startX},${startY}`;
    const targetKey = `${target.x},${target.y}`;

    gScore.set(startKey, 0);
    fScore.set(startKey, heuristic(startX, startY, target.x, target.y));

    openSet.push({
        x: startX,
        y: startY,
        key: startKey,
        f: fScore.get(startKey)
    });

    // Visualize the initial state before pathfinding starts
    const canvas = document.getElementById('gameCanvas') || document.querySelector('canvas');
    if (canvas) {
        const context = canvas.getContext('2d');
        const start = { x: startX, y: startY };
        drawStartandTarget(context, cellSize, start, target, closedSet);
        
        // Continue with pathfinding - don't return here
        // This allows us to see the visualization but still find a path
    }

    while (openSet.length > 0) {
        // Sort by fScore and get the node with lowest fScore
        openSet.sort((a, b) => a.f - b.f);
        const current = openSet.shift();

        // If we reached the target
        if (current.key === targetKey) {
            const path = reconstructPath(cameFrom, current);
            console.log(`findPathTo: ${npc.name} - Path found with ${path.length} steps`);
            return path; // Return the path so NPC can follow it
        }

        closedSet.add(current.key);

        // Get neighbors (adjacent cells)
        const neighbors = getNeighbors(current.x, current.y);

        for (const neighbor of neighbors) {
            const neighborKey = `${neighbor.x},${neighbor.y}`;

            // Skip if already evaluated or not a land cell
            if (closedSet.has(neighborKey) || !isLandCell(neighbor.x, neighbor.y)) {
                continue;
            }

            // Distance from start to neighbor through current
            const tentativeGScore = gScore.get(current.key) + 1;

            // Add neighbor to open set if not there
            const neighborInOpenSet = openSet.find(node => node.key === neighborKey);
            if (!neighborInOpenSet) {
                openSet.push({
                    x: neighbor.x,
                    y: neighbor.y,
                    key: neighborKey,
                    f: tentativeGScore + heuristic(neighbor.x, neighbor.y, target.x, target.y)
                });
                gScore.set(neighborKey, Infinity); // Initialize gScore for new nodes
            }

            if (tentativeGScore >= (gScore.get(neighborKey) || Infinity)) {
                // Not a better path
                continue;
            }

            // This is the best path so far
            cameFrom.set(neighborKey, current);
            gScore.set(neighborKey, tentativeGScore);
            fScore.set(neighborKey, tentativeGScore + heuristic(neighbor.x, neighbor.y, target.x, target.y));

            // Update f-score in openSet if neighbor is already there
            if (neighborInOpenSet) {
                neighborInOpenSet.f = fScore.get(neighborKey);
            }
        }
    }

    // No path found (openSet is empty)
    console.warn(`findPathTo: 🟥🟥🟥 ${npc.profession} ${npc.name} - No path found to target (${target.x}, ${target.y})`);
    
    // Visualize the failed pathfinding attempt
    if (canvas) {
        const context = canvas.getContext('2d');
        const start = { x: startX, y: startY };
        drawStartandTarget(context, cellSize, start, target, closedSet);
    }
    
    // Return null to idle the NPC only when no path is found
    return null;
}

/**
 * Heuristic function for A* (Manhattan distance)
 */
function heuristic(x1, y1, x2, y2) {
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
}

/**
 * Get valid neighboring cells (4-directional)
 */
function getNeighbors(x, y) {
    return [
        { x: x + 1, y },
        { x: x - 1, y },
        { x, y: y + 1 },
        { x, y: y - 1 }
    ];
}

/**
 * Reconstruct path from A* result
 */
function reconstructPath(cameFrom, current) {
    const path = [{ x: current.x, y, y: current.y }];
    let currentKey = current.key;

    while (cameFrom.has(currentKey)) {
        current = cameFrom.get(currentKey);
        currentKey = current.key;
        path.unshift({ x: current.x, y: current.y });
    }

    // Remove the starting position from the path
    path.shift();

    return path;
}