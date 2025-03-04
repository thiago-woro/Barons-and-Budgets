const treePopSound = new Audio('/assets/sounds/3pop.mp3'); // Create this simple sound file

const TREE_LIFECYCLE = {
  NEW_TREE_INTERVAL: 100,    // Try to grow new tree every 10 seconds
  TREE_DEATH_CHANCE: 0.002,     // 2% chance of random tree death check
  DEATH_CHECK_INTERVAL: 150, // Check for tree death every 15 seconds
  MAX_TREES: 1000000,              // Maximum number of trees allowed
  MIN_TREES: 20                // Minimum number of trees to maintain
};

// Add these helper functions at the top of the file
function manhattan(point1, point2) {
    return Math.abs(point1.x - point2.x) + Math.abs(point1.y - point2.y);
}

function findNearestTree(startX, startY) {
    let nearest = null;
    let minDistance = Infinity;

    treePositions.forEach(tree => {
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

function createPathToTree(startX, startY) {
    const nearestTree = findNearestTree(startX, startY);
    if (!nearestTree) return null;

    const start = {
        x: Math.floor(startX/cellSize),
        y: Math.floor(startY/cellSize)
    };
    const goal = {
        x: Math.floor(nearestTree.x/cellSize),
        y: Math.floor(nearestTree.y/cellSize)
    };

    const openSet = [{ 
        ...start, 
        g: 0, 
        h: manhattan(start, goal),
        f: manhattan(start, goal),
        parent: null 
    }];
    const closedSet = new Set();

    while (openSet.length > 0) {
        // Find node with lowest f score
        let current = openSet.reduce((a, b) => a.f < b.f ? a : b);
        
        // Goal reached
        if (current.x === goal.x && current.y === goal.y) {
            // Reconstruct path
            const path = [];
            while (current) {
                path.unshift({ x: current.x * cellSize, y: current.y * cellSize });
                current = current.parent;
            }
            return {
                path: path,
                tree: nearestTree
            };
        }

        // Remove current from openSet
        openSet.splice(openSet.indexOf(current), 1);
        closedSet.add(`${current.x},${current.y}`);

        // Generate neighbors
        const neighbors = [
            { x: current.x + 1, y: current.y },
            { x: current.x - 1, y: current.y },
            { x: current.x, y: current.y + 1 },
            { x: current.x, y: current.y - 1 }
        ];

        for (let neighbor of neighbors) {
            // Skip if already evaluated or not walkable
            if (closedSet.has(`${neighbor.x},${neighbor.y}`) ||
                !groundCells.some(cell => cell.x === neighbor.x && cell.y === neighbor.y)) {
                continue;
            }

            const g = current.g + 1;
            const h = manhattan(neighbor, goal);
            const f = g + h;

            const existingNeighbor = openSet.find(n => n.x === neighbor.x && n.y === neighbor.y);
            if (!existingNeighbor) {
                openSet.push({ ...neighbor, g, h, f, parent: current });
            } else if (g < existingNeighbor.g) {
                existingNeighbor.g = g;
                existingNeighbor.f = f;
                existingNeighbor.parent = current;
            }
        }
    }

    return null; // No path found
}

// Add this function to visualize the path (for debugging)
function drawPath(ctx, path) {
    if (!path) return;
    
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
}

function startTrees(ctx, cellSize) {
    clearCanvas(ctx);
    let treeCount = 0;

    // Define the tree emojis based on noise values
    const treeEmojis = {
        "🌴": [],   // For lower noise values
        "🌵": [],   // For medium noise values
        "🌳": [],   // For higher noise values
        "🌲": [],   // For the highest noise values
    };

    treeCount = groundCells.length * treePercentageofLand;

    // Assign tree emojis based on noise values
    emptyCells.forEach((cell) => {
        let selectedEmoji;

        if (cell.noise > 0.05) {
            selectedEmoji = "🌴";  // Lower noise values
        } if (cell.noise > 0.13) {
            selectedEmoji = "🌳";  // Medium noise values
        } if (cell.noise > 0.45) {
            selectedEmoji = "🌲";  // Higher noise values
        }

        if (treeEmojis[selectedEmoji]) {
            treeEmojis[selectedEmoji].push(cell);
        }
    });

    // Generate initial tree positions instantly
    for (let i = 0; i < treeCount; i++) {
        const selectedEmoji = Object.keys(treeEmojis)[i % 4];
        if (treeEmojis[selectedEmoji].length > 0) {
            const randomIndex = Math.floor(Math.random() * treeEmojis[selectedEmoji].length);
            const selectedCell = treeEmojis[selectedEmoji].splice(randomIndex, 1)[0];
            const x = selectedCell.x * cellSize;
            const y = selectedCell.y * cellSize;
            treePositions.push({ x, y, emoji: selectedEmoji, scale: 1, opacity: 1, rotation: 0 });
        }
    }

    drawTrees(treeCtx, treePositions);
    drawGrass(treeCtx, 0.05);
    
    // Initialize tree lifecycle
    initTreeLifecycle();
    
    return treePositions;
}

function drawTrees(ctx, treePositions) {
    clearCanvas(ctx);
    //console.log('drawing trees 🌵🌵')

    treePositions.sort((a, b) => {
        if (a.y === b.y) return b.x - a.x;
        return a.y - b.y;
    });

    treePositions.forEach((tree) => {
        const scale = tree.scale || 1;
        const opacity = tree.opacity || 1;
        const rotation = tree.rotation || 0;
        const x = tree.x;
        const y = tree.y;

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        // Draw shadow with scale
        ctx.beginPath();
        ctx.arc(0, 5, 7 * scale, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 0, 0, ${0.3 * opacity})`;
        ctx.fill();

        // Draw tree with scale, opacity and color
        ctx.fillStyle = tree.color || `rgba(0, 0, 0, ${opacity})`;
        ctx.textAlign = "center";
        ctx.font = `bold ${20 * scale}px Arial`;
        ctx.fillText(tree.emoji, 0, 0);

        ctx.restore();
    });
}

function animateNewTree(x, y, emoji, callback) {
 // console.log('new tree 🌵   🌵 ')

    const tree = { x, y, emoji, scale: 0, opacity: 0, rotation: 0 };  
    treePositions.push(tree);

    // Play pop sound at spaced intervals
    if (!treePopSound.lastPlayed || (Date.now() - treePopSound.lastPlayed) > 5000) { // 5 seconds interval
      treePopSound.currentTime = 0;
      treePopSound.play().catch(e => console.log("Audio play tree failed:", e));
      treePopSound.lastPlayed = Date.now();
    }

    //paint the tile terrains a flowery color beneath the tree
    const color = 'rgba(127, 115, 121, 0.4)';
    drawCircle(groundCtx, x, y, 70, color);

    let progress = 0;
    const duration = 1000; // 1 second animation
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        progress = Math.min(elapsed / duration, 1);

        // Elastic bounce effect
        const bounce = Math.pow(progress, 2) * Math.sin(progress * Math.PI * 3);
        tree.scale = 0.5 + bounce * 0.5; // Scale between 0.5 and 1
        tree.opacity = progress;

        drawTrees(treeCtx, treePositions);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            tree.scale = 1;
            tree.opacity = 1;
            if (callback) callback();
        }
    }

    requestAnimationFrame(animate);
}

function dyingTreeAnimation(treeIndex, callback) {
    const tree = treePositions[treeIndex];
    if (!tree) return;

    let progress = 0;
    const blackenDuration = 500;    // Time to turn black (0.5s)
    const fallDuration = 1000;      // Time to fall (1s)
    const waitDuration = 5000;      // Time to wait (5s)
    const fadeDuration = 1000;      // Time to fade (1s)
    const startTime = performance.now();
    const startRotation = tree.rotation || 0;

    // Add color property if it doesn't exist
    tree.color = tree.color || 'rgba(0, 0, 0, 1)';

    function animate(currentTime) {
        const elapsed = currentTime - startTime;

        // Blacken animation (0-0.5s)
        if (elapsed < blackenDuration) {
            progress = elapsed / blackenDuration;
            tree.color = `rgba(0, 0, 0, 1)`;
            drawTrees(treeCtx, treePositions);
            requestAnimationFrame(animate);
        }
        // Fall animation (0.5-1.5s)
        else if (elapsed < blackenDuration + fallDuration) {
            progress = (elapsed - blackenDuration) / fallDuration;
            tree.rotation = startRotation + (Math.PI / 2) * progress;
            drawTrees(treeCtx, treePositions);
            requestAnimationFrame(animate);
        }
        // Wait period (1.5-6.5s)
        else if (elapsed < blackenDuration + fallDuration + waitDuration) {
            requestAnimationFrame(animate);
        }
        // Fade out (6.5-7.5s)
        else if (elapsed < blackenDuration + fallDuration + waitDuration + fadeDuration) {
            const fadeProgress = (elapsed - blackenDuration - fallDuration - waitDuration) / fadeDuration;
            tree.opacity = 1 - fadeProgress;
            drawTrees(treeCtx, treePositions);
            requestAnimationFrame(animate);
        }
        // Animation complete
        else {
            treePositions.splice(treeIndex, 1);
            drawTrees(treeCtx, treePositions);
            if (callback) callback();
        }
    }

    requestAnimationFrame(animate);
}

function distributeOreDeposits(ctx) {
    clearCanvas(oreDepositsCtx);
    oreDeposits = [];

    betterOreCellsDistribution = groundCells.filter((cell) => {
        const noiseValue = parseFloat(cell.noise);
        return noiseValue >= 0.42;
    });

    const clusterCount = 5; // Number of ore deposit clusters
    const depositsPerCluster = 3;

    for (let cluster = 0; cluster < clusterCount; cluster++) {
        const randomGroundCell =
            betterOreCellsDistribution[Math.floor(Math.random() * betterOreCellsDistribution.length)];

        // Calculate the starting coordinates for the cluster within the selected ground cell
        const randomClusterX = randomGroundCell.x;
        const randomClusterY = randomGroundCell.y;

        let color = 'rgba(127, 115, 121, 0.4)';
        drawCircle(groundCtx, randomClusterX * cellSize, randomClusterY * cellSize, 70, color);

        // Draw the first ore deposit in the random cluster X, Y
        drawOreDeposit(ctx, randomClusterX, randomClusterY);

        // Calculate and draw the remaining ore deposits in adjacent cells
        const adjacentCells = calculateAdjacentCells(
            randomClusterX,
            randomClusterY
        );

        // Store the adjacent cells in the global variable
        adjacentOreCells = [...adjacentOreCells, ...adjacentCells];

        const depositsToDraw = Math.min(depositsPerCluster, adjacentCells.length);

        for (let i = 0; i < depositsToDraw; i++) {
            const { x, y } = adjacentCells[i];
            drawOreDeposit(ctx, x, y);
        }
    }

    // Filter out cells with ore deposits from groundCells
    emptyCells = groundCells.filter((cell) => {
        // Check if the cell coordinates are occupied by an ore deposit
        return !adjacentOreCells.some(
            (coords) =>
                coords.x === cell.x && coords.y === cell.y
        );
    });

    startTrees(treeCtx, cellSize);
}

// Add new function to manage tree lifecycle
function initTreeLifecycle() {
    // Periodic new tree growth
    setInterval(() => {
        if (treePositions.length < TREE_LIFECYCLE.MAX_TREES) {
            const randomEmptyCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            if (randomEmptyCell) {
                const x = randomEmptyCell.x * cellSize;
                const y = randomEmptyCell.y * cellSize;
                // Pick random tree type based on noise
                const treeTypes = ["🌴", "🌵", "🌳", "🌲"];
                const randomTree = treeTypes[Math.floor(Math.random() * treeTypes.length)];
                animateNewTree(x, y, randomTree);
            }
        }
    }, TREE_LIFECYCLE.NEW_TREE_INTERVAL);

    // Periodic tree death check
    setInterval(() => {
        if (treePositions.length > TREE_LIFECYCLE.MIN_TREES) {
            treePositions.forEach((_, index) => {
                if (Math.random() < TREE_LIFECYCLE.TREE_DEATH_CHANCE) {
                    dyingTreeAnimation(index);
                }
            });
        }
    }, TREE_LIFECYCLE.DEATH_CHECK_INTERVAL);
}
