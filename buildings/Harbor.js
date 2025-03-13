// Harbor building class
const harborImage = new Image();
harborImage.src = "assets/buildings/harbor.png";

class Harbor extends Building {
  constructor(x, y, size, owner) {
    // Ensure size has a default value if undefined
    const safeSize = size || 20; // Default size of 20 if not provided
    
    super(x, y, safeSize, owner);
    this.type = "Harbor";
    this.emoji = "⚓";
    this.owner = owner;
    this.resources = Infinity; // Harbors don't deplete
    this.id = `harbor_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    this.size = safeSize;
   // console.log(`Harbor created at (${x}, ${y}) with size ${this.size}`);
  }

  draw(ctx) {
    // Ensure valid coordinates and size
    if (isNaN(this.x) || isNaN(this.y)) {
      console.error(`Invalid harbor coordinates: (${this.x}, ${this.y}) with size ${this.size}`);
      return; // Skip drawing if coordinates are invalid
    }
    
    // If size is undefined, use a default value
    const harborSize = this.size || 20;
    
    // Draw the harbor image if it's loaded
    if (harborImage && harborImage.complete) {
      // Draw with proper dimensions - make it larger and centered
      const scale = 2.0; // Make it twice as large
      const width = harborSize * scale;
      const height = harborSize * scale;
      
      // Center the image on the harbor position
      const x = this.x - (width - harborSize) / 2;
      const y = this.y - (width - harborSize) / 2;
      
      ctx.drawImage(harborImage, x, y, 99, 99);
    } else {
      // If image is not loaded yet, draw a placeholder
      ctx.fillStyle = "blue";
      ctx.fillRect(this.x, this.y, harborSize, harborSize);
      ctx.fillStyle = "white";
      ctx.font = "20px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(this.emoji, this.x + harborSize/2, this.y + harborSize/2);
    }

    const x = this.x / cellSize;
    const y = this.y / cellSize;
    
    // Draw harbor area outline (2x2 grid)
    ctx.strokeStyle = "rgba(0, 100, 255, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x * cellSize - cellSize/2, y * cellSize - cellSize/2, cellSize * 2, cellSize * 2);
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