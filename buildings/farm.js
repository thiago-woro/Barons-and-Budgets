// Farm building class
class Farm extends Building {
  constructor(x, y, size, owner) {
    super(x, y, size, owner);
    this.type = "Farm";
    this.emoji = "🌾";
    this.owner = owner;
    this.resources = Infinity; // Farms never deplete
  }

  draw(ctx) {
    const x = this.x / cellSize;
    const y = this.y / cellSize;
    
    // Draw farm icon
    ctx.font = "20px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "green";
    ctx.fillText(this.emoji, (x + 0.5) * cellSize, (y + 0.5) * cellSize);
    
    // Draw farm area outline (3x3 grid)
    ctx.strokeStyle = "rgba(255, 255, 0, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x * cellSize - cellSize, y * cellSize - cellSize, cellSize * 3, cellSize * 3);
  }
  
  // Animation method
  animateEmoji(animation, emoji, duration) {
    // Simple animation for now - just log it
    console.log(`Farm at (${this.x/cellSize}, ${this.y/cellSize}) ${animation} ${emoji}`);
    
    // In a real implementation, you would create a temporary animated element here
  }
} 