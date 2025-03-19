const treePopSound = new Audio('/assets/sounds/3pop.mp3');

const TREE_LIFECYCLE = {
    NEW_TREE_INTERVAL: 15000,
    TREE_DEATH_CHANCE: 0.002,
    DEATH_CHECK_INTERVAL: 130,
    MAX_TREES: 300,
    MIN_TREES: 20
};

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

    emptyCells.forEach((cell) => {
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
        const x = (selectedCell.x + 0.5) * cellSize;
        const y = (selectedCell.y + 0.5) * cellSize;
        let scale = 1;

        newTreePositions.push({ x, y, emoji: selectedTreeEmoji, scale: scale, opacity: 1, rotation: 0 });
    }
}
    treePositions = newTreePositions;
    drawTrees(treeCtx, treePositions);
    drawGrass(treeCtx, 0.05);

    modifyWalkableCells(treePositions, "remove");

    //initTreeLifecycle(); // its causing weird animations on dead trees redraws
    return treePositions;
}

function drawTrees(ctx, treePositions) {
    clearCanvas(ctx);
      console.log('drawTrees 😍');
/*   
    // Generate a stack trace
    let err = new Error();
    console.log(`Call stack:\n${err.stack}`);
 */
    treePositions.sort((a, b) => a.y === b.y ? b.x - a.x : a.y - b.y);

    treePositions.forEach(tree => {
    const { x, y, emoji, scale = 1, opacity = 1, rotation = 0, color = `rgba(0, 0, 0, ${opacity})` } = tree;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

   /*  const yscale = Math.random() < 0.3 ? scale + (Math.random() * 0.1 + 0.3) : scale; // 50% chance to vary yscale slightly
    ctx.scale(scale, yscale); // Apply scaling
 */
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






function animateNewTree(x, y, emoji, callback) {
    const tree = { x, y, emoji, scale: 0, opacity: 0, rotation: 0 };
    treePositions.push(tree);

    if (!treePopSound.lastPlayed || (Date.now() - treePopSound.lastPlayed) > 5000) {
        treePopSound.currentTime = 0;
        treePopSound.play().catch(e => console.log("Audio play tree failed:", e));
        treePopSound.lastPlayed = Date.now();
    }

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
                treePositions.splice(finalIndex, 1);
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
        startTrees(treeCtx, cellSize);
        return;
    }

    const clusterCount = 5;
    const depositsPerCluster = 3;

    for (let cluster = 0; cluster < clusterCount; cluster++) {
        const randomGroundCell =
            betterOreCellsDistribution[Math.floor(Math.random() * betterOreCellsDistribution.length)];

        const randomClusterX = randomGroundCell.x;
        const randomClusterY = randomGroundCell.y;

        let color = 'rgba(127, 115, 121, 0.4)';
        drawCircle(groundCtx, randomClusterX * cellSize, randomClusterY * cellSize, 40, color);

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

    // Filter out cells with ore deposits from groundCells
    // emptyCells = groundCells.filter((cell) => {
    //     // Check if the cell coordinates are occupied by an ore deposit
    //     return !adjacentOreCells.some(
    //         (coords) =>
    //             coords.x === cell.x && coords.y === cell.y
    //     );
    // });

    // Use modifyWalkableCells to remove ore deposit cells from emptyCells
    console.log(`after ore deposits: emptyCells.length: ${emptyCells.length}`);
    modifyWalkableCells(adjacentOreCells, "remove");

    //only starts trees after ore deposits!
    startTrees(treeCtx, cellSize);
}












function initTreeLifecycle() {
    setInterval(() => {
        if (treePositions.length < TREE_LIFECYCLE.MAX_TREES) {
            const randomEmptyCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
            if (randomEmptyCell) {
                const x = randomEmptyCell.x * cellSize;
                const y = randomEmptyCell.y * cellSize;
                const treeTypes = ["🌴", "🌵", "🌳", "🌲"];
                const randomTree = treeTypes[Math.floor(Math.random() * treeTypes.length)];
                animateNewTree(x, y, randomTree);
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


function placeTree(x, y, emoji) {
      const newTree = {
        x: (x + 0.5) * cellSize, // Center X
        y: (y + 0.5) * cellSize, // Center Y
        emoji: emoji,
        scale: 1,
        opacity: 1,
        rotation: 0
    };

    treePositions.push(newTree); // Assuming treePositions is a global array
    
    // Update emptyCells
    modifyWalkableCells([{ x: x, y: y }], "remove");
    
    // Redraw trees
    drawTrees(treeCtx, treePositions); // Assuming treeCtx and drawTrees are defined

    console.log(`🌲 Tree placed at (${x}, ${y}) with emoji: ${emoji}`);
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