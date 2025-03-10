// Harbor building class
class Harbor extends Building {
  constructor(x, y, size, owner) {
    super(x, y, size, owner);
    this.type = "Harbor";
    this.emoji = "⚓";
    this.owner = owner;
    this.resources = Infinity; // Harbors don't deplete
    this.fishStorage = 0; // Amount of fish stored
    this.maxFishStorage = 50; // Maximum fish storage capacity
  }

  draw(ctx) {
    //use assets/harbor.png
    const harborImage = new Image();
    harborImage.src = "assets/harbor.png";
    ctx.drawImage(harborImage, this.x, this.y, this.size, this.size);

    const x = this.x / cellSize;
    const y = this.y / cellSize;
    
    // Draw harbor area outline (2x2 grid)
    ctx.strokeStyle = "rgba(0, 100, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x * cellSize - cellSize/2, y * cellSize - cellSize/2, cellSize * 2, cellSize * 2);
    
    // Draw fish storage indicator if there are fish
    if (this.fishStorage > 0) {
      const percentage = this.fishStorage / this.maxFishStorage;
      ctx.fillStyle = "rgba(0, 100, 255, 0.3)";
      ctx.fillRect(
        x * cellSize - cellSize/2, 
        (y + 1) * cellSize - percentage * cellSize, 
        cellSize * 2, 
        percentage * cellSize
      );
      
      // Draw fish count
      ctx.fillStyle = "white";
      ctx.font = "12px Arial";
      ctx.fillText(
        `🐟 ${this.fishStorage}`, 
        (x + 0.5) * cellSize, 
        (y + 0.8) * cellSize
      );
    }
  }
  
  // Add fish to storage
  addFish(amount) {
    const spaceLeft = this.maxFishStorage - this.fishStorage;
    const amountToAdd = Math.min(amount, spaceLeft);
    this.fishStorage += amountToAdd;
    return amountToAdd; // Return how much was actually added
  }
  
  // Remove fish from storage
  removeFish(amount) {
    const amountToRemove = Math.min(amount, this.fishStorage);
    this.fishStorage -= amountToRemove;
    return amountToRemove; // Return how much was actually removed
  }
  
  // Animation method
  animateEmoji(animation, emoji, duration) {
    console.log(`Harbor at (${this.x/cellSize}, ${this.y/cellSize}) ${animation} ${emoji}`);
  }
}

// Make Harbor available globally
if (typeof window !== 'undefined') {
  window.Harbor = Harbor;
} 