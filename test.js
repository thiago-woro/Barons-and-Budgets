let betterLandforHouses = [];


class House {
    constructor(x, y) {
      this.x = x * cellSize;
      this.y = y * cellSize;
      this.inhabitants = []; // Array to store NPCs living in this house
      this.upgrades = []; // Array to store home upgrades
      this.economicStatus = "Average"; // Economic status of the house
      this.homeValue = Math.floor(Math.random() * 100000) + 50000; // Random home value
      this.floors = 1;
    }
  
  // Main function to validate and update house cells
   validateCells() {
    let validCellFound = false;
  
    while (!validCellFound) {
      const randomHouse = houses[Math.floor(Math.random() * houses.length)];
      const currentX = Math.floor(randomHouse.x / cellSize);
      const currentY = Math.floor(randomHouse.y / cellSize);
  
      const validAdjacentCells = findValidAdjacentCells(currentX, currentY, houses);
    console.log('Valid adjacent cells:', validAdjacentCells.length);

  
      if (validAdjacentCells.length > 0) {
        const randomIndex = Math.floor(Math.random() * validAdjacentCells.length);
        const selectedCell = validAdjacentCells[randomIndex];
  
        this.x = selectedCell.x * cellSize;
        this.y = selectedCell.y * cellSize;
  
        validCellFound = true;
      }
    }
  }
    draw(ctx) {
   //some code
    }
 
  }
  
  // Helper function to find valid adjacent cells
  function findValidAdjacentCells(currentX, currentY, houses) {
    const adjacentCells = [
      { x: currentX - 2, y: currentY },
      { x: currentX + 2, y: currentY },
      { x: currentX, y: currentY - 2 },
      { x: currentX, y: currentY + 2 },
    ];
  
    return adjacentCells.filter((cell) => isValidGroundCell(cell, houses));
  }
  
  // Helper function to check if a cell is a valid ground cell
  function isValidGroundCell(cell, houses) {
  
  
    return betterLandforHouses.some(
      (groundCell) =>
        groundCell.x === cell.x &&
        groundCell.y === cell.y &&
        !houses.some(
          (existingHouse) =>
            Math.floor(existingHouse.x / cellSize) === cell.x &&
            Math.floor(existingHouse.y / cellSize) === cell.y
        )
    );
  }
  
