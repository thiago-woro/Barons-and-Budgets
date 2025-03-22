//TODO 
//add emotions, like happiness, sad, in love, depression, sick of wife or kids, etc
//condition: starving, sick, drunk, anemic, etc
//height, size and weight
//inventory of held items 
const treeFoundSound = new Audio('/assets/sounds/tree-down.mp3'); // Create this simple sound file

// Define Item class directly in this file to avoid reference errors
class Item {
  constructor(type, amount = 1) {
    this.type = type;
    this.amount = amount;
    
    // Access item details if they're available
    let itemDetails = { name: type, emoji: "❓" };
    
    // Try to get details from global items/foods objects if they exist
    if (typeof items !== 'undefined' && items[type]) {
      itemDetails = items[type];
    } else if (typeof foods !== 'undefined' && foods[type]) {
      itemDetails = foods[type];
    }
    
    this.name = itemDetails.name || type;
    this.emoji = itemDetails.emoji || "❓";
  }
  
  add(amount) {
    this.amount += amount;
    return this.amount;
  }
  
  remove(amount) {
    if (this.amount >= amount) {
      this.amount -= amount;
      return true;
    }
    return false;
  }
}

// Note: Make sure items.js is included before npcClass.js in your HTML


/**
 * Follows a path one step at a time
 * @param {Object} npc - The NPC object
 * @returns {boolean} - True if path is completed, false otherwise
 */
function followPath(npc) {

  
  // If NPC can't move (e.g., during cutting), don't follow path
  if (npc.canMove === false) {
    return false;
  }

  if (!npc.currentPath || npc.currentPath.length === 0) {
    return true; // No path or empty path counts as completed
  }
  
  if (npc.pathIndex < npc.currentPath.length) {
    const nextCell = npc.currentPath[npc.pathIndex];
    
    // Check if nextCell is defined
    if (!nextCell) {
      console.warn(`followPath: ${npc.name} - ${npc.profession}: undefined cell in path at index ${npc.pathIndex}`);
      npc.currentPath = null;
      return true; // Path is invalid, consider it completed
    }
    
    // Verify the next cell is still a valid land cell
    if (!isLandCell(nextCell.x, nextCell.y)) {
      console.warn(`followPath: ${npc.name} - ${npc.profession}: invalid cell (${nextCell.x}, ${nextCell.y}) in path, recalculating`);
      
     
      
      npc.currentPath = null;
      return true; // Path is invalid, consider it completed
    }
    
    npc.x = nextCell.x * cellSize;
    npc.y = nextCell.y * cellSize;
    npc.pathIndex++;
    
    // Check if path is completed
    if (npc.pathIndex >= npc.currentPath.length) {
      npc.currentPath = null;
      return true;
    }
    return false;
  }
  
  return true; // Path completed
} 


class NPC {
  constructor(x, y, myNumber, parents, age) {
    this.x = x * cellSize;
    this.y = y * cellSize;
    this.race = this.chooseRace();
    this.age = 0;
    this.sex = Math.random() < 0.5 ? "male" : "female";
    this.color = Math.random() < 0.5 ? "#ba8247" : "#a382ab";
    this.isClickable = true; // Can be toggled on or off
    this.isAlive = true; // NPC is alive when created
    this.deathAge = Math.floor(Math.random() * 80 + 20); // Age at which NPC dies
    this.name = generateName(this); // Generate a name using global function
    this.spouse;
    this.profession = this.generateProfession(age, this.race);
    this.movementSpeed = 1;
    this.children = []; // Array to store children
    this.myNumber = myNumber; // Sequential number for creation order
    this.parents = parents || null; // Set parents to null when not provided
    this.currentPath = null;
    this.pathIndex = 0;
    this.waitTime = 0;
    this.maxWaitTime = 7; // 7 seconds wait time
    this.state = "idle"; // Initial state
    this.stateData = {}; // For storing state-specific data
    this.animationState = "normal"; // For visual feedback during activities
    this.inventory = []; // Array to store items

    if (age >= 20) {
      this.profession = this.generateProfession(this.age, this.race);
      this.salary = this.calculateSalary();
    } else {
      this.profession = "novice";
      this.salary = 0;
    }
  }

  // Main update method to be called each game loop
  update() {
    // Call the appropriate profession update function
    if (this.profession === "Woodcutter") {
    console.log(`moving a: ${this.profession}`);

      updateWoodcutter(this);
    } else if (this.profession === "Hunter") {
      updateHunter(this);
    console.log(`moving a: ${this.profession}`);

    } else if (this.profession === "Fisher") {
    console.log(`moving a: ${this.profession}`);

        updateFisher(this);
    } else if (this.profession === "Miner") {
      updateMiner(this);
    } else if (this.profession === "Farmer") {
      updateFarmer(this);
    } else {
      // Default behavior for NPCs without specific profession handlers
      // this.move();
    }
    this.updateInfoPanel(); // Update info panel TODO update only when infoPanel is opened
  }

  // Set the NPC's state and update the UI
  setState(newState) {
    this.state = newState;
    // Update the state in the NPC table
    updateNpcStateInList(this, newState);
  }

  // Determine if NPC should move based on race and loop counter
  shouldMove() {
    // Always return true since the game loop now controls movement frequency
    return true;
  }

  // Regular movement method for remaning NPCS
  move() {
    return;
    console.log(`NPC ${this.name} is moving`);
    // If NPC can't move (e.g., during cutting), don't move
    if (this.canMove === false) {
      return;
    }
    
    // Find the current cell coordinates of the NPC
    const currentX = Math.floor(this.x / cellSize);
    const currentY = Math.floor(this.y / cellSize);
    // Generate the coordinates for adjacent cells
    const adjacentCells = [
        { x: currentX - 1, y: currentY },
        { x: currentX + 1, y: currentY },
        { x: currentX, y: currentY - 1 },
        { x: currentX, y: currentY + 1 },
    ];
    // Filter out cells that are not ground cells
    const validAdjacentCells = adjacentCells.filter((cell) =>
        groundCells.some(
            (groundCell) => groundCell.x === cell.x && groundCell.y === cell.y
        )
    );

    if (this.age <= 60 || (Math.random() < 8 / (this.age - 59))) {
        // If the NPC is below 60 or meets the chance-based condition
        if (validAdjacentCells.length > 0) {
            // Pick a random valid adjacent cell
            const randomIndex = Math.floor(Math.random() * validAdjacentCells.length);
            const selectedCell = validAdjacentCells[randomIndex];
            // Update the NPC's position to the new cell
            this.x = selectedCell.x * cellSize;
            this.y = selectedCell.y * cellSize;
        }
    }
    this.updateInfoPanel(); // Update info panel with new position
  }

  ageAndDie() {
    this.age++; // Increment the age by 1 year
    if (this.age >= 96 || (this.age > 80 && Math.random() < deathRate)) {
      this.die();
      deathsThisLoop++; // Increment deaths count
      // Create a death notification
      addNotification(
        "Death",
        `${this.name} has died`,
        `Age: ${this.age} years`,
        this,
        "#424042"
      );
      return;
    }

    // Update age in the table
    const ageCell = document.querySelector(
      `#npcRow-${this.myNumber} td:nth-child(2)`
    );
    if (ageCell) {
      ageCell.textContent = this.age;
    }
  }

  die() {
    // Remove the NPC from the array
    npcs.splice(npcs.indexOf(this), 1);
    // console.log(this.name + " dead at age " + this.age + " 💀");

    // Remove the NPC's row from the table
    const npcRow = document.getElementById(`npcRow-${this.myNumber}`);
    if (npcRow) {
      npcRow.remove();
    }
  }

  chooseRace() {
    if (this.parents && this.parents.length > 0) {
      console.error("parents: " + this.parents.length);

      return this.parents[0].race; // Set race to the race of the first parent
    } else {
      const race = ["Elf", "Purries", "Kurohi"];
      const randomIndex = Math.floor(Math.random() * race.length);
      return race[randomIndex];
    }
  }

  addChild(childNPC) {
    if (!this.children) {
      this.children = [];
    }
    
    // Check for circular reference before adding
    if (childNPC === this) {
      console.error("Attempted to add NPC as its own child:", this.name);
      return;
    }
    
    // Optional: Check if this NPC is already in the child's ancestry
    if (childNPC.parents && 
        childNPC.parents.some(parent => 
          parent === this || 
          (parent.parents && parent.parents.includes(this))
        )) {
      console.error("Circular reference detected when adding child:", childNPC.name, "to parent:", this.name);
      return;
    }
    
    this.children.push(childNPC);
  }

  generateProfession(race) {
    // Ensure that this.race matches one of the keys in raceProfessions
    if (!(this.race in raceProfessions)) {
      // Handle the case where the race is not found
      return { profession: "race not found", salary: 1000 };
    }

    // Get the profession array for the NPC's race
    const professionArray = raceProfessions[this.race];

    // Calculate total probability for the race's professions
    const totalProbability = professionArray.reduce(
      (sum, profession) => sum + profession.probability,
      0
    );

    // Generate a random value within the total probability range
    const randomValue = Math.random() * totalProbability;

    // Select a profession based on the probabilities
    let cumulativeProbability = 0;
    for (const profession of professionArray) {
      cumulativeProbability += profession.probability;
      if (randomValue <= cumulativeProbability) {
        // return { profession: profession.profession, salary: profession.salary };
        return profession.profession;
      }
    }

    // If no profession is selected, return a default or handle it as needed
    return; // Example: Return "Unemployed" if nothing matches
  }

  calculateSalary() {
    // Calculate salary based on the profession
    if (this.profession) {
      const professionArray = raceProfessions[this.race];
      const selectedProfession = professionArray.find(
        (profession) => profession.profession === this.profession
      );

      if (selectedProfession) {
        return selectedProfession.salary;
      }
    }
    // Return 0 if the profession is not found
    return 0;
  }

  // Draw info based on state
  drawNPCInfo(ctx) {
    if (this.profession === 'Woodcutter') {
      drawWoodcutterInfo(this, ctx);
    } else if (this.profession === 'Hunter') {
      drawHunterInfo(this, ctx);
    } else if (this.profession === 'Fisher') {
      drawFisherInfo(this, ctx);
    } else if (this.profession === 'Miner') {
      drawMinerInfo(this, ctx);
    } else if (this.profession === 'Farmer') {
      drawFarmerInfo(this, ctx);
    }
  }

  // Common method for drawing information text above NPCs
  drawInfoText(ctx, infoText, additionalInfo, progressBar) {
    // Draw main info text with shadow
    ctx.font = "10px Arial";
    ctx.textAlign = "center";
    
    // Draw text shadow first
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillText(infoText, this.x + 2, this.y - 24);
    
    // Draw main text on top
    ctx.fillStyle = "white";
    ctx.fillText(infoText, this.x, this.y - 25);
    
    // Draw additional info if provided
    if (additionalInfo && additionalInfo.text) {
      ctx.fillStyle = additionalInfo.color;
      ctx.fillText(additionalInfo.text, this.x, this.y - 45);
    }
    
    // Draw progress bar if provided
    if (progressBar && progressBar.progress !== undefined) {
      const maxWidth = progressBar.width || 20;
      const barWidth = maxWidth * progressBar.progress;
      
      // Draw background
      ctx.fillStyle = progressBar.bgColor || "rgba(0, 0, 0, 0.3)";
      ctx.fillRect(this.x - maxWidth / 2, this.y - 15, maxWidth, 3);
      
      // Draw progress
      ctx.fillStyle = progressBar.color || "orange";
      ctx.fillRect(this.x - maxWidth / 2, this.y - 15, barWidth, 3);
    }
  }
  
  // Helper method to get race-specific color
  getRaceColor() {
    return this.race === "Elf" ? "#88ff88" : 
           this.race === "Kurohi" ? "#ff8888" : 
           this.race === "Purries" ? "#8888ff" : "black";
  }

  // Method to update the info panel with the NPC's current cell position
  updateInfoPanel() {
    const infoPanel = document.getElementById("infoPanel");
    if (infoPanel) {
      const currentX = Math.floor(this.x / cellSize);
      const currentY = Math.floor(this.y / cellSize);
      let positionDiv = document.getElementById("npcPosition");

      if (!positionDiv) {
        positionDiv = document.createElement("div");
        positionDiv.id = "npcPosition";
        infoPanel.appendChild(positionDiv);
      }

      positionDiv.textContent = `Position: (${currentX}, ${currentY})`;

      // Add inventory display
      let inventoryDiv = document.getElementById("npcInventory");
      if (!inventoryDiv) {
        inventoryDiv = document.createElement("div");
        inventoryDiv.id = "npcInventory";
        infoPanel.appendChild(inventoryDiv);
      }

      if (this.inventory.length > 0) {
        inventoryDiv.innerHTML = "<br>Inventory:<br>" + 
          this.inventory.map(item => 
            `${item.emoji} ${item.type}: ${item.amount}`
          ).join("<br>");
      } else {
        inventoryDiv.innerHTML = "<br>Inventory: Empty";
      }
    }
  }

  // Add new inventory methods
  addToInventory(itemType, amount = 1) {
    const existingItem = this.inventory.find(item => item.type === itemType);
    if (existingItem) {
      existingItem.add(amount);
    } else {
      this.inventory.push(new Item(itemType, amount));
    }
  }

  removeFromInventory(itemType, amount = 1) {
    const itemIndex = this.inventory.findIndex(item => item.type === itemType);
    if (itemIndex !== -1) {
      const item = this.inventory[itemIndex];
      if (item.remove(amount)) {
        if (item.amount === 0) {
          this.inventory.splice(itemIndex, 1);
        }
        return true;
      }
    }
    return false;
  }

  getInventoryCount(itemType) {
    const item = this.inventory.find(item => item.type === itemType);
    return item ? item.amount : 0;
  }
}
