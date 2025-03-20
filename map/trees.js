const treePopSound = new Audio('/assets/sounds/3pop.mp3');

const TREE_LIFECYCLE = {
    NEW_TREE_INTERVAL: 15000,
    TREE_DEATH_CHANCE: 0.002,
    DEATH_CHECK_INTERVAL: 130,
    MAX_TREES: 300,
    MIN_TREES: 20
};

// Helper functions for coordinate conversion
function gridToPixel(gridX, gridY) {
    return {
        x: (gridX + 0.5) * cellSize,
        y: (gridY + 0.5) * cellSize
    };
}

function pixelToGrid(pixelX, pixelY) {
    return {
        x: Math.floor(pixelX / cellSize),
        y: Math.floor(pixelY / cellSize)
    };
}

function modifyWalkableCells(cells, operation) {
    if (!Array.isArray(cells)) {
        console.error("modifyWalkableCells: cells argument must be an array.");
        return;
    }
    console.log(`🌲🌲🌲🌲🌲🌲🌲 BEFORE modifyWalkableCells: emptyCells.length: ${emptyCells.length} ${operation}ing ${cells.length} cells.`);

    if (operation !== "remove" && operation !== "add") {
        console.error("modifyWalkableCells: operation argument must be 'remove' or 'add'.");
        return;
    }

    const cellSet = new Set(cells.map(cell => `${cell.x},${cell.y}`));
    let newEmptyCells;

    if (operation === "remove") {
        newEmptyCells = emptyCells.filter(ec => !cellSet.has(`${ec.x},${ec.y}`));
    } else if (operation === "add") {
        newEmptyCells = [...emptyCells, ...cells.filter(cell => !emptyCells.some(ec => ec.x === cell.x && ec.y === cell.y))];
    }
    emptyCells = newEmptyCells;

    console.log(`🌲 ${operation}ed ${cells.length} cells. emptyCells.length: ${emptyCells.length}`);
}

function startTrees(ctx, cellSize) {
    clearCanvas(ctx);
    let treeCount = groundCells.length * treePercentageofLand;
    console.log(`Starting tree placement: target ${treeCount} trees`);

    const treeEmojis = {
        "🌴": [],
        "🌵": [],
        "🌳": [],
        "🌲": [],
    };
    const noiseToEmoji = {
        "🌴": (noise) => noise > 0.01 && noise <= 0.03,
        "🌵": (noise) => noise > 0.06 && noise <= 0.08,
        "🌳": (noise) => noise > 0.13 && noise < 0.45,
        "🌲": (noise) => noise >= 0.45,
    };

    // Make sure we're placing trees only in valid cells
    // First create a Set of water cells for faster lookups
    const waterCellsSet = new Set(waterCells.map(cell => `${cell.x},${cell.y}`));
    
    // Now filter emptyCells to exclude water cells
    const validCells = emptyCells.filter(cell => {
        // Check if it's not a water cell
        return !waterCellsSet.has(`${cell.x},${cell.y}`);
    });
    
    console.log(`Valid cells for tree placement: ${validCells.length} out of ${emptyCells.length} empty cells`);

    // Sort valid cells by noise for tree type selection
    validCells.forEach((cell) => {
        const noise = cell.noise;
        for (const emoji in noiseToEmoji) {
            if (noiseToEmoji[emoji](noise)) {
                treeEmojis[emoji].push(cell);
                break;
            }
        }
    });

    const newTreePositions = [];
    for (let i = 0; i < treeCount; i++) {
        const selectedTreeEmoji = Object.keys(treeEmojis)[i % 4];
        if (treeEmojis[selectedTreeEmoji].length > 0) {
            const randomIndex = Math.floor(Math.random() * treeEmojis[selectedTreeEmoji].length);
            const selectedCell = treeEmojis[selectedTreeEmoji].splice(randomIndex, 1)[0];
            
            // Store grid coordinates directly in the treePositions
            newTreePositions.push({ 
                gridX: selectedCell.x, 
                gridY: selectedCell.y, 
                emoji: selectedTreeEmoji, 
                scale: 1, 
                opacity: 1, 
                rotation: 0 
            });
        }
    }
    
    treePositions = newTreePositions;
    console.log(`Created ${treePositions.length} new trees`);
    
    drawTrees(treeCtx, treePositions);

    // Create an array of grid coordinates from treePositions for modifyWalkableCells
    const gridCoords = treePositions.map(tree => ({ x: tree.gridX, y: tree.gridY }));
    modifyWalkableCells(gridCoords, "remove");

    //initTreeLifecycle(); // its causing weird animations on dead trees redraws
    return treePositions;
}

function drawTrees(ctx, treePositions) {
    clearCanvas(ctx);
    console.log('drawTrees 😍');

    // Sort trees by Y position for proper rendering order
    treePositions.sort((a, b) => a.gridY === b.gridY ? b.gridX - a.gridX : a.gridY - b.gridY);

    treePositions.forEach(tree => {
        const { gridX, gridY, emoji, scale = 1, opacity = 1, rotation = 0, color = `rgba(0, 0, 0, ${opacity})` } = tree;
        
        // Convert grid to pixel coordinates for drawing
        const { x, y } = gridToPixel(gridX, gridY);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);

        ctx.beginPath();
        ctx.arc(0, 5, 7, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 0, 0, ${0.3})`;
        ctx.fill();

        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.font = `bold ${20}px Arial`;
        ctx.fillText(emoji, 0, 0);

        ctx.restore();
    });
}

function animateNewTree(gridX, gridY, emoji, callback) {
    // Create a new tree with grid coordinates
    const tree = { 
        gridX, 
        gridY, 
        emoji, 
        scale: 0, 
        opacity: 0, 
        rotation: 0 
    };
    
    treePositions.push(tree);

    if (!treePopSound.lastPlayed || (Date.now() - treePopSound.lastPlayed) > 5000) {
        treePopSound.currentTime = 0;
        treePopSound.play().catch(e => console.log("Audio play tree failed:", e));
        treePopSound.lastPlayed = Date.now();
    }

    // Convert to pixel coordinates for drawing circle
    const { x, y } = gridToPixel(gridX, gridY);
    const color = 'rgba(129, 178, 86, 0.37)';
    drawCircle(groundCtx, x, y, 10, color);

    let progress = 0;
    const duration = 1000;
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        progress = Math.min(elapsed / duration, 1);

        const bounce = Math.pow(progress, 2) * Math.sin(progress * Math.PI * 3);
        tree.scale = 0.5 + bounce * 0.5;
        tree.opacity = progress;

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            tree.scale = 1;
            tree.opacity = 1;
            if (callback) callback();
            drawTrees(treeCtx, treePositions); // Draw once animation is complete
        }
    }

    requestAnimationFrame(animate);
    
    // Update emptyCells to remove this grid position
    modifyWalkableCells([{ x: gridX, y: gridY }], "remove");
}

function dyingTreeAnimation(treeIndex, callback) {
    const tree = treePositions[treeIndex];
    if (!tree) return;

    tree.isDying = true;

    const startTime = performance.now();
    const startRotation = tree.rotation || 0;
    const fallDirection = Math.random() < 0.5 ? 1 : -1;
    const fallDuration = 1000;
    const waitDuration = 1000;
    const fadeDuration = 500;

    function animate(currentTime) {
        const currentIndex = treePositions.findIndex(t => t === tree);
        if (currentIndex === -1) {
            if (callback) callback();
            return;
        }

        const elapsed = currentTime - startTime;

        if (elapsed < fallDuration) {
            const progress = elapsed / fallDuration;
            tree.rotation = startRotation + (Math.PI / 2) * progress * fallDirection;
            requestAnimationFrame(animate);
        } else if (elapsed < fallDuration + waitDuration) {
            requestAnimationFrame(animate);
        } else if (elapsed < fallDuration + waitDuration + fadeDuration) {
            const fadeProgress = (elapsed - fallDuration - waitDuration) / fadeDuration;
            tree.opacity = 1 - fadeProgress;
            requestAnimationFrame(animate);
        } else {
            const finalIndex = treePositions.findIndex(t => t === tree);
            if (finalIndex !== -1) {
                // Get the grid coords before removing
                const { gridX, gridY } = treePositions[finalIndex];
                
                // Remove from treePositions
                treePositions.splice(finalIndex, 1);
                
                // Add back to emptyCells if needed
                modifyWalkableCells([{ x: gridX, y: gridY }], "add");
            }
            if (callback) callback();
            drawTrees(treeCtx, treePositions); // Draw once animation is complete
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

    if (betterOreCellsDistribution.length === 0) {
        console.log("No suitable locations found for ore deposits");
        return;
    }

    const clusterCount = 5;
    const depositsPerCluster = 3;
    
    // Initialize/reset adjacentOreCells array
    adjacentOreCells = [];

    for (let cluster = 0; cluster < clusterCount; cluster++) {
        const randomGroundCell =
            betterOreCellsDistribution[Math.floor(Math.random() * betterOreCellsDistribution.length)];

        const randomClusterX = randomGroundCell.x;
        const randomClusterY = randomGroundCell.y;

        // Convert to pixel for drawing circle
        const { x: pixelX, y: pixelY } = gridToPixel(randomClusterX, randomClusterY);
        
        let color = 'rgba(127, 115, 121, 0.4)';
        drawCircle(groundCtx, pixelX, pixelY, 40, color);

        drawOreDeposit(ctx, randomClusterX, randomClusterY);

        const adjacentCells = calculateAdjacentCells(
            randomClusterX,
            randomClusterY
        );

        adjacentOreCells = [...adjacentOreCells, ...adjacentCells];

        const depositsToDraw = Math.min(depositsPerCluster, adjacentCells.length);

        for (let i = 0; i < depositsToDraw; i++) {
            const { x, y } = adjacentCells[i];
            drawOreDeposit(ctx, x, y);
        }
    }

    // Use modifyWalkableCells to remove ore deposit cells from emptyCells
    // adjacentOreCells are already in grid coordinates
    console.log(`Ore deposits: ${adjacentOreCells.length} cells, emptyCells before: ${emptyCells.length}`);
    modifyWalkableCells(adjacentOreCells, "remove");
    console.log(`emptyCells after ore removal: ${emptyCells.length}`);
}

function initTreeLifecycle() {
    setInterval(() => {
        if (treePositions.length < TREE_LIFECYCLE.MAX_TREES) {
            const randomEmptyCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            if (randomEmptyCell) {
                const gridX = randomEmptyCell.x;
                const gridY = randomEmptyCell.y;
                const treeTypes = ["🌴", "🌵", "🌳", "🌲"];
                const randomTree = treeTypes[Math.floor(Math.random() * treeTypes.length)];
                
                // Pass grid coordinates directly
                animateNewTree(gridX, gridY, randomTree);
            }
        }
    }, TREE_LIFECYCLE.NEW_TREE_INTERVAL);

    setInterval(() => {
        if (treePositions.length > TREE_LIFECYCLE.MIN_TREES) {
            const dyingIndices = [];
            for (let i = treePositions.length - 1; i >= 0; i--) {
                if (!treePositions[i].isDying && Math.random() < TREE_LIFECYCLE.TREE_DEATH_CHANCE) {
                    dyingIndices.push(i);
                    treePositions[i].isDying = true;
                }
            }

            if (dyingIndices.length > 0) {
                let animationsCompleted = 0;
                dyingIndices.forEach(index => {
                    dyingTreeAnimation(index, () => {
                        animationsCompleted++;
                        if (animationsCompleted === dyingIndices.length) {
                            // drawTrees(treeCtx, treePositions); // Redraw only once after all animations are done
                        }
                    });
                });
            }
        }
    }, TREE_LIFECYCLE.DEATH_CHECK_INTERVAL);
}

function placeTree(gridX, gridY, emoji) {
    // Create a new tree object using grid coordinates
    const newTree = {
        gridX,
        gridY,
        emoji,
        scale: 1,
        opacity: 1,
        rotation: 0
    };

    treePositions.push(newTree);
    
    // Update emptyCells - we can pass grid coordinates directly
    modifyWalkableCells([{ x: gridX, y: gridY }], "remove");
    
    // Redraw trees
    drawTrees(treeCtx, treePositions);

    console.log(`🌲 Tree placed at (${gridX}, ${gridY}) with emoji: ${emoji}`);
}

/* 
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
 */