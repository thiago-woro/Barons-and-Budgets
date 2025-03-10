class Building {
  constructor(x, y, cellSize, owner) {
    this.x = x * cellSize;
    this.y = y * cellSize;
    this.owner = owner; // The NPC owner of the building
    this.type = owner ? owner.profession : ""; // Type of the building based on owner's profession
    this.inhabitants = []; // Array to store NPCs or characters in the building
    this.upgrades = []; // Array to store building upgrades
    this.economicStatus = "Average"; // Economic status of the building
    this.value = Math.floor(Math.random() * 100000) + 50000; // Random building value
  }
  // Method to add an inhabitant (NPC) to this building
  addInhabitant(npc) {
    this.inhabitants.push(npc);
  }

  // Method to add an upgrade to the building
  addUpgrade(upgrade) {
    this.upgrades.push(upgrade);
  }

  // Method to draw the building on the canvas
  draw(ctx) {
    // Choose emoji character based on building type, economic status, and upgrades
    let emoji = "🏠"; // Default emoji for average house

    if (this.type === "House") {
      if (this.economicStatus === "Wealthy") {
        emoji = "🏡"; // Emoji for wealthy house
      } else if (this.economicStatus === "Poor") {
        emoji = "🏚"; // Emoji for poor house
      } else if (this.upgrades.length > 0) {
        emoji = "🏢"; // Emoji for house with upgrades
      }
    } else if (this.type === "Shop") {
      // Add emoji for shops based on their attributes or upgrades
      // Customize this part based on your game mechanics
    } else if (this.type === "Guild") {
      // Add emoji for guilds based on their attributes or upgrades
      // Customize this part based on your game mechanics
    }

    // Draw the emoji on the canvas
    ctx.font = "bold 20px Arial";
    ctx.fillText(emoji, this.x, this.y);
  }
} 