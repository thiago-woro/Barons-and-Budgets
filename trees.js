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
    //console.log("will draw " + treeCount.toFixed(0) + " trees");
   // console.log( adjacentOreCells);
  
  
  
      treeCount = groundCells.length * treePercentageofLand;
  
  
    // Assign tree emojis based on noise values
    emptyCells.forEach((cell) => {
      let selectedEmoji
  
      if (cell.noise > 0.05) {
        selectedEmoji = "🌴";  // Lower noise values
      }  if (cell.noise > 0.13) {
        selectedEmoji = "🌳";  // Medium noise values
      }  if (cell.noise > 0.45) {
        selectedEmoji = "🌲";  // Higher noise values
      } 
  
      if (treeEmojis[selectedEmoji]) {
        treeEmojis[selectedEmoji].push(cell);
      }
      
    });
  
    // Generate tree positions
    for (let i = 0; i < treeCount; i++) {
      const selectedEmoji = Object.keys(treeEmojis)[i % 4]; // Rotate through emojis
  
      if (treeEmojis[selectedEmoji].length > 0) {
        const randomIndex = Math.floor(Math.random() * treeEmojis[selectedEmoji].length);
        const selectedCell = treeEmojis[selectedEmoji].splice(randomIndex, 1)[0];
  
        const x = selectedCell.x * cellSize;
        const y = selectedCell.y * cellSize;
  
        // Store tree positions
        treePositions.push({ x, y, emoji: selectedEmoji });
      }
    }
    console.error('empty cells: '  + emptyCells.length)
     // Subtract treePositions from emptyCells and store the result in emptyCells2
      emptyCells.filter((cell) => {
      return !treePositions.some((tree) => tree.x === cell.x && tree.y === cell.y);
    });
    console.error('empty cells: '  + emptyCells.length)
  
  
  
    drawTrees(treeCtx, treePositions);
    drawGrass(treeCtx, 0.05);  //draw grass first then trees on top
  
    return treePositions;
  }
  
  function drawTrees(ctx, treePositions) {
    clearCanvas(ctx);
  
    console.log('drawing trees 🌵🌵')
  
    treePositions.sort((a, b) => {
      if (a.y === b.y) {
        // If Y coordinates are the same, sort by X coordinates in descending order
        return b.x - a.x;
      }
      // Otherwise, sort by Y coordinates in ascending order
      return a.y - b.y;
    });
  
    treePositions.forEach((tree) => {
      const x = tree.x;
      const y = tree.y;
  
      // Draw shadow
      ctx.beginPath();
      ctx.arc(x, y + 5, 7, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
      ctx.fill();
  
      // Draw tree
      ctx.fillStyle = "rgba(0, 0, 0, 1)";
      ctx.textAlign = "center";
      ctx.font = "bold 20px Arial";
      ctx.fillText(tree.emoji, x, y);
    });
  
  }


  function distributeOreDeposits(ctx) {
    clearCanvas(oreDepositsCtx);
    oreDeposits = [];
  
  
    betterOreCellsDistribution = groundCells.filter((cell) => {
       // console.log(cell)
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
  
     // console.error("writing ore deposits at: ", randomClusterX, randomClusterY);
  
      let color = 'rgba(127, 115, 121, 0.4)'
      //drawNearCells(groundCtx, randomClusterX, randomClusterY, color, 5)
       drawCircle(groundCtx, randomClusterX * cellSize, randomClusterY *cellSize, 70, color);
      
  
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
  