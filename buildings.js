const BUILDING_TYPES = {
  SCHOOL: { type: 'School', woodCost: 100, emoji: '🏫' },
  FARM: { type: 'Farm', woodCost: 150, emoji: '🏘️' },
  MINE: { type: 'Mine', woodCost: 200, emoji: '⛰️' },
  FACTORY: { type: 'Factory', woodCost: 300, emoji: '🏭' },
  HOSPITAL: { type: 'Hospital', woodCost: 250, emoji: '🏥' },
  TEMPLE: { type: 'Temple', woodCost: 400, emoji: '⛪' },
  CASTLE: { type: 'Castle', woodCost: 500, emoji: '🏰' }
};

class Building {
  constructor(x, y, type, cellSize) {
    this.x = x * cellSize;
    this.y = y * cellSize;
    this.type = type;
    this.woodCost = BUILDING_TYPES[type].woodCost;
  }

  draw(ctx) {
    ctx.font = "bold 40px Arial";
    ctx.textAlign = "center";
    ctx.fillText(BUILDING_TYPES[this.type].emoji, this.x, this.y);
  }
}

class Harbor extends Building {
  constructor(x, y, cellSize, owner) {
    super(x, y, cellSize, owner);
    this.type = "Harbor";
    this.capacity = 5; // Maximum number of fishers that can use this harbor
    this.currentUsers = 0;
    this.resources = 100; // Durability/maintenance level
  }

  // Method to draw the harbor on the canvas
  draw(buildingCtx, cellSize) {
    buildingCtx.font = "bold 20px Arial";
    buildingCtx.fillText("⚓", this.x, this.y);
  }

  // Method to check if harbor can accept more fishers
  canAcceptFisher() {
    return this.currentUsers < this.capacity;
  }

  // Method to add a fisher
  addFisher() {
    if (this.canAcceptFisher()) {
      this.currentUsers++;
      return true;
    }
    return false;
  }

  // Method to remove a fisher
  removeFisher() {
    if (this.currentUsers > 0) {
      this.currentUsers--;
      return true;
    }
    return false;
  }

  // Method to maintain the harbor
  maintain() {
    if (this.resources < 100) {
      this.resources += 10;
      if (this.resources > 100) {
        this.resources = 100;
      }
    }
  }
} 